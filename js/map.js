/**
 * map.js - Procedural College Map Generator & Dynamic Lighting
 * Grid: 25 columns x 18 rows of 32x32 pixel tiles (800 x 576 canvas)
 * Randomizes room layouts, doors, obstacles, and navigation paths on every try!
 */

const TILE_SIZE = 32;
const MAP_COLS = 25;
const MAP_ROWS = 18;

// Tile Types
const TILE_HALLWAY = 0;
const TILE_WALL = 1;
const TILE_OBSTACLE = 2; // Desk / Bookshelf
const TILE_EXIT = 3;     // Main Campus Exit Gate
const TILE_ROOM = 4;     // Room Floor

class CollegeMap {
  constructor() {
    this.grid = [];
    this.exitUnlocked = false;
    this.exitTiles = [];
    this.level = 1;
    this.doors = [];
    this.rooms = {
      library: { name: "📚 LIBRARY", minCol: 1, maxCol: 6, minRow: 1, maxRow: 6, labelX: 3.5, labelY: 1.5 },
      computerLab: { name: "💻 COMPUTER LAB", minCol: 9, maxCol: 15, minRow: 1, maxRow: 6, labelX: 12, labelY: 1.5 },
      facultyLounge: { name: "☕ FACULTY LOUNGE", minCol: 18, maxCol: 23, minRow: 1, maxRow: 6, labelX: 20.5, labelY: 1.5 },
      studyHall: { name: "🛋️ STUDY HALL", minCol: 1, maxCol: 8, minRow: 11, maxRow: 16, labelX: 4.5, labelY: 11.5 },
      lectureHall: { name: "🎓 LECTURE HALL", minCol: 12, maxCol: 23, minRow: 11, maxRow: 16, labelX: 17.5, labelY: 11.5 }
    };
    this.generate(1);
  }

  reset(level = 1) {
    this.generate(level);
  }

  unlockExit() {
    this.exitUnlocked = true;
  }

  // ==========================================================================
  // PROCEDURAL MAP GENERATION (Randomized on every try!)
  // ==========================================================================
  generate(level = 1) {
    this.level = level;
    this.exitUnlocked = false;
    this.exitTiles = [];
    this.doors = [];

    // 1. Initialize base layout with perimeter walls and base room divisions
    this.grid = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(TILE_WALL));

    // Fill hallway corridors (Rows 8 and 9)
    for (let c = 1; c < MAP_COLS - 1; c++) {
      this.grid[8][c] = TILE_HALLWAY;
      this.grid[9][c] = TILE_HALLWAY;
    }

    // Vertical corridors connecting North rooms
    for (let r = 1; r < 8; r++) {
      this.grid[r][7] = TILE_HALLWAY;
      this.grid[r][8] = TILE_HALLWAY;
      this.grid[r][16] = TILE_HALLWAY;
      this.grid[r][17] = TILE_HALLWAY;
    }

    // Vertical corridor connecting South rooms
    for (let r = 10; r < 17; r++) {
      this.grid[r][9] = TILE_HALLWAY;
      this.grid[r][10] = TILE_HALLWAY;
      this.grid[r][11] = TILE_HALLWAY;
    }

    // Fill base room floors
    Object.values(this.rooms).forEach(rm => {
      for (let r = rm.minRow; r <= rm.maxRow; r++) {
        for (let c = rm.minCol; c <= rm.maxCol; c++) {
          this.grid[r][c] = TILE_ROOM;
        }
      }
    });

    // 2. Dynamic Doorway Placement (Randomized on each try)
    // Library door to main hallway or side corridor
    const libDoorC = this.randomChoice([2, 3, 4, 5]);
    this.grid[7][libDoorC] = TILE_HALLWAY;
    this.doors.push({ col: libDoorC, row: 7 });

    // Optional side door to vertical corridor
    if (Math.random() < 0.6) {
      const libSideR = this.randomChoice([3, 4, 5]);
      this.grid[libSideR][6] = TILE_HALLWAY;
      this.doors.push({ col: 6, row: libSideR });
    }

