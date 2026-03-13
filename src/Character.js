/**
 * Character.js — tile-based character with A* pathfinding and state machine.
 * Pure JS, no Phaser dependency. Sprite/label references are set externally.
 */

const TILE_SIZE = 48;

// ─── A* pathfinding ───────────────────────────────────────────────────────────

function heuristic(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Find a path from (startX, startY) to (goalX, goalY) on a walkable grid.
 * @param {boolean[][]} walkable  - walkable[row][col]
 * @param {number} cols
 * @param {number} rows
 * @returns {Array<{tx,ty}>|null}  - list of steps NOT including start; null if no path
 */
function findPath(walkable, cols, rows, startX, startY, goalX, goalY) {
  if (startX === goalX && startY === goalY) return [];
  if (!walkable[startY]?.[startX] || !walkable[goalY]?.[goalX]) return null;

  const key = (x, y) => x * 1000 + y;

  const open = new Map();
  const closed = new Set();

  const startNode = { x: startX, y: startY, g: 0, h: heuristic(startX, startY, goalX, goalY), parent: null };
  open.set(key(startX, startY), startNode);

  while (open.size > 0) {
    // Pick node with lowest f = g + h
    let current = null;
    for (const node of open.values()) {
      if (!current || node.g + node.h < current.g + current.h) current = node;
    }

    if (current.x === goalX && current.y === goalY) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node.parent) {
        path.unshift({ tx: node.x, ty: node.y });
        node = node.parent;
      }
      return path;
    }

    open.delete(key(current.x, current.y));
    closed.add(key(current.x, current.y));

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x,     y: current.y + 1 },
      { x: current.x,     y: current.y - 1 },
    ];

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
      if (!walkable[n.y]?.[n.x]) continue;
      if (closed.has(key(n.x, n.y))) continue;

      const g = current.g + 1;
      const existing = open.get(key(n.x, n.y));
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.parent = current;
        }
      } else {
        open.set(key(n.x, n.y), {
          x: n.x, y: n.y,
          g, h: heuristic(n.x, n.y, goalX, goalY),
          parent: current,
        });
      }
    }
  }

  return null; // no path
}

// ─── Character ────────────────────────────────────────────────────────────────

export class Character {
  /**
   * @param {object} config
   * @param {string}   config.name        - sprite key prefix (e.g. 'Amelia')
   * @param {string}   config.label       - display name (e.g. 'Maple')
   * @param {number}   config.tx          - starting tile X
   * @param {number}   config.ty          - starting tile Y
   * @param {boolean[][]} config.walkable - walkable grid [row][col]
   * @param {number}   config.gridCols
   * @param {number}   config.gridRows
   * @param {object}   [config.sprite]    - Phaser sprite (set after construction)
   * @param {object}   [config.nameLabel] - Phaser Text object
   * @param {number}   [config.moveSpeed] - tiles per second (default 2)
   */
  constructor(config) {
    this.name      = config.name;
    this.label     = config.label;
    this.sprite    = config.sprite    || null;
    this.nameLabel = config.nameLabel || null;

    this.tx     = config.tx;
    this.ty     = config.ty;
    this.prevTx = config.tx;
    this.prevTy = config.ty;

    this.path        = [];
    this.moveProgress = 0;
    this.moveSpeed   = config.moveSpeed || 2; // tiles/sec

    // State: 'idle' | 'walking' | 'interacting' | 'talking'
    this.action = 'idle';
    this.facing = 'down';

    // Wander: timer counts DOWN; engine starts wander when <= 0
    this.wanderTimer = 3000 + Math.random() * 5000; // 3–8 s

    // Interaction
    this.interactTimer    = 0;
    this.interactTimerMax = 0; // initial duration; used by UI for progress bar
    this.interactTarget   = null;

    // Personality stats (0–100)
    this.mood   = 100;
    this.energy = 100;

    // Optional dialogue driven by AI
    this.currentDialogue = null;
    this.dialogueTimer   = 0;

    // Preset dialogue lines (used for random speech bubbles)
    this.dialogue     = config.dialogue || [];
    // Counts down; when it hits 0 Engine sets pendingSpeech
    this.speechTimer  = 20000 + Math.random() * 20000; // 20–40 s
    // Scene reads this each frame and shows a bubble, then clears it
    this.pendingSpeech = null;

    this.walkable  = config.walkable;
    this.gridCols  = config.gridCols;
    this.gridRows  = config.gridRows;

    // Object interaction targeting — set by engine, cleared on arrival
    this.targetObjectId = null;
    this.pendingAction  = null;

    // Fallback/re-routing: counts down; engine updates talk route when <= 0
    this._talkRetargetTimer = 0;

    // Deadlock escape: counts consecutive failed wander attempts; resets on success
    this._failedMoveCount = 0;

    // Talk targeting — set by AIEngine when walking to meet another character
    this.pendingTalkTarget   = null;  // Character ref awaiting arrival
    this.pendingTalkDialogue = null;  // What A will say when conversation starts
    this.pendingTalkResponse = null;  // What B will say when conversation starts

    // Active conversation state
    this.talkTimer    = 0;
    this.talkTimerMax = 0;
    this.talkTarget   = null;  // Character ref of current conversation partner
  }

