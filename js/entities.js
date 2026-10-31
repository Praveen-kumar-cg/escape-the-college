/**
 * entities.js - Game Entities: Player, Enemies, Keys, Power-Ups, and Particles
 * Upgraded with:
 * - Ghost motion trail & walk animations
 * - Particle burst system for item pickups
 * - Pulsing neon glow auras on all collectibles
 * - Attendance Shield & Proxy Attendance mechanics
 */

// ============================================================================
// 1. PARTICLE BURST SYSTEM
// ============================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles = [];
  }

  addBurst(x, y, color, count = 10, speed = 65) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: color,
        size: 2.5 + Math.random() * 2,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

// Global Particle Instance
window.particleSystem = new ParticleSystem();

// ============================================================================
// 2. PLAYER CLASS
// ============================================================================
class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.reset();
  }

  reset(x = this.startX, y = this.startY) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 22;
    this.speed = 150; // pixels per second
    this.direction = 'down'; // 'up', 'down', 'left', 'right'
    this.skin = 'hoodie'; // 'hoodie', 'topper', 'ninja'
    this.isMoving = false;
    this.walkCycle = 0;

    this.health = 100;
    this.maxHealth = 100;
    this.invulnTimer = 0; // seconds of invulnerability after damage
    this.floatingTexts = []; // floating score/damage notifications

    // Power-ups
    this.hasShield = false;   // Attendance Shield: absorbs 1 hit
    this.proxyTimer = 0;      // Proxy Attendance: invisibility duration in seconds (5s)
    this.speedBoostTimer = 0; // Energy Drink: speed boost (6s)
    this.notesTimer = 0;      // Notes: reveals all keys on map (5s)
    this.freezeTimer = 0;     // Bunk Pass: freezes all enemies (3s)

    // Visual Dash Trail
    this.trail = [];
    this.trailTimer = 0;
  }

  // Update position with smooth separate-axis collision detection
  update(dt, input, map) {
    let dx = 0;
    let dy = 0;

    if (input.up) { dy -= 1; this.direction = 'up'; }
    if (input.down) { dy += 1; this.direction = 'down'; }
    if (input.left) { dx -= 1; this.direction = 'left'; }
    if (input.right) { dx += 1; this.direction = 'right'; }

    // Normalize diagonal movement speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      this.walkCycle += dt * 10;

      let currentSpeed = this.speed;
      if (this.speedBoostTimer > 0) {
        currentSpeed *= 1.6; // Speed boost from Energy Drink
      }

      const moveX = dx * currentSpeed * dt;
      const moveY = dy * currentSpeed * dt;

      // Move X first and check collision (allows sliding along walls)
      this.x += moveX;
      if (map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.x -= moveX;
      }

      // Move Y next and check collision
      this.y += moveY;
      if (map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.y -= moveY;
      }

      // Add faint ghost dash trail
      this.trailTimer += dt;
      if (this.trailTimer >= 0.05) {
        this.trailTimer = 0;
        this.trail.push({
          x: this.x,
          y: this.y,
          life: 0.22,
          maxLife: 0.22
        });
        if (this.trail.length > 5) this.trail.shift();
      }
    } else {
      this.walkCycle = 0;
    }

    // Tick motion trail
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Tick invulnerability timer
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer < 0) this.invulnTimer = 0;
    }

    // Tick Proxy Attendance Invisibility (5s)
    if (this.proxyTimer > 0) {
      const prevTimer = this.proxyTimer;
      this.proxyTimer -= dt;
      if (this.proxyTimer <= 0) {
        this.proxyTimer = 0;
        if (prevTimer > 0 && window.soundManager) {
          window.soundManager.playProxyEnd();
        }
      }
    }

    // Tick Speed Boost (6s)
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer < 0) this.speedBoostTimer = 0;
    }

    // Tick Notes Key Reveal (5s)
    if (this.notesTimer > 0) {
      this.notesTimer -= dt;
      if (this.notesTimer < 0) this.notesTimer = 0;
    }

    // Tick Bunk Pass Enemy Freeze (3s)
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer < 0) this.freezeTimer = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 28 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return false;
    // Proxy attendance active: completely invisible to damage!
    if (this.proxyTimer > 0) return false;

    // Attendance Shield active: absorb the hit completely!
    if (this.hasShield) {
      this.hasShield = false;
      this.invulnTimer = 1.0;
      this.addFloatingText('SHIELD DEFLECTED! 🛡️', '#38bdf8');
      if (window.soundManager) window.soundManager.playShieldBreak();
      if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#38bdf8', 12);
      return false; // No damage taken
    }

    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.invulnTimer = 1.2; // 1.2s invulnerability

    this.addFloatingText(`-${amount} HP`, '#ef4444');
    if (window.soundManager) window.soundManager.playHit();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#ef4444', 8);

    // Trigger visual screen shake & red flash in game
    if (window.escapeGame) {
      window.escapeGame.triggerDamageEffects();
    }
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.addFloatingText(`+${amount} HP`, '#10b981');
    if (window.soundManager) window.soundManager.playCoffee();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#10b981', 8);
  }

  activateShield() {
    this.hasShield = true;
    this.addFloatingText('+ATTENDANCE SHIELD! 🛡️', '#38bdf8');
    if (window.soundManager) window.soundManager.playShield();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#38bdf8', 14);
  }

  activateProxy(duration = 5.0) {
    this.proxyTimer = duration;
    this.addFloatingText('+PROXY: INVISIBLE 5s! 👻', '#c084fc');
    if (window.soundManager) window.soundManager.playProxy();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#c084fc', 14);
  }

  activateEnergyDrink(duration = 6.0) {
    this.speedBoostTimer = duration;
    this.addFloatingText('+ENERGY DRINK! (SPEED x1.6) ⚡', '#f59e0b');
    if (window.soundManager) window.soundManager.playCoffee();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#f59e0b', 16);
  }

  activateNotes(duration = 5.0) {
    this.notesTimer = duration;
    this.addFloatingText('+CHEAT NOTES! (KEYS REVEALED) 📝', '#10b981');
    if (window.soundManager) window.soundManager.playKey();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#10b981', 16);
  }

  activateBunkPass(duration = 3.0) {
    this.freezeTimer = duration;
    this.addFloatingText('+BUNK PASS! (ENEMIES FROZEN) ❄️', '#38bdf8');
    if (window.soundManager) window.soundManager.playShield();
    if (window.particleSystem) window.particleSystem.addBurst(this.x + 10, this.y + 11, '#38bdf8', 18);
  }

  addFloatingText(text, color) {
    this.floatingTexts.push({
      text: text,
      color: color,
      x: this.x + this.width / 2,
      y: this.y - 8,
      life: 0.95
    });
  }

  // Draw student sprite with walk bounce, backpack, dash trail, shield, and proxy aura
  draw(ctx, time) {
    // 1. Draw Faint Ghost Motion Trail
    this.trail.forEach(t => {
      const alpha = (t.life / t.maxLife) * 0.28;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.fillRect(Math.round(t.x + 3), Math.round(t.y + 6), 14, 14);
      ctx.restore();
    });

    // If invulnerable, blink
    if (this.invulnTimer > 0 && Math.floor(time / 80) % 2 === 0) {
      return;
    }

    const bounce = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
    const px = Math.round(this.x);
    const py = Math.round(this.y + bounce);

    ctx.save();

    // Proxy Invisibility Effect: Ghostly purple aura and translucency
    if (this.proxyTimer > 0) {
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
    }

    // Drop shadow under player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px + this.width / 2, py + this.height + 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render by Student Skin
    if (this.skin === 'topper') {
      // Golden scholar robe
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 3, py + 8, 14, 10);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 8, py + 8, 4, 10);

      // Head
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(px + 5, py + 2, 10, 7);

      // Mortarboard Hat (Diamond cap + tassel)
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(px + 10, py - 4);
      ctx.lineTo(px + 18, py);
      ctx.lineTo(px + 10, py + 4);
      ctx.lineTo(px + 2, py);
      ctx.closePath();
      ctx.fill();

      // Gold Tassel
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 10, py);
      ctx.lineTo(px + 3, py + 6);
      ctx.stroke();

      // Glasses
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 6, py + 4, 3, 2);
      ctx.strokeRect(px + 11, py + 4, 3, 2);
    } else if (this.skin === 'ninja') {
      // Midnight ninja suit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 3, py + 8, 14, 10);

      // Red trailing scarf
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + 2, py + 8, 16, 2);
      if (this.isMoving) {
        const scarfWave = Math.sin(time * 0.02) * 3;
        ctx.fillRect(px - 3, py + 8 + scarfWave, 5, 2);
      }

      // Head & Mask
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 5, py + 1, 10, 8);

      // White glowing ninja slit eyes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      if (this.direction === 'left') {
        ctx.fillRect(px + 5, py + 4, 3, 1.5);
      } else if (this.direction === 'right') {
        ctx.fillRect(px + 12, py + 4, 3, 1.5);
      } else {
        ctx.fillRect(px + 6, py + 4, 2.5, 1.5);
        ctx.fillRect(px + 11, py + 4, 2.5, 1.5);
      }
      ctx.shadowBlur = 0;
    } else {
      // Classic Hoodie
      // Backpack (shows behind student if moving down/left/right)
      if (this.direction !== 'up') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px + 4, py + 7, 12, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 6, py + 9, 8, 4);
      }

      // Body (Cyan/Teal student hoodie)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px + 3, py + 8, 14, 10);

      // Head
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(px + 5, py + 1, 10, 8);

      // Hair / Cap
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 4, py - 1, 12, 4);

      // Eyes depending on direction
      ctx.fillStyle = '#0f172a';
      if (this.direction === 'down') {
        ctx.fillRect(px + 7, py + 4, 2, 2);
        ctx.fillRect(px + 11, py + 4, 2, 2);
      } else if (this.direction === 'left') {
        ctx.fillRect(px + 5, py + 4, 2, 2);
      } else if (this.direction === 'right') {
        ctx.fillRect(px + 13, py + 4, 2, 2);
      }
    }

    // Legs with walk animation
    ctx.fillStyle = '#334155';
    const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 3 : 0;
    ctx.fillRect(px + 4, py + 18, 4, 4 + legOffset);
    ctx.fillRect(px + 12, py + 18, 4, 4 - legOffset);

    // Shoes
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px + 3, py + 21 + legOffset, 5, 2);
    ctx.fillRect(px + 12, py + 21 - legOffset, 5, 2);

    ctx.restore();

    // Attendance Shield Bubble Aura
    if (this.hasShield) {
      ctx.save();
      const pulse = Math.sin(time * 0.008) * 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px + this.width / 2, py + this.height / 2, 16 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting Shield emoji
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const orbitAngle = time * 0.004;
      const ox = px + this.width / 2 + Math.cos(orbitAngle) * 19;
      const oy = py + this.height / 2 + Math.sin(orbitAngle) * 19;
      ctx.fillText('🛡️', ox, oy);
      ctx.restore();
    }

    // Draw floating notifications with slight float pop
    this.floatingTexts.forEach(ft => {
      ctx.font = "bold 10px 'Press Start 2P', monospace";
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 5;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    });
  }
}

