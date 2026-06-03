/* ============================================================
   3DArch Studio — Building Elements Registry
   All elements organized by category with 3D factory functions
   ============================================================ */

'use strict';

// ── Global registry ──────────────────────────────────────────
window.ELEM_REGISTRY = {};  // id → element definition
window.ELEM_CATEGORIES = []; // [{name, icon, elements:[]}]

// ── Material helpers ──────────────────────────────────────────
function _mat(color, roughness, metalness) {
  roughness = roughness !== undefined ? roughness : 0.7;
  metalness = metalness !== undefined ? metalness : 0.05;
  const m = new THREE.MeshStandardMaterial({ color: color, roughness: roughness, metalness: metalness });
  return m;
}

function _glassMat(color, opacity) {
  color = color !== undefined ? color : 0x88aacc;
  opacity = opacity !== undefined ? opacity : 0.28;
  return new THREE.MeshPhysicalMaterial({
    color: color, transparent: true, opacity: opacity,
    roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false
  });
}

function _emissiveMat(color, emissive) {
  emissive = emissive !== undefined ? emissive : color;
  return new THREE.MeshStandardMaterial({ color: color, emissive: emissive, emissiveIntensity: 0.5, roughness: 1.0, metalness: 0 });
}

// ── Geometry helpers ──────────────────────────────────────────
function _box(w, h, d, color, rough, metal) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, _mat(color, rough, metal));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function _cyl(rt, rb, h, segs, color, rough, metal) {
  segs = segs || 16;
  const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
  const mesh = new THREE.Mesh(geo, _mat(color, rough, metal));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function _sphere(r, segs, color, rough, metal) {
  segs = segs || 16;
  const geo = new THREE.SphereGeometry(r, segs, segs);
  const mesh = new THREE.Mesh(geo, _mat(color, rough, metal));
  mesh.castShadow = true;
  return mesh;
}

function _cone(r, h, segs, color, rough) {
  segs = segs || 16;
  const geo = new THREE.ConeGeometry(r, h, segs);
  const mesh = new THREE.Mesh(geo, _mat(color, rough));
  mesh.castShadow = true;
  return mesh;
}

function _torus(r, tube, color) {
  const geo = new THREE.TorusGeometry(r, tube, 8, 24);
  const mesh = new THREE.Mesh(geo, _mat(color, 0.8, 0.2));
  return mesh;
}

function _group() { return new THREE.Group(); }

function _child(group, mesh, x, y, z) {
  mesh.position.set(x || 0, y || 0, z || 0);
  group.add(mesh);
  return mesh;
}

// Gabled roof using custom geometry
function _gabledRoof(w, h, d, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const extSettings = { depth: d, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extSettings);
  // Centre along Z — no rotation needed; extrusion already lies horizontally
  geo.translate(0, 0, -d / 2);
  const mesh = new THREE.Mesh(geo, _mat(color || 0x8b4513, 0.8, 0));
  mesh.castShadow = true;
  return mesh;
}

// ── Register helper ───────────────────────────────────────────
function _reg(id, name, icon, category, w, h, d, createFn) {
  const elem = { id, name, icon, category, defaultDims: { w, h, d }, create: createFn };
  ELEM_REGISTRY[id] = elem;

  let cat = ELEM_CATEGORIES.find(function(c) { return c.name === category; });
  if (!cat) {
    cat = { name: category, icon: _catIcon(category), elements: [] };
    ELEM_CATEGORIES.push(cat);
  }
  cat.elements.push(elem);
}

function _catIcon(name) {
  var icons = {
    'Structural': '🏗️', 'Openings': '🚪', 'Roofing': '🏠',
    'Circulation': '🪜', 'Living Room': '🛋️', 'Bedroom': '🛏️',
    'Kitchen': '🍳', 'Bathroom': '🛁', 'Dining': '🪑',
    'Office': '💼', 'Lighting': '💡', 'Outdoor': '🌳',
    'Details': '🔧', 'Decor': '🖼️'
  };
  return icons[name] || '📦';
}

// ══════════════════════════════════════════════════════════════
//  1. STRUCTURAL
// ══════════════════════════════════════════════════════════════

_reg('foundation', 'Foundation Slab', '⬛', 'Structural', 6, 0.3, 4, function(d) {
  var g = _group();
  var slab = _box(d.w, d.h, d.d, 0x888888, 0.9, 0);
  slab.position.y = d.h / 2;
  g.add(slab);
  return g;
});

_reg('wall', 'Straight Wall', '🧱', 'Structural', 4, 2.8, 0.25, function(d) {
  var g = _group();
  var wall = _box(d.w, d.h, d.d, 0xd4c5a9, 0.85, 0);
  wall.position.y = d.h / 2;
  g.add(wall);
  return g;
});

_reg('wall-thin', 'Thin Partition', '▬', 'Structural', 3, 2.4, 0.12, function(d) {
  var g = _group();
  var wall = _box(d.w, d.h, d.d, 0xe8e0d0, 0.7, 0);
  wall.position.y = d.h / 2;
  g.add(wall);
  return g;
});

_reg('column', 'Column / Pillar', '🏛️', 'Structural', 0.4, 3, 0.4, function(d) {
  var g = _group();
  // Base
  var base = _box(d.w + 0.15, 0.15, d.d + 0.15, 0xc0b090, 0.6, 0);
  base.position.y = 0.075;
  g.add(base);
  // Shaft
  var shaft = _cyl(d.w / 2, d.w / 2, d.h, 8, 0xd4c8b0, 0.6, 0);
  shaft.position.y = d.h / 2 + 0.15;
  g.add(shaft);
  // Capital
  var cap = _box(d.w + 0.15, 0.15, d.d + 0.15, 0xc0b090, 0.6, 0);
  cap.position.y = d.h + 0.225;
  g.add(cap);
  return g;
});

_reg('beam', 'Structural Beam', '━', 'Structural', 5, 0.3, 0.25, function(d) {
  var g = _group();
  var beam = _box(d.w, d.h, d.d, 0x8b7355, 0.7, 0.1);
  beam.position.y = d.h / 2;
  g.add(beam);
  return g;
});

_reg('floor-slab', 'Floor Slab', '▭', 'Structural', 5, 0.2, 4, function(d) {
  var g = _group();
  var slab = _box(d.w, d.h, d.d, 0xb0a898, 0.8, 0);
  slab.position.y = d.h / 2;
  g.add(slab);
  return g;
});

_reg('ceiling', 'Ceiling Panel', '⬜', 'Structural', 4, 0.12, 3, function(d) {
  var g = _group();
  var ceil = _box(d.w, d.h, d.d, 0xf0ece4, 0.7, 0);
  ceil.position.y = d.h / 2;
  g.add(ceil);
  return g;
});

_reg('glass-wall', 'Glass Wall', '🔲', 'Structural', 4, 2.8, 0.12, function(d) {
  var g = _group();
  // Frame
  var frameTop = _box(d.w, 0.08, 0.08, 0x555555, 0.3, 0.6);
  frameTop.position.y = d.h - 0.04;
  g.add(frameTop);
  var frameBot = _box(d.w, 0.08, 0.08, 0x555555, 0.3, 0.6);
  frameBot.position.y = 0.04;
  g.add(frameBot);
  var frameL = _box(0.08, d.h, 0.08, 0x555555, 0.3, 0.6);
  frameL.position.set(-d.w / 2 + 0.04, d.h / 2, 0);
  g.add(frameL);
  var frameR = _box(0.08, d.h, 0.08, 0x555555, 0.3, 0.6);
  frameR.position.set(d.w / 2 - 0.04, d.h / 2, 0);
  g.add(frameR);
  // Glass pane
  var glass = new THREE.Mesh(
    new THREE.BoxGeometry(d.w - 0.1, d.h - 0.1, d.d),
    _glassMat(0x88bbdd, 0.2)
  );
  glass.position.y = d.h / 2;
  g.add(glass);
  return g;
});

_reg('retaining-wall', 'Retaining Wall', '🪨', 'Structural', 3, 1.2, 0.4, function(d) {
  var g = _group();
  var wall = _box(d.w, d.h, d.d, 0x7a7068, 0.95, 0);
  wall.position.y = d.h / 2;
  g.add(wall);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  2. OPENINGS
// ══════════════════════════════════════════════════════════════

_reg('window-single', 'Single Window', '🪟', 'Openings', 1.0, 1.2, 0.12, function(d) {
  var g = _group();
  var fc = 0x8899aa;
  // Outer frame
  _child(g, _box(d.w, 0.08, d.d, fc, 0.3, 0.5), 0, d.h - 0.04, 0); // top
  _child(g, _box(d.w, 0.08, d.d, fc, 0.3, 0.5), 0, 0.04, 0);        // bottom
  _child(g, _box(0.08, d.h, d.d, fc, 0.3, 0.5), -d.w/2+0.04, d.h/2, 0); // left
  _child(g, _box(0.08, d.h, d.d, fc, 0.3, 0.5), d.w/2-0.04, d.h/2, 0);  // right
  // Center divider
  _child(g, _box(0.04, d.h - 0.1, d.d, fc, 0.3, 0.5), 0, d.h/2, 0);
  _child(g, _box(d.w - 0.1, 0.04, d.d, fc, 0.3, 0.5), 0, d.h/2, 0);
  // Glass panes
  for (var dx of [-0.3, 0.3]) {
    var gl = new THREE.Mesh(new THREE.BoxGeometry(d.w/2-0.1, d.h-0.2, 0.04), _glassMat(0x99ccee, 0.2));
    gl.position.set(dx, d.h/2, 0);
    g.add(gl);
  }
  return g;
});

_reg('window-double', 'Double Window', '🪟', 'Openings', 1.8, 1.2, 0.12, function(d) {
  var g = _group();
  var fc = 0x8899aa;
  _child(g, _box(d.w, 0.08, d.d, fc, 0.3, 0.5), 0, d.h-0.04, 0);
  _child(g, _box(d.w, 0.08, d.d, fc, 0.3, 0.5), 0, 0.04, 0);
  _child(g, _box(0.08, d.h, d.d, fc, 0.3, 0.5), -d.w/2+0.04, d.h/2, 0);
  _child(g, _box(0.08, d.h, d.d, fc, 0.3, 0.5), d.w/2-0.04, d.h/2, 0);
  _child(g, _box(0.06, d.h-0.1, d.d, fc, 0.3, 0.5), 0, d.h/2, 0);
  var gl1 = new THREE.Mesh(new THREE.BoxGeometry(d.w/2-0.1, d.h-0.2, 0.04), _glassMat(0x99ccee, 0.22));
  gl1.position.set(-d.w/4, d.h/2, 0);
  g.add(gl1);
  var gl2 = gl1.clone();
  gl2.position.set(d.w/4, d.h/2, 0);
  g.add(gl2);
  return g;
});

_reg('window-bay', 'Bay Window', '🏠', 'Openings', 2.4, 1.4, 0.6, function(d) {
  var g = _group();
  var fc = 0x8899aa;
  // Center pane
  var ctr = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.5, d.h-0.1, 0.06), _glassMat(0x99ccee, 0.2));
  ctr.position.set(0, d.h/2, d.d/2-0.03);
  g.add(ctr);
  // Side panes angled
  for (var s of [-1, 1]) {
    var side = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.25, d.h-0.1, 0.06), _glassMat(0x99ccee, 0.2));
    side.position.set(s*(d.w*0.25 + d.w*0.125), d.h/2, d.d/4);
    side.rotation.y = -s * Math.PI/6;
    g.add(side);
  }
  // Frame bars
  _child(g, _box(d.w, 0.06, d.d, fc, 0.3, 0.5), 0, 0, d.d/2);
  _child(g, _box(d.w, 0.06, d.d, fc, 0.3, 0.5), 0, d.h, d.d/2);
  return g;
});

