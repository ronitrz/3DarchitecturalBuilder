# -*- coding: utf-8 -*-
"""
3DArch Studio – Demo Recorder
Captures the browser window showing localhost:8080 and saves a demo video.
Run AFTER the dev server is already running.
"""

import time, subprocess, sys, os, threading
import pyautogui
import imageio
from PIL import ImageGrab, Image, ImageDraw, ImageFont

# ── Config ─────────────────────────────────────────────────────────────────
URL            = "http://localhost:8080"
OUTPUT_PATH    = r"d:\Projects\3Darch\demo.mp4"
GIF_PATH       = r"d:\Projects\3Darch\demo.gif"
FPS            = 10          # frames per second (keep low for GIF size)
DURATION_SEC   = 40          # total recording length
CAPTURE_REGION = None        # None = full screen; or (left, top, width, height)
BROWSER        = "chrome"    # "chrome" | "msedge" | "firefox"
# ───────────────────────────────────────────────────────────────────────────

def open_browser(url):
    """Open the URL in the default browser, maximised."""
    subprocess.Popen(
        ["cmd", "/c", "start", "", url],
        shell=False,
        creationflags=subprocess.CREATE_NO_WINDOW
    )
    time.sleep(3)           # wait for browser + page to load
    pyautogui.hotkey("win", "up")   # maximise
    time.sleep(1)

def annotate(frame: Image.Image, text: str) -> Image.Image:
    """Burn a label onto the bottom of the frame."""
    draw = ImageDraw.Draw(frame)
    w, h = frame.size
    # semi-transparent banner
    draw.rectangle([(0, h - 36), (w, h)], fill=(10, 10, 30, 200))
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()
    draw.text((16, h - 28), text, fill=(180, 220, 255), font=font)
    return frame

# ── Demo automation steps ──────────────────────────────────────────────────
STEPS = [
    # (start_sec, end_sec, caption, action_fn)
    (0,  3,  "3DArch Studio – Interactive 3D Architectural Builder", None),
    (3,  6,  "Adding a Wall element…",                               "place_wall"),
    (6,  9,  "Adding Windows…",                                      "place_window"),
    (9,  12, "Adding a Door…",                                       "place_door"),
    (12, 16, "Adding Furniture – Sofa & Table…",                     "place_furniture"),
    (16, 20, "Adding outdoor Trees & Fence…",                        "place_outdoor"),
    (20, 24, "Orbiting the 3D scene…",                               "orbit"),
    (24, 28, "Switching to Top-down view…",                          "top_view"),
    (28, 32, "Switching to Isometric view…",                         "iso_view"),
    (32, 36, "Changing Sky environment to Night…",                   "night_sky"),
    (36, 40, "Demo complete – build your dream home with 3DArch!",   None),
]

# Screen coordinates (approximate for a 1920×1080 maximised browser).
# We use pyautogui to simulate clicks on UI elements.

def _click(x, y, delay=0.4):
    pyautogui.moveTo(x, y, duration=0.3)
    pyautogui.click()
    time.sleep(delay)

def _find_and_click_element(label: str):
    """
    Scroll the left sidebar and click an element button by searching for it
    via the search box.
    """
    # Click search box (approx position)
    _click(180, 108)
    time.sleep(0.2)
    pyautogui.hotkey("ctrl", "a")
    pyautogui.typewrite(label, interval=0.06)
    time.sleep(0.5)
    # First result appears – click it (approx y=230, first item in list)
    _click(180, 230)
    time.sleep(0.3)
    # Click centre of viewport to place
    _click(960, 500)
    time.sleep(0.4)
    # Clear search
    _click(180, 108)
    pyautogui.hotkey("ctrl", "a")
    pyautogui.press("delete")

def place_wall():
    _find_and_click_element("Wall")
    _click(860, 460)
    _click(1060, 460)

def place_window():
    _find_and_click_element("Window")
    _click(910, 460)

def place_door():
    _find_and_click_element("Door")
    _click(1000, 460)

def place_furniture():
    _find_and_click_element("Sofa")
    _click(940, 520)
    time.sleep(0.3)
    _find_and_click_element("Table")
    _click(990, 510)

def place_outdoor():
    _find_and_click_element("Tree")
    _click(870, 540)
    time.sleep(0.3)
    _find_and_click_element("Fence")
    _click(1050, 540)

def orbit():
    # Drag to orbit
    pyautogui.moveTo(960, 500, duration=0.2)
    pyautogui.mouseDown(button="left")
    for dx in range(0, 200, 5):
        pyautogui.moveTo(960 + dx, 480, duration=0.03)
    pyautogui.mouseUp(button="left")

def top_view():
    # Click "Top" camera button in left sidebar (approx)
    _click(100, 196)

def iso_view():
    _click(160, 196)

def night_sky():
    # Click the sky dropdown in header
    _click(1700, 38)
    time.sleep(0.4)
    # Choose Night option (approximately 6th item down)
    pyautogui.press(["down"] * 5)
    pyautogui.press("enter")

ACTION_MAP = {
    "place_wall":      place_wall,
    "place_window":    place_window,
    "place_door":      place_door,
    "place_furniture": place_furniture,
    "place_outdoor":   place_outdoor,
    "orbit":           orbit,
    "top_view":        top_view,
    "iso_view":        iso_view,
    "night_sky":       night_sky,
}

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("Opening browser…")
    open_browser(URL)

    frames = []
    total_frames = DURATION_SEC * FPS
    frame_interval = 1.0 / FPS

    print(f"Recording {DURATION_SEC}s at {FPS} fps -> {total_frames} frames")
    print("DO NOT move your mouse manually during recording.\n")

    # Pre-schedule actions in a background thread
    def run_actions():
        t0 = time.time()
        for start, end, caption, action_key in STEPS:
            wait = start - (time.time() - t0)
            if wait > 0:
                time.sleep(wait)
            if action_key and action_key in ACTION_MAP:
                ACTION_MAP[action_key]()

    action_thread = threading.Thread(target=run_actions, daemon=True)

    t_start = time.time()
    action_thread.start()

    step_idx = 0
    current_caption = STEPS[0][2]

    for i in range(total_frames):
        elapsed = time.time() - t_start

        # Update caption
        for s, e, cap, _ in STEPS:
            if s <= elapsed < e:
                current_caption = cap
                break

        # Grab screen
        img = ImageGrab.grab(bbox=CAPTURE_REGION)
        img = annotate(img, f"  {current_caption}")
        frames.append(img)

        # Sleep to maintain FPS
        next_frame_time = t_start + (i + 1) * frame_interval
        sleep_time = next_frame_time - time.time()
        if sleep_time > 0:
            time.sleep(sleep_time)

        if i % FPS == 0:
            print(f"  {elapsed:.1f}s / {DURATION_SEC}s  [{i+1}/{total_frames}]")

    print("\nEncoding video…")
    try:
        writer = imageio.get_writer(OUTPUT_PATH, fps=FPS, codec="libx264", quality=7)
        for f in frames:
            writer.append_data(f)  # type: ignore
        writer.close()
        print(f"[OK]  Video saved -> {OUTPUT_PATH}")
    except Exception as e:
        print(f"MP4 encoding failed ({e}), falling back to GIF…")
        frames_resized = [f.resize((f.width // 2, f.height // 2)) for f in frames]
        imageio.mimsave(GIF_PATH, frames_resized, fps=FPS)
        print(f"[OK]  GIF saved -> {GIF_PATH}")

if __name__ == "__main__":
    main()