// ============================================================================
// 3. KEY COLLECTIBLE CLASS (With Pulsing Golden Glow)
// ============================================================================
class KeyItem {
  constructor(id, name, tileCol, tileRow) {
    this.id = id;
    this.name = name;
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.005 + this.id) * 3;
    const kx = this.x;
    const ky = this.y + bob;

    ctx.save();
    // Pulsing Neon Golden Aura
    const pulseGlow = 10 + Math.sin(time * 0.008) * 5;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = pulseGlow;

    // Glowing energy ring around key
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(kx + 10, ky + 10, 11 + Math.sin(time * 0.006) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Ring handle
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(kx + 7, ky + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(kx + 7, ky + 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Shaft & teeth
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(kx + 10, ky + 9, 8, 2.5);
    ctx.fillRect(kx + 15, ky + 11.5, 2, 3);
    ctx.fillRect(kx + 17, ky + 11.5, 2, 2);

    ctx.restore();
  }
}

// ============================================================================
// 4. POWER-UP CLASSES: ATTENDANCE SHIELD & PROXY ATTENDANCE
// ============================================================================
class AttendanceShieldItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.006 + this.col) * 3;
    const sx = this.x;
    const sy = this.y + bob;

    ctx.save();
    // Pulsing Cyan Shield Aura
    const pulseGlow = 12 + Math.sin(time * 0.007) * 5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = pulseGlow;

