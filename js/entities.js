/**
 * entities.js - Game Entities: Player, Enemies, Keys, and Power-Ups
 * Features: Attendance Shield, Proxy Attendance (Invisibility), and Coffee Pickups.
 */

// ============================================================================
// 1. PLAYER CLASS
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
    this.isMoving = false;
    this.walkCycle = 0;

    this.health = 100;
    this.maxHealth = 100;
    this.invulnTimer = 0; // seconds of invulnerability after damage
    this.floatingTexts = []; // floating score/damage notifications

    // Power-ups
    this.hasShield = false; // Attendance Shield: absorbs 1 hit
    this.proxyTimer = 0;    // Proxy Attendance: invisibility duration in seconds
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

      const moveX = dx * this.speed * dt;
      const moveY = dy * this.speed * dt;

      // Move X first and check collision (allows sliding along walls)
      this.x += moveX;
      if (map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.x -= moveX; // revert X
      }

      // Move Y next and check collision
      this.y += moveY;
      if (map.checkCollision(this.x, this.y, this.width, this.height)) {
        this.y -= moveY; // revert Y
      }
    } else {
      this.walkCycle = 0;
    }

    // Tick invulnerability timer
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer < 0) this.invulnTimer = 0;
    }

    // Tick Proxy Attendance Invisibility
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

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
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
      this.addFloatingText('SHIELD BLOCKED HIT! 🛡️', '#38bdf8');
      if (window.soundManager) window.soundManager.playShieldBreak();
      return false; // No damage taken
    }

    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.invulnTimer = 1.2; // 1.2s invulnerability

    this.addFloatingText(`-${amount} HP`, '#ef4444');
    if (window.soundManager) window.soundManager.playHit();
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.addFloatingText(`+${amount} HP`, '#10b981');
    if (window.soundManager) window.soundManager.playCoffee();
  }

  activateShield() {
    this.hasShield = true;
    this.addFloatingText('+ATTENDANCE SHIELD! 🛡️', '#38bdf8');
    if (window.soundManager) window.soundManager.playShield();
  }

  activateProxy(duration = 3.0) {
    this.proxyTimer = duration;
    this.addFloatingText('+PROXY: INVISIBLE 3s! 👻', '#c084fc');
    if (window.soundManager) window.soundManager.playProxy();
  }

  addFloatingText(text, color) {
    this.floatingTexts.push({
      text: text,
      color: color,
      x: this.x + this.width / 2,
      y: this.y - 6,
      life: 0.9
    });
  }

  // Draw student sprite with backpack, walk bounce, shield, and proxy invisibility
  draw(ctx, time) {
    // If invulnerable, blink
    if (this.invulnTimer > 0 && Math.floor(time / 80) % 2 === 0) {
      return; // Skip frame for flashing effect
    }

    const bounce = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
    const px = Math.round(this.x);
    const py = Math.round(this.y + bounce);

    ctx.save();

    // Proxy Attendance Invisibility effect: Ghostly purple aura and translucency
    if (this.proxyTimer > 0) {
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
    }

    // Drop shadow under player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px + this.width / 2, py + this.height + 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack (shows behind student if moving down/left/right)
    if (this.direction !== 'up') {
      ctx.fillStyle = '#b45309'; // Leather brown backpack
      ctx.fillRect(px + 4, py + 7, 12, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 6, py + 9, 8, 4);
    }

    // Body (Cyan/Teal student hoodie)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(px + 3, py + 8, 14, 10);

    // Head
    ctx.fillStyle = '#fcd34d'; // Skin tone
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

    // Legs
    ctx.fillStyle = '#334155'; // Dark jeans
    const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 3 : 0;
    ctx.fillRect(px + 4, py + 18, 4, 4 + legOffset);
    ctx.fillRect(px + 12, py + 18, 4, 4 - legOffset);

    // Shoes
    ctx.fillStyle = '#f8fafc'; // White sneakers
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

      // Shield orbit icon
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const orbitAngle = time * 0.004;
      const ox = px + this.width / 2 + Math.cos(orbitAngle) * 18;
      const oy = py + this.height / 2 + Math.sin(orbitAngle) * 18;
      ctx.fillText('🛡️', ox, oy);
      ctx.restore();
    }

    // Draw floating notifications
    this.floatingTexts.forEach(ft => {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    });
  }
}

