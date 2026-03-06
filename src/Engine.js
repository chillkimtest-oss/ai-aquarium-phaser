/**
 * Engine.js — SimulationEngine: manages characters, object state machines, and
 * default random-wander behaviour (with 30% chance of object interaction).
 */

import { ObjectEngine, OBJECT_DEFS } from './objects.js';

export class SimulationEngine {
  /**
   * @param {object}      config
   * @param {boolean[][]} config.walkable   - walkable[row][col]
   * @param {number}      config.gridCols
   * @param {number}      config.gridRows
   * @param {object}      [config.aiEngine] - AIEngine instance (optional)
   */
  constructor(config = {}) {
    this.walkable  = config.walkable  || [];
    this.gridCols  = config.gridCols  || 19;
    this.gridRows  = config.gridRows  || 13;
    this.aiEngine  = config.aiEngine  || null;

    this.characters = [];

    // Object state machine engine — pre-loaded with Japanese Home objects
    this.objectEngine = new ObjectEngine();
    this.objectEngine.addObjects(OBJECT_DEFS);

    // Events queued for scene to consume (emoji floats, etc.)
    this.pendingEvents = [];

    // Sim clock — starts at 08:00 AM game-time
    this.simTimeMs = 8 * 60 * 60 * 1000;
    // 1 real second = 60 sim seconds  (1 real min = 1 sim hour)
    this.simSpeed  = 60;

    // Cache walkable tiles list (built lazily)
    this._walkableTiles = null;
  }

  addCharacter(char) {
    this.characters.push(char);
  }

  // ── Main update loop ─────────────────────────────────────────────────────────

  update(deltaMs) {
    // Advance sim clock
    this.simTimeMs += deltaMs * this.simSpeed;

    // Optional AI decisions — pass live object list so AI sees current states
    if (this.aiEngine) {
      this.aiEngine.update(deltaMs, this.characters, this.objectEngine.getAll(), {
        timeString: this.getSimTimeString(),
        findAdjacentWalkable: this._findAdjacentWalkable.bind(this),
      });
    }

    // Tick object state machines; collect auto-transition events
    const objEvents = this.objectEngine.tick(deltaMs);
    for (const ev of objEvents) {
      if (ev.emoji) this.pendingEvents.push(ev);
    }

    for (const char of this.characters) {
      // Handle arrival: character reached target object tile
      if (char.action === 'idle' && char.targetObjectId) {
        this._handleObjectArrival(char);
      }

      // Trigger random wander (or object visit) when idle and timer expired
      if (char.action === 'idle' && char.wanderTimer <= 0) {
        this._doWander(char);
      }

      // Tick speech timer — fire a random line when it expires
      if (char.dialogue.length > 0 && char.pendingSpeech === null) {
        char.speechTimer -= deltaMs;
        if (char.speechTimer <= 0) {
          const idx = Math.floor(Math.random() * char.dialogue.length);
          char.pendingSpeech = char.dialogue[idx];
          char.speechTimer   = 20000 + Math.random() * 20000; // reset 20–40 s
        }
      }

      // Per-character update (movement, animations, sprite sync)
      char.update(deltaMs);
    }
  }

  // ── Object interaction ────────────────────────────────────────────────────────

  /**
   * Called when a character arrives at an object's adjacent tile.
   * Fires the 'use' transition and puts the character into 'interacting' state.
   */
  _handleObjectArrival(char) {
    const event = this.objectEngine.interact(char.targetObjectId, char.pendingAction || 'use');

    if (event) {
      const obj = this.objectEngine.getById(char.targetObjectId);
      char.startInteraction(char.targetObjectId, obj ? obj.interactMs : 8000);

      if (event.speech) {
        char.pendingSpeech = event.speech;
      }

      if (event.emoji) {
        this.pendingEvents.push(event);
      }
    }
    // Always clear targeting so we don't re-fire on next idle frame
    char.targetObjectId = null;
    char.pendingAction  = null;
  }

  // ── Wander ───────────────────────────────────────────────────────────────────

  _doWander(char) {
    // 30% chance: walk to a random interactive object instead of wandering freely
    if (Math.random() < 0.3) {
      const objects = this.objectEngine.getAll();
      if (objects.length > 0) {
        // Shuffle and try each until one yields a reachable adjacent tile
        const shuffled = objects.slice().sort(() => Math.random() - 0.5);
        for (const obj of shuffled) {
          const tile = this._findAdjacentWalkable(obj.tx, obj.ty);
          if (tile && char.moveTo(tile.tx, tile.ty)) {
            char.targetObjectId = obj.id;
            char.pendingAction  = 'use';
            return;
          }
        }
        // All objects unreachable — fall through to random wander
      }
    }

    // Random walkable tile
    const tiles = this._getWalkableTiles();
    if (tiles.length === 0) {
      char.wanderTimer = 2000;
      return;
    }

    const cx = Math.round(char.tx);
    const cy = Math.round(char.ty);

    let moved = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (tile.tx === cx && tile.ty === cy) continue;
      moved = char.moveTo(tile.tx, tile.ty);
      if (moved) break;
    }

    if (!moved) {
      char.wanderTimer = 2000;
    }
  }

  /**
   * Return the first walkable tile cardinally adjacent to (tx, ty), or null.
   */
  _findAdjacentWalkable(tx, ty) {
    const dirs = [
      { tx, ty: ty - 1 },
      { tx, ty: ty + 1 },
      { tx: tx - 1, ty },
      { tx: tx + 1, ty },
    ];
    for (const d of dirs) {
      if (d.tx >= 0 && d.tx < this.gridCols && d.ty >= 0 && d.ty < this.gridRows) {
        if (this.walkable[d.ty]?.[d.tx]) return d;
      }
    }
    return null;
  }

  _getWalkableTiles() {
    if (this._walkableTiles) return this._walkableTiles;
    const tiles = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.walkable[row]?.[col]) tiles.push({ tx: col, ty: row });
      }
    }
    this._walkableTiles = tiles;
    return tiles;
  }

  // ── Sim clock ─────────────────────────────────────────────────────────────────

  getSimTimeString() {
    const totalSec = Math.floor(this.simTimeMs / 1000);
    const hours    = Math.floor(totalSec / 3600) % 24;
    const minutes  = Math.floor((totalSec % 3600) / 60);
    const ampm     = hours >= 12 ? 'PM' : 'AM';
    const h        = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
}