_reg('skylight', 'Roof Skylight', '🌤️', 'Openings', 1.2, 0.12, 0.9, function(d) {
  var g = _group();
  var frame = _box(d.w, d.h, d.d, 0x888888, 0.3, 0.6);
  frame.position.y = d.h/2;
  g.add(frame);
  var glass = new THREE.Mesh(new THREE.BoxGeometry(d.w-0.08, d.h+0.02, d.d-0.08), _glassMat(0xaaddff, 0.3));
  glass.position.y = d.h/2;
  g.add(glass);
  return g;
});

_reg('door-single', 'Single Door', '🚪', 'Openings', 0.9, 2.1, 0.08, function(d) {
  var g = _group();
  var fc = 0x8b6914;
  // Door panel
  var panel = _box(d.w, d.h, d.d, 0xc4922a, 0.6, 0.1);
  panel.position.y = d.h/2;
  g.add(panel);
  // Panels inset
  for (var py of [d.h*0.25, d.h*0.65]) {
    var inset = _box(d.w*0.7, d.h*0.25, d.d*0.5, 0xb5832a, 0.7, 0.1);
    inset.position.set(0, py, d.d*0.25+0.01);
    g.add(inset);
  }
  // Handle
  var handle = _cyl(0.02, 0.02, 0.12, 8, 0xddcc88, 0.2, 0.8);
  handle.rotation.z = Math.PI/2;
  handle.position.set(d.w/2-0.08, d.h*0.52, d.d*0.5+0.02);
  g.add(handle);
  // Frame
  _child(g, _box(d.w+0.08, 0.06, 0.12, fc, 0.7, 0), 0, d.h+0.03, 0);
  _child(g, _box(0.06, d.h+0.06, 0.12, fc, 0.7, 0), -d.w/2-0.03, d.h/2+0.03, 0);
  _child(g, _box(0.06, d.h+0.06, 0.12, fc, 0.7, 0), d.w/2+0.03, d.h/2+0.03, 0);
  return g;
});

_reg('door-double', 'Double Door', '🚪', 'Openings', 1.8, 2.1, 0.08, function(d) {
  var g = _group();
  var fc = 0x8b6914;
  for (var dx of [-d.w/4, d.w/4]) {
    var panel = _box(d.w/2-0.02, d.h, d.d, 0xc4922a, 0.6, 0.1);
    panel.position.set(dx, d.h/2, 0);
    g.add(panel);
    var inset = _box((d.w/2-0.06)*0.7, d.h*0.5, d.d*0.5, 0xb5832a, 0.7, 0.1);
    inset.position.set(dx, d.h/2, d.d*0.25+0.01);
    g.add(inset);
  }
  _child(g, _box(d.w+0.08, 0.06, 0.12, fc, 0.7, 0), 0, d.h+0.03, 0);
  _child(g, _box(0.06, d.h+0.06, 0.12, fc, 0.7, 0), -d.w/2-0.03, d.h/2+0.03, 0);
  _child(g, _box(0.06, d.h+0.06, 0.12, fc, 0.7, 0), d.w/2+0.03, d.h/2+0.03, 0);
  return g;
});

_reg('door-sliding', 'Sliding Door', '↔️', 'Openings', 2.0, 2.2, 0.06, function(d) {
  var g = _group();
  var track = _box(d.w+0.2, 0.06, 0.1, 0x777777, 0.3, 0.7);
  track.position.y = d.h + 0.03;
  g.add(track);
  var door = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.5, d.h, d.d), _glassMat(0x88aacc, 0.25));
  door.position.set(-d.w*0.25, d.h/2, 0);
  g.add(door);
  var frameL = _box(0.06, d.h, 0.1, 0x666666, 0.3, 0.6);
  frameL.position.set(-d.w/2, d.h/2, 0);
  g.add(frameL);
  var frameR = frameL.clone();
  frameR.position.set(d.w/2, d.h/2, 0);
  g.add(frameR);
  return g;
});

_reg('door-french', 'French Doors', '🏛️', 'Openings', 1.5, 2.2, 0.05, function(d) {
  var g = _group();
  var fc = 0x888888;
  for (var dx of [-d.w/4, d.w/4]) {
    var frame = _box(d.w/2-0.02, d.h, 0.05, 0x888888, 0.3, 0.4);
    frame.position.set(dx, d.h/2, 0);
    g.add(frame);
    for (var py of [0.25, 0.65, 0.82]) {
      var pane = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.2, d.h*0.18, 0.03), _glassMat(0x99ccee, 0.25));
      pane.position.set(dx, d.h*py, 0.01);
      g.add(pane);
    }
  }
  _child(g, _box(d.w+0.1, 0.07, 0.1, fc, 0.4, 0.4), 0, d.h+0.035, 0);
  _child(g, _box(0.07, d.h, 0.1, fc, 0.4, 0.4), -d.w/2, d.h/2, 0);
  _child(g, _box(0.07, d.h, 0.1, fc, 0.4, 0.4), d.w/2, d.h/2, 0);
  return g;
});

_reg('door-garage', 'Garage Door', '🚗', 'Openings', 3.0, 2.2, 0.06, function(d) {
  var g = _group();
  var panelH = d.h / 5;
  for (var i = 0; i < 5; i++) {
    var p = _box(d.w, panelH-0.04, d.d, 0xbbbbbb, 0.5, 0.2);
    p.position.y = i*panelH + panelH/2;
    g.add(p);
    // Groove between panels
    var groove = _box(d.w, 0.03, d.d+0.01, 0x888888, 0.5, 0.3);
    groove.position.y = i*panelH;
    g.add(groove);
  }
  // Track rails
  for (var sx of [-d.w/2+0.05, d.w/2-0.05]) {
    var rail = _box(0.06, d.h, 0.06, 0x777777, 0.3, 0.6);
    rail.position.set(sx, d.h/2, 0);
    g.add(rail);
  }
  return g;
});

_reg('arch', 'Arch Doorway', '⌒', 'Openings', 1.2, 2.4, 0.3, function(d) {
  var g = _group();
  // Sides
  _child(g, _box(0.2, d.h*0.65, d.d, 0xd4c5a9, 0.8, 0), -d.w/2+0.1, d.h*0.325, 0);
  _child(g, _box(0.2, d.h*0.65, d.d, 0xd4c5a9, 0.8, 0), d.w/2-0.1, d.h*0.325, 0);
  // Arch top (approximated with cylinder half)
  var archGeo = new THREE.CylinderGeometry((d.w-0.2)/2, (d.w-0.2)/2, d.d, 16, 1, false, 0, Math.PI);
  var arch = new THREE.Mesh(archGeo, _mat(0xd4c5a9, 0.8, 0));
  arch.rotation.z = Math.PI;
  arch.position.set(0, d.h*0.65, 0);
  g.add(arch);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  3. ROOFING
// ══════════════════════════════════════════════════════════════

_reg('roof-flat', 'Flat Roof', '⬛', 'Roofing', 6, 0.25, 5, function(d) {
  var g = _group();
  var roof = _box(d.w, d.h, d.d, 0x666666, 0.9, 0);
  roof.position.y = d.h/2;
  g.add(roof);
  // Parapet
  for (var side of [[0, d.d/2, d.w, 0.3, 0.15], [0, -d.d/2, d.w, 0.3, 0.15], [d.w/2, 0, 0.15, 0.3, d.d], [-d.w/2, 0, 0.15, 0.3, d.d]]) {
    var par = _box(side[2], side[3], side[4], 0x777777, 0.9, 0);
    par.position.set(side[0], d.h + side[3]/2, side[1]);
    g.add(par);
  }
  return g;
});

_reg('roof-gabled', 'Gabled Roof', '⛺', 'Roofing', 6, 1.8, 5, function(d) {
  var g = _group();
  var roof = _gabledRoof(d.w, d.h, d.d, 0x8b3a1a);
  g.add(roof);
  return g;
});

_reg('roof-hipped', 'Hipped Roof', '🏠', 'Roofing', 6, 1.5, 5, function(d) {
  var g = _group();
  // Trapezoidal cross-section extruded along Z (depth)
  var shape = new THREE.Shape();
  shape.moveTo(-d.w/2, 0); shape.lineTo(d.w/2, 0); shape.lineTo(d.w/4, d.h); shape.lineTo(-d.w/4, d.h); shape.closePath();
  var ext = { depth: d.d, bevelEnabled: false };
  var geo = new THREE.ExtrudeGeometry(shape, ext);
  // Centre along Z — no rotation needed
  geo.translate(0, 0, -d.d/2);
  var mesh = new THREE.Mesh(geo, _mat(0x8b3a1a, 0.8, 0));
  mesh.castShadow = true;
  g.add(mesh);
  return g;
});

_reg('roof-shed', 'Shed Roof', '↗️', 'Roofing', 5, 1.2, 4, function(d) {
  var g = _group();
  // Sloped cross-section in XY plane, extruded along Z (depth) — no rotation needed
  var shape = new THREE.Shape();
  shape.moveTo(-d.w/2, 0); shape.lineTo(d.w/2, 0); shape.lineTo(d.w/2, d.h); shape.lineTo(-d.w/2, 0.15); shape.closePath();
  var ext = { depth: d.d, bevelEnabled: false };
  var geo = new THREE.ExtrudeGeometry(shape, ext);
  geo.translate(0, 0, -d.d/2);
  var mesh = new THREE.Mesh(geo, _mat(0x7a6020, 0.8, 0));
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  return g;
});

_reg('roof-mansard', 'Mansard Roof', '🏰', 'Roofing', 6, 2.0, 5, function(d) {
  var g = _group();
  // Lower steep slopes
  var lowerH = d.h * 0.6;
  var lowerW = d.w * 0.15;
  _child(g, _box(lowerW, lowerH, d.d, 0x7a4018, 0.8, 0), -d.w/2 + lowerW/2, lowerH/2, 0);
  _child(g, _box(lowerW, lowerH, d.d, 0x7a4018, 0.8, 0), d.w/2 - lowerW/2, lowerH/2, 0);
  // Upper flat section
  var upperW = d.w - lowerW*2;
  var upper = _box(upperW, d.h-lowerH, d.d, 0x888888, 0.9, 0);
  upper.position.y = lowerH + (d.h-lowerH)/2;
  g.add(upper);
  return g;
});

_reg('dome', 'Dome / Cupola', '⛩️', 'Roofing', 4, 2.0, 4, function(d) {
  var g = _group();
  var r = d.w / 2;
  var dome = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16, 0, Math.PI*2, 0, Math.PI/2), _mat(0xccaa66, 0.4, 0.3));
  dome.position.y = 0;
  dome.castShadow = true;
  g.add(dome);
  var drum = _cyl(r, r, 0.5, 20, 0xddcc88, 0.5, 0.2);
  drum.position.y = -0.25;
  g.add(drum);
  return g;
});

