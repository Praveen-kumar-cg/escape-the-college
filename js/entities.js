/**
 * entities.js - Game Entities: Player, Enemies, Keys, and Collectibles
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

  reset() {
    this.x = this.startX;
    this.y = this.startY;
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

  addFloatingText(text, color) {
    this.floatingTexts.push({
      text: text,
      color: color,
      x: this.x + this.width / 2,
      y: this.y - 6,
      life: 0.9
    });
  }

  // Draw cute student sprite with backpack and walk bounce
  draw(ctx, time) {
    // If invulnerable, blink
    if (this.invulnTimer > 0 && Math.floor(time / 80) % 2 === 0) {
      return; // Skip frame for flashing effect
    }

    const bounce = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
    const px = Math.round(this.x);
    const py = Math.round(this.y + bounce);

    ctx.save();

    // Subtle drop shadow under player
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
    } // 'up' shows back of head

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

    // Glowing aura
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;

    // Key body
    ctx.fillStyle = '#fbbf24';
    // Ring handle
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
// 3. COFFEE PICKUP CLASS
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
// 4. ENEMY CLASSES (Strict Professor & Flying Assignment)
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
      this.speed = options.speed || 85;
      this.damage = 20;
      this.axis = options.axis || 'x'; // 'x' or 'y' patrol
      this.minPos = options.minPos || x - 100;
      this.maxPos = options.maxPos || x + 100;
      this.dir = 1;
      this.name = options.name || "Professor";
    } else {
      // Flying Assignment
      this.width = 18;
      this.height = 20;
      this.speed = options.speed || 95;
      this.damage = 15;
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
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
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

      // Suit Coat (Dark Purple / Crimson)
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(ex + 4, ey + 8, 16, 14);

      // White Shirt & Red Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 10, ey + 8, 4, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(ex + 11, ey + 10, 2, 7);

      // Head & Gray Hair
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(ex + 7, ey + 2, 10, 7);
      ctx.fillStyle = '#94a3b8'; // Gray hair
      ctx.fillRect(ex + 6, ey, 12, 3);

      // Glasses & Angry Brow
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 8, ey + 4, 3, 2);
      ctx.fillRect(ex + 13, ey + 4, 3, 2);

      // Clipboard / Grading Pen in hand
      ctx.fillStyle = '#d97706';
      ctx.fillRect(ex + (this.dir > 0 ? 19 : 0), ey + 12, 5, 8);
      ctx.fillStyle = '#ef4444'; // Red pen
      ctx.fillRect(ex + (this.dir > 0 ? 21 : 2), ey + 10, 2, 5);

      ctx.restore();

    } else {
      // Flying Assignment (Paper with wings & red 'F')
      ctx.save();
      const flap = Math.sin(time * 0.015) * 3;

      // Glow aura
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 8;

      // Paper sheet
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ex + 2, ey + 2 + flap, 14, 16);

      // Paper folded corner
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(ex + 12, ey + 2 + flap);
      ctx.lineTo(ex + 16, ey + 6 + flap);
      ctx.lineTo(ex + 12, ey + 6 + flap);
      ctx.closePath();
      ctx.fill();

      // Red 'F' Grade on paper
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