    // Glowing energy badge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shield emoji
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️', sx + 10, sy + 15);

    ctx.restore();
  }
}

class ProxyAttendanceItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.007 + this.row) * 3;
    const px = this.x;
    const py = this.y + bob;

    ctx.save();
    // Pulsing Ghost Purple Aura
    const pulseGlow = 12 + Math.sin(time * 0.008) * 5;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = pulseGlow;

    ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.beginPath();
    ctx.arc(px + 10, py + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ghost emoji
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👻', px + 10, py + 15);

    ctx.restore();
  }
}

class EnergyDrinkItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.007 + this.col) * 3;
    const ex = this.x;
    const ey = this.y + bob;

    ctx.save();
    // Pulsing Amber Energy Aura
    const pulseGlow = 12 + Math.sin(time * 0.008) * 5;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = pulseGlow;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.arc(ex + 10, ey + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Energy bolt emoji / can
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', ex + 10, ey + 15);

    ctx.restore();
  }
}

class NotesItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.006 + this.row) * 3;
    const nx = this.x;
    const ny = this.y + bob;

    ctx.save();
    // Pulsing Emerald Notes Aura
    const pulseGlow = 12 + Math.sin(time * 0.008) * 5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = pulseGlow;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.arc(nx + 10, ny + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Notes scroll emoji
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📝', nx + 10, ny + 15);

    ctx.restore();
  }
}

class BunkPassItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.008 + this.col) * 3;
    const bx = this.x;
    const by = this.y + bob;

    ctx.save();
    // Pulsing Ice-Blue Freeze Aura
    const pulseGlow = 12 + Math.sin(time * 0.009) * 5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = pulseGlow;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(bx + 10, by + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Snowflake emoji
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❄️', bx + 10, by + 15);

    ctx.restore();
  }
}