_reg('roof-butterfly', 'Butterfly Roof', '🦋', 'Roofing', 6, 1.2, 4, function(d) {
  var g = _group();
  // V-shape cross-section in XY plane, extruded along Z (depth)
  var shape1 = new THREE.Shape();
  shape1.moveTo(-d.w/2, d.h); shape1.lineTo(0, 0); shape1.lineTo(0, 0.1); shape1.lineTo(-d.w/2, d.h+0.1); shape1.closePath();
  var shape2 = new THREE.Shape();
  shape2.moveTo(0, 0); shape2.lineTo(d.w/2, d.h); shape2.lineTo(d.w/2, d.h+0.1); shape2.lineTo(0, 0.1); shape2.closePath();
  for (var sh of [shape1, shape2]) {
    var ext = { depth: d.d, bevelEnabled: false };
    var geo = new THREE.ExtrudeGeometry(sh, ext);
    // Centre along Z — no rotation needed
    geo.translate(0, 0, -d.d/2);
    var mesh = new THREE.Mesh(geo, _mat(0x6a8090, 0.6, 0.1));
    mesh.castShadow = true;
    g.add(mesh);
  }
  return g;
});

// ══════════════════════════════════════════════════════════════
//  4. CIRCULATION
// ══════════════════════════════════════════════════════════════

_reg('stairs-straight', 'Straight Stairs', '🪜', 'Circulation', 1.0, 2.4, 3.0, function(d) {
  var g = _group();
  var steps = 12;
  var stepW = d.w;
  var stepH = d.h / steps;
  var stepD = d.d / steps;
  for (var i = 0; i < steps; i++) {
    var step = _box(stepW, stepH * (i+1), stepD, 0xd4c8a0, 0.7, 0);
    step.position.set(0, stepH*(i+1)/2, -d.d/2 + stepD*(i+0.5));
    g.add(step);
  }
  return g;
});

_reg('stairs-spiral', 'Spiral Stairs', '🌀', 'Circulation', 2.0, 3.0, 2.0, function(d) {
  var g = _group();
  var steps = 16;
  var center = _cyl(0.15, 0.15, d.h, 6, 0x888888, 0.5, 0.5);
  center.position.y = d.h/2;
  g.add(center);
  for (var i = 0; i < steps; i++) {
    var angle = (i / steps) * Math.PI * 2;
    var step = _box(0.9, 0.05, 0.4, 0xd4c8a0, 0.7, 0);
    step.position.set(
      Math.cos(angle) * 0.55,
      (i / steps) * d.h + 0.025,
      Math.sin(angle) * 0.55
    );
    step.rotation.y = -angle;
    g.add(step);
  }
  return g;
});

_reg('stairs-lshaped', 'L-Shaped Stairs', '↩️', 'Circulation', 2.5, 2.4, 2.5, function(d) {
  var g = _group();
  var steps1 = 7, steps2 = 7;
  var totalSteps = steps1 + steps2;
  var stepH = d.h / totalSteps;
  // First flight
  for (var i = 0; i < steps1; i++) {
    var step = _box(d.w/2, stepH*(i+1), d.d/totalSteps, 0xd4c8a0, 0.7, 0);
    step.position.set(-d.w/4, stepH*(i+1)/2, -d.d/2 + d.d/totalSteps*(i+0.5));
    g.add(step);
  }
  // Landing
  var landing = _box(d.w/2, stepH*steps1, d.w/2, 0xd4c8a0, 0.7, 0);
  landing.position.set(d.w/4, stepH*steps1/2, -d.d/2+d.d/2*steps1/totalSteps);
  g.add(landing);
  // Second flight (perpendicular)
  for (var j = 0; j < steps2; j++) {
    var step2 = _box(d.w/totalSteps, stepH*(steps1+j+1), d.d/2, 0xd4c8a0, 0.7, 0);
    step2.position.set(d.w/2-d.w/totalSteps*(j+0.5), stepH*(steps1+j+1)/2, 0);
    g.add(step2);
  }
  return g;
});

_reg('ramp', 'Access Ramp', '↗️', 'Circulation', 1.5, 0.8, 4.0, function(d) {
  var g = _group();
  var shape = new THREE.Shape();
  shape.moveTo(0,0); shape.lineTo(d.d,0); shape.lineTo(d.d,d.h); shape.lineTo(0,0.05); shape.closePath();
  var ext = { depth: d.w, bevelEnabled: false };
  var geo = new THREE.ExtrudeGeometry(shape, ext);
  geo.rotateX(-Math.PI/2); geo.rotateY(Math.PI/2);
  geo.translate(-d.w/2, 0, d.d/2);
  var mesh = new THREE.Mesh(geo, _mat(0x999088, 0.8, 0));
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  return g;
});

_reg('elevator', 'Elevator Shaft', '🛗', 'Circulation', 2.0, 3.0, 2.0, function(d) {
  var g = _group();
  // Walls
  _child(g, _box(d.w, d.h, 0.1, 0xaaaaaa, 0.5, 0.2), 0, d.h/2, d.d/2);
  _child(g, _box(d.w, d.h, 0.1, 0xaaaaaa, 0.5, 0.2), 0, d.h/2, -d.d/2);
  _child(g, _box(0.1, d.h, d.d, 0xaaaaaa, 0.5, 0.2), d.w/2, d.h/2, 0);
  _child(g, _box(0.1, d.h, d.d, 0xaaaaaa, 0.5, 0.2), -d.w/2, d.h/2, 0);
  // Cab
  var cab = _box(d.w-0.2, d.h*0.4, d.d-0.2, 0x888888, 0.3, 0.5);
  cab.position.y = d.h*0.2;
  g.add(cab);
  // Door
  var door = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.5, d.h*0.35, 0.05), _glassMat(0x99aacc, 0.3));
  door.position.set(0, d.h*0.175, d.d/2-0.02);
  g.add(door);
  return g;
});

_reg('railing', 'Railing / Balustrade', '🚧', 'Circulation', 3.0, 1.0, 0.1, function(d) {
  var g = _group();
  // Top rail
  var topRail = _box(d.w, 0.06, 0.06, 0x888888, 0.3, 0.6);
  topRail.position.y = d.h;
  g.add(topRail);
  // Bottom rail
  var botRail = topRail.clone();
  botRail.position.y = 0.08;
  g.add(botRail);
  // Balusters
  var count = Math.floor(d.w / 0.15);
  for (var i = 0; i <= count; i++) {
    var bal = _cyl(0.02, 0.02, d.h-0.06, 6, 0x999999, 0.3, 0.5);
    bal.position.set(-d.w/2 + i*(d.w/count), d.h/2, 0);
    g.add(bal);
  }
  return g;
});

// ══════════════════════════════════════════════════════════════
//  5. LIVING ROOM
// ══════════════════════════════════════════════════════════════

_reg('sofa-2', '2-Seater Sofa', '🛋️', 'Living Room', 1.6, 0.8, 0.85, function(d) {
  var g = _group();
  var sc = 0x4a6694, cc = 0x3d5580;
  // Base
  _child(g, _box(d.w, 0.2, d.d*0.65, sc, 0.9, 0), 0, 0.1, -d.d*0.1);
  // Cushions
  for (var cx of [-d.w/4, d.w/4]) {
    _child(g, _box(d.w/2-0.04, 0.18, d.d*0.55, sc, 0.9, 0), cx, 0.29, -d.d*0.1);
  }
  // Back
  _child(g, _box(d.w, d.h-0.2, 0.2, cc, 0.9, 0), 0, (d.h-0.2)/2+0.2, d.d/2-0.1);
  // Arms
  _child(g, _box(0.15, d.h-0.2, d.d*0.65, cc, 0.9, 0), -d.w/2+0.075, (d.h-0.2)/2+0.2, -d.d*0.1);
  _child(g, _box(0.15, d.h-0.2, d.d*0.65, cc, 0.9, 0), d.w/2-0.075, (d.h-0.2)/2+0.2, -d.d*0.1);
  // Legs
  for (var lx of [-d.w/2+0.1, d.w/2-0.1]) {
    for (var lz of [-d.d*0.35+0.05, d.d*0.35-0.05]) {
      _child(g, _box(0.06, 0.12, 0.06, 0x4a3520, 0.8, 0), lx, 0.06, lz-d.d*0.08);
    }
  }
  return g;
});

_reg('sofa-3', '3-Seater Sofa', '🛋️', 'Living Room', 2.2, 0.85, 0.9, function(d) {
  var g = _group();
  var sc = 0x5a4e7a, cc = 0x4a3d6a;
  _child(g, _box(d.w, 0.2, d.d*0.65, sc, 0.9, 0), 0, 0.1, -d.d*0.1);
  for (var cx of [-d.w*0.33, 0, d.w*0.33]) {
    _child(g, _box(d.w*0.32, 0.18, d.d*0.55, sc, 0.9, 0), cx, 0.29, -d.d*0.1);
  }
  _child(g, _box(d.w, d.h-0.2, 0.22, cc, 0.9, 0), 0, (d.h-0.2)/2+0.2, d.d/2-0.11);
  _child(g, _box(0.18, d.h-0.2, d.d*0.65, cc, 0.9, 0), -d.w/2+0.09, (d.h-0.2)/2+0.2, -d.d*0.1);
  _child(g, _box(0.18, d.h-0.2, d.d*0.65, cc, 0.9, 0), d.w/2-0.09, (d.h-0.2)/2+0.2, -d.d*0.1);
  return g;
});

_reg('armchair', 'Armchair', '🪑', 'Living Room', 0.85, 0.9, 0.85, function(d) {
  var g = _group();
  var sc = 0x7a5a3a;
  _child(g, _box(d.w, 0.18, d.d*0.6, sc, 0.9, 0), 0, 0.09, -d.d*0.1);
  _child(g, _box(d.w-0.1, 0.15, d.d*0.55, sc, 0.9, 0), 0, 0.255, -d.d*0.1);
  _child(g, _box(d.w, d.h-0.18, 0.18, 0x6a4a2a, 0.9, 0), 0, (d.h-0.18)/2+0.18, d.d/2-0.09);
  _child(g, _box(0.15, d.h-0.18, d.d*0.6, 0x6a4a2a, 0.9, 0), -d.w/2+0.075, (d.h-0.18)/2+0.18, -d.d*0.1);
  _child(g, _box(0.15, d.h-0.18, d.d*0.6, 0x6a4a2a, 0.9, 0), d.w/2-0.075, (d.h-0.18)/2+0.18, -d.d*0.1);
  for (var lx of [-d.w/2+0.1, d.w/2-0.1]) {
    for (var lz of [-d.d*0.3, d.d*0.3]) { _child(g, _box(0.06,0.1,0.06,0x3a2510,0.8,0), lx, 0.05, lz); }
  }
  return g;
});

_reg('coffee-table', 'Coffee Table', '☕', 'Living Room', 1.2, 0.42, 0.6, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.05, d.d, 0xb88a60, 0.4, 0.2), 0, d.h-0.025, 0);
  for (var lx of [-d.w/2+0.06, d.w/2-0.06]) {
    for (var lz of [-d.d/2+0.06, d.d/2-0.06]) {
      _child(g, _box(0.05, d.h-0.05, 0.05, 0x8a6a44, 0.6, 0.1), lx, (d.h-0.05)/2, lz);
    }
  }
  return g;
});

