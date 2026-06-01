# -*- coding: utf-8 -*-
"""
3DArch Studio – Playwright Demo Recorder
Launches a virtual 1080p browser, loads the architectural builder,
runs an automated green-construction speedbuild, transitions through skies,
and records a gorgeous 30fps cinematic walkthrough.
Converts the output to a highly-compatible MP4 file at the end.
"""

import time
import os
import shutil
from playwright.sync_api import sync_playwright
import imageio

# ── Config ─────────────────────────────────────────────────────────────────
URL          = "http://localhost:8080"
OUTPUT_DIR   = r"d:\Projects\3Darch\videos"
FINAL_MP4    = r"d:\Projects\3Darch\demo.mp4"
RECORD_TIME  = 38  # total recording seconds
# ───────────────────────────────────────────────────────────────────────────

def setup_injected_js(page):
    """Injects our high-end speedbuild and cinematic automation functions."""
    js_code = """
    // 1. Helper to place elements programmatically in the Three.js scene
    window.placeElementAt = function(elementId, x, z, rotationY = 0, scaleY = 1, options = {}) {
      const elem = ELEM_REGISTRY[elementId];
      if (!elem) return;
      const dims = Object.assign({}, elem.defaultDims, options.dims || {});
      const obj = elem.create(dims);
      obj.position.set(x, 0, z);
      obj.rotation.y = rotationY;
      obj.scale.y = scaleY;
      
      // Setup appearance
      obj.userData = {
        elementId:  elem.id,
        elementName: elem.name,
        category:   elem.category,
        dims:       Object.assign({}, dims),
        color:      options.color || '#ffffff',
        material:   options.material || 'default',
        opacity:    options.opacity || 1.0,
      };
      obj.name = elem.name + '_' + Date.now();
      
      App.scene.add(obj);
      App.placedObjects.push(obj);
      updateStatusBar();
      return obj;
    };

    // 2. Animated placement with spring/bounce scale-up and construction flash!
    const scaleAnimations = [];
    window.placeElementAnimated = function(elementId, x, z, rotationY = 0, targetScaleY = 1, options = {}) {
      const obj = window.placeElementAt(elementId, x, z, rotationY, 0.01, options);
      if (!obj) return;
      
      // Flash element green briefly to indicate construction pop
      obj.traverse(child => {
        if (child.isMesh) {
          child.userData.originalColor = child.material.color.getHex();
          child.material.emissive = new THREE.Color(0x3b82f6); // glowing blue
          child.material.emissiveIntensity = 0.6;
        }
      });

      scaleAnimations.push({
        obj: obj,
        currentScale: 0.01,
        targetScaleY: targetScaleY,
        startTime: Date.now(),
        duration: 800, // ms
      });
    };

    // Elastic ease-out function
    function easeOutElastic(x) {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    // 3. Hook into Three.js rendering loop to drive animations
    const originalAnimate = window.animate;
    let touring = false;
    let tourTime = 0;
    
    window.animate = function() {
      const now = Date.now();
      
      // Scale-up construction animations
      for (let i = scaleAnimations.length - 1; i >= 0; i--) {
        const anim = scaleAnimations[i];
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        const scale = easeOutElastic(progress);
        anim.obj.scale.y = scale * anim.targetScaleY;
        anim.obj.scale.x = Math.min(progress * 1.05, 1);
        anim.obj.scale.z = Math.min(progress * 1.05, 1);

        if (progress >= 1) {
          // Restore standard emissive
          anim.obj.traverse(child => {
            if (child.isMesh) {
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
            }
          });
          scaleAnimations.splice(i, 1);
        }
      }

      // Cinematic Camera Tour
      if (touring) {
        const elapsed = (Date.now() - tourTime) / 1000;
        
        // Slow sweeping camera rotation
        const radius = 22 - Math.min(elapsed * 0.12, 5); // slow zoom in
        const angle = elapsed * 0.22; // rotation angle
        
        App.camera.position.x = Math.sin(angle) * radius;
        App.camera.position.z = Math.cos(angle) * radius;
        App.camera.position.y = 7.5 + Math.sin(elapsed * 0.35) * 1.8; // wave height
        
        App.orbitControls.target.set(0, 0.6, 0);
        App.orbitControls.update();

        // Sky preset progression
        if (elapsed > 16.0) {
          if (App._currentSky !== 'night') {
            App._currentSky = 'night';
            setSkyPreset('night');
            showToast('Sky preset: Cozy Starry Night 🌙', 'success', 3000);
          }
        } else if (elapsed > 10.0) {
          if (App._currentSky !== 'sunset') {
            App._currentSky = 'sunset';
            setSkyPreset('sunset');
            showToast('Sky preset: Sunset Glow 🌇', 'success', 3000);
          }
        } else if (elapsed > 4.0) {
          if (App._currentSky !== 'golden') {
            App._currentSky = 'golden';
            setSkyPreset('golden');
            showToast('Sky preset: Golden Hour 🌄', 'success', 3000);
          }
        }
      }

      originalAnimate();
    };

    window.startCinematicTour = function() {
      touring = true;
      tourTime = Date.now();
    };

    // 4. Injected build schedule
    const buildSteps = [
      // 1. Foundation Slab
      { delay: 1000, fn: () => {
          showToast('Phase 1: Excavation & Concrete Foundation Slab 🧱', 'success', 2500);
          window.placeElementAnimated('foundation', 0, 0, 0, 1);
      }},
      // 2. Outer Walls
      { delay: 3500, fn: () => {
          showToast('Phase 2: Structural Wall Framing 🏗️', 'success', 2500);
          window.placeElementAnimated('wall', 0, -3.9, 0, 1); // Back wall
          window.placeElementAnimated('wall', -4.9, 0, Math.PI/2, 1); // Left wall
          window.placeElementAnimated('wall', 4.9, 0, Math.PI/2, 1); // Right wall
      }},
      // 3. Doors & Windows
      { delay: 6500, fn: () => {
          showToast('Phase 3: Installing French Doors & Sliding Windows 🪟', 'success', 2500);
          window.placeElementAnimated('door-french', 0, 3.9, 0, 1); // Front French Doors
          window.placeElementAnimated('window-single', -4.9, -1.5, Math.PI/2, 1);
          window.placeElementAnimated('window-double', 4.9, 1.5, Math.PI/2, 1);
      }},
      // 4. Main Furniture
      { delay: 9500, fn: () => {
          showToast('Phase 4: Interior Furniture & Styling 🛋️', 'success', 2500);
          window.placeElementAnimated('rug', 0, -0.5, 0, 1);
          window.placeElementAnimated('sofa-3', 0, -1.8, 0, 1);
          window.placeElementAnimated('coffee-table', 0, -0.2, 0, 1);
          window.placeElementAnimated('tv-stand', 0, 1.8, Math.PI, 1);
      }},
      // 5. Decor & Detail
      { delay: 12500, fn: () => {
          showToast('Phase 5: Bookshelves & Indoor Greenery 🪴', 'success', 2500);
          window.placeElementAnimated('bookshelf', -3.8, -2.8, Math.PI/2, 1);
          window.placeElementAnimated('plant-pot', 3.8, -2.8, 0, 1);
          window.placeElementAnimated('floor-lamp', -1.5, -2.2, 0, 1);
      }},
      // 6. Patio & Pool
      { delay: 15500, fn: () => {
          showToast('Phase 6: Swimming Pool & Pergola Lounge 🏊', 'success', 2500);
          window.placeElementAnimated('patio', 7.5, 2, 0, 1);
          window.placeElementAnimated('pergola', 7.5, 2, 0, 1);
          window.placeElementAnimated('pool', 7.5, -2.5, Math.PI/2, 1);
      }},
      // 7. Garden Landscaping
      { delay: 18500, fn: () => {
          showToast('Phase 7: Planting Trees & Installing Garden Fountain ⛲', 'success', 2500);
          window.placeElementAnimated('fountain', -7.5, 1, 0, 1);
          window.placeElementAnimated('tree', -7.8, -3.5, 0, 1);
          window.placeElementAnimated('tree', -7.8, 4.5, 0, 1);
          window.placeElementAnimated('pine-tree', 7.8, -6.5, 0, 1);
          window.placeElementAnimated('bush', -6, 2.5, 0, 1);
          window.placeElementAnimated('bush', 6, 4.5, 0, 1);
      }},
      // 8. Start Cinematic Tour
      { delay: 21500, fn: () => {
          showToast('🏡 Speedbuild Completed! Launching Cinematic tour...', 'success', 4000);
          window.startCinematicTour();
      }}
    ];

    // Trigger all build phases
    buildSteps.forEach(step => {
      setTimeout(step.fn, step.delay);
    });
    """
    page.evaluate(js_code)

