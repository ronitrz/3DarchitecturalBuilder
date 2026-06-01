/* ============================================================
   3DArch Studio — Main Application Logic
   ============================================================ */

'use strict';

// ══════════════════════════════════════════════════════════════
//  CAMERA MOVEMENT — velocity based
// ══════════════════════════════════════════════════════════════
var _keys   = {};
var _camVel = null;                  // initialized in init() after THREE loads
var CAM_ACCEL   = 0.06;              // acceleration per frame
var CAM_FRICTION = 0.80;             // velocity damping (0=instant stop, 1=no stop)
var CAM_MAX     = 0.55;              // max speed (normal)
var CAM_SPRINT  = 2.8;              // sprint multiplier (Shift)

// Ghost placement rotation
var _ghostYaw = 0;                   // radians

// ══════════════════════════════════════════════════════════════
//  APPLICATION STATE
// ══════════════════════════════════════════════════════════════
var App = {
  // Three.js core
  scene:       null,
  camera:      null,
  renderer:    null,

  // Controls
  orbitControls:     null,
  transformControls: null,

  // Objects
  placedObjects: [],  // all placed THREE.Group objects
  selectedObject: null,
  ghostObject: null,

  // Active tool state
  activeTool: null,   // element id string, or 'measure', 'select', null
  activeMode: 'select', // 'select' | 'place' | 'measure'

  // Measure tool
  measurePoints: [],
  measureLine: null,
  measureLabel: null,

  // History
  history: [],
  historyIndex: -1,
  MAX_HISTORY: 50,

  // Settings
  units: 'm',
  snapEnabled: true,
  snapSize: 0.5,
  gridVisible: true,
  isDay: true,

  // Interaction
  mouse: null,
  raycaster: null,
  groundPlane: null,
  intersectPt: null,
  isMouseDown: false,
  mouseDownPos: null,

  // Lights
  ambientLight: null,
  sunLight: null,
  fillLight: null,

  // Grid
  gridHelper: null,
  groundMesh: null,

  // Bounding box helper
  bboxHelper: null,
};

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
function init() {
  // Scene
  App.scene = new THREE.Scene();

  // Camera
  App.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  App.camera.position.set(12, 9, 14);

  // Renderer
  var canvas = document.getElementById('three-canvas');
  App.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
  App.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  App.renderer.shadowMap.enabled = true;
  App.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  App.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  App.renderer.toneMappingExposure = 1.1;
  App.renderer.outputEncoding = THREE.sRGBEncoding;

  // Init THREE objects that need THREE to be loaded
  App.mouse       = new THREE.Vector2(-9999, -9999);
  App.raycaster   = new THREE.Raycaster();
  App.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  App.intersectPt = new THREE.Vector3();
  _camVel         = new THREE.Vector3();

  setupLights();
  setupGround();
  setupSky();
  setupGrid();
  setupOrbitControls();
  setupTransformControls();
  buildUI();
  setupContextMenu();
  setupSidebarToggles();
  setupEvents();
  setupKeyboard();
  resize();

  window.addEventListener('resize', resize);

  // Toast element
  var toast = document.createElement('div');
  toast.id = 'toast';
  document.body.appendChild(toast);

  // Sprint indicator
  var sprint = document.createElement('div');
  sprint.id = 'sprint-indicator';
  sprint.textContent = '⚡ SPRINT';
  document.getElementById('viewport').appendChild(sprint);

  // Ghost rotation tip
  var grtip = document.createElement('div');
  grtip.id = 'ghost-rotate-tip';
  grtip.innerHTML = '<kbd>Q</kbd> rotate left · <kbd>E</kbd> rotate right · <kbd>Scroll</kbd> adjust height';
  document.getElementById('viewport').appendChild(grtip);

  // WASD hint overlay
  var hint = document.createElement('div');
  hint.id = 'wasd-hint';
  hint.innerHTML =
    '<kbd>W</kbd> Forward &nbsp; <kbd>S</kbd> Back<br>' +
    '<kbd>A</kbd> Left &nbsp;&nbsp;&nbsp; <kbd>D</kbd> Right<br>' +
    '<kbd>▲</kbd> Up &nbsp;&nbsp;&nbsp;&nbsp; <kbd>▼</kbd> Down<br>' +
    '<kbd>Shift</kbd> Sprint &nbsp; <kbd>F</kbd> Focus<br>' +
    '<span style="color:var(--text-muted);font-size:9px">Hold keys to fly camera</span>';
  document.getElementById('viewport').appendChild(hint);

  animate();
  showToast('Welcome to 3DArch Studio! 🏗️ Select a tool to start building.', 'success', 4000);
}

// ══════════════════════════════════════════════════════════════
//  SKY PRESETS  (12 colour environments)
// ══════════════════════════════════════════════════════════════
var SKY_PRESETS = {
  day: {
    stops: [['0.0','#0a1628'],['0.35','#1a3058'],['0.65','#3d6080'],['0.85','#7aa8c8'],['1.0','#c8dce8']],
    dotA: '#60a5fa', dotB: '#1a3058',
    ambient: 0.6,  ambCol: 0x8899bb, sun: 2.0,  sunCol: 0xfff5e0, fill: 0.4, ground: 0x3d6632, stars: false
  },
  dawn: {
    stops: [['0.0','#14061e'],['0.3','#7a2240'],['0.6','#e05030'],['0.8','#ffb060'],['1.0','#ffd89a']],
    dotA: '#ff9060', dotB: '#7a2240',
    ambient: 0.4,  ambCol: 0xee7744, sun: 1.5,  sunCol: 0xffcc88, fill: 0.2, ground: 0x2a4020, stars: false
  },
  golden: {
    stops: [['0.0','#0d1a30'],['0.3','#3a3010'],['0.6','#c07820'],['0.8','#f0b840'],['1.0','#ffe090']],
    dotA: '#f0b840', dotB: '#c07820',
    ambient: 0.55, ambCol: 0xddaa44, sun: 2.2,  sunCol: 0xffd070, fill: 0.3, ground: 0x4a4010, stars: false
  },
  sunset: {
    stops: [['0.0','#080614'],['0.25','#3a1240'],['0.55','#bb3318'],['0.8','#ee8822'],['1.0','#ffcc66']],
    dotA: '#ee8822', dotB: '#3a1240',
    ambient: 0.35, ambCol: 0xcc6644, sun: 1.4,  sunCol: 0xffaa66, fill: 0.15, ground: 0x2a3020, stars: false
  },
  dusk: {
    stops: [['0.0','#060410'],['0.3','#180a28'],['0.6','#3a1a50'],['0.85','#7a3a90'],['1.0','#b070c0']],
    dotA: '#9b59b6', dotB: '#180a28',
    ambient: 0.2,  ambCol: 0x6644aa, sun: 0.6,  sunCol: 0x8866cc, fill: 0.1, ground: 0x1a2410, stars: false
  },
  night: {
    stops: [['0.0','#010204'],['0.4','#030810'],['0.75','#060f1c'],['1.0','#0b1824']],
    dotA: '#0f2040', dotB: '#010204',
    ambient: 0.12, ambCol: 0x334466, sun: 0.3,  sunCol: 0x4466aa, fill: 0.05, ground: 0x0d1a08, stars: true
  },
  overcast: {
    stops: [['0.0','#4a4f54'],['0.4','#72797f'],['0.7','#949b9f'],['1.0','#c2c8cc']],
    dotA: '#94a3b8', dotB: '#4a4f54',
    ambient: 0.85, ambCol: 0x99a0b0, sun: 0.7,  sunCol: 0xddddee, fill: 0.55, ground: 0x4a5a3a, stars: false
  },
  storm: {
    stops: [['0.0','#0a0c10'],['0.3','#1a1e24'],['0.65','#2a3038'],['1.0','#404850']],
    dotA: '#4a5568', dotB: '#0a0c10',
    ambient: 0.25, ambCol: 0x556677, sun: 0.4,  sunCol: 0xaabbcc, fill: 0.2, ground: 0x1a2010, stars: false
  },
  desert: {
    stops: [['0.0','#1a2a60'],['0.3','#4060a0'],['0.65','#c09050'],['0.85','#e8b860'],['1.0','#f5d890']],
    dotA: '#f5c842', dotB: '#c09050',
    ambient: 0.75, ambCol: 0xddcc88, sun: 2.6,  sunCol: 0xffeebb, fill: 0.35, ground: 0xc8a030, stars: false
  },
  arctic: {
    stops: [['0.0','#0a1e3a'],['0.3','#1a4878'],['0.6','#80b8d8'],['0.85','#c8e4f0'],['1.0','#eef8ff']],
    dotA: '#80c8f0', dotB: '#0a1e3a',
    ambient: 0.9,  ambCol: 0xaaccdd, sun: 1.6,  sunCol: 0xe8f4ff, fill: 0.6, ground: 0xe0eef8, stars: false
  },
  ocean: {
    stops: [['0.0','#040e20'],['0.3','#082a50'],['0.6','#106888'],['0.85','#30a0c0'],['1.0','#60c8d8']],
    dotA: '#22b8d0', dotB: '#082a50',
    ambient: 0.55, ambCol: 0x4499bb, sun: 1.8,  sunCol: 0xddf0ff, fill: 0.4, ground: 0x1a3a50, stars: false
  },
  volcanic: {
    stops: [['0.0','#0a0000'],['0.25','#300808'],['0.55','#882208'],['0.8','#cc5510'],['1.0','#ee8840']],
    dotA: '#cc4400', dotB: '#300808',
    ambient: 0.3,  ambCol: 0x882211, sun: 1.2,  sunCol: 0xff5500, fill: 0.2, ground: 0x2a1008, stars: false
  }
};