_reg('tv-stand', 'TV Stand / Unit', '📺', 'Living Room', 1.8, 0.55, 0.45, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x2a2a2a, 0.6, 0.2), 0, d.h/2, 0);
  // Screen
  var screen = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.9, d.h*0.7, 0.05), _mat(0x111111, 0.9, 0));
  screen.position.set(0, d.h/2+0.01, d.d/2+0.025);
  g.add(screen);
  // Drawer lines
  for (var dx of [-d.w/3, 0, d.w/3]) {
    _child(g, _box(d.w/3-0.05, 0.01, d.d-0.04, 0x444444, 0.5, 0.3), dx, d.h*0.55, 0.02);
  }
  return g;
});

_reg('bookshelf', 'Bookshelf', '📚', 'Living Room', 1.0, 2.0, 0.3, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x6b4c2a, 0.8, 0.1), 0, d.h/2, 0);
  var shelves = 5;
  for (var i = 1; i < shelves; i++) {
    var shelf = _box(d.w-0.04, 0.03, d.d, 0x7a5a34, 0.6, 0.1);
    shelf.position.y = (d.h/shelves) * i;
    g.add(shelf);
    // Books
    var x = -d.w/2 + 0.07;
    var bookColors = [0xcc3333, 0x336699, 0x228844, 0xcc8833, 0x993399];
    for (var b = 0; b < 6; b++) {
      var bw = 0.04 + Math.random()*0.04;
      var bh = d.h/shelves*0.6 + Math.random()*0.04;
      var book = _box(0.03, bh, d.d*0.7, bookColors[b%5], 0.8, 0);
      book.position.set(x + bw/2, (d.h/shelves)*i + bh/2, 0);
      g.add(book);
      x += bw + 0.01;
    }
  }
  return g;
});

_reg('rug', 'Area Rug', '▬', 'Living Room', 2.4, 0.02, 1.6, function(d) {
  var g = _group();
  var rug = _box(d.w, d.h, d.d, 0x8b3a6a, 0.95, 0);
  rug.position.y = d.h/2;
  g.add(rug);
  var border = _box(d.w-0.1, d.h+0.002, d.d-0.1, 0x6a2a52, 0.95, 0);
  border.position.y = d.h/2+0.001;
  g.add(border);
  return g;
});

_reg('curtains', 'Curtains / Drapes', '🎭', 'Living Room', 2.0, 2.4, 0.15, function(d) {
  var g = _group();
  var c = 0x8b7a6a;
  // Rod
  var rod = _cyl(0.02, 0.02, d.w+0.3, 8, 0x666666, 0.3, 0.6);
  rod.rotation.z = Math.PI/2;
  rod.position.y = d.h;
  g.add(rod);
  // Curtain panels
  for (var side of [-1, 1]) {
    var panel = _box(d.w/2, d.h, d.d, c, 0.9, 0);
    panel.position.set(side*d.w/4, d.h/2, 0);
    g.add(panel);
  }
  return g;
});

_reg('plant-pot', 'Indoor Plant', '🪴', 'Living Room', 0.4, 1.0, 0.4, function(d) {
  var g = _group();
  // Pot
  var pot = _cyl(d.w/2, d.w/2*0.7, d.h*0.3, 12, 0xcc6633, 0.8, 0);
  pot.position.y = d.h*0.15;
  g.add(pot);
  // Soil
  var soil = _cyl(d.w/2-0.01, d.w/2-0.01, 0.04, 12, 0x3d2b0a, 0.9, 0);
  soil.position.y = d.h*0.3+0.02;
  g.add(soil);
  // Stem
  var stem = _cyl(0.02, 0.02, d.h*0.4, 6, 0x2d5a1a, 0.9, 0);
  stem.position.y = d.h*0.5;
  g.add(stem);
  // Leaves (spheres)
  var lc = 0x2a7a1a;
  for (var a = 0; a < 5; a++) {
    var ang = (a/5)*Math.PI*2;
    var lf = _sphere(d.w/2*0.55, 8, lc, 0.9, 0);
    lf.position.set(Math.cos(ang)*d.w*0.25, d.h*0.75+Math.sin(a)*0.05, Math.sin(ang)*d.w*0.25);
    g.add(lf);
  }
  var top = _sphere(d.w/2*0.5, 8, 0x3a9a2a, 0.9, 0);
  top.position.y = d.h*0.88;
  g.add(top);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  6. BEDROOM
// ══════════════════════════════════════════════════════════════

_reg('bed-single', 'Single Bed', '🛏️', 'Bedroom', 1.0, 0.5, 2.0, function(d) {
  var g = _group();
  // Base/Frame
  _child(g, _box(d.w, 0.18, d.d, 0x5a3820, 0.8, 0.1), 0, 0.09, 0);
  // Mattress
  _child(g, _box(d.w-0.05, 0.15, d.d-0.1, 0xeeeeee, 0.9, 0), 0, 0.255, 0);
  // Pillow
  _child(g, _box(d.w-0.15, 0.08, 0.45, 0xfaf0e0, 0.95, 0), 0, 0.33, d.d/2-0.28);
  // Headboard
  _child(g, _box(d.w, 0.6, 0.08, 0x4a2d14, 0.8, 0.1), 0, 0.48, d.d/2-0.04);
  // Legs
  for (var lx of [-d.w/2+0.06, d.w/2-0.06]) {
    for (var lz of [-d.d/2+0.06, d.d/2-0.06]) {
      _child(g, _box(0.06, 0.08, 0.06, 0x3a2010, 0.8, 0), lx, 0.04, lz);
    }
  }
  return g;
});

_reg('bed-double', 'Double Bed', '🛏️', 'Bedroom', 1.6, 0.55, 2.1, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.2, d.d, 0x4a3020, 0.8, 0.1), 0, 0.1, 0);
  _child(g, _box(d.w-0.05, 0.18, d.d-0.1, 0xf0f0ee, 0.9, 0), 0, 0.29, 0);
  for (var px of [-d.w/4, d.w/4]) {
    _child(g, _box(d.w/2-0.1, 0.09, 0.5, 0xfaf5e0, 0.95, 0), px, 0.385, d.d/2-0.3);
  }
  _child(g, _box(d.w, 0.7, 0.1, 0x3a2010, 0.8, 0.1), 0, 0.55, d.d/2-0.05);
  _child(g, _box(d.w-0.08, 0.1, d.d, 0x6a4428, 0.8, 0.1), 0, 0.05, 0);
  return g;
});

_reg('bed-king', 'King Size Bed', '👑', 'Bedroom', 2.0, 0.55, 2.2, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.22, d.d, 0x3a2818, 0.8, 0.1), 0, 0.11, 0);
  _child(g, _box(d.w-0.06, 0.2, d.d-0.12, 0xf5f5f0, 0.9, 0), 0, 0.32, 0);
  for (var px of [-d.w/3, 0, d.w/3]) {
    _child(g, _box(d.w/3-0.08, 0.1, 0.55, 0xfff8e8, 0.95, 0), px, 0.42, d.d/2-0.32);
  }
  _child(g, _box(d.w, 0.85, 0.12, 0x2a1808, 0.8, 0.1), 0, 0.64, d.d/2-0.06);
  return g;
});

_reg('wardrobe', 'Wardrobe / Closet', '🗄️', 'Bedroom', 1.8, 2.2, 0.6, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x6b4c2a, 0.7, 0.1), 0, d.h/2, 0);
  // Doors
  for (var dx of [-d.w/4, d.w/4]) {
    var door = _box(d.w/2-0.03, d.h-0.04, 0.03, 0x7a5a34, 0.5, 0.1);
    door.position.set(dx, d.h/2, d.d/2+0.015);
    g.add(door);
    var handle = _cyl(0.015, 0.015, 0.1, 6, 0xccaa66, 0.2, 0.8);
    handle.position.set(dx + (dx<0?0.1:-0.1), d.h/2, d.d/2+0.04);
    g.add(handle);
  }
  // Top divider
  var top = _box(d.w-0.02, 0.03, d.d, 0x8a6a40, 0.6, 0);
  top.position.set(0, d.h-0.015, 0);
  g.add(top);
  return g;
});

_reg('nightstand', 'Nightstand', '🕯️', 'Bedroom', 0.5, 0.55, 0.4, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x7a5a34, 0.7, 0.1), 0, d.h/2, 0);
  var drawer = _box(d.w-0.04, d.h*0.3, 0.03, 0x8a6a44, 0.5, 0.1);
  drawer.position.set(0, d.h*0.28, d.d/2+0.015);
  g.add(drawer);
  var knob = _sphere(0.025, 6, 0xccaa66, 0.2, 0.8);
  knob.position.set(0, d.h*0.28, d.d/2+0.04);
  g.add(knob);
  return g;
});

_reg('dresser', 'Dresser / Chest', '🗃️', 'Bedroom', 1.0, 0.9, 0.45, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x7a5a34, 0.7, 0.1), 0, d.h/2, 0);
  var rows = 3;
  for (var r = 0; r < rows; r++) {
    for (var dx of [-d.w/4, d.w/4]) {
      var drawer = _box(d.w/2-0.06, d.h/rows-0.04, 0.03, 0x8a6a44, 0.5, 0.1);
      drawer.position.set(dx, d.h/rows*(r+0.5), d.d/2+0.015);
      g.add(drawer);
      var knob = _sphere(0.02, 6, 0xccaa66, 0.2, 0.8);
      knob.position.set(dx, d.h/rows*(r+0.5), d.d/2+0.04);
      g.add(knob);
    }
  }
  return g;
});

_reg('desk', 'Study Desk', '🖥️', 'Bedroom', 1.4, 0.75, 0.65, function(d) {
  var g = _group();
  // Top
  _child(g, _box(d.w, 0.04, d.d, 0x8a6a44, 0.5, 0.1), 0, d.h-0.02, 0);
  // Legs
  for (var lx of [-d.w/2+0.04, d.w/2-0.04]) {
    for (var lz of [-d.d/2+0.04, d.d/2-0.04]) {
      _child(g, _box(0.05, d.h-0.04, 0.05, 0x6a4a24, 0.8, 0), lx, (d.h-0.04)/2, lz);
    }
  }
  // Monitor (bonus)
  var screen = _box(0.5, 0.35, 0.04, 0x222222, 0.5, 0.2);
  screen.position.set(0, d.h+0.175, -d.d/2+0.15);
  g.add(screen);
  var stand = _box(0.04, 0.2, 0.12, 0x333333, 0.5, 0.3);
  stand.position.set(0, d.h+0.1, -d.d/2+0.2);
  g.add(stand);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  7. KITCHEN
// ══════════════════════════════════════════════════════════════

_reg('kitchen-counter', 'Counter (Straight)', '🍽️', 'Kitchen', 2.4, 0.9, 0.65, function(d) {
  var g = _group();
  // Cabinet body
  _child(g, _box(d.w, d.h*0.85, d.d, 0xf0e8d8, 0.7, 0.1), 0, d.h*0.85/2, 0);
  // Countertop
  _child(g, _box(d.w+0.02, d.h*0.06, d.d+0.04, 0x888878, 0.3, 0.3), 0, d.h*0.85+d.h*0.03, 0.01);
  // Door fronts
  var ndoors = Math.floor(d.w/0.5);
  for (var i = 0; i < ndoors; i++) {
    var dx2 = -d.w/2 + (i+0.5)*(d.w/ndoors);
    var df = _box(d.w/ndoors-0.03, d.h*0.6, 0.02, 0xe8dfc8, 0.5, 0.1);
    df.position.set(dx2, d.h*0.42, d.d/2+0.01);
    g.add(df);
    var kn = _sphere(0.018, 6, 0xccaa66, 0.2, 0.8);
    kn.position.set(dx2, d.h*0.42, d.d/2+0.03);
    g.add(kn);
  }
  return g;
});

_reg('kitchen-island', 'Kitchen Island', '🏝️', 'Kitchen', 1.8, 0.9, 1.0, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h*0.85, d.d, 0xf0e8d8, 0.7, 0.1), 0, d.h*0.85/2, 0);
  _child(g, _box(d.w+0.05, d.h*0.06, d.d+0.05, 0x777777, 0.2, 0.4), 0, d.h*0.85+d.h*0.03, 0);
  for (var dx of [-d.w/3, d.w/3]) {
    for (var dz of [-d.d/3, d.d/3]) {
      var df = _box(d.w/3-0.05, d.h*0.6, 0.02, 0xe8dfc8, 0.5, 0.1);
      df.position.set(dx, d.h*0.42, dz+(dz<0?d.d/3-0.03:-(d.d/3-0.03)));
      g.add(df);
    }
  }
  return g;
});

