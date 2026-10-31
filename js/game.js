/**
 * game.js - Escape the College Main Game Controller
 * Manages game loop, state machines, input handling, HUD updates, and win/loss logic.
 */

// Game States
const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_PAUSED = 'PAUSED';
const STATE_GAMEOVER = 'GAMEOVER';
const STATE_VICTORY = 'VICTORY';

class EscapeGame {
  constructor() {
    this.state = STATE_START;

    // DOM Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // HUD Elements
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.healthText = document.getElementById('health-text');
    this.keysCountText = document.getElementById('keys-count-text');
    this.timerDisplay = document.getElementById('timer-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.statusBanner = document.getElementById('hud-status-banner');
    this.statusMessage = document.getElementById('status-message');
    this.keyIcons = [
      document.getElementById('key-icon-1'),
      document.getElementById('key-icon-2'),
      document.getElementById('key-icon-3')
    ];

    // Overlays
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.victoryOverlay = document.getElementById('victory-overlay');
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

    // Game Core Objects
    this.map = new CollegeMap();
    this.player = new Player(3 * TILE_SIZE, 13 * TILE_SIZE); // Spawn in Study Hall

    // Collectible Keys (3 total)
    this.keys = [
      new KeyItem(1, "Library Key", 2, 2),        // Library
      new KeyItem(2, "Computer Lab Key", 14, 2),   // Computer Lab
      new KeyItem(3, "Faculty Lounge Key", 22, 4)  // Faculty Lounge
    ];

    // Coffee Pickups (3 total)
    this.coffees = [
      new CoffeeItem(6, 2),   // Library
      new CoffeeItem(18, 2),  // Faculty Lounge
      new CoffeeItem(8, 15)   // Cafeteria / Study Hall
    ];

    // Enemies (Professors and Flying Assignments)
    this.enemies = [
      // Professor 1: Patrols Main Corridor horizontally
      new Enemy('professor', 3 * TILE_SIZE, 8.5 * TILE_SIZE, {
        speed: 80,
        axis: 'x',
        minPos: 2 * TILE_SIZE,
        maxPos: 21 * TILE_SIZE,
        name: "Prof. Hardgrade"
      }),
      // Professor 2: Patrols East Corridor vertically
      new Enemy('professor', 17 * TILE_SIZE, 3 * TILE_SIZE, {
        speed: 70,
        axis: 'y',
        minPos: 2 * TILE_SIZE,
        maxPos: 14 * TILE_SIZE,
        name: "Dr. Proctor"
      }),
      // Flying Assignment 1: Bounces across Central Hallway
      new Enemy('assignment', 8 * TILE_SIZE, 8.5 * TILE_SIZE, {
        speed: 95,
        vx: 1,
        vy: 0.6,
        minX: 2 * TILE_SIZE,
        maxX: 22 * TILE_SIZE,
        minY: 7.5 * TILE_SIZE,
        maxY: 10 * TILE_SIZE
      }),
      // Flying Assignment 2: Bounces in Lecture Hall
      new Enemy('assignment', 15 * TILE_SIZE, 13 * TILE_SIZE, {
        speed: 105,
        vx: 0.8,
        vy: -0.8,
        minX: 12 * TILE_SIZE,
        maxX: 23 * TILE_SIZE,
        minY: 11 * TILE_SIZE,
        maxY: 16 * TILE_SIZE
      }),
      // Flying Assignment 3: Bounces in Study Hall
      new Enemy('assignment', 4 * TILE_SIZE, 12 * TILE_SIZE, {
        speed: 85,
        vx: -0.7,
        vy: 0.9,
        minX: 2 * TILE_SIZE,
        maxX: 8 * TILE_SIZE,
        minY: 11 * TILE_SIZE,
        maxY: 16 * TILE_SIZE
      })
    ];

    // Gameplay Metrics
    this.totalTime = 90; // 90 seconds countdown
    this.timeRemaining = this.totalTime;
    this.score = 0;
    this.scoreTimer = 0;
    this.keysCollected = 0;

    // Loop timing
    this.lastTime = 0;
    this.animationId = null;

    // Initialize Event Listeners
    this.bindEvents();
  }

  // Bind Buttons & Keyboard
  bindEvents() {
    // Start Escape Button
    const startBtn = document.getElementById('start-escape-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.soundManager) window.soundManager.init();
        this.startGame();
      });
    }

    // HUD Buttons
    document.getElementById('btn-pause-game').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart-game').addEventListener('click', () => this.restartGame());
    