function setupSky() {
  var skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4; skyCanvas.height = 512;
  App._skyCanvas = skyCanvas;
  App._skyCtx = skyCanvas.getContext('2d');
  setSkyPreset('day');
}

function setSkyPreset(name) {
  var p = SKY_PRESETS[name] || SKY_PRESETS.day;
  var ctx = App._skyCtx;
  var c   = App._skyCanvas;

  // Draw gradient
  ctx.clearRect(0, 0, c.width, c.height);
  var grad = ctx.createLinearGradient(0, 0, 0, c.height);
  p.stops.forEach(function(s) { grad.addColorStop(parseFloat(s[0]), s[1]); });
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);

  // Stars for night-like presets
  if (p.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < 120; i++) {
      var sx = Math.random() * c.width;
      var sy = Math.random() * c.height * 0.75;
      var sr = Math.random() * 1.1 + 0.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  App.scene.background = new THREE.CanvasTexture(App._skyCanvas);

  // Lighting — guard: lights may not exist yet on first call
  if (App.ambientLight) {
    App.ambientLight.intensity = p.ambient;
    App.ambientLight.color.set(p.ambCol);
  }
  if (App.sunLight) {
    App.sunLight.intensity = p.sun;
    App.sunLight.color.set(p.sunCol);
  }
  if (App.fillLight) {
    App.fillLight.intensity = p.fill;
  }
  if (App.groundMesh) {
    App.groundMesh.material.color.set(p.ground);
  }

  // Update sky dot preview
  var dot = document.getElementById('sky-dot');
  if (dot) dot.style.background = 'linear-gradient(135deg,' + p.dotA + ',' + p.dotB + ')';
}

// ══════════════════════════════════════════════════════════════
//  LIGHTS
// ══════════════════════════════════════════════════════════════
function setupLights() {
  App.ambientLight = new THREE.AmbientLight(0x8899bb, 0.6);
  App.scene.add(App.ambientLight);

  App.sunLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
  App.sunLight.position.set(30, 50, 20);
  App.sunLight.castShadow = true;
  App.sunLight.shadow.mapSize.width  = 2048;
  App.sunLight.shadow.mapSize.height = 2048;
  App.sunLight.shadow.camera.left   = -40;
  App.sunLight.shadow.camera.right  =  40;
  App.sunLight.shadow.camera.top    =  40;
  App.sunLight.shadow.camera.bottom = -40;
  App.sunLight.shadow.camera.far    = 200;
  App.sunLight.shadow.bias          = -0.001;
  App.scene.add(App.sunLight);

  App.fillLight = new THREE.DirectionalLight(0x8899cc, 0.4);
  App.fillLight.position.set(-20, 20, -15);
  App.scene.add(App.fillLight);

  var hemi = new THREE.HemisphereLight(0x8899bb, 0x445533, 0.3);
  App.scene.add(hemi);
}

// ══════════════════════════════════════════════════════════════
//  GROUND & GRID
// ══════════════════════════════════════════════════════════════
function setupGround() {
  var geo = new THREE.PlaneGeometry(200, 200);
  var mat = new THREE.MeshStandardMaterial({
    color: 0x3d6632, roughness: 0.95, metalness: 0,
  });
  App.groundMesh = new THREE.Mesh(geo, mat);
  App.groundMesh.rotation.x = -Math.PI / 2;
  App.groundMesh.receiveShadow = true;
  App.groundMesh.name = '__ground__';
  App.scene.add(App.groundMesh);
}

function setupGrid() {
  App.gridHelper = new THREE.GridHelper(200, 200, 0x334466, 0x1a2233);
  App.gridHelper.position.y = 0.001;
  App.scene.add(App.gridHelper);
}

// ══════════════════════════════════════════════════════════════
//  CAMERA CONTROLS
// ══════════════════════════════════════════════════════════════
function setupOrbitControls() {
  App.orbitControls = new THREE.OrbitControls(App.camera, App.renderer.domElement);
  App.orbitControls.enableDamping = true;
  App.orbitControls.dampingFactor = 0.08;
  App.orbitControls.minDistance = 1;
  App.orbitControls.maxDistance = 300;
  App.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
  App.orbitControls.mouseButtons = {
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN
  };
}

function setCameraView(view) {
  var pos, tgt = new THREE.Vector3(0, 0, 0);
  var dist = 20;
  switch (view) {
    case 'top':         pos = new THREE.Vector3(0, dist*1.5, 0.01); break;
    case 'front':       pos = new THREE.Vector3(0, dist*0.4, dist); break;
    case 'side':        pos = new THREE.Vector3(dist, dist*0.4, 0);  break;
    case 'iso':         pos = new THREE.Vector3(dist*0.8, dist*0.8, dist*0.8); break;
    case 'perspective': pos = new THREE.Vector3(12, 9, 14); break;
    default:            pos = new THREE.Vector3(12, 9, 14);
  }
  App.camera.position.copy(pos);
  App.orbitControls.target.copy(tgt);
  App.orbitControls.update();
}

// ══════════════════════════════════════════════════════════════
//  TRANSFORM CONTROLS
// ══════════════════════════════════════════════════════════════
function setupTransformControls() {
  App.transformControls = new THREE.TransformControls(App.camera, App.renderer.domElement);
  App.transformControls.addEventListener('dragging-changed', function(e) {
    App.orbitControls.enabled = !e.value;
  });
  App.transformControls.addEventListener('objectChange', function() {
    updatePropertiesPanel();
    updateDimLabels();
    snapObjectToGrid(App.selectedObject);
  });
  App.transformControls.addEventListener('mouseUp', function() {
    // Save to history after transform
    if (App.selectedObject) {
      historyPush({ type: 'transform', obj: App.selectedObject,
        pos: App.selectedObject.position.clone(),
        rot: App.selectedObject.rotation.clone(),
        scl: App.selectedObject.scale.clone()
      });
    }
  });
  App.scene.add(App.transformControls);
}