_reg('refrigerator', 'Refrigerator', '🧊', 'Kitchen', 0.75, 1.8, 0.7, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xe8e8e8, 0.3, 0.3), 0, d.h/2, 0);
  // Top door (freezer)
  var td = _box(d.w-0.02, d.h*0.35, 0.03, 0xf0f0f0, 0.2, 0.3);
  td.position.set(0, d.h*0.825, d.d/2+0.015);
  g.add(td);
  // Main door
  var md = _box(d.w-0.02, d.h*0.6, 0.03, 0xf5f5f5, 0.2, 0.3);
  md.position.set(0, d.h*0.3, d.d/2+0.015);
  g.add(md);
  // Handles
  var ht = _box(0.04, 0.3, 0.04, 0x888888, 0.2, 0.6);
  ht.position.set(d.w/2-0.08, d.h*0.82, d.d/2+0.04);
  g.add(ht);
  var hm = ht.clone();
  hm.position.y = d.h*0.5;
  g.add(hm);
  return g;
});

_reg('stove', 'Stove / Oven', '🔥', 'Kitchen', 0.75, 0.9, 0.65, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h*0.85, d.d, 0x555555, 0.4, 0.3), 0, d.h*0.85/2, 0);
  _child(g, _box(d.w, d.h*0.06, d.d, 0x444444, 0.2, 0.5), 0, d.h*0.85+d.h*0.03, 0);
  // Burners
  for (var bx of [-d.w*0.25, d.w*0.25]) {
    for (var bz of [-d.d*0.25, d.d*0.25]) {
      var burner = _cyl(0.1, 0.1, 0.03, 16, 0x222222, 0.3, 0.6);
      burner.position.set(bx, d.h*0.88, bz);
      g.add(burner);
    }
  }
  // Oven door
  var od = _box(d.w-0.04, d.h*0.5, 0.04, 0x444444, 0.3, 0.4);
  od.position.set(0, d.h*0.28, d.d/2+0.02);
  g.add(od);
  var win = new THREE.Mesh(new THREE.BoxGeometry(d.w-0.12, d.h*0.3, 0.02), _glassMat(0x333333, 0.5));
  win.position.set(0, d.h*0.28, d.d/2+0.04);
  g.add(win);
  return g;
});

_reg('kitchen-sink', 'Kitchen Sink', '🚰', 'Kitchen', 0.8, 0.9, 0.55, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h*0.85, d.d, 0xf0e8d8, 0.7, 0.1), 0, d.h*0.85/2, 0);
  _child(g, _box(d.w+0.02, d.h*0.06, d.d+0.04, 0x888888, 0.2, 0.4), 0, d.h*0.85+d.h*0.03, 0.01);
  // Basin
  var basin = _box(d.w*0.75, 0.15, d.d*0.65, 0xcccccc, 0.2, 0.5);
  basin.position.set(0, d.h-0.005, 0);
  g.add(basin);
  // Faucet
  var faucetBase = _cyl(0.025, 0.025, 0.25, 8, 0xaaaaaa, 0.2, 0.8);
  faucetBase.position.set(0, d.h+0.18, -d.d*0.25);
  g.add(faucetBase);
  var faucetNeck = _cyl(0.015, 0.015, 0.18, 8, 0xaaaaaa, 0.2, 0.8);
  faucetNeck.rotation.z = Math.PI/2;
  faucetNeck.position.set(0.06, d.h+0.31, -d.d*0.25);
  g.add(faucetNeck);
  return g;
});

_reg('upper-cabinet', 'Upper Cabinet', '🗄️', 'Kitchen', 1.2, 0.8, 0.35, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xf0e8d8, 0.7, 0.1), 0, d.h/2, 0);
  var ndoors = Math.floor(d.w/0.4)+1;
  for (var i = 0; i < ndoors; i++) {
    var dx = -d.w/2 + (i+0.5)*(d.w/ndoors);
    var df = _box(d.w/ndoors-0.03, d.h-0.04, 0.02, 0xe8dfc8, 0.5, 0.1);
    df.position.set(dx, d.h/2, d.d/2+0.01);
    g.add(df);
  }
  return g;
});

_reg('dishwasher', 'Dishwasher', '🫧', 'Kitchen', 0.6, 0.85, 0.6, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xe0e0e0, 0.3, 0.4), 0, d.h/2, 0);
  _child(g, _box(d.w-0.04, 0.06, 0.04, 0xcccccc, 0.2, 0.5), 0, d.h-0.05, d.d/2+0.02);
  var btn = _cyl(0.025, 0.025, 0.02, 8, 0x4488cc, 0.3, 0.3);
  btn.rotation.x = Math.PI/2;
  btn.position.set(0, d.h-0.05, d.d/2+0.04);
  g.add(btn);
  var hatch = _box(d.w-0.04, d.h-0.1, 0.03, 0xeeeeee, 0.2, 0.3);
  hatch.position.set(0, d.h*0.45, d.d/2+0.015);
  g.add(hatch);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  8. BATHROOM
// ══════════════════════════════════════════════════════════════

_reg('bathtub', 'Bathtub', '🛁', 'Bathroom', 1.7, 0.55, 0.8, function(d) {
  var g = _group();
  // Outer shell
  _child(g, _box(d.w, d.h, d.d, 0xf8f8f8, 0.2, 0.1), 0, d.h/2, 0);
  // Inner basin
  var inner = _box(d.w-0.1, d.h*0.7, d.d-0.1, 0xeeeeee, 0.1, 0.1);
  inner.position.set(0, d.h*0.65, 0);
  g.add(inner);
  // Faucet
  var fbase = _cyl(0.02, 0.02, 0.2, 8, 0xaaaaaa, 0.2, 0.8);
  fbase.position.set(d.w/2-0.12, d.h+0.12, 0);
  g.add(fbase);
  for (var hx of [-0.05, 0.05]) {
    var knob = _sphere(0.04, 8, 0xaaaaaa, 0.2, 0.7);
    knob.position.set(d.w/2-0.12+hx, d.h+0.24, 0);
    g.add(knob);
  }
  return g;
});

_reg('shower', 'Shower Cubicle', '🚿', 'Bathroom', 1.0, 2.2, 1.0, function(d) {
  var g = _group();
  // Floor
  _child(g, _box(d.w, 0.05, d.d, 0xddddd5, 0.6, 0.1), 0, 0.025, 0);
  // Glass walls
  var gm = _glassMat(0x88aacc, 0.18);
  for (var side of [[0, d.d/2, d.w, 0.06, d.h], [0, -d.d/2, d.w, 0.06, d.h], [d.w/2, 0, 0.06, d.h, d.d], [-d.w/2, 0, 0.06, d.h, d.d]]) {
    var panel = new THREE.Mesh(new THREE.BoxGeometry(side[2], side[4], side[3]), gm.clone());
    panel.position.set(side[0], d.h/2, side[1]);
    g.add(panel);
  }
  // Shower head
  var pipe = _cyl(0.015, 0.015, 0.6, 8, 0xaaaaaa, 0.2, 0.8);
  pipe.rotation.z = Math.PI/2;
  pipe.position.set(-d.w*0.3, d.h-0.2, -d.d*0.3);
  g.add(pipe);
  var head = _cyl(0.08, 0.06, 0.04, 8, 0x999999, 0.2, 0.7);
  head.position.set(d.w*0.05, d.h-0.2, -d.d*0.3);
  g.add(head);
  return g;
});

_reg('toilet', 'Toilet', '🚽', 'Bathroom', 0.45, 0.8, 0.7, function(d) {
  var g = _group();
  // Base/bowl
  var bowl = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.75, d.h*0.45, 16), _mat(0xf5f5f5, 0.2, 0.1));
  bowl.position.y = d.h*0.225;
  g.add(bowl);
  // Seat
  var seat = new THREE.Mesh(new THREE.TorusGeometry(d.w/2*0.65, 0.04, 6, 16), _mat(0xf8f8f8, 0.2, 0.1));
  seat.rotation.x = Math.PI/2;
  seat.position.y = d.h*0.47;
  g.add(seat);
  // Tank
  _child(g, _box(d.w*0.9, d.h*0.45, d.d*0.35, 0xf5f5f5, 0.2, 0.1), 0, d.h*0.675, -d.d*0.175);
  var lid = _box(d.w*0.88, 0.04, d.d*0.33, 0xf8f8f8, 0.2, 0.1);
  lid.position.set(0, d.h+0.02, -d.d*0.175);
  g.add(lid);
  return g;
});

_reg('bath-sink', 'Bathroom Sink', '🪣', 'Bathroom', 0.55, 0.85, 0.45, function(d) {
  var g = _group();
  // Pedestal
  _child(g, _cyl(0.08, 0.1, d.h*0.75, 12, 0xf5f5f5, 0.2, 0.1), 0, d.h*0.375, 0);
  // Basin
  var basin = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.85, d.h*0.15, 16), _mat(0xf8f8f8, 0.2, 0.1));
  basin.position.y = d.h*0.82;
  g.add(basin);
  // Faucet
  var fb = _cyl(0.015, 0.015, 0.15, 8, 0xbbbbbb, 0.2, 0.8);
  fb.position.set(0, d.h*0.95, -d.w*0.25);
  g.add(fb);
  var spout = _cyl(0.01, 0.01, 0.1, 6, 0xbbbbbb, 0.2, 0.8);
  spout.rotation.z = Math.PI/2;
  spout.position.set(0.04, d.h+0.02, -d.w*0.25);
  g.add(spout);
  return g;
});

_reg('vanity', 'Bathroom Vanity', '🪞', 'Bathroom', 1.2, 0.85, 0.5, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h*0.75, d.d, 0xf0ece0, 0.6, 0.1), 0, d.h*0.375, 0);
  _child(g, _box(d.w+0.02, d.h*0.07, d.d+0.03, 0x888888, 0.2, 0.4), 0, d.h*0.75+d.h*0.035, 0.01);
  // Basin cutout (fake)
  var basin = _box(d.w*0.6, 0.12, d.d*0.65, 0xf5f5f5, 0.1, 0.2);
  basin.position.set(0, d.h*0.75+0.03, 0);
  g.add(basin);
  // Faucet
  var fp = _cyl(0.015, 0.015, 0.12, 8, 0xbbbbbb, 0.2, 0.8);
  fp.position.set(0, d.h*0.75+0.12, -d.d*0.2);
  g.add(fp);
  return g;
});