  // ── Computed pixel position (Phaser setOrigin(0.5, 1) — feet at py) ─────────

  get px() {
    if (this.path.length === 0) {
      return this.tx * TILE_SIZE + TILE_SIZE / 2;
    }
    const next = this.path[0];
    return (this.prevTx + (next.tx - this.prevTx) * this.moveProgress) * TILE_SIZE + TILE_SIZE / 2;
  }

  get py() {
    if (this.path.length === 0) {
      return (this.ty + 1) * TILE_SIZE;
    }
    const next = this.path[0];
    return (this.prevTy + (next.ty - this.prevTy) * this.moveProgress + 1) * TILE_SIZE;
  }

  // ── Movement ─────────────────────────────────────────────────────────────────

  /**
   * @param {number} goalTx
   * @param {number} goalTy
   * @param {boolean[][]} [walkable] - optional dynamic walkable grid; defaults to this.walkable
   */
  moveTo(goalTx, goalTy, walkable = this.walkable) {
    const sx = Math.round(this.tx);
    const sy = Math.round(this.ty);
    const path = findPath(walkable, this.gridCols, this.gridRows, sx, sy, goalTx, goalTy);

    if (path && path.length > 0) {
      this.path         = path;
      this.prevTx       = sx;
      this.prevTy       = sy;
      this.moveProgress = 0;
      this.action       = 'walking';

      // Reset deadlock counter on successful path
      this._failedMoveCount = 0;

      // Set initial facing from first step
      this._updateFacingFromNextTile();
      this._playWalkAnim();
      return true;
    }
    return false;
  }

  /** Convenience wrapper — start interaction with a named object. */
  startInteraction(objectId, durationMs, animType) {
    this.startInteract(objectId, durationMs, animType);
  }

  startInteract(target, durationMs, animType) {
    this.action           = 'interacting';
    this.interactTarget   = target;
    this.interactTimer    = durationMs;
    this.interactTimerMax = durationMs;
    if (this.sprite) {
      const interactKey = animType ? `${this.name}_interact_${animType}` : null;
      if (interactKey && this.sprite.anims.exists(interactKey)) {
        this.sprite.play(interactKey, true);
      } else {
        // Use directional idle so the character faces the object
        this._playDirectionalIdle();
      }
    }
  }

  /** Enter a shared talking state with `partner` for `durationMs` milliseconds. */
  startTalk(partner, durationMs) {
    // Stop any current movement
    this.path        = [];
    this.moveProgress = 0;

    this.action       = 'talking';
    this.talkTarget   = partner;
    this.talkTimer    = durationMs;
    this.talkTimerMax = durationMs;

    // Clear any pending object interaction targeting
    this.targetObjectId      = null;
    this.pendingAction       = null;
    // Clear any pending talk targeting (e.g. B was also walking to someone)
    this.pendingTalkTarget   = null;
    this.pendingTalkDialogue = null;
    this.pendingTalkResponse = null;

    // Play directional idle so the character visually faces the right way
    this._playDirectionalIdle();
  }

