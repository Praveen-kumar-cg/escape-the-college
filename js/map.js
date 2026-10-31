/**
 * map.js - Procedural College Map Generator, Themed Rooms & Flashlight Engine
 * Distinct themes:
 * - 📚 Library: Warm mahogany wood planks & colorful bookshelves
 * - 💻 Computer Lab: Deep cyber-slate tiles & flickering glowing terminal screens
 * - ☕ Faculty Lounge: Royal purple velvet carpet & coffee bar counters
 * - 🛋️ Study Hall: Amber study flooring & lamp-lit study desks
 * - 🎓 Lecture Hall: Tiered navy auditorium tiles & lecture benches
 * - Main Hallway: Checkered marble tiles with glowing overhead neon light strips
 */

const TILE_SIZE = 32;
const MAP_COLS = 25;
const MAP_ROWS = 18;

// Tile Types
const TILE_HALLWAY = 0;
const TILE_WALL = 1;
const TILE_OBSTACLE = 2; // Desk / Bookshelf / Terminal
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
      library: { name: "📚 LIBRARY", minCol: 1, maxCol: 6, minRow: 1, maxRow: 6, labelX: 3.5, labelY: 1.5, theme: 'library' },
      computerLab: { name: "💻 COMPUTER LAB", minCol: 9, maxCol: 15, minRow: 1, maxRow: 6, labelX: 12, labelY: 1.5, theme: 'lab' },
      facultyLounge: { name: "☕ FACULTY LOUNGE", minCol: 18, maxCol: 23, minRow: 1, maxRow: 6, labelX: 20.5, labelY: 1.5, theme: 'lounge' },
      studyHall: { name: "🛋️ STUDY HALL", minCol: 1, maxCol: 8, minRow: 11, maxRow: 16, labelX: 4.5, labelY: 11.5, theme: 'study' },
      lectureHall: { name: "🎓 LECTURE HALL", minCol: 12, maxCol: 23, minRow: 11, maxRow: 16, labelX: 17.5, labelY: 11.5, theme: 'lecture' }
    };
    this.generate(1);
  }

  reset(level = 1) {
    this.generate(level);
  }

  unlockExit() {
    this.exitUnlocked = true;
  }

  // Get the room name at a given pixel position
  getRoomAt(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (row >= 1 && row <= 6) {
      if (col >= 1 && col <= 6) return "📚 Library";
      if (col >= 9 && col <= 15) return "💻 Computer Lab";
      if (col >= 18 && col <= 23) return "☕ Faculty Lounge";
    }
    if (row >= 11 && row <= 16) {
      if (col >= 1 && col <= 8) return "🛋️ Study Hall";
      if (col >= 12 && col <= 23) return "🎓 Lecture Hall";
    }
    if (row >= 8 && row <= 9) {
      return "Main Hallway";
    }
    return "Campus Corridor";
  }

  // Get theme string for a given tile coordinate
  getTileTheme(col, row) {
    if (row >= 1 && row <= 6) {
      if (col >= 1 && col <= 6) return 'library';
      if (col >= 9 && col <= 15) return 'lab';
      if (col >= 18 && col <= 23) return 'lounge';
    }
    if (row >= 11 && row <= 16) {
      if (col >= 1 && col <= 8) return 'study';
      if (col >= 12 && col <= 23) return 'lecture';
    }
    return 'hallway';
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
    const libDoorC = this.randomChoice([2, 3, 4, 5]);
    this.grid[7][libDoorC] = TILE_HALLWAY;
    this.doors.push({ col: libDoorC, row: 7 });

    if (Math.random() < 0.6) {
      const libSideR = this.randomChoice([3, 4, 5]);
      this.grid[libSideR][6] = TILE_HALLWAY;
      this.doors.push({ col: 6, row: libSideR });
    }

    const labDoorC = this.randomChoice([10, 12, 14]);
    this.grid[7][labDoorC] = TILE_HALLWAY;
    this.doors.push({ col: labDoorC, row: 7 });

    const loungeDoorC = this.randomChoice([19, 20, 22]);
    this.grid[7][loungeDoorC] = TILE_HALLWAY;
    this.doors.push({ col: loungeDoorC, row: 7 });

    const studyDoorC = this.randomChoice([3, 4, 6, 7]);
    this.grid[10][studyDoorC] = TILE_HALLWAY;
    this.doors.push({ col: studyDoorC, row: 10 });

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

  generateRoomObstacles() {
    // A. LIBRARY: Vertical Bookshelves with center aisle
    const libStyle = Math.floor(Math.random() * 3);
    if (libStyle === 0) {
      [2, 4].forEach(c => {
        [2, 3, 5].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (libStyle === 1) {
      [[2, 2], [2, 3], [5, 2], [5, 3], [3, 5], [4, 5]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    } else {
      [2, 3, 4].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; });
      [3, 4, 5].forEach(c => { this.grid[4][c] = TILE_OBSTACLE; });
    }

    // B. COMPUTER LAB: Workstations with flickering monitors
    const labStyle = Math.floor(Math.random() * 3);
    if (labStyle === 0) {
      [10, 11, 13, 14].forEach(c => {
        [2, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (labStyle === 1) {
      [12, 13].forEach(c => {
        [2, 3, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
      [10, 15].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; this.grid[5][c] = TILE_OBSTACLE; });
    } else {
      [[10, 2], [11, 2], [13, 3], [14, 3], [10, 5], [11, 5]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    }

    // C. FACULTY LOUNGE: Coffee Bar & Conference Tables
    const loungeStyle = Math.floor(Math.random() * 3);
    if (loungeStyle === 0) {
      [18, 19].forEach(c => { this.grid[2][c] = TILE_OBSTACLE; });
      [21, 22].forEach(c => { this.grid[4][c] = TILE_OBSTACLE; });
    } else if (loungeStyle === 1) {
      [18, 22].forEach(c => {
        [2, 3, 4].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      [[19, 2], [20, 2], [19, 4], [20, 4], [22, 3]].forEach(([c, r]) => {
        this.grid[r][c] = TILE_OBSTACLE;
      });
    }

    // D. STUDY HALL: Study Desks & Lamps
    const studyStyle = Math.floor(Math.random() * 3);
    if (studyStyle === 0) {
      [2, 3, 6, 7].forEach(c => {
        [12, 15].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else if (studyStyle === 1) {
      [3, 4, 5, 6].forEach(c => {
        [13, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      [2, 7].forEach(c => {
        [12, 13, 14, 15].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    }

    // E. LECTURE HALL: Tiered Auditorium Rows
    const lectureStyle = Math.floor(Math.random() * 3);
    if (lectureStyle === 0) {
      [13, 14, 15, 17, 18, 19].forEach(c => {
        [12, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
      [21, 22].forEach(c => { this.grid[13][c] = TILE_OBSTACLE; });
    } else if (lectureStyle === 1) {
      [14, 15, 16, 19, 20, 21].forEach(c => {
        [12, 14, 16].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    } else {
      [14, 15, 16, 17, 18, 19, 20].forEach(c => { this.grid[15][c] = TILE_OBSTACLE; });
      [14, 20].forEach(c => {
        [12, 13, 14].forEach(r => { this.grid[r][c] = TILE_OBSTACLE; });
      });
    }
  }

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

    const exitReachable = this.exitTiles.some(t => visited[t.row][t.col]);
    if (!exitReachable) {
      this.grid[8][22] = TILE_HALLWAY;
      this.grid[9][22] = TILE_HALLWAY;
    }
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

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

  isTileSolid(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
      return true;
    }
    const tile = this.grid[row][col];
    if (tile === TILE_WALL || tile === TILE_OBSTACLE) {
      return true;
    }
    if (tile === TILE_EXIT && !this.exitUnlocked) {
      return true;
    }
    return false;
  }

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
  // RENDERING: DISTINCT ROOM THEMES, LIGHT STRIPS & ANIMATED EXIT
  // ==========================================================================
  draw(ctx, time, player = null) {
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.grid[r][c];
        const theme = this.getTileTheme(c, r);

        if (tile === TILE_WALL) {
          // Dark campus brick wall with 3D top bevel
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Wall top highlight
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, TILE_SIZE, 3);

          // Brick pattern borders
          ctx.strokeStyle = '#040711';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        } else if (tile === TILE_ROOM) {
          // --- THEMED FLOORS PER ROOM ---
          if (theme === 'library') {
            // Warm Mahogany Wood Planks
            ctx.fillStyle = (r + c) % 2 === 0 ? '#2a170c' : '#221208';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Wood plank seams
            ctx.strokeStyle = 'rgba(74, 40, 21, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          } else if (theme === 'lab') {
            // Computer Lab: Deep Cyber-Slate & Neon Grid Lines
            ctx.fillStyle = (r + c) % 2 === 0 ? '#051829' : '#041321';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Neon cyan circuitry border
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          } else if (theme === 'lounge') {
            // Faculty Lounge: Royal Velvet Purple Carpet
            ctx.fillStyle = (r + c) % 2 === 0 ? '#260f38' : '#1e092d';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Gold/violet carpet weave
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          } else if (theme === 'study') {
            // Study Hall: Cozy Amber Wood Linoleum
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1d152a' : '#171022';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.06)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          } else if (theme === 'lecture') {
            // Lecture Hall: Tiered Navy Auditorium Linoleum
            ctx.fillStyle = (r + c) % 2 === 0 ? '#0a1930' : '#071326';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          }

        } else if (tile === TILE_HALLWAY) {
          // Main Hallway: Alternating Checkered Marble Tiles
          const isCheckered = (r + c) % 2 === 0;
          ctx.fillStyle = isCheckered ? '#0e172a' : '#080d19';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          // Overhead neon cyan ceiling strip down central hallway
          if (r === 8 && c >= 1 && c <= 22) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
            ctx.fillRect(x, y + 30, TILE_SIZE, 2);
          }

        } else if (tile === TILE_OBSTACLE) {
          // --- THEMED OBSTACLES PER ROOM ---
          if (theme === 'library') {
            // Bookshelf with colorful pixel books
            ctx.fillStyle = '#221208';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Mahogany Bookcase frame
            ctx.fillStyle = '#3a2012';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // Shelf dividers & colorful books
            const colors = ['#dc2626', '#2563eb', '#059669', '#eab308', '#9333ea'];
            for (let b = 0; b < 4; b++) {
              ctx.fillStyle = colors[(c * 3 + b + r) % colors.length];
              ctx.fillRect(x + 4 + b * 6, y + 5, 5, 20);
              // Gold rib on book
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(x + 4 + b * 6, y + 9, 5, 2);
            }

          } else if (theme === 'lab') {
            // Computer Terminal with flickering monitor
            ctx.fillStyle = '#051829';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Dark desk
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);

            // Glowing Monitor Screen with subtle flicker
            const screenFlicker = Math.sin(time * 0.02 + c) > 0.3 ? 0.9 : 0.7;
            ctx.fillStyle = `rgba(6, 182, 212, ${screenFlicker})`;
            ctx.fillRect(x + 7, y + 7, 18, 12);

            // Code scanlines on screen
            ctx.fillStyle = '#083344';
            ctx.fillRect(x + 9, y + 10, 14, 2);
            ctx.fillRect(x + 9, y + 14, 10, 2);

            // Green power LED
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x + 22, y + 21, 2, 2);

          } else if (theme === 'lounge') {
            // Faculty Lounge Table & Steaming Mug
            ctx.fillStyle = '#260f38';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            ctx.fillStyle = '#4c1d95';
            ctx.fillRect(x + 3, y + 5, TILE_SIZE - 6, TILE_SIZE - 10);

            // Tablecloth & Mug
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(x + 11, y + 10, 10, 8);

          } else if (theme === 'study') {
            // Study Desk & Lamp
            ctx.fillStyle = '#1d152a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 2, y + 5, TILE_SIZE - 4, TILE_SIZE - 10);

            // Lamp light pool
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(x + 12, y + 11, 8, 8);

          } else {
            // Default Hallway / Lecture Auditorium Bench
            ctx.fillStyle = '#0a1930';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);

            ctx.fillStyle = '#0284c7';
            ctx.fillRect(x + 8, y + 10, 16, 6);
          }

        } else if (tile === TILE_EXIT) {
          // --- EXIT GATE: ANIMATED PORTAL ---
          if (!this.exitUnlocked) {
            // Locked Gate (Crimson Barrier & Iron Bars)
            ctx.fillStyle = '#2b0707';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 6, y); ctx.lineTo(x + 6, y + TILE_SIZE);
            ctx.moveTo(x + 16, y); ctx.lineTo(x + 16, y + TILE_SIZE);
            ctx.moveTo(x + 26, y); ctx.lineTo(x + 26, y + TILE_SIZE);
            ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (r === 8 && c === 23) {
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🔒', x + 16, y + 22);
            }
          } else {
            // Unlocked Gate: Glowing Animated Emerald Freedom Portal!
            const pulse = Math.sin(time * 0.007) * 0.25 + 0.75;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.45 * pulse})`;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Pulsing Neon Emerald Archway
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 12;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.shadowBlur = 0;

            // Animated Energy Particles across portal
            const beamX = x + ((time * 0.05) % TILE_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(beamX, y + 4, 3, TILE_SIZE - 8);

            if (r === 8 && c === 23) {
              ctx.font = 'bold 9px monospace';
              ctx.fillStyle = '#6ee7b7';
              ctx.textAlign = 'center';
              ctx.fillText('ESCAPE!', x + 16, y + 20);
            }
          }
        }
      }
    }

    // Render Large & Bright Room Header Labels
    ctx.save();
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 8;
    Object.values(this.rooms).forEach(rm => {
      ctx.shadowColor = rm.theme === 'lab' ? '#06b6d4' : rm.theme === 'library' ? '#f59e0b' : '#c084fc';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(rm.name, rm.labelX * TILE_SIZE, rm.labelY * TILE_SIZE);
    });
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('⚡ MAIN HALLWAY ⚡', 12.5 * TILE_SIZE, 8.8 * TILE_SIZE);
    ctx.restore();

    // Flashlight & Ambient Darkness Vignette
    if (player) {
      this.drawFlashlight(ctx, time, player);
    }
  }

  // Soft Radial Flashlight with Ambient Vignette
  drawFlashlight(ctx, time, player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const flicker = Math.sin(time * 0.012) * 5;

    // Radius tuned for smooth gameplay navigation
    let radius = 320 + flicker; // Default soft ambient vignette
    let outerDarkness = 0.55;

    if (this.level === 2) {
      radius = 260 + flicker;
      outerDarkness = 0.75;
    } else if (this.level >= 3) {
      radius = 195 + flicker;
      outerDarkness = 0.94;
    }

    ctx.save();
    const grad = ctx.createRadialGradient(px, py, radius * 0.25, px, py, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.65, `rgba(4, 7, 16, ${outerDarkness * 0.4})`);
    grad.addColorStop(1, `rgba(4, 7, 16, ${outerDarkness})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    ctx.restore();
  }
}
