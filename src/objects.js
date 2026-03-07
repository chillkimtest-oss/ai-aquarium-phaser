/**
 * objects.js — interactive object state machines for the Japanese Home scene.
 *
 * Each object definition has:
 *   { id, name, position: { tx, ty }, interactMs, state, states }
 *
 * Each state can have:
 *   transitions: { use: { next: 'stateName' } }   — triggered by interact()
 *   auto_next:   { state: 'stateName', after: N }  — fires automatically after N seconds
 *   speech:      'string'                           — shown as character speech bubble
 *   emoji:       '🍳'                               — floating emoji on transition
 */

// ── Object definitions ────────────────────────────────────────────────────────
// Japanese Home (912×642, 19×13 tiles, 48px each).
// Walkable interior: cols 1–17, rows 2–9.

export const OBJECT_DEFS = [
  {
    id: 'stove',
    name: 'stove',
    capacity: 1,
    position: { tx: 3, ty: 3 },
    interactMs: 8000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'cooking' } },
      },
      cooking: {
        speech: 'Let me cook something...',
        auto_next: { state: 'done', after: 30 },
      },
      done: {
        emoji: '🍳',
        speech: "Dinner's ready! 🍳",
        auto_next: { state: 'idle', after: 60 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'fridge',
    name: 'fridge',
    capacity: 1,
    position: { tx: 2, ty: 3 },
    interactMs: 5000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'open' } },
      },
      open: {
        speech: 'Hmm, what to eat...',
        auto_next: { state: 'idle', after: 10 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'tea_set',
    name: 'tea set',
    capacity: 1,
    position: { tx: 5, ty: 5 },
    interactMs: 6000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'brewing' } },
      },
      brewing: {
        speech: 'Brewing some tea~',
        auto_next: { state: 'ready', after: 15 },
      },
      ready: {
        emoji: '🍵',
        speech: 'Tea is ready~',
        auto_next: { state: 'idle', after: 45 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'kotatsu',
    name: 'kotatsu',
    capacity: 2,
    position: { tx: 6, ty: 6 },
    interactMs: 12000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'cozy' } },
      },
      cozy: {
        speech: 'So warm and cozy under here...',
        auto_next: { state: 'idle', after: 60 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'tv',
    name: 'TV',
    capacity: 2,
    position: { tx: 9, ty: 3 },
    interactMs: 10000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'on' } },
      },
      on: {
        speech: 'This show is interesting...',
        auto_next: { state: 'idle', after: 45 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'bookshelf',
    name: 'bookshelf',
    capacity: 1,
    position: { tx: 15, ty: 3 },
    interactMs: 10000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'reading' } },
      },
      reading: {
        speech: 'This is a good chapter...',
        auto_next: { state: 'idle', after: 40 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'desk',
    name: 'desk',
    capacity: 1,
    position: { tx: 14, ty: 5 },
    interactMs: 8000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'working' } },
      },
      working: {
        speech: 'Time to get some work done.',
        auto_next: { state: 'idle', after: 35 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'bed',
    name: 'bed',
    capacity: 1,
    position: { tx: 16, ty: 5 },
    interactMs: 15000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'resting' } },
      },
      resting: {
        emoji: '💤',
        speech: 'Just a little nap...',
        auto_next: { state: 'idle', after: 60 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'easel',
    name: 'easel',
    capacity: 1,
    position: { tx: 2, ty: 7 },
    interactMs: 12000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'painting' } },
      },
      painting: {
        speech: 'This light is perfect for painting~',
        auto_next: { state: 'done', after: 45 },
      },
      done: {
        emoji: '🎨',
        speech: 'My masterpiece is complete!',
        auto_next: { state: 'idle', after: 30 },
        transitions: { use: { next: 'idle' } },
      },
    },
  },
  {
    id: 'bonsai',
    name: 'bonsai',
    capacity: 1,
    position: { tx: 11, ty: 8 },
    interactMs: 5000,
    state: 'idle',
    states: {
      idle: {
        transitions: { use: { next: 'tending' } },
      },
      tending: {
        speech: 'The bonsai looks healthy today.',
        auto_next: { state: 'idle', after: 12 },
      },
    },
  },
];

// ── ObjectInstance ────────────────────────────────────────────────────────────

