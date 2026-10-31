/**
 * game.js - Escape the College Main Game Controller
 * Features:
 * - 3 Levels with rising difficulty arc (Semester 1 -> 2 -> 3)
 * - Procedural path & room randomization on every try (never the same design!)
 * - Power-ups: Attendance Shield & Proxy Attendance (Invisibility)
 * - Procedural Spooky BGM & Sound Effects
 * - Flawless phone touch controls & Projector Fullscreen Mode
 * - 100% In-Memory (RAM only, 0 disk/localStorage footprint)
 */

// Game States
const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_PAUSED = 'PAUSED';
const STATE_LEVELCLEAR = 'LEVELCLEAR';
const STATE_GAMEOVER = 'GAMEOVER';
const STATE_VICTORY = 'VICTORY';

class EscapeGame {
  constructor() {
    this.state = STATE_START;
    this.level = 1;
    this.maxLevels = 3;

    // Level configuration definitions
    this.levelConfigs = {
      1: {
        name: "Semester 1: Freshers' Midnight",
        time: 90,
        objective: "Search the rooms, grab power-ups, and collect all 3 keys to escape Semester 1!",
        coffeeCount: 3,
        shieldCount: 1,
        proxyCount: 1,
        professors: [
          { name: "Prof. Hardgrade", speed: 75, damage: 18 }
        ],
        assignments: [
          { speed: 85, damage: 12 },
          { speed: 90, damage: 12 }
        ]
      },
      2: {
        name: "Semester 2: Mid-Term Mayhem",
        time: 75,
        objective: "Watch out for tighter corridors & patrolling proctors! Collect all 3 keys!",
        coffeeCount: 2,
        shieldCount: 1,
        proxyCount: 1,
        professors: [
          { name: "Prof. Hardgrade", speed: 85, damage: 20 },
          { name: "Dr. Proctor", speed: 80, damage: 20 }
        ],
        assignments: [
          { speed: 95, damage: 15 },
          { speed: 100, damage: 15 },
          { speed: 95, damage: 15 }
        ]
      },
      3: {
        name: "Finals Week: The Graduation Heist",
        time: 60,
        objective: "Finals Blackout! Strict Dean & professors on high alert! Collect all 3 keys to graduate!",
        coffeeCount: 2,
        shieldCount: 1,
        proxyCount: 1,
        professors: [
          { name: "Dean Strictlaw", speed: 95, damage: 25, isDean: true },
          { name: "Prof. Hardgrade", speed: 90, damage: 22 },
          { name: "Dr. Proctor", speed: 85, damage: 22 }
        ],
        assignments: [
          { speed: 105, damage: 18 },
          { speed: 110, damage: 18 },
          { speed: 105, damage: 18 },
          { speed: 115, damage: 18 }
        ]
      }
    };

    // DOM Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // HUD Elements
    this.levelBadge = document.getElementById('hud-level-badge');
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.healthText = document.getElementById('health-text');
    this.keysCountText = document.getElementById('keys-count-text');
    this.timerDisplay = document.getElementById('timer-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.statusBanner = document.getElementById('hud-status-banner');
    this.statusMessage = document.getElementById('status-message');
    this.powerupShieldPill = document.getElementById('hud-shield-pill');
    this.powerupProxyPill = document.getElementById('hud-proxy-pill');
    this.keyIcons = [
      document.getElementById('key-icon-1'),
      document.getElementById('key-icon-2'),
      document.getElementById('key-icon-3')
    ];

    // Overlays
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.levelClearOverlay = document.getElementById('level-clear-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.victoryOverlay = document.getElementById('victory-overlay');

    // Overlay Text Elements
    this.levelClearTitle = document.getElementById('levelclear-title');
    this.levelClearReason = document.getElementById('levelclear-reason');
    this.levelClearScore = document.getElementById('levelclear-score');
    this.levelClearBonus = document.getElementById('levelclear-bonus');
    this.gameOverReason = document.getElementById('game-over-reason');
    this.gameOverScore = document.getElementById('gameover-score');
    this.gameOverKeys = document.getElementById('gameover-keys');
    this.victoryScore = document.getElementById('victory-score');
    this.victoryTime = document.getElementById('victory-time');

    // Input state
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Core Game Objects
    this.map = new CollegeMap();
    this.player = new Player(3 * TILE_SIZE, 13 * TILE_SIZE);
    this.keys = [];
    this.coffees = [];
    this.shields = [];
    this.proxies = [];
    this.enemies = [];

    // Gameplay Metrics (Stored strictly in RAM / browser memory)
    this.totalTime = 90;
    this.timeRemaining = this.totalTime;
    this.score = 0;
    this.scoreTimer = 0;
    this.keysCollected = 0;
    this.sessionHighScore = 0;

    // Loop timing
    this.lastTime = 0;
    this.animationId = null;

    // Initialize Event Listeners
    this.bindEvents();
  }

  // Bind Buttons, Keyboard, Fullscreen, and Touch
  bindEvents() {
    // Start Escape Button
    const startBtn = document.getElementById('start-escape-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.soundManager) {
          window.soundManager.init();
          window.soundManager.startBgm();
        }
        this.startLevel(1);
      });
    }

