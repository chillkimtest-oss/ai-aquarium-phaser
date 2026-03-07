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
        pushEvent: (ev) => this.pendingEvents.push(ev),
      });
    }

    // Tick object state machines; collect auto-transition events
    const objEvents = this.objectEngine.tick(deltaMs);
    for (const ev of objEvents) {
      if (ev.emoji) this.pendingEvents.push(ev);
    }

    for (const char of this.characters) {
      // Save pre-update state to detect interaction-end transitions
      const prevAction        = char.action;
      const prevInteractTarget = char.interactTarget;

      // Handle arrival: character reached target object tile
      if (char.action === 'idle' && char.targetObjectId) {
        this._handleObjectArrival(char);
      }

      // Handle arrival: character reached talk target
      if (char.action === 'idle' && char.pendingTalkTarget) {
        this._handleTalkArrival(char);
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

      // Detect interaction end: release slot so other characters can use the object
      if (prevAction === 'interacting' && char.action !== 'interacting' && prevInteractTarget) {
        this.objectEngine.release(prevInteractTarget, char.name);
      }
    }
  }

  // ── Object interaction ────────────────────────────────────────────────────────

  /**
   * Called when a character arrives at an object's adjacent tile.
   * Fires the 'use' transition and puts the character into 'interacting' state.
   */
  _handleObjectArrival(char) {
    const objectId = char.targetObjectId;
    const event = this.objectEngine.interact(objectId, char.pendingAction || 'use');

    if (event) {
      // Convert reservation → active occupancy
      this.objectEngine.arrive(objectId, char.name);

      const obj = this.objectEngine.getById(objectId);

      // Hold the character for the full auto_next duration if the new state has one;
      // otherwise fall back to the object's generic interactMs.
      let holdMs = obj ? obj.interactMs : 8000;
      if (obj && event.state) {
        const stateDef = obj.states[event.state];
        if (stateDef?.auto_next?.after) {
          holdMs = stateDef.auto_next.after * 1000;
        }
      }

      char.startInteraction(objectId, holdMs);

      if (event.speech) {
        char.pendingSpeech = event.speech;
      }

      if (event.emoji) {
        this.pendingEvents.push(event);
      }
    } else {
      // No valid transition — release the reservation
      this.objectEngine.release(objectId, char.name);
    }
    // Always clear targeting so we don't re-fire on next idle frame
    char.targetObjectId = null;
    char.pendingAction  = null;
  }

  // ── Talk handshake ────────────────────────────────────────────────────────────

  /**
   * Called when a character arrives at the tile adjacent to their talk target.
   * Re-evaluates B's availability; starts conversation or logs rejection.
   */
  _handleTalkArrival(char) {
    const target = char.pendingTalkTarget;
    char.pendingTalkTarget = null;

    // Re-check availability: accept if idle or walking, reject if busy
    const canTalk = target.action === 'idle' || target.action === 'walking';

    if (!canTalk) {
      this.pendingEvents.push({
        type:           'talk_rejected',
        initiatorLabel: char.label,
        targetLabel:    target.label,
      });
      char.wanderTimer = 3000 + Math.random() * 5000;
      return;
    }

    this._startConversation(char, target);
  }

  /**
   * Configurable conversation duration range (ms).
   * Defaults to 10–15 s; override via constructor config.
   */
  get _talkDurationMs() {
    return 10_000 + Math.random() * 5_000;
  }

  /**
   * Synchronise charA and charB into a shared 'talking' state.
   * Both face each other, AI timers are paused (via action check in AIEngine),
   * and conversation ends naturally when the timer expires.
   */
  _startConversation(charA, charB) {
    const duration = this._talkDurationMs;

    // Face each other
    const dx = Math.round(charB.tx) - Math.round(charA.tx);
    const dy = Math.round(charB.ty) - Math.round(charA.ty);
    if (Math.abs(dx) >= Math.abs(dy)) {
      charA.facing = dx >= 0 ? 'right' : 'left';
      charB.facing = dx >= 0 ? 'left'  : 'right';
    } else {
      charA.facing = dy >= 0 ? 'down' : 'up';
      charB.facing = dy >= 0 ? 'up'   : 'down';
    }

    // Transfer queued dialogue to speech bubbles
    if (charA.pendingTalkDialogue) {
      charA.pendingSpeech          = charA.pendingTalkDialogue;
      charA.pendingTalkDialogue    = null;
    }
    if (charA.pendingTalkResponse) {
      charB.pendingSpeech          = charA.pendingTalkResponse;
      charA.pendingTalkResponse    = null;
    }

    charA.startTalk(charB, duration);
    charB.startTalk(charA, duration);

    this.pendingEvents.push({
      type:           'conversation_start',
      initiatorLabel: charA.label,
      targetLabel:    charB.label,
    });
  }

  // ── Wander ───────────────────────────────────────────────────────────────────

  _doWander(char) {
    // 30% chance: walk to a random interactive object instead of wandering freely
    if (Math.random() < 0.3) {
      const objects = this.objectEngine.getAll();
      if (objects.length > 0) {
        // Shuffle and try each until one has an available slot and a reachable adjacent tile
        const shuffled = objects.slice().sort(() => Math.random() - 0.5);
        for (const obj of shuffled) {
          if (obj.isFull()) continue; // skip objects at capacity
          const tile = this._findAdjacentWalkable(obj.tx, obj.ty);
          if (tile && char.moveTo(tile.tx, tile.ty)) {
            obj.reserve(char.name); // claim a slot before walking
            char.targetObjectId = obj.id;
            char.pendingAction  = 'use';
            return;
          }
        }
        // All objects full or unreachable — fall through to random wander
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