_reg('mirror-bath', 'Bathroom Mirror', '🪞', 'Bathroom', 0.9, 0.7, 0.06, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x444444, 0.3, 0.3), 0, d.h/2, 0);
  var mirror = new THREE.Mesh(new THREE.BoxGeometry(d.w-0.04, d.h-0.04, 0.01), _mat(0xaaccee, 0.05, 0.9));
  mirror.position.set(0, d.h/2, d.d/2+0.005);
  g.add(mirror);
  return g;
});

_reg('towel-rail', 'Towel Rail', '🧻', 'Bathroom', 0.7, 0.3, 0.1, function(d) {
  var g = _group();
  for (var px of [-d.w/2+0.04, d.w/2-0.04]) {
    _child(g, _box(0.04, d.h, 0.08, 0x888888, 0.2, 0.6), px, d.h/2, 0);
  }
  var rail = _cyl(0.018, 0.018, d.w, 8, 0xaaaaaa, 0.2, 0.8);
  rail.rotation.z = Math.PI/2;
  rail.position.y = d.h;
  g.add(rail);
  // Towel
  var towel = _box(d.w-0.12, 0.4, 0.06, 0x4488cc, 0.9, 0);
  towel.position.y = d.h*0.6;
  g.add(towel);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  9. DINING
// ══════════════════════════════════════════════════════════════

_reg('dining-table-4', 'Dining Table 4-seat', '🍽️', 'Dining', 1.4, 0.76, 0.8, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.05, d.d, 0xa0784a, 0.4, 0.2), 0, d.h-0.025, 0);
  for (var lx of [-d.w/2+0.08, d.w/2-0.08]) {
    for (var lz of [-d.d/2+0.08, d.d/2-0.08]) {
      _child(g, _box(0.06, d.h-0.05, 0.06, 0x7a5a32, 0.7, 0.1), lx, (d.h-0.05)/2, lz);
    }
  }
  return g;
});

_reg('dining-table-6', 'Dining Table 6-seat', '🍽️', 'Dining', 2.0, 0.76, 0.9, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.05, d.d, 0xa0784a, 0.4, 0.2), 0, d.h-0.025, 0);
  for (var lx of [-d.w/2+0.08, d.w/2-0.08]) {
    for (var lz of [-d.d/2+0.08, d.d/2-0.08]) {
      _child(g, _box(0.06, d.h-0.05, 0.06, 0x7a5a32, 0.7, 0.1), lx, (d.h-0.05)/2, lz);
    }
  }
  _child(g, _box(0.06, d.h-0.05, 0.06, 0x7a5a32, 0.7, 0.1), 0, (d.h-0.05)/2, -d.d/2+0.08);
  _child(g, _box(0.06, d.h-0.05, 0.06, 0x7a5a32, 0.7, 0.1), 0, (d.h-0.05)/2, d.d/2-0.08);
  return g;
});

_reg('dining-chair', 'Dining Chair', '🪑', 'Dining', 0.45, 0.9, 0.45, function(d) {
  var g = _group();
  var sc = 0x8a6a44;
  // Seat
  _child(g, _box(d.w, 0.04, d.d, sc, 0.5, 0.1), 0, d.h*0.5, 0);
  // Back
  _child(g, _box(d.w, d.h*0.45, 0.04, sc, 0.6, 0.1), 0, d.h*0.72, d.d/2-0.02);
  // Legs
  for (var lx of [-d.w/2+0.04, d.w/2-0.04]) {
    for (var lz of [-d.d/2+0.04, d.d/2-0.04]) {
      _child(g, _box(0.04, d.h*0.5, 0.04, 0x6a4a24, 0.8, 0), lx, d.h*0.25, lz);
    }
  }
  return g;
});

_reg('bar-stool', 'Bar Stool', '🪑', 'Dining', 0.35, 0.8, 0.35, function(d) {
  var g = _group();
  // Seat
  var seat = _cyl(d.w/2, d.w/2, 0.05, 12, 0x6a4a24, 0.5, 0.1);
  seat.position.y = d.h-0.025;
  g.add(seat);
  // Pedestal
  _child(g, _cyl(0.03, 0.06, d.h-0.05, 8, 0x888888, 0.2, 0.6), 0, (d.h-0.05)/2, 0);
  // Foot ring
  var ring = _torus(d.w*0.3, 0.02, 0x777777);
  ring.position.y = d.h*0.35;
  g.add(ring);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  10. OFFICE
// ══════════════════════════════════════════════════════════════

_reg('office-desk', 'Office Desk', '💼', 'Office', 1.6, 0.75, 0.7, function(d) {
  var g = _group();
  _child(g, _box(d.w, 0.04, d.d, 0x4a4040, 0.4, 0.3), 0, d.h-0.02, 0);
  _child(g, _box(0.05, d.h-0.04, 0.05, 0x3a3030, 0.6, 0.2), -d.w/2+0.04, (d.h-0.04)/2, -d.d/2+0.04);
  _child(g, _box(0.05, d.h-0.04, 0.05, 0x3a3030, 0.6, 0.2), d.w/2-0.04, (d.h-0.04)/2, -d.d/2+0.04);
  // Drawer unit
  _child(g, _box(0.45, d.h-0.04, d.d*0.5, 0x3a3030, 0.6, 0.2), d.w/2-0.25, (d.h-0.04)/2, d.d*0.25);
  return g;
});

_reg('office-chair', 'Office Chair', '💺', 'Office', 0.6, 1.2, 0.6, function(d) {
  var g = _group();
  // Seat
  var seat = _box(d.w, 0.05, d.d, 0x222222, 0.9, 0);
  seat.position.y = d.h*0.42;
  g.add(seat);
  // Back
  var back = _box(d.w, d.h*0.45, 0.06, 0x222222, 0.9, 0);
  back.position.set(0, d.h*0.42+d.h*0.225, d.d/2-0.03);
  g.add(back);
  // Armrests
  for (var ax of [-d.w/2+0.06, d.w/2-0.06]) {
    _child(g, _box(0.05, 0.04, 0.2, 0x333333, 0.8, 0), ax, d.h*0.52, 0);
  }
  // Piston
  _child(g, _cyl(0.035, 0.04, d.h*0.38, 8, 0x666666, 0.2, 0.6), 0, d.h*0.19, 0);
  // Star base
  for (var i = 0; i < 5; i++) {
    var ang = (i/5)*Math.PI*2;
    var arm = _box(0.04, 0.04, d.d*0.45, 0x333333, 0.5, 0.2);
    arm.position.set(Math.cos(ang)*d.d*0.2, 0.02, Math.sin(ang)*d.d*0.2);
    arm.rotation.y = ang;
    g.add(arm);
    var wheel = _cyl(0.04, 0.04, 0.04, 8, 0x444444, 0.5, 0.1);
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(Math.cos(ang)*d.d*0.4, 0.04, Math.sin(ang)*d.d*0.4);
    g.add(wheel);
  }
  return g;
});

_reg('filing-cabinet', 'Filing Cabinet', '🗂️', 'Office', 0.5, 1.2, 0.65, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x888888, 0.4, 0.3), 0, d.h/2, 0);
  var drawers = 4;
  for (var i = 0; i < drawers; i++) {
    var dr = _box(d.w-0.04, d.h/drawers-0.04, 0.03, 0x999999, 0.3, 0.3);
    dr.position.set(0, d.h/drawers*(i+0.5), d.d/2+0.015);
    g.add(dr);
    var hn = _box(d.w*0.5, 0.04, 0.04, 0x666666, 0.3, 0.6);
    hn.position.set(0, d.h/drawers*(i+0.5), d.d/2+0.04);
    g.add(hn);
  }
  return g;
});

_reg('bookcase-office', 'Office Bookcase', '📋', 'Office', 0.8, 2.0, 0.35, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x2a2a2a, 0.6, 0.1), 0, d.h/2, 0);
  for (var i = 1; i < 5; i++) {
    var shelf = _box(d.w-0.04, 0.02, d.d, 0x3a3a3a, 0.5, 0.1);
    shelf.position.y = (d.h/5)*i;
    g.add(shelf);
  }
  return g;
});

// ══════════════════════════════════════════════════════════════
//  11. LIGHTING
// ══════════════════════════════════════════════════════════════

_reg('light-ceiling', 'Ceiling Light', '💡', 'Lighting', 0.3, 0.2, 0.3, function(d) {
  var g = _group();
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.6, d.h, 16, 1, true), _glassMat(0xffeebb, 0.4));
  shade.position.y = -d.h/2;
  g.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), _emissiveMat(0xfff5dd, 0xffeebb));
  bulb.position.y = -d.h*0.1;
  g.add(bulb);
  return g;
});

_reg('light-pendant', 'Pendant Light', '🏮', 'Lighting', 0.35, 0.45, 0.35, function(d) {
  var g = _group();
  var cord = _cyl(0.008, 0.008, 0.3, 6, 0x333333, 0.8, 0);
  cord.position.y = 0.15;
  g.add(cord);
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.5, d.h*0.6, 20), _mat(0xcc8833, 0.7, 0.1));
  shade.position.y = -d.h*0.1;
  g.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), _emissiveMat(0xffeebb, 0xfff0cc));
  bulb.position.y = -d.h*0.05;
  g.add(bulb);
  return g;
});

_reg('chandelier', 'Chandelier', '✨', 'Lighting', 1.0, 0.8, 1.0, function(d) {
  var g = _group();
  var main = _cyl(0.04, 0.04, 0.3, 8, 0xccaa44, 0.2, 0.7);
  main.position.y = 0.15;
  g.add(main);
  var ring = _torus(d.w/2*0.7, 0.025, 0xccaa44);
  ring.position.y = -0.1;
  g.add(ring);
  var arms = 6;
  for (var i = 0; i < arms; i++) {
    var ang = (i/arms)*Math.PI*2;
    var arm = _cyl(0.012, 0.012, d.w*0.5, 6, 0xccaa44, 0.2, 0.7);
    arm.rotation.z = Math.PI/2;
    arm.position.set(Math.cos(ang)*d.w*0.25, -0.1, Math.sin(ang)*d.w*0.25);
    arm.rotation.y = ang;
    g.add(arm);
    var bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), _emissiveMat(0xfff5cc, 0xffeebb));
    bl.position.set(Math.cos(ang)*d.w*0.48, -0.25, Math.sin(ang)*d.w*0.48);
    g.add(bl);
  }
  return g;
});

_reg('floor-lamp', 'Floor Lamp', '🕯️', 'Lighting', 0.35, 1.6, 0.35, function(d) {
  var g = _group();
  var base = _cyl(d.w/2, d.w/2*0.8, 0.08, 12, 0x333333, 0.4, 0.4);
  base.position.y = 0.04;
  g.add(base);
  var pole = _cyl(0.02, 0.02, d.h-0.3, 8, 0x444444, 0.3, 0.5);
  pole.position.y = (d.h-0.3)/2+0.08;
  g.add(pole);
  var shade = new THREE.Mesh(new THREE.ConeGeometry(d.w/2, 0.3, 16, 1, true), _mat(0xeecc88, 0.8, 0));
  shade.rotation.x = Math.PI;
  shade.position.y = d.h-0.1;
  g.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), _emissiveMat(0xfff5cc, 0xffeeaa));
  bulb.position.y = d.h-0.05;
  g.add(bulb);
  return g;
});