    // HUD Action Buttons
    document.getElementById('btn-pause-game').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart-game').addEventListener('click', () => this.restartGame());

    // Sound Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const isMuted = window.soundManager.toggleMute();
      soundBtn.textContent = isMuted ? '🔇' : '🔊';
      soundBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
    });

    // Fullscreen Toggle (Great for Projectors and Mobile)
    const fsBtn = document.getElementById('btn-fullscreen-toggle');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Modal Action Buttons
    document.getElementById('btn-resume-game').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-modal-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-gameover-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-gameover-home').addEventListener('click', () => this.returnToHome());
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      this.score = 0;
      this.startLevel(1);
    });
    document.getElementById('btn-victory-home').addEventListener('click', () => this.returnToHome());

    // Level Clear Next Button
    const nextLvlBtn = document.getElementById('btn-next-level');
    if (nextLvlBtn) {
      nextLvlBtn.addEventListener('click', () => {
        if (this.level < this.maxLevels) {
          this.startLevel(this.level + 1);
        } else {
          this.triggerVictory();
        }
      });
    }

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Touch / D-Pad Buttons (Enhanced for Mobile Ergonomics)
    this.bindDpad();

    // Prevent default touch pull-to-refresh on canvas
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  // Toggle Projector / Mobile Fullscreen
  toggleFullscreen() {
    const doc = document.documentElement;
    if (!document.fullscreenElement) {
      if (doc.requestFullscreen) {
        doc.requestFullscreen().catch(() => {});
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  // Enhanced D-Pad with sliding multi-touch support
  bindDpad() {
    const dpadContainer = document.getElementById('dpad-controls');
    if (!dpadContainer) return;

    const buttons = {
      'dpad-up': 'up',
      'dpad-down': 'down',
      'dpad-left': 'left',
      'dpad-right': 'right'
    };

    const updateTouchInput = (touchX, touchY) => {
      Object.keys(buttons).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const isInside = (
          touchX >= rect.left &&
          touchX <= rect.right &&
          touchY >= rect.top &&
          touchY <= rect.bottom
        );
        this.input[buttons[id]] = isInside;
      });
    };

    const resetDpad = () => {
      this.input.up = false;
      this.input.down = false;
      this.input.left = false;
      this.input.right = false;
    };

    dpadContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      updateTouchInput(t.clientX, t.clientY);
    }, { passive: false });

    dpadContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      updateTouchInput(t.clientX, t.clientY);
    }, { passive: false });

    dpadContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      resetDpad();
    }, { passive: false });

    dpadContainer.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      resetDpad();
    }, { passive: false });

    // Desktop Mouse Fallback on D-pad
    Object.keys(buttons).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const key = buttons[id];
      el.addEventListener('mousedown', (e) => { e.preventDefault(); this.input[key] = true; });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); this.input[key] = false; });
      el.addEventListener('mouseleave', (e) => { e.preventDefault(); this.input[key] = false; });
    });
  }

  handleKeyDown(e) {
    if (e.repeat) return;

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.input.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = true;
        break;
      case 'KeyP':
      case 'Escape':
        if (this.state === STATE_PLAYING || this.state === STATE_PAUSED) {
          this.togglePause();
        }
        break;
      case 'KeyR':
        if (this.state !== STATE_START) {
          this.restartGame();
        }
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.input.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = false;
        break;
    }
  }

  // ==========================================================================
  // PROCEDURAL LEVEL GENERATION & RESTART
  // Ensures a completely different path, design, and root on every try!
  // ==========================================================================

  startLevel(levelNumber) {
    this.level = Math.max(1, Math.min(this.maxLevels, levelNumber));
    const config = this.levelConfigs[this.level];

    this.startScreen.classList.remove('active');
    this.startScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    this.gameScreen.classList.add('active');
    this.hideAllModals();

    // 1. Procedurally generate a brand new map layout
    this.map.generate(this.level);

    // 2. Query available walkable floor tiles in each room
    const libTiles = this.map.getWalkableTilesInArea(1, 6, 1, 6);
    const labTiles = this.map.getWalkableTilesInArea(9, 15, 1, 6);
    const loungeTiles = this.map.getWalkableTilesInArea(18, 23, 1, 6);
    const studyTiles = this.map.getWalkableTilesInArea(1, 8, 11, 16);
    const lectureTiles = this.map.getWalkableTilesInArea(12, 23, 11, 16);
    const hallwayTiles = this.map.getWalkableTilesInArea(2, 22, 8, 9);

    const pickRandomTile = (tiles) => {
      if (!tiles || tiles.length === 0) return { col: 3, row: 13 };
      const idx = Math.floor(Math.random() * tiles.length);
      return tiles.splice(idx, 1)[0];
    };

    // 3. Spawn Player in a safe Study Hall / Hallway tile
    const spawnTile = pickRandomTile(studyTiles);
    this.player.reset(spawnTile.col * TILE_SIZE, spawnTile.row * TILE_SIZE);

    // 4. Randomize Key Positions on guaranteed walkable floor tiles
    const k1 = pickRandomTile(libTiles);
    const k2 = pickRandomTile(labTiles);
    const k3 = pickRandomTile(loungeTiles);

    this.keys = [
      new KeyItem(1, "Library Key", k1.col, k1.row),
      new KeyItem(2, "Computer Lab Key", k2.col, k2.row),
      new KeyItem(3, "Faculty Lounge Key", k3.col, k3.row)
    ];

    // 5. Randomize Coffee Pickups
    this.coffees = [];
    const coffeePool = [libTiles, labTiles, loungeTiles, studyTiles, lectureTiles];
    for (let i = 0; i < config.coffeeCount; i++) {
      const pool = coffeePool[i % coffeePool.length];
      const cTile = pickRandomTile(pool);
      this.coffees.push(new CoffeeItem(cTile.col, cTile.row));
    }

    // 6. Randomize Power-Ups: Attendance Shield & Proxy Attendance
    this.shields = [];
    if (config.shieldCount > 0) {
      const shieldTile = pickRandomTile(Math.random() < 0.5 ? hallwayTiles : studyTiles);
      this.shields.push(new AttendanceShieldItem(shieldTile.col, shieldTile.row));
    }

    this.proxies = [];
    if (config.proxyCount > 0) {
      const proxyTile = pickRandomTile(Math.random() < 0.5 ? lectureTiles : labTiles);
      this.proxies.push(new ProxyAttendanceItem(proxyTile.col, proxyTile.row));
    }

    // 7. Dynamic Enemies based on Level & generated corridors
    this.enemies = [];

    // Main Corridor Patrol Professor
    this.enemies.push(new Enemy('professor', 3 * TILE_SIZE, 8.5 * TILE_SIZE, {
      speed: config.professors[0].speed,
      damage: config.professors[0].damage,
      axis: 'x',
      minPos: 2 * TILE_SIZE,
      maxPos: 21 * TILE_SIZE,
      name: config.professors[0].name
    }));

    // Additional Professors on Level 2 & 3
    if (this.level >= 2 && config.professors[1]) {
      // Patrols Faculty Lounge corridor vertically
      this.enemies.push(new Enemy('professor', 17 * TILE_SIZE, 2 * TILE_SIZE, {
        speed: config.professors[1].speed,
        damage: config.professors[1].damage,
        axis: 'y',
        minPos: 1.5 * TILE_SIZE,
        maxPos: 5.5 * TILE_SIZE,
        name: config.professors[1].name
      }));
    }

    if (this.level >= 3 && config.professors[2]) {
      // Dean Strictlaw: Patrols Lecture Wing
      this.enemies.push(new Enemy('professor', 12 * TILE_SIZE, 13 * TILE_SIZE, {
        speed: config.professors[0].speed,
        damage: config.professors[0].damage,
        axis: 'x',
        minPos: 12 * TILE_SIZE,
        maxPos: 22 * TILE_SIZE,
        name: config.professors[0].name,
        isDean: true
      }));
    }

    // Flying Assignments
    config.assignments.forEach((asg, idx) => {
      let ax = 8 * TILE_SIZE;
      let ay = 8.5 * TILE_SIZE;
      let minX = 2 * TILE_SIZE, maxX = 22 * TILE_SIZE;
      let minY = 7.5 * TILE_SIZE, maxY = 10 * TILE_SIZE;

      if (idx === 1) {
        ax = 15 * TILE_SIZE; ay = 13 * TILE_SIZE;
        minX = 12 * TILE_SIZE; maxX = 23 * TILE_SIZE;
        minY = 11 * TILE_SIZE; maxY = 16 * TILE_SIZE;
      } else if (idx === 2) {
        ax = 4 * TILE_SIZE; ay = 12 * TILE_SIZE;
        minX = 2 * TILE_SIZE; maxX = 8 * TILE_SIZE;
        minY = 11 * TILE_SIZE; maxY = 16 * TILE_SIZE;
      } else if (idx === 3) {
        ax = 12 * TILE_SIZE; ay = 3 * TILE_SIZE;
        minX = 9 * TILE_SIZE; maxX = 15 * TILE_SIZE;
        minY = 1.5 * TILE_SIZE; maxY = 6 * TILE_SIZE;
      }

      this.enemies.push(new Enemy('assignment', ax, ay, {
        speed: asg.speed,
        damage: asg.damage,
        vx: idx % 2 === 0 ? 1 : -0.8,
        vy: idx % 2 === 0 ? 0.6 : -0.7,
        minX, maxX, minY, maxY
      }));
    });

    // Reset Level Metrics
    this.totalTime = config.time;
    this.timeRemaining = this.totalTime;
    this.keysCollected = 0;
    this.scoreTimer = 0;

    // Reset Inputs
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;

    // Update HUD
    if (this.levelBadge) {
      this.levelBadge.textContent = `SEMESTER ${this.level} / ${this.maxLevels}`;
    }
    this.statusBanner.classList.remove('alert-open');
    this.statusMessage.textContent = config.objective;
    this.updateHUD();

    // Start Main Game Loop
    this.state = STATE_PLAYING;
    this.lastTime = performance.now();
    if (!this.animationId) {
      this.loop(this.lastTime);
    }
  }

  restartGame() {
    this.hideAllModals();
    // Restart current level with fresh randomized procedural layout
    this.startLevel(this.level);
  }

  returnToHome() {
    this.state = STATE_START;
    this.hideAllModals();
    if (window.soundManager) window.soundManager.stopBgm();

    this.gameScreen.classList.remove('active');
    this.gameScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.startScreen.classList.add('active');

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  togglePause() {
    if (this.state === STATE_PLAYING) {
      this.state = STATE_PAUSED;
      this.pauseOverlay.classList.remove('hidden');
    } else if (this.state === STATE_PAUSED) {
      this.state = STATE_PLAYING;
      this.pauseOverlay.classList.add('hidden');
      this.lastTime = performance.now();
    }
  }

  hideAllModals() {
    this.pauseOverlay.classList.add('hidden');
    if (this.levelClearOverlay) this.levelClearOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.victoryOverlay.classList.add('hidden');
  }

  // ==========================================================================
  // LEVEL CLEAR, VICTORY, AND GAME OVER
  // ==========================================================================

  triggerLevelClear() {
    this.state = STATE_LEVELCLEAR;
    if (window.soundManager) window.soundManager.playLevelUp();

    // Time Bonus: 25 points per remaining second
    const timeBonus = Math.floor(this.timeRemaining) * 25;
    this.score += 500 + timeBonus;
    this.sessionHighScore = Math.max(this.sessionHighScore, this.score);

    if (this.levelClearTitle) {
      this.levelClearTitle.textContent = `SEMESTER ${this.level} COMPLETED!`;
    }
    if (this.levelClearReason) {
      const nextLvl = this.level + 1;
      this.levelClearReason.textContent = `You secured the Department Keys and escaped! Next up: ${this.levelConfigs[nextLvl].name}!`;
    }
    if (this.levelClearScore) this.levelClearScore.textContent = this.score;
    if (this.levelClearBonus) this.levelClearBonus.textContent = `+${500 + timeBonus} PTS`;

    if (this.levelClearOverlay) {
      this.levelClearOverlay.classList.remove('hidden');
    }
  }

  triggerVictory() {
    this.state = STATE_VICTORY;
    if (window.soundManager) window.soundManager.playVictory();

    const timeBonus = Math.floor(this.timeRemaining) * 30;
    this.score += 1500 + timeBonus;
    this.sessionHighScore = Math.max(this.sessionHighScore, this.score);

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.victoryScore.textContent = this.score;
    this.victoryTime.textContent = timeStr;

    this.victoryOverlay.classList.remove('hidden');
  }

  triggerGameOver(reason) {
    this.state = STATE_GAMEOVER;
    if (window.soundManager) window.soundManager.playGameOver();

    this.sessionHighScore = Math.max(this.sessionHighScore, this.score);

    this.gameOverReason.textContent = reason;
    this.gameOverScore.textContent = this.score;
    this.gameOverKeys.textContent = `${this.keysCollected} / 3`;

    this.gameOverOverlay.classList.remove('hidden');
  }

  // ==========================================================================
  // MAIN GAME LOOP & UPDATES
  // ==========================================================================

  loop(currentTime) {
    this.animationId = requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === STATE_PLAYING) {
      this.update(dt, currentTime);
    }

    this.render(currentTime);
  }

  update(dt, time) {
    // 1. Tick Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.updateHUD();
      this.triggerGameOver("Midnight has struck! The campus security has locked you in!");
      return;
    }

    // 2. Score increments for survival
    this.scoreTimer += dt;
    if (this.scoreTimer >= 1.0) {
      this.score += 10;
      this.scoreTimer -= 1.0;
    }

    // 3. Update Player
    this.player.update(dt, this.input, this.map);

    // 4. Update Enemies & Check Collisions
    this.enemies.forEach(enemy => {
      enemy.update(dt, this.map);

      if (this.checkEntityCollision(this.player, enemy)) {
        const tookDamage = this.player.takeDamage(enemy.damage);
        if (tookDamage) {
          if (this.player.health <= 0) {
            this.updateHUD();
            this.triggerGameOver("Academic Burnout! Overwhelmed by strict professors & deadlines!");
            return;
          }
        }
      }
    });

    if (this.state !== STATE_PLAYING) return;

    // 5. Check Key Collection
    this.keys.forEach(key => {
      if (!key.collected && this.checkEntityCollision(this.player, key)) {
        key.collected = true;
        this.keysCollected++;
        this.score += 300;
        this.player.addFloatingText(`+${key.name.toUpperCase()}!`, '#fbbf24');
        if (window.soundManager) window.soundManager.playKey();

        if (this.keysCollected >= 3) {
          this.map.unlockExit();
          this.statusBanner.classList.add('alert-open');
          this.statusMessage.textContent = "⚡ ALL 3 KEYS COLLECTED! The Main College Exit Gate is UNLOCKED! Run to freedom!";
          if (window.soundManager) window.soundManager.playGateUnlocked();
        } else {
          this.statusMessage.textContent = `Keys Found: ${this.keysCollected} / 3. Find the remaining department keys!`;
        }
      }
    });

    // 6. Check Coffee Pickups
    this.coffees.forEach(coffee => {
      if (!coffee.collected && this.checkEntityCollision(this.player, coffee)) {
        coffee.collected = true;
        this.player.heal(25);
        this.score += 150;
      }
    });

    // 7. Check Attendance Shield Pickups
    this.shields.forEach(shield => {
      if (!shield.collected && this.checkEntityCollision(this.player, shield)) {
        shield.collected = true;
        this.player.activateShield();
        this.score += 200;
      }
    });

    // 8. Check Proxy Attendance Pickups
    this.proxies.forEach(proxy => {
      if (!proxy.collected && this.checkEntityCollision(this.player, proxy)) {
        proxy.collected = true;
        this.player.activateProxy(3.0);
        this.score += 250;
      }
    });

    // 9. Check Exit Gate Victory or Level Advance
    if (this.map.exitUnlocked && this.map.isAtExit(this.player.x, this.player.y, this.player.width, this.player.height)) {
      if (this.level < this.maxLevels) {
        this.triggerLevelClear();
      } else {
        this.triggerVictory();
      }
      return;
    }

    // 10. Update HUD Metrics
    this.updateHUD();
  }

  checkEntityCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  updateHUD() {
    // Health bar fill & color
    const healthPercent = Math.max(0, Math.min(100, (this.player.health / this.player.maxHealth) * 100));
    this.healthBarFill.style.width = `${healthPercent}%`;
    this.healthText.textContent = `${Math.round(this.player.health)} HP`;

    if (this.player.health <= 25) {
      this.healthBarFill.className = 'health-bar-fill danger';
    } else if (this.player.health <= 50) {
      this.healthBarFill.className = 'health-bar-fill warning';
    } else {
      this.healthBarFill.className = 'health-bar-fill';
    }

    // Keys Tracker
    this.keysCountText.textContent = `${this.keysCollected} / 3`;
    this.keyIcons.forEach((icon, idx) => {
      if (idx < this.keysCollected) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });

    // Power-Up Pills
    if (this.powerupShieldPill) {
      if (this.player.hasShield) {
        this.powerupShieldPill.classList.remove('hidden');
      } else {
        this.powerupShieldPill.classList.add('hidden');
      }
    }

    if (this.powerupProxyPill) {
      if (this.player.proxyTimer > 0) {
        this.powerupProxyPill.classList.remove('hidden');
        this.powerupProxyPill.textContent = `👻 PROXY: ${this.player.proxyTimer.toFixed(1)}s`;
      } else {
        this.powerupProxyPill.classList.add('hidden');
      }
    }

    // Timer display
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.timeRemaining <= 20) {
      this.timerDisplay.classList.add('danger');
    } else {
      this.timerDisplay.classList.remove('danger');
    }

    // Score display
    this.scoreDisplay.textContent = this.score;
  }

  render(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Map & Floors
    this.map.draw(this.ctx, time, this.player);

    // 2. Draw Collectibles & Powerups
    this.keys.forEach(k => k.draw(this.ctx, time));
    this.coffees.forEach(c => c.draw(this.ctx, time));
    this.shields.forEach(s => s.draw(this.ctx, time));
    this.proxies.forEach(p => p.draw(this.ctx, time));

    // 3. Draw Enemies
    this.enemies.forEach(e => e.draw(this.ctx, time));

    // 4. Draw Player
    this.player.draw(this.ctx, time);
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.escapeGame = new EscapeGame();
});