function setTransformMode(mode) {
  App.transformControls.setMode(mode);
  document.querySelectorAll('.tmode-btn[data-mode]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

// ══════════════════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════════════════
function historyPush(action) {
  // Trim redo stack
  if (App.historyIndex < App.history.length - 1) {
    App.history = App.history.slice(0, App.historyIndex + 1);
  }
  App.history.push(action);
  if (App.history.length > App.MAX_HISTORY) App.history.shift();
  App.historyIndex = App.history.length - 1;
  updateStatusBar();
}

function undo() {
  if (App.historyIndex < 0) { showToast('Nothing to undo', ''); return; }
  var action = App.history[App.historyIndex--];
  undoAction(action);
  updateStatusBar();
}

function redo() {
  if (App.historyIndex >= App.history.length - 1) { showToast('Nothing to redo', ''); return; }
  var action = App.history[++App.historyIndex];
  redoAction(action);
  updateStatusBar();
}

function undoAction(action) {
  if (action.type === 'place') {
    App.scene.remove(action.obj);
    App.placedObjects = App.placedObjects.filter(function(o) { return o !== action.obj; });
    if (App.selectedObject === action.obj) deselectObject();
  } else if (action.type === 'delete') {
    App.scene.add(action.obj);
    App.placedObjects.push(action.obj);
  } else if (action.type === 'transform') {
    // Restore previous state stored in action (simplified)
  }
  updateStatusBar();
}

function redoAction(action) {
  if (action.type === 'place') {
    App.scene.add(action.obj);
    App.placedObjects.push(action.obj);
  } else if (action.type === 'delete') {
    App.scene.remove(action.obj);
    App.placedObjects = App.placedObjects.filter(function(o) { return o !== action.obj; });
    if (App.selectedObject === action.obj) deselectObject();
  }
  updateStatusBar();
}

// ══════════════════════════════════════════════════════════════
//  GHOST PREVIEW
// ══════════════════════════════════════════════════════════════
function createGhost(elementId) {
  clearGhost();
  var elem = ELEM_REGISTRY[elementId];
  if (!elem) return;

  var group = elem.create(Object.assign({}, elem.defaultDims));
  // Make translucent blue
  group.traverse(function(child) {
    if (child.isMesh) {
      var origMat = child.material;
      child.material = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.5,
        metalness: 0.1,
        depthWrite: false,
      });
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
  group.name = '__ghost__';
  App.scene.add(group);
  App.ghostObject = group;
}

function clearGhost() {
  if (App.ghostObject) {
    App.scene.remove(App.ghostObject);
    App.ghostObject = null;
  }
}

function updateGhostPosition() {
  if (!App.ghostObject) return;
  var pt = getGroundIntersection();
  if (!pt) return;
  var snapped = snapToGrid(pt);
  App.ghostObject.position.set(snapped.x, App._ghostHeight || 0, snapped.z);
  App.ghostObject.rotation.y = _ghostYaw;
}

// ══════════════════════════════════════════════════════════════
//  PLACEMENT
// ══════════════════════════════════════════════════════════════
function placeElement() {
  if (!App.activeTool || App.activeMode !== 'place') return;

  var elem = ELEM_REGISTRY[App.activeTool];
  if (!elem) return;

  var pt = getGroundIntersection();
  if (!pt) return;
  var snapped = snapToGrid(pt);

  var dims = Object.assign({}, elem.defaultDims);
  var obj = elem.create(dims);
  obj.position.set(snapped.x, 0, snapped.z);
  obj.userData = {
    elementId:  elem.id,
    elementName: elem.name,
    category:   elem.category,
    dims:       Object.assign({}, dims),
    color:      '#ffffff',
    material:   'default',
    opacity:    1.0,
  };
  obj.name = elem.name + '_' + Date.now();

  App.scene.add(obj);
  App.placedObjects.push(obj);

  historyPush({ type: 'place', obj: obj });

  selectObject(obj);
  updateStatusBar();
  showToast('Placed: ' + elem.name, 'success');
}

// ══════════════════════════════════════════════════════════════
//  SELECTION
// ══════════════════════════════════════════════════════════════
function selectObject(obj) {
  deselectObject();
  App.selectedObject = obj;

  // Bounding box
  if (App.bboxHelper) App.scene.remove(App.bboxHelper);
  App.bboxHelper = new THREE.BoxHelper(obj, 0xffaa00);
  App.bboxHelper.name = '__bbox__';
  App.scene.add(App.bboxHelper);

  App.transformControls.attach(obj);
  document.getElementById('transform-overlay').style.display = 'flex';

  updatePropertiesPanel();
  updateDimLabels();
  updateStatusBar();
}

function deselectObject() {
  if (App.bboxHelper) {
    App.scene.remove(App.bboxHelper);
    App.bboxHelper = null;
  }
  App.transformControls.detach();
  App.selectedObject = null;
  document.getElementById('transform-overlay').style.display = 'none';
  hideDimLabels();
  showNoSelection();
  updateStatusBar();
}

function deleteSelected() {
  if (!App.selectedObject) return;
  var obj = App.selectedObject;
  deselectObject();
  App.scene.remove(obj);
  App.placedObjects = App.placedObjects.filter(function(o) { return o !== obj; });
  historyPush({ type: 'delete', obj: obj });
  updateStatusBar();
  showToast('Deleted element', '');
}

function duplicateSelected() {
  if (!App.selectedObject) return;
  var src = App.selectedObject;
  var ud = src.userData;
  var elem = ELEM_REGISTRY[ud.elementId];
  if (!elem) return;

  var dims = Object.assign({}, ud.dims);
  var copy = elem.create(dims);
  copy.position.copy(src.position);
  copy.position.x += 0.5;
  copy.position.z += 0.5;
  copy.rotation.copy(src.rotation);
  copy.scale.copy(src.scale);
  copy.userData = JSON.parse(JSON.stringify(ud));
  copy.name = src.name + '_copy';

  App.scene.add(copy);
  App.placedObjects.push(copy);
  historyPush({ type: 'place', obj: copy });

  selectObject(copy);
  updateStatusBar();
  showToast('Duplicated: ' + ud.elementName, 'success');
}

// ══════════════════════════════════════════════════════════════
//  RAYCASTING
// ══════════════════════════════════════════════════════════════
function getGroundIntersection() {
  App.raycaster.setFromCamera(App.mouse, App.camera);
  var target = new THREE.Vector3();
  var intersects = App.raycaster.ray.intersectPlane(App.groundPlane, target);
  return intersects ? target : null;
}

function getObjectUnderMouse() {
  var targets = App.placedObjects.filter(function(o) { return o.name !== '__ghost__'; });
  App.raycaster.setFromCamera(App.mouse, App.camera);
  var hits = App.raycaster.intersectObjects(targets, true);
  if (hits.length === 0) return null;

  // Walk up to find the root placed object
  var hit = hits[0].object;
  while (hit.parent && hit.parent !== App.scene) {
    hit = hit.parent;
  }
  if (App.placedObjects.indexOf(hit) === -1) return null;
  return hit;
}

function snapToGrid(pt) {
  if (!App.snapEnabled) return pt;
  return new THREE.Vector3(
    Math.round(pt.x / App.snapSize) * App.snapSize,
    pt.y,
    Math.round(pt.z / App.snapSize) * App.snapSize
  );
}

function snapObjectToGrid(obj) {
  if (!App.snapEnabled || !obj || App.transformControls.mode !== 'translate') return;
  obj.position.x = Math.round(obj.position.x / App.snapSize) * App.snapSize;
  obj.position.z = Math.round(obj.position.z / App.snapSize) * App.snapSize;
}

// ══════════════════════════════════════════════════════════════
//  MEASURE TOOL
// ══════════════════════════════════════════════════════════════
function startMeasure() {
  App.measurePoints = [];
  if (App.measureLine) { App.scene.remove(App.measureLine); App.measureLine = null; }
  updateMeasurePanel(null);
}

function addMeasurePoint(pt) {
  App.measurePoints.push(pt.clone());
  if (App.measurePoints.length === 2) {
    var dist = App.measurePoints[0].distanceTo(App.measurePoints[1]);
    // Draw line
    var geo = new THREE.BufferGeometry().setFromPoints(App.measurePoints);
    var mat = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
    if (App.measureLine) App.scene.remove(App.measureLine);
    App.measureLine = new THREE.Line(geo, mat);
    App.measureLine.position.y = 0.01;
    App.scene.add(App.measureLine);

    updateMeasurePanel(dist);
    App.measurePoints = [];
    showToast('Distance: ' + formatDim(dist), 'success');
  }
}

function updateMeasurePanel(dist) {
  var body = document.getElementById('properties-body');
  var html = '<div class="measure-panel">';
  html += '<div class="prop-section-title">Measure Tool</div>';
  if (dist !== null) {
    html += '<div class="measure-result">';
    html += '<div class="dist-value">' + formatDim(dist) + '</div>';
    html += '<div class="dist-label">Distance</div></div>';
    html += '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px">Click two points to measure again</p>';
  } else {
    html += '<p style="font-size:12px;color:var(--text-secondary);text-align:center;padding:16px">Click the first point in the scene</p>';
  }
  html += '</div>';
  body.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
//  DIMENSION LABELS
// ══════════════════════════════════════════════════════════════
function updateDimLabels() {
  if (!App.selectedObject) { hideDimLabels(); return; }

  var bbox = new THREE.Box3().setFromObject(App.selectedObject);
  var size = new THREE.Vector3();
  bbox.getSize(size);
  var center = new THREE.Vector3();
  bbox.getCenter(center);

  var wPos = new THREE.Vector3(center.x, bbox.min.y - 0.3, center.z);
  var hPos = new THREE.Vector3(bbox.max.x + 0.4, center.y, center.z);
  var dPos = new THREE.Vector3(center.x, bbox.min.y - 0.3, bbox.max.z + 0.4);

  setDimLabel('dim-w', formatDim(size.x), wPos);
  setDimLabel('dim-h', formatDim(size.y), hPos);
  setDimLabel('dim-d', formatDim(size.z), dPos);
}

function setDimLabel(id, text, worldPos) {
  var el = document.getElementById(id);
  var canvas = App.renderer.domElement;
  var rect = canvas.getBoundingClientRect();

  var vec = worldPos.clone().project(App.camera);
  var x = (vec.x * 0.5 + 0.5) * rect.width  + rect.left;
  var y = (-(vec.y * 0.5) + 0.5) * rect.height + rect.top;

  // Check if behind camera
  if (vec.z > 1) { el.style.display = 'none'; return; }

  el.style.display = 'block';
  el.style.left = (x - rect.left) + 'px';
  el.style.top  = (y - rect.top) + 'px';
  el.textContent = text;
}

function hideDimLabels() {
  ['dim-w','dim-h','dim-d'].forEach(function(id) {
    document.getElementById(id).style.display = 'none';
  });
}

// ══════════════════════════════════════════════════════════════
//  UNITS FORMATTING
// ══════════════════════════════════════════════════════════════
function formatDim(meters) {
  switch (App.units) {
    case 'mm': return (meters * 1000).toFixed(0) + ' mm';
    case 'cm': return (meters * 100).toFixed(1) + ' cm';
    case 'ft': return (meters * 3.28084).toFixed(2) + " ft";
    default:   return meters.toFixed(2) + ' m';
  }
}

// ══════════════════════════════════════════════════════════════
//  PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════
function showNoSelection() {
  var body = document.getElementById('properties-body');
  body.innerHTML = '<div id="no-selection">' +
    '<div class="no-sel-icon">🏗️</div>' +
    '<p class="no-sel-title">No element selected</p>' +
    '<p class="no-sel-sub">Click an element in the scene, or choose a tool from the left panel to start building.</p>' +
    '</div>';
}

function updatePropertiesPanel() {
  var obj = App.selectedObject;
  if (!obj) { showNoSelection(); return; }

  var ud  = obj.userData || {};
  var pos = obj.position;
  var rot = obj.rotation;
  var scl = obj.scale;

  var bbox = new THREE.Box3().setFromObject(obj);
  var size = new THREE.Vector3();
  bbox.getSize(size);

  var html = '';

  // Element name header
  html += '<div style="padding:10px 8px 4px">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + (ud.elementName || obj.name) + '</div>';
  html += '<div style="font-size:10px;color:var(--text-muted)">' + (ud.category || '') + '</div>';
  html += '</div>';

  // Dimensions
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Dimensions</div>';
  html += '<div class="prop-3col">';
  html += propInputGroup('W', formatDim(size.x), 'prop-dim-w', 'number', 'step="0.1"');
  html += propInputGroup('H', formatDim(size.y), 'prop-dim-h', 'number', 'step="0.1"');
  html += propInputGroup('D', formatDim(size.z), 'prop-dim-d', 'number', 'step="0.1"');
  html += '</div></div>';

  // Position
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Position</div>';
  html += '<div class="prop-3col">';
  html += propInputGroup('X', pos.x.toFixed(2), 'prop-pos-x', 'number', 'step="0.1"');
  html += propInputGroup('Y', pos.y.toFixed(2), 'prop-pos-y', 'number', 'step="0.1"');
  html += propInputGroup('Z', pos.z.toFixed(2), 'prop-pos-z', 'number', 'step="0.1"');
  html += '</div></div>';

  // Rotation (Y only for simplicity, plus full 3-axis)
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Rotation (°)</div>';
  html += '<div class="prop-3col">';
  html += propInputGroup('X°', (THREE.MathUtils.radToDeg(rot.x)).toFixed(1), 'prop-rot-x', 'number', 'step="5"');
  html += propInputGroup('Y°', (THREE.MathUtils.radToDeg(rot.y)).toFixed(1), 'prop-rot-y', 'number', 'step="5"');
  html += propInputGroup('Z°', (THREE.MathUtils.radToDeg(rot.z)).toFixed(1), 'prop-rot-z', 'number', 'step="5"');
  html += '</div></div>';

  // Scale
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Scale</div>';
  html += '<div class="prop-3col">';
  html += propInputGroup('Sx', scl.x.toFixed(2), 'prop-scl-x', 'number', 'step="0.05" min="0.05"');
  html += propInputGroup('Sy', scl.y.toFixed(2), 'prop-scl-y', 'number', 'step="0.05" min="0.05"');
  html += propInputGroup('Sz', scl.z.toFixed(2), 'prop-scl-z', 'number', 'step="0.05" min="0.05"');
  html += '</div></div>';

  // Color & Material
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Appearance</div>';

  html += '<div class="prop-color-wrap">';
  html += '<label class="prop-label">Color</label>';
  html += '<label class="prop-color-swatch"><input type="color" id="prop-color" value="' + (ud.color || '#ffffff') + '"></label>';
  html += '<span id="prop-color-hex" style="font-size:11px;color:var(--text-muted)">' + (ud.color || '#ffffff') + '</span>';
  html += '</div>';

  html += '<div class="prop-row"><label class="prop-label">Opacity</label>';
  html += '<div style="flex:1"><input type="range" class="prop-slider" id="prop-opacity" min="0.1" max="1" step="0.05" value="' + (ud.opacity || 1.0) + '"></div>';
  html += '<span id="prop-opacity-val" style="font-size:10px;color:var(--text-muted);min-width:28px;text-align:right">' + Math.round((ud.opacity||1)*100) + '%</span>';
  html += '</div>';

  html += '<div class="prop-section-title" style="margin-top:6px">Material Preset</div>';
  html += '<div class="prop-mat-grid">';
  var mats = [
    ['default','Default'], ['concrete','Concrete'], ['brick','Brick'],
    ['wood','Wood'], ['glass','Glass'], ['metal','Metal'],
    ['marble','Marble'], ['tile','Tile'], ['plaster','Plaster'],
  ];
  mats.forEach(function(m) {
    var active = (ud.material || 'default') === m[0] ? ' active' : '';
    html += '<button class="mat-btn' + active + '" data-mat="' + m[0] + '">' + m[1] + '</button>';
  });
  html += '</div></div>';

  // Elevation helper
  html += '<div class="prop-section">';
  html += '<div class="prop-section-title">Elevation</div>';
  html += '<div class="prop-row"><label class="prop-label">Floor Y</label>';
  html += '<input type="number" class="prop-input" id="prop-elev" step="0.1" value="' + pos.y.toFixed(2) + '"></div>';
  html += '</div>';

  // Actions
  html += '<div class="prop-section">';
  html += '<div class="prop-action-row">';
  html += '<button class="prop-btn" id="prop-btn-dup">⊕ Duplicate</button>';
  html += '<button class="prop-btn danger" id="prop-btn-del">✕ Delete</button>';
  html += '</div>';
  html += '<div class="prop-action-row">';
  html += '<button class="prop-btn" id="prop-btn-reset-rot">↺ Reset Rotation</button>';
  html += '</div>';
  html += '</div>';

  document.getElementById('properties-body').innerHTML = html;

  // Wire up property events
  wirePropEvents(obj);
}

function propInputGroup(label, value, id, type, extra) {
  return '<div class="prop-input-group">' +
    '<label>' + label + '</label>' +
    '<input type="' + type + '" class="prop-input" id="' + id + '" value="' + value + '" ' + (extra||'') + '>' +
    '</div>';
}

function wirePropEvents(obj) {
  function onPosChange() {
    var x = parseFloat(document.getElementById('prop-pos-x').value) || 0;
    var y = parseFloat(document.getElementById('prop-pos-y').value) || 0;
    var z = parseFloat(document.getElementById('prop-pos-z').value) || 0;
    obj.position.set(x, y, z);
    updateDimLabels();
  }

  function onRotChange() {
    var rx = THREE.MathUtils.degToRad(parseFloat(document.getElementById('prop-rot-x').value) || 0);
    var ry = THREE.MathUtils.degToRad(parseFloat(document.getElementById('prop-rot-y').value) || 0);
    var rz = THREE.MathUtils.degToRad(parseFloat(document.getElementById('prop-rot-z').value) || 0);
    obj.rotation.set(rx, ry, rz);
    updateDimLabels();
  }

  function onSclChange() {
    var sx = parseFloat(document.getElementById('prop-scl-x').value) || 1;
    var sy = parseFloat(document.getElementById('prop-scl-y').value) || 1;
    var sz = parseFloat(document.getElementById('prop-scl-z').value) || 1;
    obj.scale.set(sx, sy, sz);
    if (App.bboxHelper) App.bboxHelper.update();
    updateDimLabels();
  }

  ['prop-pos-x','prop-pos-y','prop-pos-z'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', onPosChange);
  });
  ['prop-rot-x','prop-rot-y','prop-rot-z'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', onRotChange);
  });
  ['prop-scl-x','prop-scl-y','prop-scl-z'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', onSclChange);
  });

  var elevEl = document.getElementById('prop-elev');
  if (elevEl) elevEl.addEventListener('input', function() {
    obj.position.y = parseFloat(this.value) || 0;
    document.getElementById('prop-pos-y').value = obj.position.y.toFixed(2);
    updateDimLabels();
  });

  var colorEl = document.getElementById('prop-color');
  if (colorEl) colorEl.addEventListener('input', function() {
    var hex = this.value;
    obj.userData.color = hex;
    document.getElementById('prop-color-hex').textContent = hex;
    applyColorToObject(obj, hex);
  });

  var opEl = document.getElementById('prop-opacity');
  if (opEl) opEl.addEventListener('input', function() {
    var val = parseFloat(this.value);
    obj.userData.opacity = val;
    document.getElementById('prop-opacity-val').textContent = Math.round(val*100) + '%';
    applyOpacityToObject(obj, val);
  });

  document.querySelectorAll('.mat-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mat-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      obj.userData.material = this.dataset.mat;
      applyMaterialPreset(obj, this.dataset.mat);
    });
  });

  var delBtn = document.getElementById('prop-btn-del');
  if (delBtn) delBtn.addEventListener('click', deleteSelected);

  var dupBtn = document.getElementById('prop-btn-dup');
  if (dupBtn) dupBtn.addEventListener('click', duplicateSelected);

  var resetRotBtn = document.getElementById('prop-btn-reset-rot');
  if (resetRotBtn) resetRotBtn.addEventListener('click', function() {
    obj.rotation.set(0, 0, 0);
    updatePropertiesPanel();
    updateDimLabels();
  });
}