// ============================================================================
// 5. COFFEE PICKUP CLASS (With Warm Steam & Pulsing Glow)
// ============================================================================
class CoffeeItem {
  constructor(tileCol, tileRow) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 8;
    this.y = tileRow * TILE_SIZE + 8;
    this.width = 16;
    this.height = 16;
    this.collected = false;
  }

  reset() {
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.004 + this.col) * 2;
    const cx = this.x;
    const cy = this.y + bob;

    ctx.save();
    // Warm coffee glow
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8 + Math.sin(time * 0.006) * 4;

    // Steam particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const steamY = (time * 0.02) % 6;
    ctx.fillRect(cx + 4, cy - 3 - steamY, 2, 2);
    ctx.fillRect(cx + 8, cy - 5 - steamY, 2, 2);

    // Blue mug
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx + 2, cy + 3, 11, 10);
    // Mug handle
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 12, cy + 5, 3, 5);

    // Coffee surface
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx + 3, cy + 3, 9, 2);

    ctx.restore();
  }
}

// ============================================================================
// 6. ENEMY VARIETY & PERSONALITY
// Types: Professor (vision cone), Warden (lantern radius chaser),
// Ghost Senior (phases walls & flickers), Assignment Drone (explodes & respawns)
// ============================================================================
class Enemy {
  constructor(type, x, y, options = {}) {
    this.type = type; // 'professor', 'warden', 'ghost_senior', 'drone', 'assignment'
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.options = options;

    this.speechBubble = null;
    this.speechCooldown = Math.random() * 2;
    this.respawnTimer = 0;
    this.sweepTime = Math.random() * 10;
    this.visionAngle = 0;

    if (type === 'professor') {
      this.width = 24;
      this.height = 26;
      this.speed = options.speed || 80;
      this.damage = options.damage || 20;
      this.axis = options.axis || 'x';
      this.minPos = options.minPos || x - 100;
      this.maxPos = options.maxPos || x + 100;
      this.dir = 1;
      this.name = options.name || "Professor";
      this.isDean = !!options.isDean;
      this.speechList = [
        "Attendance 74%!",
        "Where's your ID?",
        "Beta, assignment kahan hai?",
        "Detained!",
        "Surprise viva today!",
        "Backlog guaranteed!"
      ];
    } else if (type === 'warden') {
      this.width = 24;
      this.height = 26;
      this.speed = options.speed || 130;
      this.damage = options.damage || 22;
      this.name = options.name || "Hostel Warden";
      this.lightRadius = 75;
      this.patrolDirX = Math.random() < 0.5 ? 1 : -1;
      this.patrolDirY = Math.random() < 0.5 ? 1 : -1;
      this.patrolTimer = 0;
      this.speechList = [
        "Hostel curfew 10 PM!",
        "Lights OUT!",
        "Where's your hall pass?!",
        "Caught red-handed!",
        "Call your parents!"
      ];
    } else if (type === 'ghost_senior') {
      this.width = 22;
      this.height = 26;
      this.speed = options.speed || 48;
      this.damage = options.damage || 16;
      this.name = options.name || "Ghost Senior";
      this.flickerAlpha = 0.6;
      this.speechList = [
        "Backlog clear hua?",
        "I've been here 7 years...",
        "Drop year mat lena...",
        "Placement season...",
        "Pass marks kitne the?"
      ];
    } else if (type === 'drone') {
      this.width = 22;
      this.height = 20;
      this.speed = options.speed || 85;
      this.damage = options.damage || 22;
      this.name = options.name || "Assignment Drone";
      this.speechList = [
        "SUBMIT BY TONIGHT!",
        "DEADLINE 11:59 PM!",
        "0 MARKS FOR LATE!",
        "PLAGIARISM DETECTED!"
      ];
    } else {
      // Classic flying assignment
      this.width = 18;
      this.height = 20;
      this.speed = options.speed || 95;
      this.damage = options.damage || 15;
      this.vx = options.vx || 1;
      this.vy = options.vy || 1;
      this.minX = options.minX || 32;
      this.maxX = options.maxX || 768;
      this.minY = options.minY || 32;
      this.maxY = options.maxY || 544;
      this.name = "Assignment";
      this.speechList = ["Grade: F!", "Pending Review!"];
    }
    this.baseSpeed = this.speed;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.dir = 1;
    this.respawnTimer = 0;
    this.speechBubble = null;
    this.speechCooldown = 2;
  }

  triggerSpeech(text) {
    if (this.speechCooldown > 0) return;
    const phrase = text || this.speechList[Math.floor(Math.random() * this.speechList.length)];
    this.speechBubble = { text: phrase, timer: 2.2 };
    this.speechCooldown = 5.0;
  }

  explode() {
    this.respawnTimer = 10.0;
    if (window.particleSystem) {
      window.particleSystem.addBurst(this.x + 10, this.y + 10, '#ef4444', 20, 90);
      window.particleSystem.addBurst(this.x + 10, this.y + 10, '#f97316', 15, 75);
    }
    if (window.soundManager) {
      window.soundManager.playHit();
    }
  }

  update(dt, map, player) {
    // Tick Speech Bubble & Cooldowns
    if (this.speechBubble) {
      this.speechBubble.timer -= dt;
      if (this.speechBubble.timer <= 0) {
        this.speechBubble = null;
      }
    }
    if (this.speechCooldown > 0) {
      this.speechCooldown -= dt;
    }

    // Drone respawn timer
    if (this.type === 'drone' && this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawnTimer = 0;
        this.x = this.startX;
        this.y = this.startY;
        if (window.particleSystem) {
          window.particleSystem.addBurst(this.x + 10, this.y + 10, '#06b6d4', 14, 60);
        }
      }
      return; // Inactive while recharging
    }

