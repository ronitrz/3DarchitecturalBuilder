# 🏗️ 3DArch Studio — Interactive 3D Architectural Builder

<div align="center">

![3DArch Studio Banner](https://img.shields.io/badge/3DArch-Studio-3b82f6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJMMjEuNSA3LjVWMTYuNUwxMiAyMkwyLjUgMTYuNVY3LjVMMTIgMloiIGZpbGw9IiMzYjgyZjYiLz48L3N2Zz4=)
![Three.js](https://img.shields.io/badge/Three.js-r134-black?style=for-the-badge&logo=threedotjs)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**A fully browser-based, interactive 3D architectural design tool.**
Build houses, offices, and any structure with 80+ elements — no installation required.

[🚀 Open App](#getting-started) · [📐 Features](#features) · [🎮 Controls](#controls) · [🧱 Elements](#building-elements)

</div>

---

## ✨ Overview

**3DArch Studio** lets you design buildings and interiors in real-time 3D, right in your browser. Place walls, windows, doors, roofs, furniture, outdoor elements and much more — with precise measurements, material presets, and a cinematic sky environment system.

Built entirely with vanilla HTML, CSS, and JavaScript using [Three.js](https://threejs.org/) for WebGL rendering. No build tools, no frameworks, no installation.

![App Preview](https://raw.githubusercontent.com/ronitrz/3DarchitecturalBuilder/main/preview.png)

---

## 🚀 Getting Started

### Option 1 — Python (recommended, any OS)
```bash
git clone https://github.com/ronitrz/3DarchitecturalBuilder.git
cd 3DarchitecturalBuilder
python -m http.server 5500
# Open http://localhost:5500
```

### Option 2 — Node.js
```bash
git clone https://github.com/ronitrz/3DarchitecturalBuilder.git
cd 3DarchitecturalBuilder
npx serve .
```

### Option 3 — VS Code
Install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.

> ⚠️ **Do not open `index.html` directly** via `file://` — use a local server so CDN scripts load correctly.

---

## 🎮 Controls

### Camera Controls
| Action | Control |
|---|---|
| **Orbit / Rotate** | Left-click drag |
| **Pan** | Right-click drag |
| **Zoom** | Scroll wheel |

### Keyboard — Camera Movement (fly mode)
| Key | Action |
|---|---|
| `W` | Fly forward |
| `S` | Fly backward |
| `A` | Strafe left |
| `D` | Strafe right |
| `↑` Arrow | Move camera up |
| `↓` Arrow | Move camera down |

### Keyboard — Shortcuts
| Key | Action |
|---|---|
| `G` | Move selected object |
| `R` | Rotate selected object |
| `S` | Scale selected object |
| `Del` / `Backspace` | Delete selected |
| `Ctrl+D` | Duplicate selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save scene |
| `Ctrl+N` | New scene |
| `Esc` | Cancel placement / Deselect |
| `F2` | Screenshot |

---

## 📐 Features

### 🏗️ Building & Placement
- Click any element in the left panel to activate the placement tool
- A **ghost preview** follows your mouse with blue overlay
- **Grid snapping** (0.5m default) keeps everything aligned
- Click in the scene to place; right-click drag to orbit while placing
- **Undo/Redo** with full history stack

### 📏 Measurement System
- **Dimension labels** (W / H / D) float on selected objects in 3D space
- **Measure tape tool** — click two points to get the distance
- **Unit selector** — switch between `m`, `cm`, `mm`, `ft` at any time

### 🎨 Appearance
- **Color picker** per element
- **Opacity slider** (useful for glass elements)
- **9 material presets**: Default, Concrete, Brick, Wood, Glass, Metal, Marble, Tile, Plaster

### 🌈 Sky Environments (12 presets)
| Preset | Atmosphere |
|---|---|
| ☀️ Daylight | Bright blue sky, strong sun |
| 🌅 Dawn | Pink-orange sunrise |
| 🌄 Golden Hour | Warm amber light |
| 🌇 Sunset | Purple-orange drama |
| 🌆 Dusk | Deep purple twilight |
| 🌙 Night | Dark sky with stars |
| 🌥️ Overcast | Soft diffuse gray |
| ⛈️ Storm | Near-black dramatic |
| 🏜️ Desert | Hot sandy haze |
| 🏔️ Arctic | Icy pale blue |
| 🌊 Ocean | Deep cyan-teal |
| 🌋 Volcanic | Fiery red-orange |

Each preset changes: sky gradient · ambient light · sun color/intensity · ground color

### 🛠️ Transform Tools
- **Move** (`G`) — translate along X/Y/Z axes with handles
- **Rotate** (`R`) — rotate around any axis
- **Scale** (`S`) — uniform or axis-locked scale
- **Properties panel** — type exact values for position, rotation, scale, dimensions

### 💾 Save & Export
- **Save** — downloads your scene as a `.json` file
- **Load** — restore any saved scene from file
- **Screenshot** — exports a clean PNG of the current 3D view

---

## 🧱 Building Elements

**80+ elements across 14 categories:**

<details>
<summary>🏗️ Structural (9 elements)</summary>

- Foundation Slab
- Straight Wall
- Thin Partition Wall
- Glass Wall
- Column / Pillar
- Structural Beam
- Floor Slab
- Ceiling Panel
- Retaining Wall
</details>

<details>
<summary>🚪 Openings (10 elements)</summary>

- Single Window
- Double Window
- Bay Window
- Roof Skylight
- Single Door
- Double Door
- Sliding Door
- French Doors
- Garage Door
- Arch Doorway
</details>

<details>
<summary>🏠 Roofing (7 elements)</summary>

- Flat Roof
- Gabled Roof
- Hipped Roof
- Shed Roof
- Mansard Roof
- Dome / Cupola
- Butterfly Roof
</details>

<details>
<summary>🪜 Circulation (6 elements)</summary>

- Straight Stairs
- Spiral Stairs
- L-Shaped Stairs
- Access Ramp
- Elevator Shaft
- Railing / Balustrade
</details>

<details>
<summary>🛋️ Living Room (9 elements)</summary>

- 2-Seater Sofa · 3-Seater Sofa
- Armchair · Rug · Curtains
- Coffee Table · TV Stand
- Bookshelf · Indoor Plant
</details>

<details>
<summary>🛏️ Bedroom (7 elements)</summary>

- Single Bed · Double Bed · King Bed
- Wardrobe · Nightstand
- Dresser / Chest · Study Desk
</details>

<details>
<summary>🍳 Kitchen (7 elements)</summary>

- Counter (Straight) · Kitchen Island
- Refrigerator · Stove / Oven
- Kitchen Sink · Upper Cabinet
- Dishwasher
</details>

<details>
<summary>🛁 Bathroom (7 elements)</summary>

- Bathtub · Shower Cubicle · Toilet
- Bathroom Sink · Vanity Cabinet
- Mirror · Towel Rail
</details>

<details>
<summary>🪑 Dining (4 elements)</summary>

- Dining Table 4-seat
- Dining Table 6-seat
- Dining Chair · Bar Stool
</details>

<details>
<summary>💼 Office (4 elements)</summary>

- Office Desk · Office Chair
- Filing Cabinet · Bookcase
</details>

<details>
<summary>💡 Lighting (8 elements)</summary>

- Ceiling Light · Pendant Light
- Chandelier · Floor Lamp
- Table Lamp · Wall Sconce
- Recessed Light · Track Lighting
</details>

<details>
<summary>🌳 Outdoor (12 elements)</summary>

- Driveway · Pathway
- Fence Panel · Gate
- Swimming Pool · Patio/Deck
- Pergola · Garage Block
- Deciduous Tree · Pine Tree
- Bush / Shrub · Grass Patch · Fountain
</details>

<details>
<summary>🔧 Structural Details (6 elements)</summary>

- Chimney Stack · Fireplace
- HVAC Unit · Solar Panels
- Window AC Unit · Water Tank
</details>

<details>
<summary>🖼️ Decor (5 elements)</summary>

- Artwork / Painting · Decorative Vase
- Wall Clock · Flat Screen TV
- Glass Railing
</details>

---

## 📁 Project Structure

```
3DarchitecturalBuilder/
├── index.html          # App shell — layout, toolbar, canvas
├── style.css           # Premium dark theme (glassmorphism)
├── js/
│   ├── elements.js     # 80+ element definitions & 3D factories
│   └── app.js          # Scene engine, controls, UI, tools
└── README.md
```

### Dependencies (CDN — no install needed)
| Library | Version | Purpose |
|---|---|---|
| [Three.js](https://threejs.org) | r134 | 3D rendering (WebGL) |
| [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) | r134 | Camera orbit/pan/zoom |
| [TransformControls](https://threejs.org/docs/#examples/en/controls/TransformControls) | r134 | Move/rotate/scale handles |
| [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) | latest | UI typography |

---

## 🗺️ Roadmap

- [ ] Multi-floor / storey support
- [ ] Curved wall tool
- [ ] Texture image upload
- [ ] Room area calculator
- [ ] Export to OBJ / GLTF
- [ ] Collaborative editing (WebSockets)
- [ ] AR preview (WebXR)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ using [Three.js](https://threejs.org)

⭐ Star this repo if you found it useful!

</div>
