import { Character }         from './Character.js';
import { SimulationEngine } from './Engine.js';
import { AIEngine }          from './AIEngine.js';
import { showSpeech }        from './speechBubble.js';
import { OBJECT_DEFS }       from './objects.js';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TILE_SIZE  = 48;
const GRID_COLS  = 19;
const GRID_ROWS  = 13;

// Walk spritesheet layout (2304×864, 48 cols × 9 rows, frame size 48×96)
// Frame number = row * 48 + col.
//   Row 0 → placeholder thumbnails (NOT usable — too small)
//   Row 1 → up   (6 frames: 48–53)
//   Row 3 → right (6 frames: 144–149)
//   Row 6 → down  (6 frames: 288–293)
// LEFT reuses the RIGHT frames with flipX applied at runtime.
const WALK_DIRS = [
  { key: 'up',    start:  48, end:  53 },
  { key: 'down',  start: 288, end: 293 },
  { key: 'right', start: 144, end: 149 },
  { key: 'left',  start: 144, end: 149 }, // mirrored via flipX
];

// Character definitions — tile positions within walkable area (col 1–17, row 2–9)
const CHARS = [
  {
    name: 'Amelia', label: 'Maple', tx: 6, ty: 7,
    dialogue: ['Perfect brew today~', 'Want some tea?', 'The kitchen smells amazing'],
  },
  {
    name: 'Lucy', label: 'Sol', tx: 10, ty: 6,
    dialogue: ['The bonsai looks healthy', 'I should water the plants', 'Such peaceful light...'],
  },
  {
    name: 'Ash', label: 'Nyx', tx: 13, ty: 5,
    dialogue: ['I need more paint...', 'This light is perfect for sketching', 'Where did I put my brush?'],
  },
];

// ─── Walkable grid ─────────────────────────────────────────────────────────────
// 19 cols × 13 rows.
// Interior floor (main room): cols 1–17, rows 2–9.
// Rows 0–1 = roof/top wall; rows 10–12 = genkan / exterior — not walkable.

function buildWalkableGrid() {
  const grid = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const r = [];
    for (let col = 0; col < GRID_COLS; col++) {
      r.push(col >= 1 && col <= 17 && row >= 2 && row <= 9);
    }
    grid.push(r);
  }
  // Mark tiles occupied by objects as non-walkable
  for (const def of OBJECT_DEFS) {
    const { tx, ty } = def.position;
    if (ty >= 0 && ty < GRID_ROWS && tx >= 0 && tx < GRID_COLS) {
      grid[ty][tx] = false;
    }
  }
  return grid;
}

// ─── Scene ─────────────────────────────────────────────────────────────────────