    // If player has Bunk Pass active, all enemies are frozen!
    if (player && player.freezeTimer > 0) {
      return;
    }

    // Surprise Test Random Event: Speed up by 40% for 10s
    let spd = this.baseSpeed;
    if (window.escapeGame && window.escapeGame.activeEvent && window.escapeGame.activeEvent.type === 'surprise_test') {
      spd *= 1.4;
    }
    this.speed = spd;

    // 1. PROFESSOR PATROL & SWEEPING VISION CONE
    if (this.type === 'professor') {
      this.sweepTime += dt;
      let baseAngle = 0;
      if (this.axis === 'x') {
        this.x += this.dir * this.speed * dt;
        if (this.x >= this.maxPos) {
          this.x = this.maxPos;
          this.dir = -1;
        } else if (this.x <= this.minPos) {
          this.x = this.minPos;
          this.dir = 1;
        }
        baseAngle = this.dir > 0 ? 0 : Math.PI;
      } else {
        this.y += this.dir * this.speed * dt;
        if (this.y >= this.maxPos) {
          this.y = this.maxPos;
          this.dir = -1;
        } else if (this.y <= this.minPos) {
          this.y = this.minPos;
          this.dir = 1;
        }
        baseAngle = this.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      // Sweeping vision cone angle (oscillates ±30 degrees)
      const sweepOffset = Math.sin(this.sweepTime * 2.8) * 0.52;
      this.visionAngle = baseAngle + sweepOffset;

      // Vision cone player detection
      if (player && player.proxyTimer <= 0) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const ex = this.x + this.width / 2;
        const ey = this.y + this.height / 2;
        const dist = Math.hypot(px - ex, py - ey);

        if (dist < 95) {
          const angleToPlayer = Math.atan2(py - ey, px - ex);
          let angleDiff = Math.abs(angleToPlayer - this.visionAngle);
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

          if (angleDiff < 0.48) {
            this.triggerSpeech();
          }
        }
      }

    // 2. WARDEN: FAST CHASER INSIDE LANTERN LIGHT RADIUS
    } else if (this.type === 'warden') {
      let isChasingPlayer = false;
      if (player && player.proxyTimer <= 0) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const ex = this.x + this.width / 2;
        const ey = this.y + this.height / 2;
        const dist = Math.hypot(px - ex, py - ey);

        if (dist <= this.lightRadius) {
          isChasingPlayer = true;
          this.triggerSpeech();

          // Charge towards player
          const angle = Math.atan2(py - ey, px - ex);
          const moveX = Math.cos(angle) * this.speed * dt;
          const moveY = Math.sin(angle) * this.speed * dt;

          this.x += moveX;
          if (map.checkCollision(this.x, this.y, this.width, this.height)) {
            this.x -= moveX;
          }
          this.y += moveY;
          if (map.checkCollision(this.x, this.y, this.width, this.height)) {
            this.y -= moveY;
          }
        }
      }

      if (!isChasingPlayer) {
        // Patrol wander
        this.patrolTimer += dt;
        if (this.patrolTimer > 1.8) {
          this.patrolTimer = 0;
          this.patrolDirX = (Math.random() - 0.5) * 2;
          this.patrolDirY = (Math.random() - 0.5) * 2;
        }
        const moveX = this.patrolDirX * (this.speed * 0.5) * dt;
        const moveY = this.patrolDirY * (this.speed * 0.5) * dt;

        this.x += moveX;
        if (map.checkCollision(this.x, this.y, this.width, this.height)) {
          this.x -= moveX;
          this.patrolDirX = -this.patrolDirX;
        }
        this.y += moveY;
        if (map.checkCollision(this.x, this.y, this.width, this.height)) {
          this.y -= moveY;
          this.patrolDirY = -this.patrolDirY;
        }
      }