_reg('table-lamp', 'Table Lamp', '🪔', 'Lighting', 0.25, 0.5, 0.25, function(d) {
  var g = _group();
  var base = _cyl(d.w/2*0.8, d.w/2, 0.05, 12, 0x8a7050, 0.5, 0.1);
  base.position.y = 0.025;
  g.add(base);
  var stem = _cyl(0.02, 0.03, d.h*0.6, 8, 0x9a8060, 0.5, 0.1);
  stem.position.y = 0.05+d.h*0.3;
  g.add(stem);
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.4, d.h*0.4, 16, 1, true), _mat(0xf0e0c0, 0.8, 0));
  shade.position.y = d.h*0.75;
  g.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), _emissiveMat(0xfff8e8, 0xffeecc));
  bulb.position.y = d.h*0.78;
  g.add(bulb);
  return g;
});

_reg('wall-sconce', 'Wall Sconce', '🕯️', 'Lighting', 0.2, 0.35, 0.25, function(d) {
  var g = _group();
  var bracket = _box(0.06, d.h*0.4, d.d, 0x666666, 0.3, 0.5);
  bracket.position.set(-d.w/2+0.03, d.h*0.2, 0);
  g.add(bracket);
  var arm = _box(d.w-0.06, 0.04, 0.04, 0x666666, 0.3, 0.5);
  arm.position.y = d.h*0.4;
  g.add(arm);
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2*0.8, d.w/2*0.4, d.h*0.5, 12, 1, true), _mat(0xeecc88, 0.8, 0));
  shade.position.set(d.w/2-0.03, d.h*0.55, 0);
  g.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), _emissiveMat(0xfff5cc, 0xffeeaa));
  bulb.position.set(d.w/2-0.03, d.h*0.55, 0);
  g.add(bulb);
  return g;
});

_reg('recessed-light', 'Recessed Light', '⬤', 'Lighting', 0.15, 0.08, 0.15, function(d) {
  var g = _group();
  var housing = _cyl(d.w/2, d.w/2, d.h, 16, 0x888888, 0.3, 0.4);
  housing.position.y = d.h/2;
  g.add(housing);
  var lens = new THREE.Mesh(new THREE.CircleGeometry(d.w/2*0.7, 16), _emissiveMat(0xfff8e8, 0xfff0cc));
  lens.rotation.x = -Math.PI/2;
  lens.position.y = d.h+0.001;
  g.add(lens);
  return g;
});

_reg('track-light', 'Track Lighting', '💡', 'Lighting', 2.0, 0.12, 0.1, function(d) {
  var g = _group();
  var track = _box(d.w, 0.05, d.d, 0x333333, 0.3, 0.5);
  track.position.y = 0.025;
  g.add(track);
  var nLights = Math.floor(d.w/0.5)+1;
  for (var i = 0; i < nLights; i++) {
    var xPos = -d.w/2 + (i/(nLights-1||1))*d.w;
    var arm2 = _cyl(0.015, 0.015, 0.25, 6, 0x444444, 0.3, 0.5);
    arm2.position.set(xPos, -0.1, 0);
    g.add(arm2);
    var head2 = _cyl(0.05, 0.04, 0.08, 10, 0x555555, 0.3, 0.4);
    head2.rotation.z = Math.PI/4;
    head2.position.set(xPos+0.06, -0.25, 0);
    g.add(head2);
    var bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), _emissiveMat(0xfff5cc, 0xffeeaa));
    bulb2.position.set(xPos+0.09, -0.29, 0);
    g.add(bulb2);
  }
  return g;
});

// ══════════════════════════════════════════════════════════════
//  12. OUTDOOR
// ══════════════════════════════════════════════════════════════

_reg('driveway', 'Driveway', '🛣️', 'Outdoor', 5, 0.08, 3, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0x666666, 0.95, 0), 0, d.h/2, 0);
  // Lane marking
  for (var z = -d.d/2+0.3; z < d.d/2; z += 0.8) {
    var mark = _box(0.08, d.h+0.001, 0.35, 0xddddcc, 0.9, 0);
    mark.position.set(0, d.h/2, z);
    g.add(mark);
  }
  return g;
});

_reg('pathway', 'Garden Pathway', '🛤️', 'Outdoor', 1.2, 0.06, 3, function(d) {
  var g = _group();
  var nSlabs = Math.floor(d.d/0.5);
  for (var i = 0; i < nSlabs; i++) {
    var slab = _box(d.w*0.9, d.h+0.01, 0.4, 0xaaaaaa, 0.9, 0);
    slab.position.set(0, d.h/2, -d.d/2 + i*(d.d/nSlabs) + 0.2);
    g.add(slab);
  }
  return g;
});

_reg('fence-panel', 'Fence Panel', '⊟', 'Outdoor', 2.0, 1.5, 0.1, function(d) {
  var g = _group();
  var postH = d.h + 0.2;
  for (var px of [-d.w/2, d.w/2]) {
    _child(g, _box(0.1, postH, 0.1, 0x8b6340, 0.9, 0), px, postH/2-0.1, 0);
  }
  var rails = 3;
  for (var r = 0; r < rails; r++) {
    _child(g, _box(d.w, 0.04, 0.04, 0xa0744a, 0.9, 0), 0, (d.h/(rails-1))*r+0.05, 0);
  }
  // Pickets
  var pickets = Math.floor(d.w/0.18);
  for (var i = 0; i < pickets; i++) {
    var picket = _box(0.06, d.h-0.1, 0.04, 0xb08050, 0.9, 0);
    picket.position.set(-d.w/2+0.06+i*(d.w/pickets), d.h*0.45, 0);
    g.add(picket);
  }
  return g;
});

_reg('gate', 'Garden Gate', '🚧', 'Outdoor', 1.2, 1.5, 0.08, function(d) {
  var g = _group();
  for (var px of [-d.w/2, d.w/2]) {
    _child(g, _box(0.1, d.h+0.3, 0.1, 0x5a3a18, 0.9, 0), px, (d.h+0.3)/2-0.15, 0);
  }
  var frame = _box(d.w, 0.06, d.d, 0x6a4a28, 0.8, 0);
  frame.position.y = d.h-0.03;
  g.add(frame);
  var bot = frame.clone();
  bot.position.y = 0.1;
  g.add(bot);
  // Bars
  var bars = 6;
  for (var b = 0; b < bars; b++) {
    var bar = _box(0.04, d.h-0.16, d.d, 0x7a5a38, 0.8, 0.1);
    bar.position.set(-d.w/2+0.08+b*(d.w-0.16)/(bars-1), d.h/2, 0);
    g.add(bar);
  }
  // Handle
  var handle2 = _cyl(0.02, 0.02, 0.15, 6, 0xccaa44, 0.2, 0.8);
  handle2.rotation.z = Math.PI/2;
  handle2.position.set(d.w/2-0.12, d.h*0.52, 0);
  g.add(handle2);
  return g;
});

_reg('pool', 'Swimming Pool', '🏊', 'Outdoor', 6, 0.1, 3.5, function(d) {
  var g = _group();
  var depth = 1.5;
  // Pool shell
  _child(g, _box(d.w, 0.15, d.d, 0x88aacc, 0.3, 0.1), 0, -depth/2, 0);
  // Water surface
  var water = new THREE.Mesh(new THREE.BoxGeometry(d.w-0.15, 0.05, d.d-0.15), _glassMat(0x44aadd, 0.8));
  water.position.y = -0.05;
  g.add(water);
  // Walls
  for (var side of [[0, d.d/2, d.w, depth, 0.15], [0, -d.d/2, d.w, depth, 0.15], [d.w/2, 0, 0.15, depth, d.d], [-d.w/2, 0, 0.15, depth, d.d]]) {
    var wall = _box(side[2], side[3], side[4], 0xaabbcc, 0.4, 0.1);
    wall.position.set(side[0], -depth/2, side[1]);
    g.add(wall);
  }
  // Coping / rim
  _child(g, _box(d.w+0.4, 0.12, 0.18, 0xccbbaa, 0.5, 0.1), 0, 0.06, d.d/2+0.09);
  _child(g, _box(d.w+0.4, 0.12, 0.18, 0xccbbaa, 0.5, 0.1), 0, 0.06, -d.d/2-0.09);
  _child(g, _box(0.18, 0.12, d.d, 0xccbbaa, 0.5, 0.1), d.w/2+0.09, 0.06, 0);
  _child(g, _box(0.18, 0.12, d.d, 0xccbbaa, 0.5, 0.1), -d.w/2-0.09, 0.06, 0);
  return g;
});

_reg('patio', 'Patio / Deck', '🪵', 'Outdoor', 5, 0.15, 4, function(d) {
  var g = _group();
  var nBoards = Math.floor(d.d/0.15);
  for (var i = 0; i < nBoards; i++) {
    var board = _box(d.w, d.h, 0.12, 0x8b6340, 0.9, 0);
    board.position.set(0, d.h/2, -d.d/2 + i*(d.d/nBoards) + 0.06);
    g.add(board);
  }
  return g;
});

_reg('pergola', 'Pergola', '⛩️', 'Outdoor', 4, 2.5, 3, function(d) {
  var g = _group();
  // Posts
  for (var px of [-d.w/2+0.1, d.w/2-0.1]) {
    for (var pz of [-d.d/2+0.1, d.d/2-0.1]) {
      _child(g, _box(0.12, d.h, 0.12, 0x8b6340, 0.9, 0), px, d.h/2, pz);
    }
  }
  // Beams (long)
  for (var bz of [-d.d/2+0.1, 0, d.d/2-0.1]) {
    _child(g, _box(d.w, 0.12, 0.12, 0x9a7050, 0.8, 0), 0, d.h+0.06, bz);
  }
  // Slats
  var slats = 6;
  for (var i = 0; i < slats; i++) {
    var slat = _box(0.06, 0.06, d.d-0.1, 0xaa8060, 0.8, 0);
    slat.position.set(-d.w/2 + 0.1 + i*(d.w-0.2)/(slats-1), d.h+0.18, 0);
    g.add(slat);
  }
  return g;
});

_reg('garage', 'Garage Block', '🏠', 'Outdoor', 6, 2.8, 6, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xd4c8a8, 0.8, 0), 0, d.h/2, 0);
  // Garage door
  for (var p = 0; p < 4; p++) {
    var panel = _box(d.w*0.7, d.h/4-0.04, 0.04, 0xbbbbbb, 0.5, 0.2);
    panel.position.set(0, d.h/8+p*(d.h/4), d.d/2+0.02);
    g.add(panel);
  }
  // Person door
  _child(g, _box(0.8, 2.0, 0.06, 0x8b6914, 0.6, 0.1), d.w/2-0.55, 1.0, d.d/2+0.03);
  // Window
  var win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.04), _glassMat(0x99bbcc, 0.2));
  win.position.set(-d.w/2+0.6, d.h*0.75, d.d/2+0.02);
  g.add(win);
  return g;
});

_reg('tree', 'Deciduous Tree', '🌳', 'Outdoor', 1.5, 4.0, 1.5, function(d) {
  var g = _group();
  // Trunk
  var trunk = _cyl(d.w*0.1, d.w*0.12, d.h*0.4, 8, 0x6b4c2a, 0.9, 0.1);
  trunk.position.y = d.h*0.2;
  g.add(trunk);
  // Canopy layers
  var canopyColors = [0x2a6a1a, 0x357a20, 0x408a2a];
  for (var i = 0; i < 3; i++) {
    var canopy = _sphere(d.w*(0.4+i*0.12), 10, canopyColors[i], 0.9, 0);
    canopy.position.y = d.h*0.45 + i*d.h*0.12;
    canopy.scale.y = 0.85;
    g.add(canopy);
  }
  return g;
});

