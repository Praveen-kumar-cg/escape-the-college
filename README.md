# 🎓 ESCAPE THE COLLEGE
> *“One student. One exit. Infinite assignments.”*

[![Play Live](https://img.shields.io/badge/🎮%20Play%20Live-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://praveen-kumar-cg.github.io/escape-the-college/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-purple?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🕹️ Live Demo
Play the game directly in your browser:  
👉 **[https://praveen-kumar-cg.github.io/escape-the-college/](https://praveen-kumar-cg.github.io/escape-the-college/)**

---

## 📖 Story & Objective
You fell asleep in the library and woke up trapped inside the campus at midnight! The main security gate is locked shut, requiring **3 Department Keys**. 

To survive and graduate, you must navigate the dark collegiate labyrinth, evade strict patrolling professors and flying overdue assignments, collect all keys, and make it to the main gate before the midnight deadline strikes!

---

## 🎯 Game Features & Objectives

| Objective | Details |
| :--- | :--- |
| 🔑 **Collect 3 Department Keys** | Located across the **Library**, **Computer Lab**, and **Faculty Lounge**. All 3 are required to unlock the Exit Gate. |
| ☕ **Drink Hot Coffee** | Restores **+25 HP** and grants score points to keep burnout at bay. |
| 🚨 **Evade Obstacles & Enemies** | Dodge strict professors (*Prof. Hardgrade* & *Dr. Proctor*) and bouncing spectral **F-grade assignments**. |
| ⏱️ **Beat the Clock** | Escape before the **90-second midnight timer** runs out! |
| 🚪 **Unlock the Gate** | Once all keys are found, run to the glowing green portal at the main gate to secure your diploma! |

---

## 🎮 Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>▲</kbd> <kbd>◄</kbd> <kbd>▼</kbd> <kbd>►</kbd> | Move Student (Smooth 8-directional movement) |
| <kbd>P</kbd> or <kbd>Esc</kbd> | Pause / Resume Game |
| <kbd>R</kbd> | Quick Restart |

### Mobile & Touch
- **On-Screen D-Pad**: Full responsive on-screen buttons for touchscreens and mobile devices.
- **HUD Buttons**: Quick-access buttons for Pause, Restart, and Mute/Unmute audio.

---

## 🔒 Privacy & In-Memory Design
* **100% In-Memory (RAM Only):** All player statistics, health, keys, timer, and scores are managed strictly in the active browser memory session.
* **Zero Disk Footprint:** No `localStorage`, `sessionStorage`, or cookies are written to your computer or device. Closing or refreshing the tab clears all session data instantly.

---

## 🛠️ Tech Stack & Architecture

- **Vanilla JavaScript (ES6+):** Pure object-oriented game loop using `requestAnimationFrame`, separated into modular architecture.
- **HTML5 Canvas:** 2D tile-map rendering with sub-pixel collision sliding along walls.
- **Procedural Web Audio API:** Zero external audio dependencies—all sound effects (key pickup chimes, damage impacts, coffee boosts, victory fanfares) are synthesized mathematically in real-time.
- **Responsive CSS3:** Neon dark-mode midnight palette with animated frosted-glass UI overlays.

---

## 📂 Project Structure

```text
escape-the-college/
├── index.html          # HTML structure, UI screens, HUD, and Canvas
├── style.css           # Modern collegiate cyber-dark styling & animations
├── README.md           # Documentation & project information
└── js/
    ├── audio.js        # Web Audio API sound synthesizer
    ├── entities.js     # Player, Enemy, Key, and Coffee classes
    ├── map.js          # Campus grid tile-map and collision system
    └── game.js         # Core game loop, input handling, and state machine
```

---

## 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Praveen-kumar-cg/escape-the-college.git
   cd escape-the-college
   ```

2. **Open the game:**
   - Double-click [`index.html`](file:///C:/Users/Praveen%20kumar/.gemini/antigravity/scratch/escape-the-college/index.html) to run it directly in any modern browser (Chrome, Edge, Firefox, Safari).
   - *Optional:* Launch with a lightweight HTTP server:
     ```bash
     npx serve .
     # or
     python -m http.server 8000
     ```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