    // 3. GHOST SENIOR: SLOW, PHASES THROUGH WALLS, FLICKERS
    } else if (this.type === 'ghost_senior') {
      this.sweepTime += dt;
      this.flickerAlpha = 0.2 + 0.65 * ((Math.sin(this.sweepTime * 3) + 1) / 2);

      if (player) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const ex = this.x + this.width / 2;
        const ey = this.y + this.height / 2;
        const dist = Math.hypot(px - ex, py - ey);

        if (dist < 110 && player.proxyTimer <= 0) {
          this.triggerSpeech();
        }

        // Float steadily towards player — BYPASSES WALL COLLISION!
        const angle = Math.atan2(py - ey, px - ex);
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      }

    // 4. ASSIGNMENT DRONE: HOMES IN ON PLAYER, RECHARGES AFTER HIT
    } else if (this.type === 'drone') {
      if (player) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const ex = this.x + this.width / 2;
        const ey = this.y + this.height / 2;
        const dist = Math.hypot(px - ex, py - ey);

        if (dist < 120 && player.proxyTimer <= 0) {
          this.triggerSpeech();
        }

        const angle = Math.atan2(py - ey, px - ex);
        const moveX = Math.cos(angle) * this.speed * dt;
        const moveY = Math.sin(angle) * this.speed * dt;

        this.x += moveX;
        if (map.checkCollision(this.x, this.y, this.width, this.height)) {
          this.x -= moveX;
        }
        this.y += moveY;
        if (map.checkCollision(this.x, this.y, this.width, this.height)) {
          this.y -= moveY;
        }
      }

    // 5. CLASSIC FLYING ASSIGNMENT
    } else {
      this.x += this.vx * this.speed * dt;
      this.y += this.vy * this.speed * dt;

      if (this.x <= this.minX || this.x + this.width >= this.maxX || map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.vx = -this.vx;
        this.x += this.vx * 3;
      }
      if (this.y <= this.minY || this.y + this.height >= this.maxY || map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.vy = -this.vy;
        this.y += this.vy * 3;
      }
    }
  }

  draw(ctx, time) {
    // If drone is recharging/inactive, do not draw
    if (this.type === 'drone' && this.respawnTimer > 0) return;

    const ex = Math.round(this.x);
    const ey = Math.round(this.y);

    // 1. PROFESSOR
    if (this.type === 'professor') {
      ctx.save();
      // Sweeping Flashlight / Vision cone
      const coneRadius = 90;
      const coneAngle = 0.45;
      ctx.beginPath();
      ctx.moveTo(ex + 12, ey + 13);
      ctx.arc(ex + 12, ey + 13, coneRadius, this.visionAngle - coneAngle, this.visionAngle + coneAngle);
      ctx.closePath();

      const coneGrad = ctx.createRadialGradient(ex + 12, ey + 13, 10, ex + 12, ey + 13, coneRadius);
      coneGrad.addColorStop(0, this.isDean ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)');
      coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Professor Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex + 12, ey + 26, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Suit Coat
      ctx.fillStyle = this.isDean ? '#1c1917' : '#4c0519';
      ctx.fillRect(ex + 4, ey + 8, 16, 14);

      // Shirt & Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 10, ey + 8, 4, 6);
      ctx.fillStyle = this.isDean ? '#eab308' : '#dc2626';
      ctx.fillRect(ex + 11, ey + 10, 2, 7);

      // Head & Hair
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(ex + 7, ey + 2, 10, 7);
      ctx.fillStyle = this.isDean ? '#e2e8f0' : '#94a3b8';
      ctx.fillRect(ex + 6, ey, 12, 3);

      // Glasses & Angry Brow
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 8, ey + 4, 3, 2);
      ctx.fillRect(ex + 13, ey + 4, 3, 2);

      // Clipboard / Red Pen
      ctx.fillStyle = '#d97706';
      ctx.fillRect(ex + (this.dir > 0 ? 19 : 0), ey + 12, 5, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ex + (this.dir > 0 ? 21 : 2), ey + 10, 2, 5);

      ctx.restore();

    // 2. WARDEN
    } else if (this.type === 'warden') {
      ctx.save();
      // Lantern Light Radius
      const rad = this.lightRadius;
      const grad = ctx.createRadialGradient(ex + 12, ey + 13, 10, ex + 12, ey + 13, rad);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
      grad.addColorStop(0.7, 'rgba(251, 191, 36, 0.12)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex + 12, ey + 13, rad, 0, Math.PI * 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex + 12, ey + 26, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Khaki uniform
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ex + 4, ey + 8, 16, 14);

      // Brass security badge
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ex + 6, ey + 10, 3, 4);

      // Peaked Cap
      ctx.fillStyle = '#451a03';
      ctx.fillRect(ex + 5, ey - 2, 14, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ex + 5, ey + 2, 14, 1.5);

      // Head & Mustache
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(ex + 7, ey + 3, 10, 6);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(ex + 8, ey + 7, 8, 2); // Stern mustache

      // Glowing Lantern
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fillRect(ex + 18, ey + 12, 5, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 19, ey + 14, 3, 4);
      ctx.shadowBlur = 0;

      ctx.restore();

    // 3. GHOST SENIOR
    } else if (this.type === 'ghost_senior') {
      ctx.save();
      ctx.globalAlpha = this.flickerAlpha;

      // Ethereal Blue Glow
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 12;

      // Spectral Convocation Gown Body
      const wisp = Math.sin(time * 0.008) * 3;
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(ex + 4, ey + 8);
      ctx.lineTo(ex + 18, ey + 8);
      ctx.lineTo(ex + 20 + wisp, ey + 24);
      ctx.lineTo(ex + 12, ey + 20);
      ctx.lineTo(ex + 2 - wisp, ey + 24);
      ctx.closePath();
      ctx.fill();

      // Ghost Head
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(ex + 11, ey + 5, 6, 0, Math.PI * 2);
      ctx.fill();

      // Graduation Mortarboard Cap
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(ex + 11, ey - 3);
      ctx.lineTo(ex + 19, ey);
      ctx.lineTo(ex + 11, ey + 3);
      ctx.lineTo(ex + 3, ey);
      ctx.closePath();
      ctx.fill();

      // Golden Tassel
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex + 11, ey);
      ctx.lineTo(ex + 5, ey + 4);
      ctx.stroke();

      // Glowing spectral eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(ex + 9, ey + 4, 1.5, 2);
      ctx.fillRect(ex + 13, ey + 4, 1.5, 2);

      ctx.restore();

    // 4. ASSIGNMENT DRONE
    } else if (this.type === 'drone') {
      ctx.save();
      const hover = Math.sin(time * 0.012) * 2;

      // Rotor blades blur
      ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex + 2, ey + hover, 6, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(ex + 20, ey + hover, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Drone Chassis
      ctx.fillStyle = '#334155';
      ctx.fillRect(ex + 5, ey + 3 + hover, 12, 7);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex + 2, ey + hover); ctx.lineTo(ex + 6, ey + 4 + hover);
      ctx.moveTo(ex + 20, ey + hover); ctx.lineTo(ex + 16, ey + 4 + hover);
      ctx.stroke();

      // Blinking red beacon LED
      const blink = Math.sin(time * 0.02) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = blink ? 8 : 0;
      ctx.beginPath();
      ctx.arc(ex + 11, ey + 6 + hover, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Hanging Exam Sheets with red "F"
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 0;
      ctx.fillRect(ex + 6, ey + 10 + hover, 10, 11);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('F', ex + 8.5, ey + 18 + hover);

      ctx.restore();

    // 5. CLASSIC FLYING ASSIGNMENT
    } else {
      ctx.save();
      const flap = Math.sin(time * 0.015) * 3;

      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ex + 2, ey + 2 + flap, 14, 16);

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(ex + 12, ey + 2 + flap);
      ctx.lineTo(ex + 16, ey + 6 + flap);
      ctx.lineTo(ex + 12, ey + 6 + flap);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('F', ex + 6, ey + 13 + flap);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex - 1, ey + 8 + flap, 4, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(ex + 19, ey + 8 + flap, 4, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Frozen in ice overlay if player has Bunk Pass active
    if (window.escapeGame && window.escapeGame.player && window.escapeGame.player.freezeTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(ex - 3, ey - 3, this.width + 6, this.height + 6);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ex - 3, ey - 3, this.width + 6, this.height + 6);
      ctx.font = '11px sans-serif';
      ctx.fillText('❄️', ex + this.width / 2 - 5, ey - 5);
      ctx.restore();
    }

    // SPEECH BUBBLE RENDERING
    if (this.speechBubble && this.speechBubble.timer > 0) {
      const alpha = Math.min(1, this.speechBubble.timer / 0.35);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 7px 'Press Start 2P', monospace";
      const text = this.speechBubble.text;
      const textWidth = ctx.measureText(text).width;
      const bw = textWidth + 12;
      const bh = 17;
      const bx = ex + this.width / 2 - bw / 2;
      const by = ey - bh - 9;

      // Dark background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.fill();
      ctx.stroke();

      // Pointer tail
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(ex + this.width / 2 - 3, by + bh);
      ctx.lineTo(ex + this.width / 2, by + bh + 4);
      ctx.lineTo(ex + this.width / 2 + 3, by + bh);
      ctx.fill();

      // Text
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx + bw / 2, by + bh / 2 + 1);

      ctx.restore();
    }
  }
}