    // Computer Lab door to main hallway
    const labDoorC = this.randomChoice([10, 12, 14]);
    this.grid[7][labDoorC] = TILE_HALLWAY;
    this.doors.push({ col: labDoorC, row: 7 });

    // Faculty Lounge door to main hallway
    const loungeDoorC = this.randomChoice([19, 20, 22]);
    this.grid[7][loungeDoorC] = TILE_HALLWAY;
    this.doors.push({ col: loungeDoorC, row: 7 });

    // Study Hall door to main hallway
    const studyDoorC = this.randomChoice([3, 4, 6, 7]);
    this.grid[10][studyDoorC] = TILE_HALLWAY;
    this.doors.push({ col: studyDoorC, row: 10 });

    // Lecture Hall door to main hallway
    const lectureDoorC1 = this.randomChoice([13, 14, 15]);
    const lectureDoorC2 = this.randomChoice([18, 20, 22]);
    this.grid[10][lectureDoorC1] = TILE_HALLWAY;
    this.grid[10][lectureDoorC2] = TILE_HALLWAY;
    this.doors.push({ col: lectureDoorC1, row: 10 });
    this.doors.push({ col: lectureDoorC2, row: 10 });

    // 3. Procedural Internal Room Obstacles
    this.generateRoomObstacles();

    // 4. Dynamic Hallway Obstacles based on Level
    if (level >= 2) {
      // Add a couple of dynamic fallen desks / barricades with a clear bypass
      const barCol = this.randomChoice([5, 13, 15]);
      this.grid[8][barCol] = TILE_OBSTACLE;
    }
    if (level >= 3) {
      const barCol2 = this.randomChoice([4, 12, 19]);
      this.grid[9][barCol2] = TILE_OBSTACLE;
    }

    // 5. Exit Gate Placement (Primary East Hallway Gate)
    this.grid[8][23] = TILE_EXIT;
    this.grid[9][23] = TILE_EXIT;
    this.exitTiles = [{ col: 23, row: 8 }, { col: 23, row: 9 }];

