import { Character }         from './Character.js';
import { SimulationEngine } from './Engine.js';
import { AIEngine }          from './AIEngine.js';
import { showSpeech }        from './speechBubble.js';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TILE_SIZE  = 48;
const GRID_COLS  = 19;
const GRID_ROWS  = 13;

// Walk spritesheet layout (2304×864, 48 cols × 9 rows, frame size 48×96)
// Frame number = row * 48 + col.  Verified by visual inspection:
//   Row 0 → up   (4 frames:  0–3)
//   Row 3 → right (6 frames: 144–149)
//   Row 6 → down  (6 frames: 288–293)
// LEFT reuses the RIGHT frames with flipX applied at runtime.
const WALK_DIRS = [
  { key: 'up',    start:   0, end:   3 },
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
    name: 'Ash', label: 'Nyx', tx: 14, ty: 5,
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
  return grid;
}

// ─── Scene ─────────────────────────────────────────────────────────────────────

export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  // ── Preload ──────────────────────────────────────────────────────────────────

  preload() {
    this.load.image('jp', 'assets/designs/Japanese_Home_1_preview_48x48.png');

    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      this.load.spritesheet(`${name}_idle`, `assets/characters/${name}_idle.png`, {
        frameWidth: 48, frameHeight: 96,
      });
      this.load.spritesheet(`${name}_walk`, `assets/characters/${name}_walk.png`, {
        frameWidth: 48, frameHeight: 96,
      });
    });
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  create() {
    // Background
    const img = this.add.image(0, 0, 'jp').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, img.width, img.height);
    this.cameras.main.centerOn(img.width / 2, img.height / 2);

    // Animations
    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      this.anims.create({
        key: `${name}_idle_anim`,
        frames: this.anims.generateFrameNumbers(`${name}_idle`, { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });

      WALK_DIRS.forEach(({ key, start, end }) => {
        this.anims.create({
          key: `${name}_walk_${key}`,
          frames: this.anims.generateFrameNumbers(`${name}_walk`, { start, end }),
          frameRate: 8,
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

    // Float emoji above objects that completed a transition
    if (this.engine.pendingEvents.length > 0) {
      for (const ev of this.engine.pendingEvents) {
        if (!ev.emoji) continue;
        const obj = this.engine.objectEngine.getById(ev.objectId);
        if (!obj) continue;
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
      this.engine.pendingEvents = [];
    }
  }
}