def run_recorder():
    """Runs Playwright browser simulation to record the dynamic canvas."""
    # Ensure output directories
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("[Playwright] Launching Chromium browser (headless mode for 60fps)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Record video natively via Playwright at 1080p
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=OUTPUT_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        print(f"[Playwright] Navigating to {URL}...")
        page.goto(URL)
        page.wait_for_load_state("networkidle")

        # Hide any overlays or elements if wanted, adjust view
        print("[Playwright] Injecting Auto-Builder script and starting dynamic Speedbuild...")
        setup_injected_js(page)

        # Wait for the recording length
        time_elapsed = 0
        while time_elapsed < RECORD_TIME:
            time.sleep(1)
            time_elapsed += 1
            print(f"  Recording progress: {time_elapsed}s / {RECORD_TIME}s")

        print("[Playwright] Speedbuild and tour completed. Saving video...")
        context.close()
        browser.close()

    # Find the recorded video file (Playwright saves with a random UUID)
    files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".webm")]
    if not files:
        print("[Error] No video file was generated by Playwright!")
        return False

    raw_video = os.path.join(OUTPUT_DIR, files[0])
    print(f"[Playwright] Video recorded successfully to raw file: {raw_video}")

    # Convert the high-definition WebM file to standard MP4
    print("[Playwright] Converting WebM video to standard MP4 via imageio-ffmpeg...")
    try:
        reader = imageio.get_reader(raw_video)
        fps = reader.get_meta_data().get("fps", 30)
        
        # Save as optimized, standard-compliant MP4
        writer = imageio.get_writer(
            FINAL_MP4, 
            fps=fps, 
            codec="libx264", 
            quality=8, 
            ffmpeg_log_level="error"
        )
        
        for frame in reader:
            writer.append_data(frame)
        writer.close()
        print(f"[OK] High-definition demo video saved successfully to: {FINAL_MP4}")
        return True
    except Exception as e:
        print(f"[Warning] MP4 transcoding failed ({e}). Providing direct WebM fallback.")
        shutil.copy(raw_video, FINAL_MP4.replace(".mp4", ".webm"))
        print(f"[OK] Fallback WebM video saved to: {FINAL_MP4.replace('.mp4', '.webm')}")
        return True

if __name__ == "__main__":
    run_recorder()
