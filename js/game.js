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
    this.powerupSpeedPill = document.getElementById('hud-speed-pill');
    this.powerupNotesPill = document.getElementById('hud-notes-pill');
    this.powerupBunkPill = document.getElementById('hud-bunk-pill');
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

    // Visual Effects & Popup Elements
    this.damageFlashOverlay = document.getElementById('damage-flash-overlay');
    this.roomPopup = document.getElementById('room-entry-popup');
    this.roomPopupName = document.getElementById('room-entry-name');
    this.eventBanner = document.getElementById('random-event-banner');
    this.eventBannerText = document.getElementById('random-event-text');
    this.eventBannerIcon = document.getElementById('random-event-icon');
    this.storyLogContainer = document.getElementById('story-log-container');
    this.bestScoreDisplay = document.getElementById('log-best-score-val');

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
    this.energyDrinks = [];
    this.notes = [];
    this.bunkPasses = [];
    this.enemies = [];

    // Gameplay Metrics (Stored strictly in RAM / browser memory)
    this.totalTime = 90;
    this.timeRemaining = this.totalTime;
    this.score = 0;
    this.scoreTimer = 0;
    this.keysCollected = 0;
    this.sessionHighScore = 0;

    // Visual Effects & Story Log State
    this.screenShake = 0;
    this.currentRoom = null;
    this.roomPopupTimer = null;
    this.storyLogs = [];

    // Random Events State (Power Cut, Surprise Test, Canteen Open)
    this.randomEventTimer = 28.0;
    this.activeEvent = null;

    // Phase 4: Boss Fight "The Final Exam" State
    this.boss = null;
    this.bossDefeated = false;
    this.bossProjectiles = [];
    this.answerKeys = [];

    // Phase 5: Difficulty & Daily Challenge
    this.difficulty = 'backbencher';
    this.oneHitElimination = false;
    this.isDailyChallenge = false;
    this.dailyPRNG = null;
    this.screenShakeEnabled = true;

    // Phase 6: Run Metrics & Achievements Tracking
    this.damageTakenThisRun = 0;
    this.coffeesDrunkThisRun = 0;
    this.ghostChaseTimer = 0;
    this.selectedSkin = 'hoodie';

    // Load persisted settings, skins, stats, achievements (etc_ prefix)
    this.loadPersistedData();

    // Global reference for player/map events
    window.escapeGame = this;

    // Loop timing
    this.lastTime = 0;
    this.animationId = null;

    // Initialize Event Listeners & Typewriter
    this.isStarting = false;
    this.bindEvents();
    this.initTypewriter();
  }

  // Typewriter effect for menu tagline
  initTypewriter() {
    const textEl = document.getElementById('typewriter-text');
    if (!textEl) return;
    const fullText = "One student. One exit. Infinite assignments.";
    textEl.textContent = "";
    let charIdx = 0;

    const typeNext = () => {
      if (charIdx < fullText.length) {
        textEl.textContent += fullText.charAt(charIdx);
        charIdx++;
        setTimeout(typeNext, 45);
      }
    };
    setTimeout(typeNext, 250);
  }

  // Bind Buttons, Keyboard, Fullscreen, and Touch
  bindEvents() {
    // Start Escape Button with Screen Flash & Clock Chime
    const startBtn = document.getElementById('start-escape-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (this.isStarting) return;
        this.isStarting = true;

        if (window.soundManager) {
          window.soundManager.init();
          window.soundManager.playClockChime();
        }

        const flash = document.getElementById('start-flash-overlay');
        if (flash) {
          flash.classList.add('flash-active');
        }

        this.startScreen.classList.add('start-fade-out');

        setTimeout(() => {
          if (flash) flash.classList.remove('flash-active');
          this.startScreen.classList.remove('start-fade-out');

          if (window.soundManager) {
            window.soundManager.startBgm();
          }
          this.playIntroCutscene(() => {
            this.startLevel(1);
            this.isStarting = false;
          });
        }, 650);
      });
    }

    // How to Play Modal
    const htpBtn = document.getElementById('btn-how-to-play');
    const htpModal = document.getElementById('how-to-play-modal');
    const closeHtpBtn = document.getElementById('btn-close-how-to-play');

    if (htpBtn && htpModal) {
      htpBtn.addEventListener('click', () => {
        htpModal.classList.remove('hidden');
        if (window.soundManager) window.soundManager.playClick();
      });
    }
    if (closeHtpBtn && htpModal) {
      closeHtpBtn.addEventListener('click', () => {
        htpModal.classList.add('hidden');
        if (window.soundManager) window.soundManager.playClick();
      });
    }

    // Start Menu Sound Toggle Button
    const menuSoundBtn = document.getElementById('btn-menu-sound');
    const hudSoundBtn = document.getElementById('btn-sound-toggle');

    if (menuSoundBtn) {
      menuSoundBtn.addEventListener('click', () => {
        const isMuted = window.soundManager.toggleMute();
        const soundLabel = isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
        menuSoundBtn.textContent = soundLabel;
        if (hudSoundBtn) {
          hudSoundBtn.textContent = isMuted ? '🔇' : '🔊';
          hudSoundBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
        }
      });
    }

    // HUD Action Buttons
    document.getElementById('btn-pause-game').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart-game').addEventListener('click', () => this.restartGame());

    // Sound Toggle (HUD)
    if (hudSoundBtn) {
      hudSoundBtn.addEventListener('click', () => {
        const isMuted = window.soundManager.toggleMute();
        hudSoundBtn.textContent = isMuted ? '🔇' : '🔊';
        hudSoundBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
        if (menuSoundBtn) {
          menuSoundBtn.textContent = isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
        }
      });
    }

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

  // ==========================================================================
  // PERSISTENCE & ACHIEVEMENTS SYSTEM (Wrapped in try/catch with etc_ prefix)
  // ==========================================================================

  loadPersistedData() {
    try {
      const savedDiff = localStorage.getItem('etc_difficulty');
      if (savedDiff) this.difficulty = savedDiff;

      const savedOneHit = localStorage.getItem('etc_one_hit');
      if (savedOneHit !== null) this.oneHitElimination = (savedOneHit === 'true');

      const savedSkin = localStorage.getItem('etc_skin');
      if (savedSkin) {
        this.selectedSkin = savedSkin;
        if (this.player) this.player.skin = savedSkin;
      }

      const savedShake = localStorage.getItem('etc_screenshake');
      if (savedShake !== null) this.screenShakeEnabled = (savedShake === 'true');

      const rawStats = localStorage.getItem('etc_stats');
      this.stats = rawStats ? JSON.parse(rawStats) : {
        bestScore: 0,
        bestTime: null,
        totalWins: 0,
        totalDeaths: 0,
        totalKeys: 0,
        totalRuns: 0
      };

      const rawAch = localStorage.getItem('etc_achievements');
      this.achievements = rawAch ? JSON.parse(rawAch) : [];
      this.sessionHighScore = this.stats.bestScore || 0;
    } catch (e) {
      this.stats = { bestScore: 0, bestTime: null, totalWins: 0, totalDeaths: 0, totalKeys: 0, totalRuns: 0 };
      this.achievements = [];
    }
  }

  saveStats() {
    try {
      localStorage.setItem('etc_stats', JSON.stringify(this.stats));
    } catch (e) {}
  }

  unlockAchievement(id, name, desc) {
    if (!this.achievements.includes(id)) {
      this.achievements.push(id);
      try {
        localStorage.setItem('etc_achievements', JSON.stringify(this.achievements));
      } catch (e) {}

      // Show Achievement Toast
      this.showAchievementToast(name);
      this.addStoryLog(`🏆 UNLOCKED: ${name}!`, 'powerup');
      if (window.soundManager) window.soundManager.playVictory();
    }
  }

  showAchievementToast(name) {
    const toast = document.getElementById('achievement-toast');
    const toastName = document.getElementById('toast-name');
    if (toast && toastName) {
      toastName.textContent = name;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
      }, 3500);
    }
  }

  getDailySeed() {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}${mo}${da}`;
  }

  createPRNG(seedStr) {
    let s = 0;
    for (let i = 0; i < seedStr.length; i++) {
      s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
    }
    return function() {
      let t = s += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  rng() {
    if (this.isDailyChallenge && this.dailyPRNG) {
      return this.dailyPRNG();
    }
    return Math.random();
  }


  copyDailyShareText(isWin) {
    const d = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    const elapsed = Math.max(1, Math.round(this.totalTime - this.timeRemaining));
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    const timeFormatted = `${mins}:${secs}`;

    const statusText = isWin ? `escaped in ${timeFormatted}, ${this.score} pts` : `caught at ${timeFormatted}, ${this.score} pts`;
    const shareText = `Escape the College Daily ${dateStr}: ${statusText} 🎓 Play at: https://praveen-kumar-cg.github.io/escape-the-college/`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        const btn = isWin ? document.getElementById('btn-victory-share') : document.getElementById('btn-gameover-share');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = "✅ Copied to Clipboard!";
          setTimeout(() => { btn.textContent = original; }, 2000);
        }
      }).catch(() => {});
    }
  }


  updateStatsModal() {
    const elBestScore = document.getElementById('stat-best-score');
    const elBestTime = document.getElementById('stat-best-time');
    const elWins = document.getElementById('stat-total-wins');
    const elDeaths = document.getElementById('stat-total-deaths');
    const elKeys = document.getElementById('stat-total-keys');
    const elRuns = document.getElementById('stat-total-runs');

    if (elBestScore) elBestScore.textContent = (this.stats.bestScore || 0).toLocaleString();
    if (elBestTime) {
      if (this.stats.bestTime) {
        const m = String(Math.floor(this.stats.bestTime / 60)).padStart(2, '0');
        const s = String(this.stats.bestTime % 60).padStart(2, '0');
        elBestTime.textContent = `${m}:${s}`;
      } else {
        elBestTime.textContent = '--:--';
      }
    }
    if (elWins) elWins.textContent = this.stats.totalWins || 0;
    if (elDeaths) elDeaths.textContent = this.stats.totalDeaths || 0;
    if (elKeys) elKeys.textContent = this.stats.totalKeys || 0;
    if (elRuns) elRuns.textContent = this.stats.totalRuns || 0;

    // Highlight Unlocked Achievement Badges
    const badgeIds = ['zero_damage', 'caffeine_addict', 'speedrunner', 'boss_slayer', 'ghost_buster', 'night_owl'];
    badgeIds.forEach(id => {
      const badgeEl = document.getElementById(`ach-${id}`);
      if (badgeEl) {
        if (this.achievements.includes(id)) {
          badgeEl.classList.add('unlocked');
        } else {
          badgeEl.classList.remove('unlocked');
        }
      }
    });
  }

  initVirtualJoystick() {
    const joystick = document.getElementById('virtual-joystick');
    const knob = document.getElementById('joystick-knob');
    if (!joystick || !knob) return;

    let touchActive = false;
    let originX = 0;
    let originY = 0;

    const onPointerDown = (e) => {
      touchActive = true;
      const rect = joystick.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      onPointerMove(e);
    };

    const onPointerMove = (e) => {
      if (!touchActive) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      const dx = clientX - originX;
      const dy = clientY - originY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 34;

      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      const threshold = 10;
      this.input.left = dx < -threshold;
      this.input.right = dx > threshold;
      this.input.up = dy < -threshold;
      this.input.down = dy > threshold;
    };

    const onPointerUp = () => {
      touchActive = false;
      knob.style.transform = 'translate(0px, 0px)';
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
    };

    joystick.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

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

    // 6. Randomize Power-Ups: Shield, Proxy, Energy Drink, Notes, Bunk Pass
    this.shields = [];
    const shieldTile = pickRandomTile(Math.random() < 0.5 ? hallwayTiles : studyTiles);
    this.shields.push(new AttendanceShieldItem(shieldTile.col, shieldTile.row));

    this.proxies = [];
    const proxyTile = pickRandomTile(Math.random() < 0.5 ? lectureTiles : labTiles);
    this.proxies.push(new ProxyAttendanceItem(proxyTile.col, proxyTile.row));

    this.energyDrinks = [];
    const energyTile = pickRandomTile(Math.random() < 0.5 ? loungeTiles : hallwayTiles);
    this.energyDrinks.push(new EnergyDrinkItem(energyTile.col, energyTile.row));

    this.notes = [];
    const notesTile = pickRandomTile(Math.random() < 0.5 ? libTiles : studyTiles);
    this.notes.push(new NotesItem(notesTile.col, notesTile.row));

    this.bunkPasses = [];
    const bunkTile = pickRandomTile(Math.random() < 0.5 ? labTiles : lectureTiles);
    this.bunkPasses.push(new BunkPassItem(bunkTile.col, bunkTile.row));

    // 7. Dynamic Enemies: Professor, Warden, Ghost Senior, and Assignment Drone
    this.enemies = [];

    // Main Corridor Patrol Professor (with sweeping vision cone)
    this.enemies.push(new Enemy('professor', 3 * TILE_SIZE, 8.5 * TILE_SIZE, {
      speed: config.professors[0].speed,
      damage: config.professors[0].damage,
      axis: 'x',
      minPos: 2 * TILE_SIZE,
      maxPos: 21 * TILE_SIZE,
      name: config.professors[0].name
    }));

    // Warden: Fast chaser patrolling corridors
    this.enemies.push(new Enemy('warden', 19 * TILE_SIZE, 3 * TILE_SIZE, {
      speed: 125 + this.level * 6,
      damage: 20 + this.level * 2,
      name: "Chief Warden"
    }));

    // Assignment Drone: Homes in and explodes on contact
    this.enemies.push(new Enemy('drone', 14 * TILE_SIZE, 13 * TILE_SIZE, {
      speed: 80 + this.level * 8,
      damage: 22,
      name: "Assignment Drone"
    }));

    // Level 2 & 3: Ghost Senior (phases through walls, flickers in and out)
    if (this.level >= 2) {
      this.enemies.push(new Enemy('ghost_senior', 3 * TILE_SIZE, 3 * TILE_SIZE, {
        speed: 46 + this.level * 4,
        damage: 16 + this.level * 2,
        name: "Ghost Senior"
      }));

      // Extra Professor for Level 2 & 3
      if (config.professors[1]) {
        this.enemies.push(new Enemy('professor', 17 * TILE_SIZE, 2 * TILE_SIZE, {
          speed: config.professors[1].speed,
          damage: config.professors[1].damage,
          axis: 'y',
          minPos: 1.5 * TILE_SIZE,
          maxPos: 5.5 * TILE_SIZE,
          name: config.professors[1].name
        }));
      }
    }

    // Level 3: Dean Strictlaw + extra Drone
    if (this.level >= 3) {
      this.enemies.push(new Enemy('professor', 12 * TILE_SIZE, 13 * TILE_SIZE, {
        speed: 95,
        damage: 25,
        axis: 'x',
        minPos: 12 * TILE_SIZE,
        maxPos: 22 * TILE_SIZE,
        name: "Dean Strictlaw",
        isDean: true
      }));

      this.enemies.push(new Enemy('drone', 5 * TILE_SIZE, 14 * TILE_SIZE, {
        speed: 92,
        damage: 22,
        name: "Express Drone"
      }));
    }

    // Flying Assignment
    if (config.assignments && config.assignments.length > 0) {
      this.enemies.push(new Enemy('assignment', 8 * TILE_SIZE, 8.5 * TILE_SIZE, {
        speed: config.assignments[0].speed,
        damage: config.assignments[0].damage,
        vx: 1, vy: 0.7,
        minX: 2 * TILE_SIZE, maxX: 22 * TILE_SIZE,
        minY: 7.5 * TILE_SIZE, maxY: 10 * TILE_SIZE
      }));
    }

    // Reset Level Metrics
    this.totalTime = config.time;
    this.timeRemaining = this.totalTime;
    this.keysCollected = 0;
    this.scoreTimer = 0;
    this.currentRoom = null;
    this.screenShake = 0;

    // Reset Boss Fight State
    this.boss = null;
    this.bossDefeated = false;
    this.bossProjectiles = [];
    this.answerKeys = [];

    // Phase 5 & 6: Difficulty Modifiers & Run Tracking
    if (levelNumber === 1) {
      this.damageTakenThisRun = 0;
      this.coffeesDrunkThisRun = 0;
      this.ghostChaseTimer = 0;
      this.stats.totalRuns = (this.stats.totalRuns || 0) + 1;
      this.saveStats();
    }

    // Apply Player Skin
    this.player.skin = this.selectedSkin;

    // Difficulty Adjustments
    let timeModifier = 0;
    let speedMult = 1.0;
    let damageMult = 1.0;

    if (this.difficulty === 'fresher') {
      timeModifier = 30;
      speedMult = 0.8;
      damageMult = 0.7;
    } else if (this.difficulty === 'topper') {
      timeModifier = -15;
      speedMult = 1.25;
      damageMult = 1.3;
    } else if (this.difficulty === 'final_year') {
      timeModifier = -20;
      speedMult = 1.4;
      damageMult = 1.5;
    }

    this.totalTime = Math.max(35, config.time + timeModifier);
    this.timeRemaining = this.totalTime;

    // Apply difficulty to enemies
    this.enemies.forEach(e => {
      e.speed *= speedMult;
      e.damage *= damageMult;
    });

    if (this.isDailyChallenge && this.levelBadge) {
      const d = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      this.levelBadge.textContent = `📅 DAILY: ${d.getDate()} ${monthNames[d.getMonth()]}`;
    }

    // Reset Inputs
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;

    // Update HUD & Story Log
    if (this.levelBadge) {
      this.levelBadge.textContent = `SEMESTER ${this.level} / ${this.maxLevels}`;
    }
    this.statusBanner.classList.remove('alert-open');
    this.statusMessage.textContent = config.objective;
    this.updateHUD();

    this.addStoryLog(`Commenced ${config.name}!`, 'action');
    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = this.sessionHighScore;
    }

    // Reset Random Events
    this.randomEventTimer = 28.0;
    this.activeEvent = null;
    this.hideEventBanner();

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
    this.initTypewriter();

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

  // ==========================================================================
  // PHASE 7: SKIPPABLE INTRO CUTSCENE
  // ==========================================================================

  playIntroCutscene(onComplete) {
    const overlay = document.getElementById('intro-cutscene-overlay');
    const line1 = document.getElementById('cutscene-line-1');
    const line2 = document.getElementById('cutscene-line-2');
    const line3 = document.getElementById('cutscene-line-3');
    const skipBtn = document.getElementById('btn-skip-cutscene');

    if (!overlay || !line1) {
      onComplete();
      return;
    }

    line1.textContent = '';
    line2.textContent = '';
    line3.textContent = '';
    overlay.classList.remove('hidden');

    let finished = false;
    const finishCutscene = () => {
      if (finished) return;
      finished = true;
      overlay.classList.add('hidden');
      window.removeEventListener('keydown', keyHandler);
      onComplete();
    };

    const keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        finishCutscene();
      }
    };
    window.addEventListener('keydown', keyHandler);
    if (skipBtn) skipBtn.onclick = finishCutscene;

    const text1 = "You fell asleep in the campus library...";
    const text2 = "It's midnight... the heavy iron gates are locked!";
    const text3 = "Dodge patrolling proctors. Find keys. DEFEAT THE FINAL EXAM!";

    let idx1 = 0;
    const timer1 = setInterval(() => {
      if (finished) { clearInterval(timer1); return; }
      if (idx1 < text1.length) {
        line1.textContent += text1[idx1++];
      } else {
        clearInterval(timer1);
        let idx2 = 0;
        const timer2 = setInterval(() => {
          if (finished) { clearInterval(timer2); return; }
          if (idx2 < text2.length) {
            line2.textContent += text2[idx2++];
          } else {
            clearInterval(timer2);
            let idx3 = 0;
            const timer3 = setInterval(() => {
              if (finished) { clearInterval(timer3); return; }
              if (idx3 < text3.length) {
                line3.textContent += text3[idx3++];
              } else {
                clearInterval(timer3);
                setTimeout(() => { if (!finished) finishCutscene(); }, 2000);
              }
            }, 25);
          }
        }, 25);
      }
    }, 25);
  }

  hideAllModals() {
    this.pauseOverlay.classList.add('hidden');
    if (this.levelClearOverlay) this.levelClearOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.victoryOverlay.classList.add('hidden');
    const cutscene = document.getElementById('intro-cutscene-overlay');
    if (cutscene) cutscene.classList.add('hidden');
    const stats = document.getElementById('stats-modal');
    if (stats) stats.classList.add('hidden');
    const settings = document.getElementById('settings-modal');
    if (settings) settings.classList.add('hidden');
  }

  // ==========================================================================
  // VISUAL EFFECTS, ROOM POPUPS & RADAR MINIMAP
  // ==========================================================================

  triggerDamageEffects() {
    this.screenShake = 0.35;
    if (this.damageFlashOverlay) {
      this.damageFlashOverlay.classList.remove('flash-active');
      void this.damageFlashOverlay.offsetWidth;
      this.damageFlashOverlay.classList.add('flash-active');
      setTimeout(() => {
        if (this.damageFlashOverlay) {
          this.damageFlashOverlay.classList.remove('flash-active');
        }
      }, 250);
    }
  }

  showRoomPopup(roomName) {
    if (!this.roomPopup || !this.roomPopupName) return;
    this.roomPopupName.textContent = `ENTERED: ${roomName.toUpperCase()}`;
    this.roomPopup.classList.remove('hidden');
    this.roomPopup.classList.remove('fade-out');

    if (this.roomPopupTimer) clearTimeout(this.roomPopupTimer);
    this.roomPopupTimer = setTimeout(() => {
      if (this.roomPopup) {
        this.roomPopup.classList.add('fade-out');
        setTimeout(() => {
          if (this.roomPopup) this.roomPopup.classList.add('hidden');
        }, 300);
      }
    }, 1800);
  }

  // Random Events (Power Cut, Surprise Test, Canteen Open)
  triggerRandomEvent() {
    const events = ['power_cut', 'surprise_test', 'canteen_open'];
    const chosen = events[Math.floor(Math.random() * events.length)];

    if (chosen === 'power_cut') {
      this.activeEvent = {
        type: 'power_cut',
        timer: 10.0,
        icon: '⚡',
        text: 'RANDOM EVENT: POWER CUT (10s BLACKOUT)!'
      };
      this.addStoryLog('⚡ POWER CUT! Campus blackout for 10s!', 'damage');
    } else if (chosen === 'surprise_test') {
      this.activeEvent = {
        type: 'surprise_test',
        timer: 10.0,
        icon: '📝',
        text: 'RANDOM EVENT: SURPRISE TEST (+40% SPEED)!'
      };
      this.addStoryLog('📝 SURPRISE TEST! Enemies sped up (+40%)!', 'damage');
    } else if (chosen === 'canteen_open') {
      this.activeEvent = {
        type: 'canteen_open',
        timer: 8.0,
        icon: '☕',
        text: 'RANDOM EVENT: CANTEEN OPEN! BONUS COFFEE DROPPED!'
      };
      const libTiles = this.map.getWalkableTilesInArea(1, 6, 1, 6);
      const labTiles = this.map.getWalkableTilesInArea(9, 15, 1, 6);
      const loungeTiles = this.map.getWalkableTilesInArea(18, 23, 1, 6);
      const studyTiles = this.map.getWalkableTilesInArea(1, 8, 11, 16);
      const lectureTiles = this.map.getWalkableTilesInArea(12, 23, 11, 16);
      const pools = [libTiles, labTiles, loungeTiles, studyTiles, lectureTiles];

      for (let i = 0; i < 2; i++) {
        const p = pools[Math.floor(Math.random() * pools.length)];
        if (p && p.length > 0) {
          const t = p[Math.floor(Math.random() * p.length)];
          this.coffees.push(new CoffeeItem(t.col, t.row));
        }
      }
      this.addStoryLog('☕ CANTEEN OPEN! Extra hot coffee spawned!', 'coffee');
    }

    this.showEventBanner(this.activeEvent.icon, this.activeEvent.text);
    if (window.soundManager) window.soundManager.playGateUnlocked();
  }

  showEventBanner(icon, text) {
    if (!this.eventBanner || !this.eventBannerText) return;
    if (this.eventBannerIcon) this.eventBannerIcon.textContent = icon;
    this.eventBannerText.textContent = text;
    this.eventBanner.classList.remove('hidden');
    this.eventBanner.classList.remove('fade-out');
  }

  hideEventBanner() {
    if (!this.eventBanner) return;
    this.eventBanner.classList.add('fade-out');
    setTimeout(() => {
      if (this.eventBanner) this.eventBanner.classList.add('hidden');
    }, 350);
  }

  // Phase 4: Spawn Answer Key to damage Boss
  spawnNextAnswerKey(index) {
    const libTiles = this.map.getWalkableTilesInArea(1, 6, 1, 6);
    const labTiles = this.map.getWalkableTilesInArea(9, 15, 1, 6);
    const loungeTiles = this.map.getWalkableTilesInArea(18, 23, 1, 6);
    const studyTiles = this.map.getWalkableTilesInArea(1, 8, 11, 16);
    const lectureTiles = this.map.getWalkableTilesInArea(12, 23, 11, 16);
    const pools = [libTiles, labTiles, loungeTiles, studyTiles, lectureTiles];

    let chosenTile = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const pool = pools[(index + attempt) % pools.length];
      if (pool && pool.length > 0) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        const distToBoss = this.boss ? Math.hypot(t.col * TILE_SIZE - this.boss.x, t.row * TILE_SIZE - this.boss.y) : 300;
        if (distToBoss > 120) {
          chosenTile = t;
          break;
        }
      }
    }
    if (!chosenTile) {
      chosenTile = { col: 4 + index * 4, row: 13 };
    }

    const answerKey = new AnswerKeyItem(chosenTile.col, chosenTile.row, index);
    this.answerKeys.push(answerKey);
    this.player.addFloatingText(`Answer Key #${index} Spawned! 📑`, '#facc15');
    this.addStoryLog(`📑 Answer Key #${index} dropped! Grab it to weaken The Final Exam!`, 'key');
  }

  addStoryLog(text, type = 'info') {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.storyLogs.unshift({ time: timeStr, text, type });
    if (this.storyLogs.length > 25) {
      this.storyLogs.pop();
    }
    this.renderStoryLogs();
  }

  renderStoryLogs() {
    if (!this.storyLogContainer) return;
    if (this.storyLogs.length === 0) {
      this.storyLogContainer.innerHTML = '<div class="log-empty-msg">Waiting for campus activity...</div>';
      return;
    }

    let html = '';
    this.storyLogs.slice(0, 16).forEach(log => {
      html += `<div class="story-log-entry log-${log.type}">
        <span class="log-time">[${log.time}]</span>
        <span class="log-msg">${log.text}</span>
      </div>`;
    });
    this.storyLogContainer.innerHTML = html;

    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = this.sessionHighScore;
    }
  }

  // Draw beacon guide arrow orbiting around player pointing to nearest key or exit gate
  drawGuideArrow(ctx, time) {
    let targetX = null;
    let targetY = null;
    let isExit = false;

    if (this.keysCollected < 3) {
      let minDist = Infinity;
      this.keys.forEach(k => {
        if (!k.collected) {
          const kx = k.x + k.width / 2;
          const ky = k.y + k.height / 2;
          const dist = Math.hypot(kx - this.player.x, ky - this.player.y);
          if (dist < minDist) {
            minDist = dist;
            targetX = kx;
            targetY = ky;
          }
        }
      });
    } else if (this.boss && !this.boss.defeated) {
      const activeAK = this.answerKeys.find(ak => !ak.collected);
      if (activeAK) {
        targetX = activeAK.x + activeAK.width / 2;
        targetY = activeAK.y + activeAK.height / 2;
        isExit = false;
      } else {
        targetX = this.boss.x + this.boss.width / 2;
        targetY = this.boss.y + this.boss.height / 2;
        isExit = false;
      }
    } else {
      targetX = 23.5 * TILE_SIZE;
      targetY = 8.5 * TILE_SIZE;
      isExit = true;
    }

    if (targetX === null) return;

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    const angle = Math.atan2(targetY - py, targetX - px);

    const orbitRadius = 44 + Math.sin(time * 0.009) * 4;
    const arrowX = px + Math.cos(angle) * orbitRadius;
    const arrowY = py + Math.sin(angle) * orbitRadius;

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    const color = isExit ? '#10b981' : '#facc15';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Sharp glowing cyber chevron arrow
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draw Corner Radar Minimap with real-time player, keys, enemies, and exit
  drawMinimap(ctx, time) {
    const mmW = 124;
    const mmH = 92;
    const mmX = this.canvas.width - mmW - 12;
    const mmY = 12;

    ctx.save();
    // Translucent dark radar background
    ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
    ctx.fillRect(mmX, mmY, mmW, mmH);

    // Glowing cyan radar boundary
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Radar Header
    ctx.font = "bold 6px 'Press Start 2P', monospace";
    ctx.fillStyle = '#06b6d4';
    ctx.textAlign = 'left';
    ctx.fillText("RADAR", mmX + 6, mmY + 11);

    // Coordinate scale
    const scaleX = (mmW - 12) / (MAP_COLS * TILE_SIZE);
    const scaleY = (mmH - 18) / (MAP_ROWS * TILE_SIZE);
    const offX = mmX + 6;
    const offY = mmY + 14;

    // Room boundaries
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offX + 1 * TILE_SIZE * scaleX, offY + 1 * TILE_SIZE * scaleY, 6 * TILE_SIZE * scaleX, 6 * TILE_SIZE * scaleY);
    ctx.strokeRect(offX + 9 * TILE_SIZE * scaleX, offY + 1 * TILE_SIZE * scaleY, 7 * TILE_SIZE * scaleX, 6 * TILE_SIZE * scaleY);
    ctx.strokeRect(offX + 18 * TILE_SIZE * scaleX, offY + 1 * TILE_SIZE * scaleY, 6 * TILE_SIZE * scaleX, 6 * TILE_SIZE * scaleY);
    ctx.strokeRect(offX + 1 * TILE_SIZE * scaleX, offY + 11 * TILE_SIZE * scaleY, 8 * TILE_SIZE * scaleX, 6 * TILE_SIZE * scaleY);
    ctx.strokeRect(offX + 12 * TILE_SIZE * scaleX, offY + 11 * TILE_SIZE * scaleY, 12 * TILE_SIZE * scaleX, 6 * TILE_SIZE * scaleY);

    // Exit Gate
    const exitDotX = offX + 23.5 * TILE_SIZE * scaleX;
    const exitDotY = offY + 8.5 * TILE_SIZE * scaleY;
    ctx.fillStyle = this.map.exitUnlocked ? '#10b981' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 4;
    ctx.fillRect(exitDotX - 3, exitDotY - 3, 6, 6);

    // Keys (glowing yellow)
    this.keys.forEach(k => {
      if (!k.collected) {
        const kx = offX + (k.x + k.width / 2) * scaleX;
        const ky = offY + (k.y + k.height / 2) * scaleY;
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Answer Keys (glowing gold triangles on radar)
    this.answerKeys.forEach(ak => {
      if (!ak.collected) {
        const akx = offX + (ak.x + ak.width / 2) * scaleX;
        const aky = offY + (ak.y + ak.height / 2) * scaleY;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.fillRect(akx - 2, aky - 2, 5, 5);
      }
    });

    // Boss (large pulsing skull/square on radar)
    if (this.boss && !this.boss.defeated) {
      const bx = offX + (this.boss.x + this.boss.width / 2) * scaleX;
      const by = offY + (this.boss.y + this.boss.height / 2) * scaleY;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(bx - 4, by - 4, 8, 8);
    }

    // Enemies (pulsing red dots)
    const enemyPulse = (Math.sin(time * 0.015) + 1) / 2 * 0.4 + 0.6;
    ctx.fillStyle = `rgba(239, 68, 68, ${enemyPulse})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 4;
    this.enemies.forEach(e => {
      const ex = offX + (e.x + e.width / 2) * scaleX;
      const ey = offY + (e.y + e.height / 2) * scaleY;
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player (pulsing bright cyan dot)
    const px = offX + (this.player.x + this.player.width / 2) * scaleX;
    const py = offY + (this.player.y + this.player.height / 2) * scaleY;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
    this.addStoryLog(`Semester ${this.level} Cleared! (+${500 + timeBonus} PTS)`, 'success');

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
    this.addStoryLog(`College Escaped! Degree Awarded! 🎓`, 'success');

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
    this.addStoryLog(`Game Over: ${reason}`, 'damage');

    const funnyLoseReasons = [
      "Sentenced to 8 AM remedial lectures forever!",
      "Dean Strictlaw assigned 500 pages of extra homework!",
      "Detained! Your attendance dropped to 42%!",
      "Backlogs will follow you into eternity!",
      "Caught without campus ID past curfew!"
    ];
    this.gameOverReason.textContent = reason || funnyLoseReasons[Math.floor(Math.random() * funnyLoseReasons.length)];
    this.stats.totalDeaths = (this.stats.totalDeaths || 0) + 1;
    this.saveStats();

    const goShareBtn = document.getElementById('btn-gameover-share');
    if (goShareBtn) {
      goShareBtn.onclick = () => this.copyDailyShareText(false);
    }
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

    // Screen Shake tick
    if (this.screenShake > 0) {
      this.screenShake -= dt;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Footsteps Audio when student is moving
    if (this.player.isMoving && window.soundManager && window.soundManager.playFootstep) {
      window.soundManager.playFootstep();
    }

    // Heartbeat Audio when enemies are nearby or time is low
    if (window.soundManager) {
      let nearestDist = Infinity;
      let nearestEnemyType = null;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemyType = e.type;
        }
      });

      // Track Ghost Senior chase for achievement
      if (nearestEnemyType === 'ghost_senior' && nearestDist < 100) {
        this.ghostChaseTimer += dt;
        if (this.ghostChaseTimer >= 10.0) {
          this.unlockAchievement('ghost_buster', 'Ghost Buster', 'Survive a Ghost Senior chase for 10s!');
        }
      }

      if (nearestDist < 120 || this.timeRemaining < 15) {
        const rate = (this.timeRemaining < 15) ? 1.8 : Math.max(1.0, (120 - nearestDist) / 60 + 1.0);
        if (window.soundManager.playHeartbeat) {
          window.soundManager.playHeartbeat(rate);
        }
      }
    }

    // Random Events Timer (Power Cut, Surprise Test, Canteen Open)
    if (this.activeEvent) {
      this.activeEvent.timer -= dt;
      if (this.activeEvent.timer <= 0) {
        this.activeEvent = null;
        this.hideEventBanner();
      }
    } else {
      this.randomEventTimer -= dt;
      if (this.randomEventTimer <= 0) {
        this.randomEventTimer = 28.0 + Math.random() * 6.0;
        this.triggerRandomEvent();
      }
    }

    // 2. Score increments for survival
    this.scoreTimer += dt;
    if (this.scoreTimer >= 1.0) {
      this.score += 10;
      this.scoreTimer -= 1.0;
    }

    // 3. Update Player
    this.player.update(dt, this.input, this.map);

    // Check Room Entry Transition
    const currentRoomName = this.map.getRoomAt(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    if (currentRoomName && currentRoomName !== this.currentRoom) {
      this.currentRoom = currentRoomName;
      this.showRoomPopup(currentRoomName);
      this.addStoryLog(`Entered ${currentRoomName}`, 'room');
    }

    // Update Particle System
    if (window.particleSystem) {
      window.particleSystem.update(dt);
    }

    // 4. Update Enemies & Check Collisions
    this.enemies.forEach(enemy => {
      enemy.update(dt, this.map, this.player);

      // Skip inactive recharging drone
      if (enemy.type === 'drone' && enemy.respawnTimer > 0) return;

      if (this.checkEntityCollision(this.player, enemy)) {
        if (enemy.type === 'drone') {
          enemy.explode();
        }
        const tookDamage = this.player.takeDamage(enemy.damage);
        if (tookDamage) {
          this.triggerDamageEffects();
          this.addStoryLog(`Hit by ${enemy.name || 'Assignment'} (-${Math.round(enemy.damage)} HP)`, 'damage');
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
        this.stats.totalKeys = (this.stats.totalKeys || 0) + 1;
        this.saveStats();
        this.player.addFloatingText(`Key found! 🔑`, '#fbbf24');
        if (window.particleSystem) {
          window.particleSystem.addBurst(key.x + 12, key.y + 12, '#fbbf24', 18);
        }
        this.addStoryLog(`Found ${key.name}! (+300 PTS)`, 'key');
        if (window.soundManager) window.soundManager.playKey();

        if (this.keysCollected >= 3) {
          if (!this.boss && !this.bossDefeated) {
            // Spawn Boss: The Final Exam!
            const exitCol = this.map.exitCol || 22;
            const exitRow = this.map.exitRow || 8;
            this.boss = new BossEnemy((exitCol - 3) * TILE_SIZE, exitRow * TILE_SIZE);
            this.screenShake = 0.6;
            this.showEventBanner("⚠️", "THE FINAL EXAM HAS BEGUN! DEFEAT THE DEAN!");
            this.addStoryLog("⚠️ BOSS FIGHT: The Final Exam appeared at the exit! Defeat him!", "danger");
            if (window.soundManager) {
              window.soundManager.playHit();
              if (window.soundManager.startBossTheme) window.soundManager.startBossTheme();
            }
            this.spawnNextAnswerKey(1);
          } else if (this.bossDefeated) {
            this.map.unlockExit();
            this.statusBanner.classList.add('alert-open');
            this.addStoryLog(`⚡ EXIT UNLOCKED! Run to the gate!`, 'gate');
            if (window.soundManager) window.soundManager.playGateUnlocked();
          }
        }
      }
    });

    // 6. Check Coffee Pickups
    this.coffees.forEach(coffee => {
      if (!coffee.collected && this.checkEntityCollision(this.player, coffee)) {
        coffee.collected = true;
        this.player.heal(25);
        this.score += 150;
        this.coffeesDrunkThisRun++;
        if (this.coffeesDrunkThisRun >= 5) {
          this.unlockAchievement('caffeine_addict', 'Caffeine Addict', 'Chugged 5 coffees in one run!');
        }
        if (window.particleSystem) {
          window.particleSystem.addBurst(coffee.x + 12, coffee.y + 12, '#10b981', 14);
        }
        this.addStoryLog(`Sipped Hot Coffee (+25 HP, +150 PTS)`, 'coffee');
      }
    });

    // 7. Check Attendance Shield Pickups
    this.shields.forEach(shield => {
      if (!shield.collected && this.checkEntityCollision(this.player, shield)) {
        shield.collected = true;
        this.player.activateShield();
        this.score += 200;
        if (window.particleSystem) {
          window.particleSystem.addBurst(shield.x + 12, shield.y + 12, '#38bdf8', 16);
        }
        this.addStoryLog(`Equipped Attendance Shield! 🛡️`, 'shield');
      }
    });

    // 8. Check Proxy Attendance Pickups
    this.proxies.forEach(proxy => {
      if (!proxy.collected && this.checkEntityCollision(this.player, proxy)) {
        proxy.collected = true;
        this.player.activateProxy(3.0);
        this.score += 250;
        if (window.particleSystem) {
          window.particleSystem.addBurst(proxy.x + 12, proxy.y + 12, '#c084fc', 16);
        }
        this.addStoryLog(`Activated Proxy Attendance! 👻 (5s)`, 'proxy');
      }
    });

    // Check Energy Drink Pickups (Speed x1.6 for 6s)
    this.energyDrinks.forEach(ed => {
      if (!ed.collected && this.checkEntityCollision(this.player, ed)) {
        ed.collected = true;
        this.player.activateEnergyDrink(6.0);
        this.score += 200;
        if (window.particleSystem) {
          window.particleSystem.addBurst(ed.x + 12, ed.y + 12, '#f59e0b', 16);
        }
        this.addStoryLog(`Chugged Energy Drink! ⚡ (Speed x1.6 for 6s)`, 'item');
      }
    });

    // Check Cheat Notes Pickups (Reveals all keys for 5s)
    this.notes.forEach(note => {
      if (!note.collected && this.checkEntityCollision(this.player, note)) {
        note.collected = true;
        this.player.activateNotes(5.0);
        this.score += 250;
        if (window.particleSystem) {
          window.particleSystem.addBurst(note.x + 12, note.y + 12, '#10b981', 16);
        }
        this.addStoryLog(`Studied Cheat Notes! 📝 (Keys Revealed 5s)`, 'item');
      }
    });

    // Check Bunk Pass Pickups (Freezes all enemies for 3s)
    this.bunkPasses.forEach(bp => {
      if (!bp.collected && this.checkEntityCollision(this.player, bp)) {
        bp.collected = true;
        this.player.activateBunkPass(3.0);
        this.score += 300;
        if (window.particleSystem) {
          window.particleSystem.addBurst(bp.x + 12, bp.y + 12, '#38bdf8', 18);
        }
        this.addStoryLog(`Used Bunk Pass! ❄️ (Enemies Frozen 3s)`, 'shield');
      }
    });

    // Phase 4: Boss Update & Collisions
    if (this.boss && !this.boss.defeated) {
      this.boss.update(dt, this.map, this.player, this.bossProjectiles);

      // Boss body collision
      if (this.checkEntityCollision(this.player, this.boss)) {
        this.player.takeDamage(this.boss.damage * dt);
        this.screenShake = 0.25;
      }
    }

    // Boss Projectiles Update
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Projectile collision with player
      const pBox = { x: p.x, y: p.y, width: p.width || 12, height: p.height || 12 };
      if (this.checkEntityCollision(this.player, pBox)) {
        this.player.takeDamage(14);
        this.screenShake = 0.25;
        if (window.particleSystem) {
          window.particleSystem.addBurst(p.x, p.y, '#ef4444', 10);
        }
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      // Out of bounds check
      if (p.x < -30 || p.x > MAP_COLS * TILE_SIZE + 30 || p.y < -30 || p.y > MAP_ROWS * TILE_SIZE + 30) {
        this.bossProjectiles.splice(i, 1);
      }
    }

    // Answer Key Pickups (Damages the Boss)
    this.answerKeys.forEach(ak => {
      if (!ak.collected && this.checkEntityCollision(this.player, ak)) {
        ak.collected = true;
        this.score += 500;
        this.player.addFloatingText(`Answer Key #${ak.index}! 📑`, '#facc15');
        if (window.particleSystem) {
          window.particleSystem.addBurst(ak.x + 10, ak.y + 10, '#facc15', 20);
        }
        if (window.soundManager) window.soundManager.playKey();

        if (this.boss) {
          this.boss.takeHit();
          this.screenShake = 0.45;
          if (this.boss.defeated) {
            this.bossDefeated = true;
            this.score += 1500;
            this.map.unlockExit();
            this.statusBanner.classList.add('alert-open');
            this.addStoryLog("⚡ FINAL EXAM SLAIN! EXIT GATE UNLOCKED! Run to the gate!", "gate");
            if (window.soundManager) {
              window.soundManager.playGateUnlocked();
              if (window.soundManager.stopBossTheme) window.soundManager.stopBossTheme();
            }
            this.showEventBanner("⚡", "FINAL EXAM SLAIN! THE EXIT IS OPEN!");
            if (window.particleSystem) {
              window.particleSystem.addBurst(this.boss.x + 23, this.boss.y + 26, '#10b981', 35);
            }
            this.unlockAchievement('boss_slayer', 'Boss Slayer', 'Defeated The Final Exam Dean!');
          } else {
            this.spawnNextAnswerKey(ak.index + 1);
          }
        }
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

    // Dynamic Mission Line
    const remainingKeys = 3 - this.keysCollected;
    if (remainingKeys > 0) {
      this.statusMessage.textContent = `Mission: Find ${remainingKeys} more ${remainingKeys === 1 ? 'key' : 'keys'} to unlock the Exit Gate!`;
    } else if (this.boss && !this.boss.defeated) {
      this.statusMessage.textContent = `⚠️ THE FINAL EXAM: Dean has ${this.boss.health} HP! Find Answer Key to strike!`;
    } else {
      this.statusMessage.textContent = `⚡ FINAL EXAM SLAIN! The Exit Gate is open! Run to freedom! 🚪⚡`;
    }

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

    if (this.powerupSpeedPill) {
      if (this.player.speedBoostTimer > 0) {
        this.powerupSpeedPill.classList.remove('hidden');
        this.powerupSpeedPill.textContent = `⚡ SPEED: ${this.player.speedBoostTimer.toFixed(1)}s`;
      } else {
        this.powerupSpeedPill.classList.add('hidden');
      }
    }

    if (this.powerupNotesPill) {
      if (this.player.notesTimer > 0) {
        this.powerupNotesPill.classList.remove('hidden');
        this.powerupNotesPill.textContent = `📝 NOTES: ${this.player.notesTimer.toFixed(1)}s`;
      } else {
        this.powerupNotesPill.classList.add('hidden');
      }
    }

    if (this.powerupBunkPill) {
      if (this.player.freezeTimer > 0) {
        this.powerupBunkPill.classList.remove('hidden');
        this.powerupBunkPill.textContent = `❄️ BUNK: ${this.player.freezeTimer.toFixed(1)}s`;
      } else {
        this.powerupBunkPill.classList.add('hidden');
      }
    }

    // Timer display & urgent shake in last 15 seconds
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.timeRemaining <= 15) {
      this.timerDisplay.classList.add('danger');
      this.timerDisplay.classList.add('urgent-shake');
    } else if (this.timeRemaining <= 20) {
      this.timerDisplay.classList.add('danger');
      this.timerDisplay.classList.remove('urgent-shake');
    } else {
      this.timerDisplay.classList.remove('danger');
      this.timerDisplay.classList.remove('urgent-shake');
    }

    // Score display
    this.scoreDisplay.textContent = this.score;
  }

  render(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let shaking = false;
    if (this.screenShake > 0) {
      shaking = true;
      const mag = Math.min(8, this.screenShake * 20);
      const sx = (Math.random() - 0.5) * mag;
      const sy = (Math.random() - 0.5) * mag;
      this.ctx.save();
      this.ctx.translate(sx, sy);
    }

    // 1. Draw Map & Floors
    this.map.draw(this.ctx, time, this.player);

    // 2. Draw Collectibles & Powerups
    this.keys.forEach(k => k.draw(this.ctx, time));
    this.coffees.forEach(c => c.draw(this.ctx, time));
    this.shields.forEach(s => s.draw(this.ctx, time));
    this.proxies.forEach(p => p.draw(this.ctx, time));
    this.energyDrinks.forEach(ed => ed.draw(this.ctx, time));
    this.notes.forEach(n => n.draw(this.ctx, time));
    this.bunkPasses.forEach(b => b.draw(this.ctx, time));

    // Cheat Notes Key Reveal effect (pulsing beacon rings & vertical rays)
    if (this.player.notesTimer > 0) {
      this.keys.forEach(k => {
        if (!k.collected) {
          this.ctx.save();
          const pulse = Math.sin(time * 0.01) * 5;
          this.ctx.strokeStyle = '#10b981';
          this.ctx.lineWidth = 2.5;
          this.ctx.shadowColor = '#10b981';
          this.ctx.shadowBlur = 16;
          this.ctx.beginPath();
          this.ctx.arc(k.x + 10, k.y + 10, 18 + pulse, 0, Math.PI * 2);
          this.ctx.stroke();

          // Vertical sky beacon beam
          this.ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          this.ctx.fillRect(k.x + 9, 0, 2, k.y + 10);
          this.ctx.restore();
        }
      });
    }

    // Draw Boss Collectibles & Entities
    this.answerKeys.forEach(ak => ak.draw(this.ctx, time));
    if (this.boss) this.boss.draw(this.ctx, time);

    // Draw Boss Projectiles
    this.bossProjectiles.forEach(p => {
      this.ctx.save();
      if (p.type === 'paper') {
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeRect(p.x, p.y, p.width, p.height);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = "bold 8px 'Press Start 2P', monospace";
        this.ctx.fillText("F", p.x + 3, p.y + 12);
      } else {
        this.ctx.font = "bold 13px 'Press Start 2P', monospace";
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText("F", p.x, p.y);
      }
      this.ctx.restore();
    });

    // 3. Draw Enemies
    this.enemies.forEach(e => e.draw(this.ctx, time));

    // 4. Draw Player & Trail & Floating Texts
    this.player.draw(this.ctx, time);

    // 5. Draw Particle Bursts
    if (window.particleSystem) {
      window.particleSystem.draw(this.ctx);
    }

    // 6. Draw Beacon Guide Arrow
    if (this.state === STATE_PLAYING) {
      this.drawGuideArrow(this.ctx, time);
    }

    if (shaking) {
      this.ctx.restore();
    }

    // 7. Draw Radar Minimap (corner overlay, on top of shake)
    if (this.state === STATE_PLAYING) {
      this.drawMinimap(this.ctx, time);
    }
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.escapeGame = new EscapeGame();
});