// ── Material & Color application ─────────────────────────────
function applyColorToObject(obj, hexColor) {
  var color = new THREE.Color(hexColor);
  obj.traverse(function(child) {
    if (child.isMesh && !isGlassMaterial(child.material)) {
      child.material = child.material.clone();
      child.material.color.copy(color);
    }
  });
}

function applyOpacityToObject(obj, opacity) {
  obj.traverse(function(child) {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = opacity < 1.0;
      child.material.opacity = opacity;
    }
  });
}

function isGlassMaterial(mat) {
  return mat.transparent && mat.opacity < 0.5 && mat.roughness < 0.2;
}

var MAT_PRESETS = {
  default:  { color: null, roughness: 0.7, metalness: 0.05 },
  concrete: { color: 0x999088, roughness: 0.9, metalness: 0.0 },
  brick:    { color: 0xcc5533, roughness: 0.95, metalness: 0.0 },
  wood:     { color: 0x8b6340, roughness: 0.85, metalness: 0.0 },
  glass:    { color: 0x88aacc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3 },
  metal:    { color: 0xaaaaaa, roughness: 0.15, metalness: 0.9 },
  marble:   { color: 0xeeeae0, roughness: 0.15, metalness: 0.05 },
  tile:     { color: 0xddddcc, roughness: 0.4, metalness: 0.05 },
  plaster:  { color: 0xf0ece0, roughness: 0.85, metalness: 0.0 },
};