// ============================================================================
// 2. KEY COLLECTIBLE CLASS
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
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;

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
// 3. POWER-UP CLASSES: ATTENDANCE SHIELD & PROXY ATTENDANCE
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
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    // Glowing energy badge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 10, 11, 0, Math.PI * 2);
    ctx.fill();

    // Shield emoji / graphic
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
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;

    // Glowing ghostly card
    ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.beginPath();
    ctx.arc(px + 10, py + 10, 11, 0, Math.PI * 2);
    ctx.fill();

    // Ghost emoji
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👻', px + 10, py + 15);

    ctx.restore();
  }
}

// ============================================================================
// 4. COFFEE PICKUP CLASS
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
    // Warm steam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const steamY = (time * 0.02) % 6;
    ctx.fillRect(cx + 4, cy - 3 - steamY, 2, 2);
    ctx.fillRect(cx + 8, cy - 5 - steamY, 2, 2);

    // Coffee Mug
    ctx.fillStyle = '#0284c7'; // Blue mug
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
// 5. ENEMY CLASSES (Strict Professors & Flying Assignments)
// ============================================================================
class Enemy {
  constructor(type, x, y, options = {}) {
    this.type = type; // 'professor' or 'assignment'
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;

    if (type === 'professor') {
      this.width = 24;
      this.height = 26;
      this.speed = options.speed || 80;
      this.damage = options.damage || 20;
      this.axis = options.axis || 'x'; // 'x' or 'y' patrol
      this.minPos = options.minPos || x - 100;
      this.maxPos = options.maxPos || x + 100;
      this.dir = 1;
      this.name = options.name || "Professor";
      this.isDean = !!options.isDean;
    } else {
      // Flying Assignment
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
    }
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.dir = 1;
  }

  update(dt, map) {
    if (this.type === 'professor') {
      if (this.axis === 'x') {
        this.x += this.dir * this.speed * dt;
        if (this.x >= this.maxPos) {
          this.x = this.maxPos;
          this.dir = -1;
        } else if (this.x <= this.minPos) {
          this.x = this.minPos;
          this.dir = 1;
        }
      } else {
        this.y += this.dir * this.speed * dt;
        if (this.y >= this.maxPos) {
          this.y = this.maxPos;
          this.dir = -1;
        } else if (this.y <= this.minPos) {
          this.y = this.minPos;
          this.dir = 1;
        }
      }
    } else {
      // Flying Assignment: Floating bouncing sheet
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
    const ex = Math.round(this.x);
    const ey = Math.round(this.y);

    if (this.type === 'professor') {
      ctx.save();
      // Flashlight / Detection beam
      ctx.fillStyle = this.isDean ? 'rgba(220, 38, 38, 0.18)' : 'rgba(239, 68, 68, 0.12)';
      ctx.beginPath();
      if (this.axis === 'x') {
        const beamDir = this.dir;
        ctx.moveTo(ex + (beamDir > 0 ? this.width : 0), ey + 10);
        ctx.lineTo(ex + beamDir * 55, ey - 10);
        ctx.lineTo(ex + beamDir * 55, ey + 30);
      } else {
        const beamDir = this.dir;
        ctx.moveTo(ex + 12, ey + (beamDir > 0 ? this.height : 0));
        ctx.lineTo(ex - 12, ey + beamDir * 55);
        ctx.lineTo(ex + 36, ey + beamDir * 55);
      }
      ctx.closePath();
      ctx.fill();

      // Professor Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex + 12, ey + 26, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Suit Coat (Dark Purple or Dean Gold-Black)
      ctx.fillStyle = this.isDean ? '#1c1917' : '#4c0519';
      ctx.fillRect(ex + 4, ey + 8, 16, 14);

      // Shirt & Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 10, ey + 8, 4, 6);
      ctx.fillStyle = this.isDean ? '#eab308' : '#dc2626'; // Gold tie for Dean
      ctx.fillRect(ex + 11, ey + 10, 2, 7);

      // Head & Hair
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(ex + 7, ey + 2, 10, 7);
      ctx.fillStyle = this.isDean ? '#e2e8f0' : '#94a3b8'; // White hair for Dean
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

    } else {
      // Flying Assignment (Paper sheet with red F)
      ctx.save();
      const flap = Math.sin(time * 0.015) * 3;

      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 8;

      // Paper sheet
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ex + 2, ey + 2 + flap, 14, 16);

      // Folded corner
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(ex + 12, ey + 2 + flap);
      ctx.lineTo(ex + 16, ey + 6 + flap);
      ctx.lineTo(ex + 12, ey + 6 + flap);
      ctx.closePath();
      ctx.fill();

      // Red 'F' Grade
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('F', ex + 6, ey + 13 + flap);

      // Little spectral wings
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex - 1, ey + 8 + flap, 4, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(ex + 19, ey + 8 + flap, 4, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