export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  // ── Preload ──────────────────────────────────────────────────────────────────

  preload() {
    this.load.image('jp', 'assets/designs/Japanese_Home_1_preview_48x48.png');

    // Object state sprites (one image per visual state)
    [
      'stove_off', 'stove_on',
      'book_closed', 'book_open',
      'easel_blank', 'easel_painting', 'easel_finished',
      'cup_empty', 'cup_full',
    ].forEach(key => this.load.image(key, `assets/sprites/${key}.png`));

    // Interaction animation types → spritesheets (48×96 frames, 6 frames each)
    const INTERACT_ANIMS = ['reading_48x48', 'sit_48x48', 'sit2_48x48', 'phone_48x48'];

    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      this.load.spritesheet(`${name}_idle`, `assets/characters/${name}_idle.png`, {
        frameWidth: 48, frameHeight: 96,
      });
      this.load.spritesheet(`${name}_walk`, `assets/characters/${name}_walk.png`, {
        frameWidth: 48, frameHeight: 96,
      });
      INTERACT_ANIMS.forEach(anim => {
        this.load.spritesheet(`${name}_${anim}`, `assets/characters/${name}_${anim}.png`, {
          frameWidth: 48, frameHeight: 96,
        });
      });
    });
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  create() {
    // Background
    const img = this.add.image(0, 0, 'jp').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, img.width, img.height);
    this.cameras.main.centerOn(img.width / 2, img.height / 2);

    // Object state sprites — overlaid on the background tile, swapped on state transitions
    // Objects with spriteMap: stove, tea_set, bookshelf, easel
    this._objectSprites = {};
    for (const def of OBJECT_DEFS) {
      if (!def.spriteMap) continue;
      const initKey = def.spriteMap[def.state] ?? null;
      if (!initKey) continue;
      const px = def.position.tx * TILE_SIZE;
      const py = def.position.ty * TILE_SIZE;
      this._objectSprites[def.id] = this.add.image(px, py, initKey)
        .setOrigin(0, 0)
        .setDepth(1);
    }

    // Interaction animation type → Phaser anim key suffix and spritesheet key suffix
    const INTERACT_ANIM_DEFS = [
      { type: 'reading', sheetKey: 'reading_48x48' },
      { type: 'sit',     sheetKey: 'sit_48x48'     },
      { type: 'sit2',    sheetKey: 'sit2_48x48'    },
      { type: 'phone',   sheetKey: 'phone_48x48'   },
    ];

    // Animations
    // Idle spritesheet layout: 24 frames (4 directions × 6 frames)
    //   down  0–5, left 6–11, right 12–17, up 18–23
    const IDLE_DIRS = [
      { key: 'down',  start:  0, end:  5 },
      { key: 'left',  start:  6, end: 11 },
      { key: 'right', start: 12, end: 17 },
      { key: 'up',    start: 18, end: 23 },
    ];

    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      // Generic idle (backwards-compat, always faces down)
      this.anims.create({
        key: `${name}_idle_anim`,
        frames: this.anims.generateFrameNumbers(`${name}_idle`, { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });

      // Directional idle animations
      IDLE_DIRS.forEach(({ key, start, end }) => {
        this.anims.create({
          key: `${name}_idle_${key}`,
          frames: this.anims.generateFrameNumbers(`${name}_idle`, { start, end }),
          frameRate: 6,
          repeat: -1,
        });
      });

      WALK_DIRS.forEach(({ key, start, end }) => {
        this.anims.create({
          key: `${name}_walk_${key}`,
          frames: this.anims.generateFrameNumbers(`${name}_walk`, { start, end }),
          frameRate: 8,
          repeat: -1,
        });
      });

      // Interaction animations (6-frame loop, 6 fps)
      INTERACT_ANIM_DEFS.forEach(({ type, sheetKey }) => {
        this.anims.create({
          key: `${name}_interact_${type}`,
          frames: this.anims.generateFrameNumbers(`${name}_${sheetKey}`, { start: 0, end: 5 }),
          frameRate: 6,
          repeat: -1,
        });
      });
    });

    // Engine
    const walkable = buildWalkableGrid();
    this.engine = new SimulationEngine({
      walkable,
      gridCols: GRID_COLS,
      gridRows: GRID_ROWS,
      aiEngine: new AIEngine({
        endpoint: '/api/llm',
        model: 'anthropic/claude-3-haiku',
        decisionIntervalMs: 30_000,
      }),
    });

    // Characters
    CHARS.forEach(({ name, label, tx, ty, dialogue }) => {
      const initPx = tx * TILE_SIZE + TILE_SIZE / 2;
      const initPy = (ty + 1) * TILE_SIZE;

      const sprite = this.add.sprite(initPx, initPy, `${name}_idle`)
        .setOrigin(0.5, 1)
        .setDepth(10);
      sprite.play(`${name}_idle_anim`);

      const nameLabel = this.add.text(initPx, initPy - 100, label, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(11);

      const char = new Character({
        name, label, tx, ty, sprite, nameLabel,
        walkable, gridCols: GRID_COLS, gridRows: GRID_ROWS,
        dialogue,
      });

      this.engine.addCharacter(char);
    });

    // Expose engine for the debug overlay panel
    window._gameEngine = this.engine;

    // Sim clock display (screen-fixed, top-left)
    this.clockText = this.add.text(8, 8, '', {
      fontSize: '13px',
      color: '#ffe8a3',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(20).setScrollFactor(0);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(_time, delta) {
    this.engine.update(delta);
    this.clockText.setText(this.engine.getSimTimeString());

    // Show speech bubbles queued by the engine
    for (const char of this.engine.characters) {
      if (char.pendingSpeech && char.sprite) {
        showSpeech(this, char.sprite, char.pendingSpeech);
        char.pendingSpeech = null;
      }
    }

    // Process object state-transition events: swap sprites and float emojis
    if (this.engine.pendingEvents.length > 0) {
      for (const ev of this.engine.pendingEvents) {
        const obj = this.engine.objectEngine.getById(ev.objectId);
        if (!obj) continue;

        // Swap object sprite texture on state change
        if (ev.spriteKey && this._objectSprites[ev.objectId]) {
          this._objectSprites[ev.objectId].setTexture(ev.spriteKey);
        }

        // Float emoji above the object
        if (ev.emoji) {
          const px = obj.tx * TILE_SIZE + TILE_SIZE / 2;
          const py = obj.ty * TILE_SIZE;
          const label = this.add.text(px, py, ev.emoji, { fontSize: '24px' }).setDepth(25);
          this.tweens.add({
            targets: label,
            y:       label.y - 40,
            alpha:   0,
            duration: 2000,
            onComplete: () => label.destroy(),
          });
        }
      }
      this.engine.pendingEvents = [];
    }
  }
}