function applyMaterialPreset(obj, presetName) {
  var preset = MAT_PRESETS[presetName] || MAT_PRESETS.default;
  var baseColor = obj.userData.color ? new THREE.Color(obj.userData.color) : null;

  obj.traverse(function(child) {
    if (child.isMesh && !isGlassMaterial(child.material)) {
      var origColor = child.material.color ? child.material.color.clone() : new THREE.Color(0xffffff);
      var newColor = preset.color ? new THREE.Color(preset.color) : (baseColor || origColor);
      child.material = new THREE.MeshStandardMaterial({
        color: newColor,
        roughness: preset.roughness,
        metalness: preset.metalness,
        transparent: preset.transparent || false,
        opacity: preset.opacity || 1.0,
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  UI BUILD
// ══════════════════════════════════════════════════════════════
function buildUI() {
  buildElementCategories();
  buildHeaderEvents();
}

function buildElementCategories() {
  var container = document.getElementById('element-categories');
  container.innerHTML = '';

  ELEM_CATEGORIES.forEach(function(cat) {
    var section = document.createElement('div');
    section.className = 'cat-section';
    section.dataset.cat = cat.name;

    var header = document.createElement('div');
    header.className = 'cat-header';
    header.innerHTML = '<div class="cat-header-left">' +
      '<span class="cat-icon">' + cat.icon + '</span>' +
      '<span class="cat-name">' + cat.name + '</span>' +
      '<span class="cat-count">(' + cat.elements.length + ')</span>' +
      '</div><span class="cat-chevron">▾</span>';

    var items = document.createElement('div');
    items.className = 'cat-items';

    cat.elements.forEach(function(elem) {
      var btn = document.createElement('button');
      btn.className = 'elem-btn';
      btn.dataset.elemId = elem.id;
      btn.title = elem.name + ' [click to place]';
      btn.innerHTML = '<span class="elem-icon">' + elem.icon + '</span>' +
                      '<span class="elem-name">' + elem.name + '</span>';
      btn.addEventListener('click', function() {
        setActiveTool(elem.id);
      });
      items.appendChild(btn);
    });

    header.addEventListener('click', function() {
      var collapsed = items.classList.contains('collapsed');
      if (collapsed) {
        items.classList.remove('collapsed');
        header.classList.remove('collapsed');
        items.style.maxHeight = items.scrollHeight + 'px';
      } else {
        items.classList.add('collapsed');
        header.classList.add('collapsed');
        items.style.maxHeight = '0';
      }
    });

    // Start collapsed except first two
    var catIndex = ELEM_CATEGORIES.indexOf(cat);
    if (catIndex > 2) {
      items.classList.add('collapsed');
      header.classList.add('collapsed');
      items.style.maxHeight = '0';
    } else {
      items.style.maxHeight = '9999px';
    }

    section.appendChild(header);
    section.appendChild(items);
    container.appendChild(section);
  });
}

function buildHeaderEvents() {
  // Grid toggle
  var gridToggle = document.getElementById('grid-toggle');
  var gridBtn = document.getElementById('btn-grid');
  function updateGridToggle() {
    App.gridVisible = gridToggle.checked;
    App.gridHelper.visible = App.gridVisible;
    gridBtn.classList.toggle('active', App.gridVisible);
  }
  gridToggle.addEventListener('change', updateGridToggle);
  updateGridToggle();

  // Snap toggle
  var snapToggle = document.getElementById('snap-toggle');
  var snapBtn = document.getElementById('btn-snap');
  function updateSnapToggle() {
    App.snapEnabled = snapToggle.checked;
    snapBtn.classList.toggle('active', App.snapEnabled);
  }
  snapToggle.addEventListener('change', updateSnapToggle);
  updateSnapToggle();

  // Unit select
  document.getElementById('unit-select').addEventListener('change', function() {
    App.units = this.value;
    if (App.selectedObject) { updatePropertiesPanel(); updateDimLabels(); }
  });

  // Sky preset select
  var skySelect = document.getElementById('sky-select');
  if (skySelect) {
    skySelect.addEventListener('change', function() {
      setSkyPreset(this.value);
      showToast('Sky: ' + this.options[this.selectedIndex].text.trim(), 'success');
    });
  }

  // Undo/redo
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);

  // New
  document.getElementById('btn-new').addEventListener('click', function() {
    if (confirm('Clear the scene and start fresh?')) {
      clearScene();
    }
  });

  // Save
  document.getElementById('btn-save').addEventListener('click', saveScene);

  // Load
  document.getElementById('btn-load').addEventListener('click', function() {
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', function(e) {
    loadScene(e.target.files[0]);
  });

  // Screenshot
  document.getElementById('btn-screenshot').addEventListener('click', takeScreenshot);

  // Quick tools
  document.getElementById('qtool-select').addEventListener('click', function() { setSelectMode(); });
  document.getElementById('qtool-measure').addEventListener('click', function() { setMeasureMode(); });
  document.getElementById('qtool-delete').addEventListener('click', deleteSelected);
  document.getElementById('qtool-duplicate').addEventListener('click', duplicateSelected);

  // Camera views
  document.querySelectorAll('.view-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { setCameraView(this.dataset.view); });
  });

  // Transform mode buttons
  document.querySelectorAll('.tmode-btn[data-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() { setTransformMode(this.dataset.mode); });
  });

  // Deselect button
  var deselBtn = document.getElementById('btn-deselect');
  if (deselBtn) deselBtn.addEventListener('click', deselectObject);

  // Search
  var searchEl = document.getElementById('search-elements');
  var clearBtn = document.getElementById('search-clear');

  searchEl.addEventListener('input', function() {
    filterElements(this.value.trim());
    clearBtn.style.display = this.value ? '' : 'none';
  });
  clearBtn.addEventListener('click', function() {
    searchEl.value = '';
    filterElements('');
    this.style.display = 'none';
  });
}

function filterElements(query) {
  var q = query.toLowerCase();
  document.querySelectorAll('.cat-section').forEach(function(section) {
    var anyVisible = false;
    section.querySelectorAll('.elem-btn').forEach(function(btn) {
      var name = btn.querySelector('.elem-name').textContent.toLowerCase();
      var matches = !q || name.includes(q);
      btn.classList.toggle('search-hidden', !matches);
      if (matches) anyVisible = true;
    });
    section.classList.toggle('search-empty', !anyVisible);

    // Auto-expand matching categories
    if (anyVisible && q) {
      var items = section.querySelector('.cat-items');
      var header = section.querySelector('.cat-header');
      items.classList.remove('collapsed');
      header.classList.remove('collapsed');
      items.style.maxHeight = '9999px';
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  TOOL SWITCHING
// ══════════════════════════════════════════════════════════════
function setActiveTool(elementId) {
  App.activeTool = elementId;
  App.activeMode = 'place';
  _ghostYaw = 0;
  App._ghostHeight = 0;

  // Update cursor
  document.getElementById('three-canvas').className = 'placing';

  // Highlight button
  document.querySelectorAll('.elem-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.elemId === elementId);
  });
  document.querySelectorAll('.qtool').forEach(function(b) { b.classList.remove('active'); });

  deselectObject();
  createGhost(elementId);

  var tip = document.getElementById('ghost-rotate-tip');
  if (tip) tip.classList.add('visible');

  var elem = ELEM_REGISTRY[elementId];
  document.getElementById('hint-text').textContent =
    'Click to place: ' + (elem ? elem.name : elementId) + ' · Q/E rotate · Scroll height · Esc cancel';
  document.getElementById('st-mode').textContent = '⊕ Placing';
  document.getElementById('st-mode').className = 'st-chip st-placing';

  showToast('Tool: ' + (elem ? elem.name : elementId) + ' — click to place', 'success');
}

function setSelectMode() {
  App.activeTool = null;
  App.activeMode = 'select';
  clearGhost();
  _ghostYaw = 0;
  App._ghostHeight = 0;

  var tip = document.getElementById('ghost-rotate-tip');
  if (tip) tip.classList.remove('visible');

  document.getElementById('three-canvas').className = '';
  document.querySelectorAll('.elem-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('qtool-select').classList.add('active');
  document.querySelectorAll('.qtool:not(#qtool-select)').forEach(function(b) { b.classList.remove('active'); });

  document.getElementById('hint-text').textContent = 'Click to select · Orbit: left-drag · Pan: right-drag · Zoom: scroll';
  document.getElementById('st-mode').textContent = '● Select';
  document.getElementById('st-mode').className = 'st-chip st-mode';
}

function setMeasureMode() {
  App.activeTool = 'measure';
  App.activeMode = 'measure';
  clearGhost();
  deselectObject();

  document.getElementById('three-canvas').className = 'measuring';
  document.querySelectorAll('.elem-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.qtool').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('qtool-measure').classList.add('active');

  document.getElementById('hint-text').textContent = 'Click two points to measure distance · Esc to exit';
  document.getElementById('st-mode').textContent = '📏 Measure';
  document.getElementById('st-mode').className = 'st-chip st-measuring';

  startMeasure();
}

// ══════════════════════════════════════════════════════════════
//  EVENT HANDLING
// ══════════════════════════════════════════════════════════════
function setupEvents() {
  var canvas = document.getElementById('three-canvas');

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);

  // Right-click — context menu (select mode) or cancel (place mode)
  canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    if (App.activeMode === 'place') {
      setSelectMode();
      return;
    }
    if (App.selectedObject) {
      showContextMenu(e.clientX, e.clientY);
    }
  });

  // Mouse wheel — ghost height in place mode, zoom otherwise handled by OrbitControls
  canvas.addEventListener('wheel', function(e) {
    if (App.activeMode === 'place' && App.ghostObject) {
      e.preventDefault();
      App._ghostHeight = (App._ghostHeight || 0) - e.deltaY * 0.003;
      App._ghostHeight = Math.max(-2, Math.min(20, App._ghostHeight));
      updateGhostPosition();
    }
  }, { passive: false });

  // Hide context menu on any click
  document.addEventListener('mousedown', function(e) {
    var menu = document.getElementById('ctx-menu');
    if (menu && !menu.contains(e.target)) hideContextMenu();
  });
}

function onMouseMove(e) {
  var rect = App.renderer.domElement.getBoundingClientRect();
  App.mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
  App.mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;

  // Update ghost
  if (App.activeMode === 'place' && App.ghostObject) {
    updateGhostPosition();
  }

  // Update coordinate display
  var pt = getGroundIntersection();
  if (pt) {
    var s = snapToGrid(pt);
    document.getElementById('st-coords').innerHTML = 'X: ' + s.x.toFixed(2) + ' &nbsp; Z: ' + s.z.toFixed(2);
    document.getElementById('hint-coords').textContent = s.x.toFixed(2) + ', ' + s.z.toFixed(2);
  }

  // Update bbox
  if (App.bboxHelper) App.bboxHelper.update();
}

function onMouseDown(e) {
  if (e.button !== 0) return; // Only left click
  App.isMouseDown = true;
  App.mouseDownPos = { x: e.clientX, y: e.clientY };
}

function onMouseUp(e) {
  if (e.button !== 0) return;
  App.isMouseDown = false;

  // Check for drag (orbit) vs click
  var dx = e.clientX - (App.mouseDownPos ? App.mouseDownPos.x : e.clientX);
  var dy = e.clientY - (App.mouseDownPos ? App.mouseDownPos.y : e.clientY);
  var dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > 5) return; // was a drag, not a click

  if (App.activeMode === 'place') {
    placeElement();
    return;
  }

  if (App.activeMode === 'measure') {
    var pt = getGroundIntersection();
    if (pt) addMeasurePoint(pt);
    return;
  }

  // Select mode
  var hit = getObjectUnderMouse();
  if (hit) {
    selectObject(hit);
  } else {
    // Clicked empty space
    if (App.selectedObject) deselectObject();
  }
}

// ══════════════════════════════════════════════════════════════
//  CONTEXT MENU
// ══════════════════════════════════════════════════════════════
function showContextMenu(x, y) {
  var menu = document.getElementById('ctx-menu');
  // Position with viewport clamping
  var mw = 170, mh = 210;
  var cx = Math.min(x, window.innerWidth  - mw - 8);
  var cy = Math.min(y, window.innerHeight - mh - 8);
  menu.style.left = cx + 'px';
  menu.style.top  = cy + 'px';
  menu.classList.add('visible');
}

function hideContextMenu() {
  document.getElementById('ctx-menu').classList.remove('visible');
}

function setupContextMenu() {
  document.getElementById('ctx-move').addEventListener('click',   function() { setTransformMode('translate'); hideContextMenu(); });
  document.getElementById('ctx-rotate').addEventListener('click', function() { setTransformMode('rotate');    hideContextMenu(); });
  document.getElementById('ctx-scale').addEventListener('click',  function() { setTransformMode('scale');     hideContextMenu(); });
  document.getElementById('ctx-focus').addEventListener('click',  function() { focusSelected();               hideContextMenu(); });
  document.getElementById('ctx-dup').addEventListener('click',    function() { duplicateSelected();           hideContextMenu(); });
  document.getElementById('ctx-del').addEventListener('click',    function() { deleteSelected();              hideContextMenu(); });
}

// ══════════════════════════════════════════════════════════════
//  FOCUS CAMERA ON SELECTED
// ══════════════════════════════════════════════════════════════
function focusSelected() {
  if (!App.selectedObject) return;
  var bbox = new THREE.Box3().setFromObject(App.selectedObject);
  var center = new THREE.Vector3();
  bbox.getCenter(center);
  var size = new THREE.Vector3();
  bbox.getSize(size);
  var radius = Math.max(size.x, size.y, size.z) * 1.8 + 1.5;

  // Move camera to orbit around the object
  var dir = App.camera.position.clone().sub(App.orbitControls.target).normalize();
  var newPos = center.clone().add(dir.multiplyScalar(radius));
  App.camera.position.copy(newPos);
  App.orbitControls.target.copy(center);
  App.orbitControls.update();
  showToast('Focused on: ' + (App.selectedObject.userData.elementName || App.selectedObject.name), '');
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR TOGGLES
// ══════════════════════════════════════════════════════════════
function setupSidebarToggles() {
  var leftSidebar  = document.getElementById('sidebar-left');
  var rightSidebar = document.getElementById('sidebar-right');
  var leftBtn      = document.getElementById('toggle-left');
  var rightBtn     = document.getElementById('toggle-right');
  var leftIcon     = document.getElementById('toggle-left-icon');
  var rightIcon    = document.getElementById('toggle-right-icon');

  function toggleLeft() {
    var collapsed = leftSidebar.classList.toggle('collapsed');
    leftIcon.textContent  = collapsed ? '▶' : '◀';
    leftBtn.title = collapsed ? 'Show panel ([)' : 'Hide panel ([)';
    // Give renderer a frame to see new size
    setTimeout(resize, 300);
  }

  function toggleRight() {
    var collapsed = rightSidebar.classList.toggle('collapsed');
    rightIcon.textContent  = collapsed ? '◀' : '▶';
    rightBtn.title = collapsed ? 'Show panel (])' : 'Hide panel (])';
    setTimeout(resize, 300);
  }

  leftBtn.addEventListener('click', toggleLeft);
  rightBtn.addEventListener('click', toggleRight);

  // Keyboard shortcut [ and ]
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === '[') toggleLeft();
    if (e.key === ']') toggleRight();
    if (e.key === '\\') { toggleLeft(); toggleRight(); } // \ = both at once
  });
}

// ══════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════
function setupKeyboard() {
  var MOVEMENT_KEYS = ['w','a','s','d','arrowup','arrowdown','shift'];

  // ── Key state tracking (for smooth velocity movement) ───────────────
  document.addEventListener('keydown', function(e) {
    var k = e.key.toLowerCase();
    if (MOVEMENT_KEYS.indexOf(k) !== -1) {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
        _keys[k] = true;
        if (k === 'arrowup' || k === 'arrowdown') e.preventDefault();
        // Show sprint indicator
        if (k === 'shift') {
          var si = document.getElementById('sprint-indicator');
          if (si) si.classList.add('active');
        }
      }
    }
  });
  document.addEventListener('keyup', function(e) {
    var k = e.key.toLowerCase();
    _keys[k] = false;
    if (k === 'shift') {
      var si = document.getElementById('sprint-indicator');
      if (si) si.classList.remove('active');
    }
  });
  window.addEventListener('blur', function() {
    _keys = {};
    var si = document.getElementById('sprint-indicator');
    if (si) si.classList.remove('active');
  });

  // ── Action shortcuts ─────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    var key = e.key;

    // ─ Ghost rotate while placing ──────────────────────────
    if (App.activeMode === 'place') {
      if (key === 'q' || key === 'Q') {
        _ghostYaw += Math.PI / 12;  // 15°
        if (App.ghostObject) App.ghostObject.rotation.y = _ghostYaw;
        return;
      }
      if (key === 'e' || key === 'E') {
        _ghostYaw -= Math.PI / 12;
        if (App.ghostObject) App.ghostObject.rotation.y = _ghostYaw;
        return;
      }
      if (key === 'Escape') { setSelectMode(); return; }
    }

    switch (key) {
      case 'Escape':
        if (App.activeMode === 'measure') setSelectMode();
        else deselectObject();
        break;
      case 'Delete':
      case 'Backspace':
        deleteSelected();
        break;
      // Transform modes
      case 'g': case 'G':
        if (App.selectedObject) setTransformMode('translate');
        break;
      case 'r': case 'R':
        if (App.selectedObject) setTransformMode('rotate');
        break;
      case 's': case 'S':
        if (App.selectedObject && !e.ctrlKey) setTransformMode('scale');
        break;
      // Focus camera
      case 'f': case 'F':
        focusSelected();
        break;
      // Undo / redo
      case 'z': case 'Z':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); undo(); }
        break;
      case 'y': case 'Y':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo(); }
        break;
      // Duplicate
      case 'd': case 'D':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); duplicateSelected(); }
        break;
      // New scene
      case 'n': case 'N':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); if (confirm('Clear the scene?')) clearScene(); }
        break;
      // Screenshot
      case 'F2':
        takeScreenshot();
        break;
      // Numpad / number keys for transform modes
      case '1':
        if (App.selectedObject) setTransformMode('translate');
        break;
      case '2':
        if (App.selectedObject) setTransformMode('rotate');
        break;
      case '3':
        if (App.selectedObject) setTransformMode('scale');
        break;
      case '4':
        if (App.selectedObject) deselectObject();
        break;
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  STATUS BAR
// ══════════════════════════════════════════════════════════════
function updateStatusBar() {
  var objCount = App.placedObjects.length;
  document.getElementById('st-objects').textContent = objCount + ' object' + (objCount !== 1 ? 's' : '');
}