// ============================================================================
// 7. BOSS ENEMY: "THE FINAL EXAM" & ANSWER KEY WEAPON
// ============================================================================
class BossEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 46;
    this.height = 52;
    this.maxHealth = 3;
    this.health = 3;
    this.damage = 25;
    this.speed = 70;
    this.state = 'idle'; // 'idle', 'charge_prep', 'charging'
    this.stateTimer = 2.0;
    this.attackCycle = 0;
    this.chargeVx = 0;
    this.chargeVy = 0;
    this.flashTimer = 0;
    this.defeated = false;
    this.speechBubble = { text: "PREPARE FOR THE FINAL EXAM!", timer: 3.0 };
  }

  takeHit() {
    this.health -= 1;
    this.flashTimer = 0.4;
    this.speechBubble = {
      text: this.health === 2 ? "PAPER LEAK DETECTED?!" : this.health === 1 ? "MY CURVE IS RUINED!" : "I AM DEFEATED!",
      timer: 2.2
    };
    if (this.health <= 0) {
      this.defeated = true;
    }
  }

  update(dt, map, player, projectiles) {
    if (this.defeated) return;

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.speechBubble && this.speechBubble.timer > 0) {
      this.speechBubble.timer -= dt;
      if (this.speechBubble.timer <= 0) this.speechBubble = null;
    }

    this.stateTimer -= dt;

    if (this.state === 'idle') {
      this.y += Math.sin(Date.now() * 0.003) * 16 * dt;

      if (this.stateTimer <= 0) {
        this.attackCycle = (this.attackCycle + 1) % 3;

        if (this.attackCycle === 0) {
          // Attack 1: Falling papers in lines
          this.speechBubble = { text: "SURPRISE EXAM SHEETS!", timer: 2.0 };
          for (let c = 3; c <= 21; c += 3) {
            projectiles.push({
              type: 'paper',
              x: c * TILE_SIZE,
              y: 2 * TILE_SIZE,
              vx: 0,
              vy: 115,
              width: 14,
              height: 16
            });
          }
          this.stateTimer = 2.5;
        } else if (this.attackCycle === 1) {
          // Attack 2: Spreading circle of "F" grades
          this.speechBubble = { text: "F FOR EVERYONE!", timer: 2.0 };
          const count = 10;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            projectiles.push({
              type: 'f_grade',
              x: this.x + this.width / 2,
              y: this.y + this.height / 2,
              vx: Math.cos(angle) * 125,
              vy: Math.sin(angle) * 125,
              size: 10
            });
          }
          this.stateTimer = 2.8;
        } else {
          // Attack 3: Wind-up charge towards player
          this.state = 'charge_prep';
          this.stateTimer = 1.0;
          this.speechBubble = { text: "DETENTION INCOMING!", timer: 1.5 };
        }
      }
    } else if (this.state === 'charge_prep') {
      if (this.stateTimer <= 0) {
        this.state = 'charging';
        this.stateTimer = 1.2;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.chargeVx = Math.cos(angle) * 220;
        this.chargeVy = Math.sin(angle) * 220;
      }
    } else if (this.state === 'charging') {
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;

      if (this.x < 32 || this.x > MAP_COLS * TILE_SIZE - 64) this.chargeVx *= -1;
      if (this.y < 32 || this.y > MAP_ROWS * TILE_SIZE - 64) this.chargeVy *= -1;

      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.stateTimer = 2.0;
      }
    }
  }

  draw(ctx, time) {
    if (this.defeated) return;

    const bx = Math.round(this.x);
    const by = Math.round(this.y);

    ctx.save();

    if (this.state === 'charge_prep') {
      const pulse = Math.sin(time * 0.02) * 6;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx - 4 - pulse, by - 4 - pulse, this.width + 8 + pulse * 2, this.height + 8 + pulse * 2);
    }

    if (this.flashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, this.width, this.height);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(bx + this.width / 2, by + this.height + 2, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Robe
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(bx + 4, by + 14, this.width - 8, this.height - 14);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 4, by + 14, this.width - 8, this.height - 14);

    // Collar
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(bx + this.width / 2, by + 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(bx + 12, by + 4, 22, 12);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(bx + 10, by, 26, 6);

    // Eyes
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(bx + 15, by + 8, 4, 3);
    ctx.fillRect(bx + 27, by + 8, 4, 3);
    ctx.shadowBlur = 0;

    // Health Bar
    const barWidth = 60;
    const barHeight = 8;
    const barX = bx + this.width / 2 - barWidth / 2;
    const barY = by - 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const hpWidth = (this.health / this.maxHealth) * barWidth;
    ctx.fillStyle = this.health === 3 ? '#10b981' : this.health === 2 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, hpWidth, barHeight);

    ctx.font = "bold 6px 'Press Start 2P', monospace";
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText("FINAL EXAM DEAN", bx + this.width / 2, barY - 5);

    ctx.restore();

    // Speech Bubble
    if (this.speechBubble && this.speechBubble.timer > 0) {
      ctx.save();
      ctx.font = "bold 7px 'Press Start 2P', monospace";
      const text = this.speechBubble.text;
      const tw = ctx.measureText(text).width;
      const bw = tw + 14;
      const bh = 18;
      const bxP = bx + this.width / 2 - bw / 2;
      const byP = barY - 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bxP, byP, bw, bh);
      ctx.strokeRect(bxP, byP, bw, bh);

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bxP + bw / 2, byP + bh / 2 + 1);
      ctx.restore();
    }
  }
}

class AnswerKeyItem {
  constructor(tileCol, tileRow, index) {
    this.col = tileCol;
    this.row = tileRow;
    this.x = tileCol * TILE_SIZE + 6;
    this.y = tileRow * TILE_SIZE + 6;
    this.width = 20;
    this.height = 20;
    this.index = index;
    this.collected = false;
  }

  draw(ctx, time) {
    if (this.collected) return;

    const bob = Math.sin(time * 0.008 + this.index) * 3;
    const ax = this.x;
    const ay = this.y + bob;

    ctx.save();
    const pulse = Math.sin(time * 0.01) * 6;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 14 + pulse;

    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(ax + 10, ay + 10, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔑', ax + 10, ay + 15);

    ctx.font = "bold 6px 'Press Start 2P', monospace";
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(`KEY #${this.index}`, ax + 10, ay - 6);

    ctx.restore();
  }
}
