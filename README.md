# 🎓 ESCAPE THE COLLEGE
> *“One student. One exit. Infinite assignments.”*

[![Play Live](https://img.shields.io/badge/🎮%20Play%20Live-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://praveen-kumar-cg.github.io/escape-the-college/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-purple?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-green?style=for-the-badge&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 🕹️ Play Live in Your Browser
👉 **[https://praveen-kumar-cg.github.io/escape-the-college/](https://praveen-kumar-cg.github.io/escape-the-college/)**

*Tip: Supports Desktop Keyboard (WASD/Arrows), Touch Virtual Joystick on Mobile Phones, and Classroom Projectors (1-click fullscreen mode).*

> **Note on GitHub Pages 404:**
> If you see a `404 - There isn't a GitHub Pages site here`, enable GitHub Pages in your repo settings:
> 1. Go to repository **Settings** -> **Pages** (or visit `https://github.com/Praveen-kumar-cg/escape-the-college/settings/pages`).
> 2. Under **Build and deployment** -> **Source**, choose **Deploy from a branch**.
> 3. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
> 4. In ~60 seconds, your site will be live at the link above!

---

## 📖 Story & Gameplay Arc
You fell asleep in the campus library and woke up trapped inside at midnight! To escape and graduate, you must survive academic chaos across multiple difficulty levels:

* 📚 **Procedural Corridors:** Every run creates a brand-new campus layout with themed rooms: Library, Computer Lab, Faculty Lounge, Study Hall, and Lecture Hall.
* 👹 **Diverse Campus Threats:**
  * **Patrolling Professor:** Sweeps an illuminated vision beam back and forth.
  * **Chief Warden:** Fast chaser detecting you within lantern light.
  * **Ghost Senior:** Phases through solid walls and flickers in and out of sight.
  * **Assignment Drone:** Self-guided drone homing in and detonating on contact!
* 👑 **Boss Fight — The Final Exam:** When all 3 campus keys are collected, the Dean appears at the exit gate! Dodge falling exam papers, spreading circles of "F" grades, and charging attacks while collecting 3 Answer Keys to defeat the boss and unlock freedom!

---

## ⚡ Game Features

* 🔀 **Procedural Map Generation:** New layout, doors, obstacles, and navigation routes on every single run.
* 📅 **Daily Challenge Mode:** Generates the exact same layout and enemy spawns for everyone on that date based on a seeded PRNG, with one-click clipboard sharing (`Escape the College Daily 31 Oct: escaped in 01:12, 940 pts`).
* 🎯 **4 Difficulty Presets:** Fresher (Easy), Backbencher (Normal), Topper (Hard), and Final Year (Nightmare, with optional 💀 One-Hit Ends Run).
* 🛡️ **5 Strategic Power-Ups:**
  * 👻 **Proxy Attendance:** Invisible and invincible for 5s.
  * ⚡ **Energy Drink:** +60% speed sprint for 6s.
  * 📝 **Cheat Notes:** Sky beacons pinpointing all hidden keys for 5s.
  * ❄️ **Bunk Pass:** Freezes all campus enemies in ice for 3s.
  * 🛡️ **Attendance Shield:** Absorbs an enemy strike with 0 damage.
* 🌪️ **Random Dynamic Events (~every 30s):** Power Cut blackout, Surprise Test (+40% enemy speed), and Canteen Open (bonus coffee drops).
* 🏆 **Achievements & Career Stats:** Unlock 6 badges (Zero Damage Escape, Caffeine Addict, Speedrunner, Boss Slayer, Ghost Buster, Night Owl) and track best times and scores in `localStorage` under `etc_`.
* 🧥 **Unlockable Student Skins:** Choose between Classic Hoodie, Academic Topper, and Stealth Ninja.
* 🎬 **Cinematic Midnight Intro & Endings:** Skippable retro typewriter intro cutscene with humorous win/loss credits.
* 🎵 **Procedural Web Audio:** Spooky ambient drone, footsteps synthesizer, accelerating heartbeat under pressure, and fast boss theme arpeggio with master volume slider and mute controls.
* 📱 **Mobile Touch Joystick & PWA:** Smooth 360° virtual joystick, haptic vibration on hits (`navigator.vibrate`), and 100% offline gameplay via `manifest.json` and `sw.js`.

---

## 🎮 Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>▲</kbd> <kbd>◄</kbd> <kbd>▼</kbd> <kbd>►</kbd> | Move Student (8-directional) |
| <kbd>P</kbd> or <kbd>Esc</kbd> | Pause / Resume Game |
| <kbd>R</kbd> | Quick Restart (Generates brand-new map) |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Skip Intro Cutscene |

### Mobile Devices
* **Virtual Touch Joystick:** Drag the on-screen joystick knob to move in any direction with analog feel.
* **On-Screen D-Pad:** Tap arrow buttons for precise grid stepping.

---

## 📂 Project Structure

```text
escape-the-college/
├── index.html          # Structure, UI screens, HUD, canvas, modals & PWA links
├── style.css           # Collegiate neon retro pixel styling & responsive queries
├── README.md           # Game guide, story & GitHub Pages deployment instructions
├── manifest.json       # PWA web app manifest with inline SVG icon
├── sw.js               # Service worker for 100% offline cache
└── js/
    ├── audio.js        # Procedural spooky BGM, footsteps, heartbeat & boss theme
    ├── entities.js     # Player, Skins, 4 Enemy types, Boss Dean, Answer Keys, & Power-ups
    ├── map.js          # Procedural campus tile-map generator & dynamic flashlight
    └── game.js         # Core loop, Boss fight, Daily Challenge, Achievements & Joystick
```

---

## 🚀 Running Locally

```bash
git clone https://github.com/Praveen-kumar-cg/escape-the-college.git
cd escape-the-college
# Double click index.html or open with any local server:
npx serve .
```

---

## 📄 License
Open source and available under the [MIT License](LICENSE).