// ══════════════════════════════════════════════════════════════
//  SAVE / LOAD / SCREENSHOT
// ══════════════════════════════════════════════════════════════
function clearScene() {
  deselectObject();
  App.placedObjects.forEach(function(obj) { App.scene.remove(obj); });
  App.placedObjects = [];
  App.history = [];
  App.historyIndex = -1;
  if (App.measureLine) { App.scene.remove(App.measureLine); App.measureLine = null; }
  updateStatusBar();
  showNoSelection();
  showToast('Scene cleared', '');
}

function saveScene() {
  var data = {
    version: 1,
    objects: App.placedObjects.map(function(obj) {
      return {
        elementId: obj.userData.elementId,
        name: obj.name,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        userData: obj.userData,
      };
    })
  };
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '3darch_scene_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Scene saved!', 'success');
}

function loadScene(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      clearScene();
      (data.objects || []).forEach(function(od) {
        var elem = ELEM_REGISTRY[od.elementId];
        if (!elem) return;
        var dims = (od.userData && od.userData.dims) || elem.defaultDims;
        var obj = elem.create(Object.assign({}, dims));
        obj.position.set(od.position.x, od.position.y, od.position.z);
        obj.rotation.set(od.rotation.x, od.rotation.y, od.rotation.z);
        obj.scale.set(od.scale.x, od.scale.y, od.scale.z);
        obj.userData = od.userData || {};
        obj.name = od.name;
        App.scene.add(obj);
        App.placedObjects.push(obj);
      });
      updateStatusBar();
      showToast('Scene loaded! ' + App.placedObjects.length + ' objects', 'success');
    } catch(err) {
      showToast('Error loading file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function takeScreenshot() {
  // Render one more frame without dimension labels for clean shot
  hideDimLabels();
  App.renderer.render(App.scene, App.camera);

  var canvas = App.renderer.domElement;
  var url = canvas.toDataURL('image/png');
  var a = document.createElement('a');
  a.href = url;
  a.download = '3darch_screenshot_' + Date.now() + '.png';
  a.click();

  if (App.selectedObject) updateDimLabels();
  showToast('Screenshot saved!', 'success');
}

// ══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION
// ══════════════════════════════════════════════════════════════
var _toastTimer = null;

function showToast(msg, type, duration) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'show' + (type ? ' ' + type : '');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() {
    toast.className = '';
  }, duration || 2500);
}

