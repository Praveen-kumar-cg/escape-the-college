# 🎓 ESCAPE THE COLLEGE
> *“One student. One exit. Infinite assignments.”*

[![Play Live](https://img.shields.io/badge/🎮%20Play%20Live-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://praveen-kumar-cg.github.io/escape-the-college/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-purple?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🕹️ Play Live in Your Browser
👉 **[https://praveen-kumar-cg.github.io/escape-the-college/](https://praveen-kumar-cg.github.io/escape-the-college/)**

*Tip: Supports Desktop, Mobile phones (landscape touch D-pad), and Classroom Projectors (1-click fullscreen mode).*

---

## 📖 Story & Gameplay Arc
You fell asleep in the campus library and woke up trapped inside at midnight! To graduate, you must survive **3 rising semesters of academic chaos**:

1. **Semester 1: Freshers' Midnight** (90s timer) — Learn the campus, find 3 keys, and dodge patrolling proctors.
2. **Semester 2: Mid-Term Mayhem** (75s timer) — Tighter corridors, faster professors, and eerie flickering emergency lights.
3. **Finals Week: The Graduation Heist** (60s timer) — Extreme security! Dean Strictlaw is on patrol with high-speed exam papers and atmospheric flashlight blackout vision!

---

## ⚡ Key Features

* 🔀 **Procedural Map Generation on Every Try:** Every single run generates a **completely new layout, dynamic doorways, internal room obstacles, and randomized navigation routes**—you never play the exact same design twice!
* 🏛️ **Themed Floors & Room Popups:** Distinct visual themes for each room—Library (warm wood & bookshelves), Computer Lab (cyan glow & flickering monitors), Faculty Lounge (royal purple carpet), Lecture Hall (collegiate cyan desks), and Main Hallway (checkered tiles with glowing neon strips)—plus instant *"Entered: [Room]"* HUD notifications.
* 🔦 **Flashlight & Spooky Ambient Vignette:** Soft radial player flashlight cone with atmospheric darkness vignette that tightens in difficulty during Semesters 2 and 3.
* 🧭 **Beacon Guide Arrow & Corner Radar Minimap:** Sleek cyber beacon orbiting the player pointing directly to the nearest key (or to the exit gate once unlocked) paired with a live real-time HUD Radar minimap.
* 💥 **Hit & Pickup Effects:** Screen shake and red perimeter flash on damage, floating arcade numbers (`-20 HP`, `+150 PTS`, `Key found! 🔑`), particle bursts on collectible pickups, and ghost player motion trails.
* 📜 **Desktop Incident Feed & Session Best:** Live event logging feed with timestamps recording every campus incident, room entry, and power-up activation, alongside your session high score.
* 🛡️ **Attendance 75% Shield:** Collect glowing shields to absorb an enemy strike with 0 damage.
* 👻 **Proxy Attendance (Invisibility):** Grab the proxy hall pass to become translucent and invincible to all obstacles for 3 seconds!
* 🚪 **Animated Emerald Exit Portal:** Once all 3 keys are gathered, the exit gate animates into an active glowing green freedom portal.
* ☕ **Hot Coffee Boosts:** Sip coffee to restore **+25 HP** and boost your score.
* 🎵 **Procedural Spooky BGM & Web Audio:** Eerie atmospheric drone and mysterious midnight bell chimes synthesized in real-time with zero audio files to download.
* 📱 **Flawless Phone & Projector Support:** Responsive on-screen sliding D-Pad for mobile and dedicated **⛶ Fullscreen** mode for projectors.
* 🔒 **100% In-Memory (RAM Only):** All game metrics and session high scores remain strictly in browser RAM—**zero cookies, zero tracking, and zero laptop disk/localStorage footprint**.

---

## 🎮 Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>▲</kbd> <kbd>◄</kbd> <kbd>▼</kbd> <kbd>►</kbd> | Move Student (Smooth 8-directional movement) |
| <kbd>P</kbd> or <kbd>Esc</kbd> | Pause / Resume Game |
| <kbd>R</kbd> | Quick Restart (Generates a new procedural map!) |

### Mobile & Projector
* **Sliding Touch D-Pad:** Ergonomic virtual controller optimized for thumb movement on mobile devices.
* **⛶ Fullscreen Button:** Instant 1-click fullscreen scaling to fill auditorium and classroom projectors.

---

## 📂 Project Structure

```text
escape-the-college/
├── index.html          # HTML structure, UI screens, HUD, and Canvas
├── style.css           # Collegiate cyber-dark styling, animations & responsive media queries
├── README.md           # Documentation & project information
└── js/
    ├── audio.js        # Procedural spooky BGM & Web Audio synthesizer
    ├── entities.js     # Player, Enemies, Keys, Shields, and Proxies
    ├── map.js          # Procedural campus tile-map generator & dynamic lighting
    └── game.js         # Core game loop, 3-level progression & input manager
```

---

## 🚀 Running Locally

```bash
git clone https://github.com/Praveen-kumar-cg/escape-the-college.git
cd escape-the-college
# Double click index.html or open with a local web server:
npx serve .
```

---

## 📄 License
Open source and available under the [MIT License](LICENSE).