class ObjectInstance {
  constructor(def) {
    this.id        = def.id;
    this.name      = def.name;
    this.label     = def.name;           // compat for AIEngine
    this.position  = def.position;
    this.tx        = def.position.tx;    // compat for AIEngine distance checks
    this.ty        = def.position.ty;
    this.states    = def.states;
    this.state     = def.state || 'idle';
    this.interactMs = def.interactMs || 8000;
    this.autoTimer = 0;
    this._resetAutoTimer();

    // Slot system
    this.capacity      = def.capacity ?? 1;
    this._reservations = new Set(); // charNames walking toward this object
    this._occupants    = new Set(); // charNames actively interacting
  }

  /** True if no more slots are available (reserved + occupied >= capacity). */
  isFull() {
    return this._reservations.size + this._occupants.size >= this.capacity;
  }

  /**
   * Reserve a slot for charName before they start walking.
   * Returns true if the reservation succeeded, false if the object is full.
   */
  reserve(charName) {
    if (this.isFull()) return false;
    this._reservations.add(charName);
    return true;
  }

  /**
   * Called when charName arrives at the object.
   * Converts the reservation to an active occupancy.
   */
  arrive(charName) {
    this._reservations.delete(charName);
    this._occupants.add(charName);
  }

  /**
   * Release a slot when the character finishes interacting or abandons the walk.
   */
  release(charName) {
    this._reservations.delete(charName);
    this._occupants.delete(charName);
  }

  /** Clear all reservations and occupancies (used on sim reset). */
  clearSlots() {
    this._reservations.clear();
    this._occupants.clear();
  }

  /**
   * Returns current slot occupancy info.
   * @returns {{ capacity, reserved, occupied, available }}
   */
  getSlotInfo() {
    return {
      capacity:  this.capacity,
      reserved:  this._reservations.size,
      occupied:  this._occupants.size,
      available: this.capacity - this._reservations.size - this._occupants.size,
    };
  }

  _resetAutoTimer() {
    const s = this.states[this.state];
    this.autoTimer = s?.auto_next ? s.auto_next.after * 1000 : 0;
  }

  /**
   * Trigger an interaction action (e.g. 'use').
   * @returns {{ objectId, state, speech, emoji }|null}
   */
  interact(action = 'use') {
    const s  = this.states[this.state];
    const tr = s?.transitions?.[action];
    if (!tr) return null;

    this.state = tr.next;
    this._resetAutoTimer();

    const ns = this.states[this.state];
    return {
      objectId: this.id,
      state:    this.state,
      speech:   ns?.speech || null,
      emoji:    ns?.emoji  || null,
    };
  }

  /**
   * Advance auto_next timers.
   * @returns {{ objectId, state, emoji, auto: true }|null}
   */
  tick(deltaMs) {
    if (this.autoTimer <= 0) return null;

    this.autoTimer -= deltaMs;
    if (this.autoTimer > 0) return null;

    const s = this.states[this.state];
    if (!s?.auto_next) return null;

    this.state = s.auto_next.state;
    this._resetAutoTimer();

    const ns = this.states[this.state];
    return {
      objectId: this.id,
      state:    this.state,
      emoji:    ns?.emoji || null,
      auto:     true,
    };
  }
}

// ── ObjectEngine ──────────────────────────────────────────────────────────────

export class ObjectEngine {
  constructor() {
    this._map = new Map(); // id → ObjectInstance
  }

  addObjects(defs) {
    for (const def of defs) {
      this._map.set(def.id, new ObjectInstance(def));
    }
  }

  /**
   * Tick all object timers. Returns any events that fired this frame.
   * @returns {Array<{ objectId, state, emoji, auto }>}
   */
  tick(deltaMs) {
    const events = [];
    for (const obj of this._map.values()) {
      const ev = obj.tick(deltaMs);
      if (ev) events.push(ev);
    }
    return events;
  }

  /**
   * Trigger an action on an object (e.g. 'use').
   * @returns {{ objectId, state, speech, emoji }|null}
   */
  interact(objectId, action = 'use') {
    return this._map.get(objectId)?.interact(action) ?? null;
  }

  getAll()    { return Array.from(this._map.values()); }
  getById(id) { return this._map.get(id) ?? null; }

  reserve(objectId, charName) { return this._map.get(objectId)?.reserve(charName) ?? false; }
  arrive(objectId, charName)  { this._map.get(objectId)?.arrive(charName); }
  release(objectId, charName) { this._map.get(objectId)?.release(charName); }
  clearSlots(objectId)        { this._map.get(objectId)?.clearSlots(); }
  clearAllSlots()             { for (const obj of this._map.values()) obj.clearSlots(); }
}