// ══════════════════════════════════════════════════════════════
//  RESIZE
// ══════════════════════════════════════════════════════════════
function resize() {
  var container = document.getElementById('viewport');
  var w = container.clientWidth;
  var h = container.clientHeight;
  App.camera.aspect = w / h;
  App.camera.updateProjectionMatrix();
  App.renderer.setSize(w, h, false);
}

// ══════════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  WASD + ARROW KEY CAMERA MOVEMENT
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  SMOOTH WASD + ARROW CAMERA MOVEMENT (velocity-based)
// ══════════════════════════════════════════════════════════════
function updateCameraMovement() {
  var any = _keys['w'] || _keys['s'] || _keys['a'] || _keys['d'] ||
            _keys['arrowup'] || _keys['arrowdown'];

  var sprint = _keys['shift'] ? CAM_SPRINT : 1.0;
  var maxSpd = CAM_MAX * sprint;

  // Forward / right vectors (flat XZ plane)
  var forward = new THREE.Vector3();
  App.camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
  forward.normalize();

  var right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  // Accumulate desired acceleration
  var accel = new THREE.Vector3();
  if (_keys['w'])         accel.addScaledVector(forward,  CAM_ACCEL * sprint);
  if (_keys['s'])         accel.addScaledVector(forward, -CAM_ACCEL * sprint);
  if (_keys['a'])         accel.addScaledVector(right,   -CAM_ACCEL * sprint);
  if (_keys['d'])         accel.addScaledVector(right,    CAM_ACCEL * sprint);
  if (_keys['arrowup'])   accel.y += CAM_ACCEL * sprint;
  if (_keys['arrowdown']) accel.y -= CAM_ACCEL * sprint;

  // Apply acceleration and friction
  _camVel.add(accel);
  _camVel.multiplyScalar(CAM_FRICTION);

  // Clamp to max speed
  if (_camVel.length() > maxSpd) _camVel.setLength(maxSpd);

  // Stop tiny drift
  if (_camVel.lengthSq() < 0.00001) _camVel.set(0, 0, 0);

  if (_camVel.lengthSq() > 0) {
    App.camera.position.add(_camVel);
    App.orbitControls.target.add(_camVel);
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateCameraMovement();
  App.orbitControls.update();

  if (App.bboxHelper && App.selectedObject) {
    App.bboxHelper.update();
  }

  App.renderer.render(App.scene, App.camera);

  // Update dim labels every frame when selected
  if (App.selectedObject) {
    updateDimLabels();
  }
}

// ══════════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', init);