  // ── Per-frame update ──────────────────────────────────────────────────────────

  update(deltaMs) {
    if (this.action === 'walking' && this.path.length > 0) {
      const tileDurationMs = 1000 / this.moveSpeed;
      this.moveProgress += deltaMs / tileDurationMs;

      // Advance tiles
      while (this.moveProgress >= 1 && this.path.length > 0) {
        this.moveProgress -= 1;
        const arrived = this.path.shift();
        this.prevTx = arrived.tx;
        this.prevTy = arrived.ty;
        this.tx     = arrived.tx;
        this.ty     = arrived.ty;
      }

      // Update facing after tile advance so animation matches the current movement direction
      this._updateFacingFromNextTile();

      if (this.path.length === 0) {
        this.moveProgress = 0;
        this.action       = 'idle';
        this.wanderTimer  = 3000 + Math.random() * 5000;
        this._playAnim('idle');
      } else {
        this._playWalkAnim();
      }
    } else if (this.action === 'idle') {
      this.wanderTimer -= deltaMs;
      // Ensure idle animation is always playing in idle state (handles external action resets)
      this._playAnim('idle');
    } else if (this.action === 'interacting') {
      this.interactTimer -= deltaMs;
      if (this.interactTimer <= 0) {
        this.action        = 'idle';
        this.interactTarget = null;
        this.wanderTimer   = 3000 + Math.random() * 5000;
        this._playAnim('idle');
      }
    } else if (this.action === 'talking') {
      this.talkTimer -= deltaMs;
      if (this.talkTimer <= 0) {
        this.action      = 'idle';
        this.talkTarget  = null;
        this.wanderTimer = 3000 + Math.random() * 5000;
        this._playAnim('idle');
      }
    }

    // Tick dialogue
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= deltaMs;
      if (this.dialogueTimer <= 0) this.currentDialogue = null;
    }

    // Sync Phaser sprite
    if (this.sprite) {
      this.sprite.x = this.px;
      this.sprite.y = this.py;
    }

    if (this.nameLabel && this.sprite) {
      this.nameLabel.setPosition(this.sprite.x, this.sprite.y - 100);
    }
  }

  // ── Perception ───────────────────────────────────────────────────────────────

  /** Returns objects within `radius` tiles. */
  getPerceivedObjects(objects, radius = 4) {
    return objects.filter(obj => {
      const dx = obj.tx - this.tx;
      const dy = obj.ty - this.ty;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  // ── Animation helpers ─────────────────────────────────────────────────────────

  _updateFacingFromNextTile() {
    if (this.path.length === 0) return;
    const next = this.path[0];
    const dx   = next.tx - this.tx;
    const dy   = next.ty - this.ty;
    if (Math.abs(dx) >= Math.abs(dy)) {
      this.facing = dx >= 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }
  }

  _playAnim(type) {
    if (!this.sprite) return;
    const key = type === 'idle'
      ? `${this.name}_idle_anim`
      : `${this.name}_walk_${this.facing}`;
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key, true);
    }
    this.sprite.flipX = (type === 'walk' && this.facing === 'left');
  }

  /** Play the directional idle animation matching this.facing. */
  _playDirectionalIdle() {
    if (!this.sprite) return;
    const key = `${this.name}_idle_${this.facing}`;
    // Use scene.anims (global manager) — sprite.anims.exists only knows previously played keys
    const manager = this.sprite.scene?.anims;
    if (manager?.exists(key)) {
      if (this.sprite.anims.currentAnim?.key !== key) {
        this.sprite.play(key, true);
      }
      this.sprite.flipX = false;
    } else {
      // Fallback to generic idle
      this._playAnim('idle');
    }
  }

  _playWalkAnim() {
    this._playAnim('walk');
  }
}