    // Sound Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const isMuted = window.soundManager.toggleMute();
      soundBtn.textContent = isMuted ? '🔇' : '🔊';
      soundBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
    });

    // Modal Action Buttons
    document.getElementById('btn-resume-game').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-modal-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-gameover-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-gameover-home').addEventListener('click', () => this.returnToHome());
    document.getElementById('btn-victory-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-victory-home').addEventListener('click', () => this.returnToHome());

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Touch / D-Pad Buttons
    this.bindDpad();
  }

  bindDpad() {
    const bindBtn = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const setTrue = (e) => { e.preventDefault(); this.input[key] = true; };
      const setFalse = (e) => { e.preventDefault(); this.input[key] = false; };

      el.addEventListener('mousedown', setTrue);
      el.addEventListener('mouseup', setFalse);
      el.addEventListener('mouseleave', setFalse);
      el.addEventListener('touchstart', setTrue, { passive: false });
      el.addEventListener('touchend', setFalse, { passive: false });
    };

    bindBtn('dpad-up', 'up');
    bindBtn('dpad-down', 'down');
    bindBtn('dpad-left', 'left');
    bindBtn('dpad-right', 'right');
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
  // GAME STATE TRANSITIONS
  // ==========================================================================

  startGame() {
    this.startScreen.classList.remove('active');
    this.startScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    this.gameScreen.classList.add('active');

    this.resetGameValues();
    this.state = STATE_PLAYING;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  returnToHome() {
    this.state = STATE_START;
    this.hideAllModals();

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

  restartGame() {
    this.hideAllModals();
    this.resetGameValues();
    this.state = STATE_PLAYING;
    this.lastTime = performance.now();
  }

  resetGameValues() {
    this.map.reset();
    this.player.reset();
    this.keys.forEach(k => k.reset());
    this.coffees.forEach(c => c.reset());
    this.enemies.forEach(e => e.reset());

    this.keysCollected = 0;
    this.timeRemaining = this.totalTime;
    this.score = 0;
    this.scoreTimer = 0;

    // Reset inputs
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;

    // Reset HUD
    this.updateHUD();
    this.statusBanner.classList.remove('alert-open');
    this.statusMessage.textContent = "Objective: Search the rooms and collect all 3 keys to unlock the College Exit Gate!";
  }

  hideAllModals() {
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.victoryOverlay.classList.add('hidden');
  }

  triggerGameOver(reason) {
    this.state = STATE_GAMEOVER;
    if (window.soundManager) window.soundManager.playGameOver();

    this.gameOverReason.textContent = reason;
    this.gameOverScore.textContent = this.score;
    this.gameOverKeys.textContent = `${this.keysCollected} / 3`;

    this.gameOverOverlay.classList.remove('hidden');
  }

  triggerVictory() {
    this.state = STATE_VICTORY;
    if (window.soundManager) window.soundManager.playVictory();

    // Time Bonus: 25 points per remaining second + 1000 Victory Bonus
    const timeBonus = Math.floor(this.timeRemaining) * 25;
    this.score += 1000 + timeBonus;

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.victoryScore.textContent = this.score;
    this.victoryTime.textContent = timeStr;

    this.victoryOverlay.classList.remove('hidden');
  }

  // ==========================================================================
  // MAIN GAME LOOP & UPDATES
  // ==========================================================================

  loop(currentTime) {
    this.animationId = requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp delta to 100ms
    this.lastTime = currentTime;

    if (this.state === STATE_PLAYING) {
      this.update(dt, currentTime);
    }

    this.render(currentTime);
  }

  update(dt, time) {
    // 1. Update Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.updateHUD();
      this.triggerGameOver("Midnight has struck! The night patrol has locked you inside the college!");
      return;
    }

    // 2. Score increments for surviving
    this.scoreTimer += dt;
    if (this.scoreTimer >= 1.0) {
      this.score += 10;
      this.scoreTimer -= 1.0;
    }

    // 3. Update Player
    this.player.update(dt, this.input, this.map);

    // 4. Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(dt, this.map);

      // Check collision with player
      if (this.checkEntityCollision(this.player, enemy)) {
        const tookDamage = this.player.takeDamage(enemy.damage);
        if (tookDamage) {
          if (this.player.health <= 0) {
            this.updateHUD();
            this.triggerGameOver("Academic Burnout! You were overwhelmed by obstacles and collapsed from exhaustion!");
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

        // Check if all keys collected
        if (this.keysCollected >= 3) {
          this.map.unlockExit();
          this.statusBanner.classList.add('alert-open');
          this.statusMessage.textContent = "⚡ ALL 3 KEYS COLLECTED! The Main College Exit Gate is UNLOCKED! Run to freedom!";
          if (window.soundManager) window.soundManager.playGateUnlocked();
        } else {
          this.statusMessage.textContent = `Keys Found: ${this.keysCollected} / 3. Find the remaining keys!`;
        }
      }
    });

    // 6. Check Coffee Collection
    this.coffees.forEach(coffee => {
      if (!coffee.collected && this.checkEntityCollision(this.player, coffee)) {
        coffee.collected = true;
        this.player.heal(25);
        this.score += 150;
      }
    });

    // 7. Check Exit Gate Victory
    if (this.map.exitUnlocked && this.map.isAtExit(this.player.x, this.player.y, this.player.width, this.player.height)) {
      this.triggerVictory();
      return;
    }

    // 8. Update HUD Metrics
    this.updateHUD();
  }

  // AABB Bounding Box Collision
  checkEntityCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Update HUD DOM Elements
  updateHUD() {
    // Health bar fill & colors
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

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  render(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw College Map Floor & Walls
    this.map.draw(this.ctx, time);

    // 2. Draw Collectibles
    this.keys.forEach(k => k.draw(this.ctx, time));
    this.coffees.forEach(c => c.draw(this.ctx, time));

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