    // 6. Reachability Validation (BFS) - Ensure no room is isolated
    this.ensureReachability();
  }

  // Generate varied room layouts by selecting different architectural templates
  generateRoomObstacles() {
    // --- A. LIBRARY ---
    const libStyle = Math.floor(Math.random() * 3);
    if (libStyle === 0) {
      // Vertical Book Stacks with center aisle
      [2, 4].forEach(c => {
        [2, 3, 5].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (libStyle === 1) {
      // Reading Carrels Pods
      [[2, 2], [2, 3], [5, 2], [5, 3], [3, 5], [4, 5]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    } else {
      // Zig-zag Stacks
      [2, 3, 4].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; });
      [3, 4, 5].forEach(c => { this.grid[4][c] = TILE_OBSTACLE; });
    }

    // --- B. COMPUTER LAB ---
    const labStyle = Math.floor(Math.random() * 3);
    if (labStyle === 0) {
      // Paired Workstation Rows
      [10, 11, 13, 14].forEach(c => {
        [2, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (labStyle === 1) {
      // Central Server Block with side desks
      [12, 13].forEach(c => {
        [2, 3, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
      [10, 15].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; this.grid[5][c] = TILE_OBSTACLE; });
    } else {
      // Staggered Pods
      [[10, 2], [11, 2], [13, 3], [14, 3], [10, 5], [11, 5]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    }

    // --- C. FACULTY LOUNGE ---
    const loungeStyle = Math.floor(Math.random() * 3);
    if (loungeStyle === 0) {
      // Coffee counter + Conference Table
      [18, 19].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; });
      [21, 22].forEach(c => { this.grid[4][c] = TILE_OBSTACLE; });
    } else if (loungeStyle === 1) {
      // Perimeter Sofas
      [18, 22].forEach(c => {
        [2, 3, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      // Executive Desks
      [[19, 2], [20, 2], [19, 4], [20, 4], [22, 3]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    }

    // --- D. STUDY HALL ---
    const studyStyle = Math.floor(Math.random() * 3);
    if (studyStyle === 0) {
      // Dual study blocks
      [2, 3, 6, 7].forEach(c => {
        [12, 15].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (studyStyle === 1) {
      // Center discussion table
      [3, 4, 5, 6].forEach(c => {
        [13, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      // Perimeter cubicles
      [2, 7].forEach(c => {
        [12, 13, 14, 15].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    }

    // --- E. LECTURE HALL ---
    const lectureStyle = Math.floor(Math.random() * 3);
    if (lectureStyle === 0) {
      // Center aisle auditorium rows
      [13, 14, 15, 17, 18, 19].forEach(c => {
        [12, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
      [21, 22].forEach(c => { this.grid[13][c] = TILE_OBSTACLE; });
    } else if (lectureStyle === 1) {
      // Dual aisle rows
      [14, 15, 16, 19, 20, 21].forEach(c => {
        [12, 14, 16].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      // Horseshoe seminar seating
      [14, 15, 16, 17, 18, 19, 20].forEach(c => { this.grid[15][c] = TILE_OBSTACLE; });
      [14, 20].forEach(c => {
        [12, 13, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    }
  }

  // BFS Reachability check: ensures student at hallway/spawn can reach all rooms and the exit
  ensureReachability() {
    const startC = 3;
    const startR = 13;
    const visited = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));
    const queue = [[startC, startR]];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const [c, r] = queue.shift();
      const neighbors = [
        [c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]
      ];

      for (const [nc, nr] of neighbors) {
        if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS && !visited[nr][nc]) {
          const tile = this.grid[nr][nc];
          if (tile === TILE_HALLWAY || tile === TILE_ROOM || tile === TILE_EXIT) {
            visited[nr][nc] = true;
            queue.push([nc, nr]);
          }
        }
      }
    }

    // Verify exit is reachable
    const exitReachable = this.exitTiles.some(t => visited[t.row][t.col]);
    if (!exitReachable) {
      // Carve direct opening to exit
      this.grid[8][22] = TILE_HALLWAY;
      this.grid[9][22] = TILE_HALLWAY;
    }
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Get all walkable room/hallway floor tiles inside a bounding box
  getWalkableTilesInArea(minCol, maxCol, minRow, maxRow) {
    const list = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.grid[r][c] === TILE_ROOM || this.grid[r][c] === TILE_HALLWAY) {
          list.push({ col: c, row: r });
        }
      }
    }
    return list;
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

  // ==========================================================================
  // RENDERING & SPOOKY LIGHTING (Projector & Mobile Ready)
  // ==========================================================================
  draw(ctx, time, player = null) {
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
          ctx.fillStyle = (r * 7 + c * 3) % 2 === 0 ? '#06b6d4' : '#f59e0b';
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

            // Padlock icon
            if (r === 8 && c === 23) {
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🔒', x + 16, y + 22);
            }
          } else {
            // Unlocked Gate: Vibrant emerald freedom portal
            const pulse = Math.sin(time * 0.006) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.45 * pulse})`;
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
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    Object.values(this.rooms).forEach(rm => {
      ctx.fillText(rm.name, rm.labelX * TILE_SIZE, rm.labelY * TILE_SIZE);
    });
    ctx.fillText('MAIN HALLWAY', 12.5 * TILE_SIZE, 8.8 * TILE_SIZE);

    // Dynamic Spooky Atmosphere Lighting on Levels 2 & 3
    if (this.level >= 2 && player) {
      this.drawSpookyLighting(ctx, time, player);
    }
  }

  // Spooky ambient lighting: flashlight cone / darkness vignette
  drawSpookyLighting(ctx, time, player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const flicker = Math.sin(time * 0.01) * 6;
    const radius = this.level === 3 ? 190 + flicker : 270 + flicker;

    ctx.save();
    const grad = ctx.createRadialGradient(px, py, radius * 0.35, px, py, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, this.level === 3 ? 'rgba(3, 7, 18, 0.65)' : 'rgba(3, 7, 18, 0.35)');
    grad.addColorStop(1, this.level === 3 ? 'rgba(3, 7, 18, 0.94)' : 'rgba(3, 7, 18, 0.7)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    ctx.restore();
  }
}
