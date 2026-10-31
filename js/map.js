/**
 * map.js - College Tile Map and Collision Detection
 * Grid: 25 columns x 18 rows of 32x32 pixel tiles (800 x 576 canvas)
 */

const TILE_SIZE = 32;
const MAP_COLS = 25;
const MAP_ROWS = 18;

// Tile Types
const TILE_HALLWAY = 0;
const TILE_WALL = 1;
const TILE_OBSTACLE = 2; // Desk / Bookshelf
const TILE_EXIT = 3;     // Main Campus Exit Gate
const TILE_ROOM = 4;     // Room Wooden Floor

// 25 x 18 Tile Grid Layout
// 1 = Solid Wall, 0 = Hallway, 2 = Desk/Bookcase, 3 = Exit Gate, 4 = Room Floor
const BASE_COLLEGE_MAP = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 0
  [ 1, 4, 4, 4, 4, 4, 4, 1, 0, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 1 ], // 1
  [ 1, 4, 2, 4, 2, 4, 4, 1, 0, 4, 2, 2, 4, 2, 2, 4, 1, 4, 2, 2, 4, 4, 2, 4, 1 ], // 2
  [ 1, 4, 2, 4, 2, 4, 4, 1, 0, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 1 ], // 3
  [ 1, 4, 4, 4, 4, 4, 4, 1, 0, 4, 2, 2, 4, 2, 2, 4, 1, 4, 2, 4, 4, 2, 4, 4, 1 ], // 4
  [ 1, 4, 2, 4, 2, 4, 4, 1, 0, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 1 ], // 5
  [ 1, 4, 4, 4, 4, 4, 4, 1, 0, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 1 ], // 6
  [ 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1 ], // 7 (Doors at (4,7), (12,7), (20,7))
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1 ], // 8 (Exit Gate at 23,8)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1 ], // 9 (Exit Gate at 23,9)
  [ 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 10 (Doors at (4,10), (14,10))
  [ 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1 ], // 11
  [ 1, 4, 2, 2, 4, 2, 2, 4, 4, 1, 0, 0, 4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 4, 4, 1 ], // 12
  [ 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1 ], // 13
  [ 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 4, 4, 1 ], // 14
  [ 1, 4, 2, 2, 4, 2, 2, 4, 4, 1, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1 ], // 15
  [ 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1 ], // 16
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]  // 17
];

// Room Labels for map rendering
const ROOM_LABELS = [
  { text: "📚 LIBRARY", x: 4 * TILE_SIZE, y: 1.5 * TILE_SIZE },
  { text: "💻 COMPUTER LAB", x: 12.5 * TILE_SIZE, y: 1.5 * TILE_SIZE },
  { text: "☕ FACULTY LOUNGE", x: 20.5 * TILE_SIZE, y: 1.5 * TILE_SIZE },
  { text: "🛋️ STUDY HALL", x: 5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
  { text: "🎓 LECTURE HALL", x: 18 * TILE_SIZE, y: 11.5 * TILE_SIZE },
  { text: "MAIN HALLWAY", x: 11 * TILE_SIZE, y: 8.8 * TILE_SIZE }
];

class CollegeMap {
  constructor() {
    this.reset();
  }

  reset() {
    // Clone grid
    this.grid = BASE_COLLEGE_MAP.map(row => [...row]);
    this.exitUnlocked = false;
  }

  unlockExit() {
    this.exitUnlocked = true;
  }

  // Check if tile is solid (blocks movement)
  isTileSolid(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
      return true; // Outside bounds is solid
    }
    const tile = this.grid[row][col];
    if (tile === TILE_WALL || tile === TILE_OBSTACLE) {
      return true;
    }
    // Exit gate blocks passage until unlocked
    if (tile === TILE_EXIT && !this.exitUnlocked) {
      return true;
    }
    return false;
  }

  // Check if a bounding box collides with solid tiles
  checkCollision(x, y, width, height) {
    // Compute tile range covered by the bounding box
    const minCol = Math.floor(x / TILE_SIZE);
    const maxCol = Math.floor((x + width - 1) / TILE_SIZE);
    const minRow = Math.floor(y / TILE_SIZE);
    const maxRow = Math.floor((y + height - 1) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.isTileSolid(c, r)) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if bounding box touches the Exit Gate
  isAtExit(x, y, width, height) {
    const minCol = Math.floor(x / TILE_SIZE);
    const maxCol = Math.floor((x + width - 1) / TILE_SIZE);
    const minRow = Math.floor(y / TILE_SIZE);
    const maxRow = Math.floor((y + height - 1) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (c >= 0 && c < MAP_COLS && r >= 0 && r < MAP_ROWS) {
          if (this.grid[r][c] === TILE_EXIT) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Render the campus map to canvas
  draw(ctx, time) {
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.grid[r][c];

        if (tile === TILE_WALL) {
          // Dark campus brick wall
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Wall top highlight
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, TILE_SIZE, 4);

          // Subtle brick lines
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        } else if (tile === TILE_ROOM) {
          // Wooden/linoleum room floor
          ctx.fillStyle = (r + c) % 2 === 0 ? '#141e33' : '#121a2d';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        } else if (tile === TILE_HALLWAY) {
          // Slate stone hallway floor
          ctx.fillStyle = (r + c) % 2 === 0 ? '#0b1120' : '#090e1a';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        } else if (tile === TILE_OBSTACLE) {
          // Room floor base
          ctx.fillStyle = '#141e33';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Desk / Bookcase block
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);

          // Desk top surface
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 3, y + 4, TILE_SIZE - 6, 6);

          // Computer / Book detail
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(x + 10, y + 12, 12, 8);

        } else if (tile === TILE_EXIT) {
          // Exit Gate Area
          if (!this.exitUnlocked) {
            // Locked Gate (Red barrier and iron bars)
            ctx.fillStyle = '#2d0a0a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Metal bars
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 6, y); ctx.lineTo(x + 6, y + TILE_SIZE);
            ctx.moveTo(x + 16, y); ctx.lineTo(x + 16, y + TILE_SIZE);
            ctx.moveTo(x + 26, y); ctx.lineTo(x + 26, y + TILE_SIZE);
            ctx.stroke();

            // Red warning glow
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Padlock icon on the gate
            if (r === 8 && c === 23) {
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🔒', x + 16, y + 22);
            }
          } else {
            // Unlocked Gate: Vibrant emerald freedom portal
            const pulse = Math.sin(time * 0.006) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.4 * pulse})`;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Glowing green exit archway
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            if (r === 8 && c === 23) {
              ctx.font = 'bold 10px monospace';
              ctx.fillStyle = '#6ee7b7';
              ctx.textAlign = 'center';
              ctx.fillText('EXIT', x + 16, y + 20);
            }
          }
        }
      }
    }

    // Render Room Header Labels
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ROOM_LABELS.forEach(label => {
      ctx.fillText(label.text, label.x, label.y);
    });
  }
}
