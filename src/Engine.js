/**
 * Engine.js — SimulationEngine: manages characters, objects, sim clock, and
 * default random-wander behaviour when AI is not connected.
 */

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
    this.objects    = [];

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

  addObject(obj) {
    this.objects.push(obj);
  }

  // ── Main update loop ─────────────────────────────────────────────────────────

  update(deltaMs) {
    // Advance sim clock
    this.simTimeMs += deltaMs * this.simSpeed;

    // Optional AI decisions
    if (this.aiEngine) {
      this.aiEngine.update(deltaMs, this.characters, this.objects, {
        timeString: this.getSimTimeString(),
      });
    }

    for (const char of this.characters) {
      // Trigger random wander when idle and timer expired
      if (char.action === 'idle' && char.wanderTimer <= 0) {
        this._doWander(char);
      }

      // Per-character update (movement, animations, sprite sync)
      char.update(deltaMs);
    }

    // Tick object states (placeholder — objects don't animate yet)
    for (const obj of this.objects) {
      if (obj.busyTimer > 0) {
        obj.busyTimer -= deltaMs;
        if (obj.busyTimer <= 0) {
          obj.state     = 'idle';
          obj.busyTimer = 0;
        }
      }
    }
  }

  // ── Wander ───────────────────────────────────────────────────────────────────

  _doWander(char) {
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
      // Couldn't path anywhere — wait a bit before retrying
      char.wanderTimer = 2000;
    }
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