_reg('pine-tree', 'Pine Tree', '🌲', 'Outdoor', 1.5, 5.0, 1.5, function(d) {
  var g = _group();
  var trunk = _cyl(d.w*0.06, d.w*0.08, d.h*0.25, 6, 0x6b4c2a, 0.9, 0);
  trunk.position.y = d.h*0.125;
  g.add(trunk);
  var tiers = 4;
  for (var i = 0; i < tiers; i++) {
    var tier = _cone(d.w*(0.5-i*0.1), d.h*0.28, 8, 0x2a5a18+i*0x040400, 0.9);
    tier.position.y = d.h*0.22 + i*d.h*0.18;
    g.add(tier);
  }
  return g;
});

_reg('bush', 'Bush / Shrub', '🌿', 'Outdoor', 0.8, 0.7, 0.8, function(d) {
  var g = _group();
  var colors = [0x2a7a1a, 0x358a22, 0x3a9a28];
  for (var i = 0; i < 5; i++) {
    var b = _sphere(d.w*(0.25+Math.random()*0.15), 8, colors[i%3], 0.9, 0);
    b.position.set((Math.random()-0.5)*d.w*0.5, d.h*(0.2+Math.random()*0.3), (Math.random()-0.5)*d.d*0.5);
    b.scale.y = 0.8;
    g.add(b);
  }
  return g;
});

_reg('grass-patch', 'Grass Patch', '🌱', 'Outdoor', 3, 0.08, 3, function(d) {
  var g = _group();
  var grass = _box(d.w, d.h, d.d, 0x3a8a1a, 0.95, 0);
  grass.position.y = d.h/2;
  g.add(grass);
  return g;
});

_reg('fountain', 'Garden Fountain', '⛲', 'Outdoor', 1.5, 1.2, 1.5, function(d) {
  var g = _group();
  // Base basin
  var base = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2*0.85, 0.3, 20), _mat(0xaaaaaa, 0.4, 0.2));
  base.position.y = 0.15;
  g.add(base);
  // Water in basin
  var water = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2-0.08, d.w/2-0.08, 0.05, 20), _glassMat(0x66aacc, 0.7));
  water.position.y = 0.27;
  g.add(water);
  // Center column
  var col = _cyl(0.06, 0.1, d.h*0.7, 12, 0xbbbbbb, 0.3, 0.2);
  col.position.y = 0.3+d.h*0.35;
  g.add(col);
  // Top bowl
  var topBowl = new THREE.Mesh(new THREE.CylinderGeometry(d.w*0.3, d.w*0.2, 0.12, 16), _mat(0xbbbbbb, 0.3, 0.2));
  topBowl.position.y = 0.3+d.h*0.7+0.06;
  g.add(topBowl);
  var topWater = new THREE.Mesh(new THREE.CylinderGeometry(d.w*0.25, d.w*0.25, 0.04, 16), _glassMat(0x66aacc, 0.7));
  topWater.position.y = 0.3+d.h*0.7+0.12;
  g.add(topWater);
  return g;
});

// ══════════════════════════════════════════════════════════════
//  13. STRUCTURAL DETAILS
// ══════════════════════════════════════════════════════════════

_reg('chimney', 'Chimney Stack', '🧱', 'Details', 0.6, 2.0, 0.6, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xcc5533, 0.9, 0), 0, d.h/2, 0);
  // Flue
  _child(g, _box(d.w*0.4, 0.15, d.d*0.4, 0x333333, 0.8, 0), 0, d.h+0.075, 0);
  // Cap
  _child(g, _box(d.w+0.08, 0.06, d.d+0.08, 0x888888, 0.5, 0.3), 0, d.h-0.03, 0);
  return g;
});

_reg('fireplace', 'Fireplace', '🔥', 'Details', 1.5, 1.2, 0.5, function(d) {
  var g = _group();
  // Mantle surround
  _child(g, _box(d.w, d.h*0.15, d.d, 0xddccaa, 0.5, 0.1), 0, d.h-d.h*0.075, 0);
  _child(g, _box(0.15, d.h, d.d, 0xccbbaa, 0.6, 0.1), -d.w/2+0.075, d.h/2, 0);
  _child(g, _box(0.15, d.h, d.d, 0xccbbaa, 0.6, 0.1), d.w/2-0.075, d.h/2, 0);
  // Firebox opening
  var openW = d.w-0.35, openH = d.h*0.75, openD = d.d*0.7;
  _child(g, _box(openW, openH, openD, 0x222222, 0.9, 0), 0, openH/2+0.02, 0);
  // Fire glow
  var fire = new THREE.Mesh(new THREE.BoxGeometry(openW*0.7, openH*0.3, 0.05), _emissiveMat(0xff4400, 0xff6600));
  fire.position.set(0, openH*0.2, openD/2-0.01);
  g.add(fire);
  return g;
});

_reg('hvac', 'HVAC Unit', '🌡️', 'Details', 1.0, 0.6, 0.6, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xcccccc, 0.4, 0.3), 0, d.h/2, 0);
  // Grille (front)
  for (var i = 0; i < 8; i++) {
    var slat = _box(d.w-0.04, 0.02, 0.02, 0xbbbbbb, 0.3, 0.3);
    slat.position.set(0, 0.04+i*(d.h-0.08)/7, d.d/2+0.01);
    g.add(slat);
  }
  // Fan housing
  var fan = _cyl(d.d*0.3, d.d*0.3, 0.06, 12, 0xaaaaaa, 0.3, 0.4);
  fan.rotation.x = Math.PI/2;
  fan.position.set(0, d.h*0.55, d.d/2+0.03);
  g.add(fan);
  return g;
});

_reg('solar-panel', 'Solar Panels', '☀️', 'Details', 2.0, 0.06, 1.0, function(d) {
  var g = _group();
  var frame = _box(d.w, d.h, d.d, 0x444455, 0.3, 0.4);
  frame.position.y = d.h/2;
  g.add(frame);
  var nCols = Math.floor(d.w/0.35);
  var nRows = Math.floor(d.d/0.25);
  for (var r = 0; r < nRows; r++) {
    for (var c = 0; c < nCols; c++) {
      var cell = _box(0.3, d.h+0.002, 0.2, 0x223388, 0.1, 0.5);
      cell.position.set(-d.w/2+0.175+c*(d.w/nCols), d.h/2+0.001, -d.d/2+0.125+r*(d.d/nRows));
      g.add(cell);
    }
  }
  return g;
});

_reg('ac-unit', 'Window AC Unit', '❄️', 'Details', 0.6, 0.3, 0.4, function(d) {
  var g = _group();
  _child(g, _box(d.w, d.h, d.d, 0xeeeeee, 0.3, 0.2), 0, d.h/2, 0);
  for (var i = 0; i < 5; i++) {
    var sl = _box(d.w-0.04, 0.02, 0.04, 0xdddddd, 0.3, 0.2);
    sl.position.set(0, 0.04+i*(d.h-0.08)/4, d.d/2+0.01);
    g.add(sl);
  }
  return g;
});

_reg('water-tank', 'Water Tank', '🫙', 'Details', 1.5, 2.0, 1.5, function(d) {
  var g = _group();
  var tank = _cyl(d.w/2, d.w/2, d.h*0.85, 16, 0x4477aa, 0.4, 0.2);
  tank.position.y = d.h*0.425;
  g.add(tank);
  var lid = _cyl(d.w/2+0.05, d.w/2+0.05, 0.08, 16, 0x336699, 0.4, 0.2);
  lid.position.y = d.h*0.85+0.04;
  g.add(lid);
  // Legs
  for (var i = 0; i < 3; i++) {
    var ang = (i/3)*Math.PI*2;
    _child(g, _box(0.08, d.h*0.3, 0.08, 0x888888, 0.4, 0.3), Math.cos(ang)*d.w*0.4, d.h*0.15, Math.sin(ang)*d.w*0.4);
  }
  return g;
});

// ══════════════════════════════════════════════════════════════
//  14. DECOR
// ══════════════════════════════════════════════════════════════

_reg('artwork', 'Artwork / Painting', '🖼️', 'Decor', 0.8, 0.6, 0.04, function(d) {
  var g = _group();
  var frame = _box(d.w, d.h, d.d, 0x4a3520, 0.7, 0.1);
  frame.position.y = d.h/2;
  g.add(frame);
  var colors = [0xcc4444, 0x4488cc, 0x88aa44, 0xcc8833];
  var art = _box(d.w-0.06, d.h-0.06, 0.01, colors[Math.floor(Math.random()*4)], 0.8, 0);
  art.position.set(0, d.h/2, d.d/2+0.005);
  g.add(art);
  return g;
});

_reg('vase', 'Decorative Vase', '🏺', 'Decor', 0.25, 0.5, 0.25, function(d) {
  var g = _group();
  var body = _cyl(d.w/2, d.w/2*0.6, d.h*0.75, 14, 0xcc8833, 0.4, 0.1);
  body.position.y = d.h*0.375;
  g.add(body);
  var neck = _cyl(d.w/2*0.25, d.w/2*0.45, d.h*0.25, 12, 0xbb7722, 0.4, 0.1);
  neck.position.y = d.h*0.875;
  g.add(neck);
  return g;
});

_reg('clock-wall', 'Wall Clock', '🕐', 'Decor', 0.4, 0.4, 0.06, function(d) {
  var g = _group();
  var face = _cyl(d.w/2, d.w/2, d.h*0.12, 24, 0xf5f5f0, 0.3, 0.1);
  face.rotation.x = Math.PI/2;
  face.position.y = d.h/2;
  g.add(face);
  var rim = _torus(d.w/2, 0.025, 0x555555);
  rim.rotation.x = Math.PI/2;
  rim.position.y = d.h/2;
  g.add(rim);
  return g;
});

_reg('tv', 'Flat Screen TV', '📺', 'Decor', 1.2, 0.72, 0.06, function(d) {
  var g = _group();
  var bezel = _box(d.w, d.h, d.d, 0x111111, 0.5, 0.2);
  bezel.position.y = d.h/2;
  g.add(bezel);
  var screen = new THREE.Mesh(new THREE.BoxGeometry(d.w-0.04, d.h-0.04, 0.01), _mat(0x0a1a2a, 0.9, 0.1));
  screen.position.set(0, d.h/2, d.d/2+0.005);
  g.add(screen);
  var stand = _box(0.06, 0.25, 0.16, 0x222222, 0.5, 0.3);
  stand.position.set(0, -0.12, 0);
  g.add(stand);
  var base2 = _box(0.3, 0.03, 0.2, 0x222222, 0.5, 0.3);
  base2.position.set(0, -0.245, 0);
  g.add(base2);
  return g;
});

_reg('staircase-railing-glass', 'Glass Railing', '🔲', 'Decor', 3.0, 1.0, 0.05, function(d) {
  var g = _group();
  var rail = _box(d.w, 0.06, 0.06, 0x888888, 0.2, 0.6);
  rail.position.y = d.h+0.03;
  g.add(rail);
  var panel = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), _glassMat(0x88aacc, 0.15));
  panel.position.y = d.h/2;
  g.add(panel);
  return g;
});

console.log('[3DArch] Elements loaded:', Object.keys(ELEM_REGISTRY).length, 'in', ELEM_CATEGORIES.length, 'categories');
