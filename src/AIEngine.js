/**
 * AIEngine.js — LLM-driven decision engine.
 *
 * When `endpoint` is null (default) the engine is disabled and characters
 * fall back to random wander controlled by SimulationEngine.
 *
 * To enable, pass an endpoint URL and optionally an API key:
 *   new AIEngine({ endpoint: 'https://api.anthropic.com/v1/messages', apiKey: '...' })
 *
 * The engine polls each character independently on a configurable interval.
 * Responses are expected as JSON with this shape:
 *   { "action": "move|interact|idle|talk",
 *     "targetId": "object_id",               // for interact
 *     "targetTile": { "tx": 5, "ty": 9 },    // for move
 *     "targetCharacter": "character_name",   // for talk
 *     "dialogue": "optional speech",
 *     "targetDialogue": "response from target character", // for talk
 *     "description": "what the character is doing" }
 */

export class AIEngine {
  /**
   * @param {object}  [config]
   * @param {string}  [config.endpoint]            - full URL of LLM API endpoint
   * @param {string}  [config.apiKey]              - bearer token / API key
   * @param {string}  [config.model]               - model ID (for Anthropic-style APIs)
   * @param {number}  [config.decisionIntervalMs]  - ms between decisions per char (default 30 000)
   */
  constructor(config = {}) {
    this.endpoint           = config.endpoint           || null;
    this.apiKey             = config.apiKey             || null;
    this.model              = config.model              || 'claude-sonnet-4-6';
    this.decisionIntervalMs = config.decisionIntervalMs || 30_000;
    this.onDecision         = config.onDecision         || null;

    this.enabled = !!this.endpoint;

    // Per-character countdown timers  { name → ms until next decision }
    this._timers = new Map();
    // Prevent overlapping requests  { name → true }
    this._pending = new Set();
  }

  // ── Called by SimulationEngine each frame ─────────────────────────────────

  update(deltaMs, characters, objects, simState) {
    if (!this.enabled) return;

    for (const char of characters) {
      let t = this._timers.get(char.name) ?? 0;
      t -= deltaMs;

      // Don't make decisions while character is held at an object; let the
      // timer keep ticking so the cooldown UI stays accurate.
      if (t <= 0 && !this._pending.has(char.name) && char.action !== 'interacting') {
        this._timers.set(char.name, this.decisionIntervalMs);
        this._requestDecision(char, characters, objects, simState);
      } else {
        this._timers.set(char.name, t);
      }
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  async _requestDecision(character, characters, objects, simState) {
    this._pending.add(character.name);

    try {
      const nearbyObjects = objects
        .filter(obj => {
          const dx = obj.tx - character.tx;
          const dy = obj.ty - character.ty;
          return Math.sqrt(dx * dx + dy * dy) <= 8;
        })
        .map(o => ({ id: o.id, label: o.label, state: o.state }));

      const nearbyCharacters = characters
        .filter(c => {
          if (c.name === character.name) return false;
          const dx = c.tx - character.tx;
          const dy = c.ty - character.ty;
          return Math.sqrt(dx * dx + dy * dy) <= 8;
        })
        .map(c => ({ name: c.name, label: c.label, tx: Math.round(c.tx), ty: Math.round(c.ty), action: c.action }));

      const systemPrompt =
        `You are ${character.label}, a character in a cosy Japanese home simulation. ` +
        `Decide what to do next based on your mood (${character.mood}/100) and energy (${character.energy}/100). ` +
        `Reply ONLY with valid JSON — no markdown fences, no extra text.`;

      const userPrompt =
        `Sim time: ${simState.timeString}. ` +
        `You are at tile (${Math.round(character.tx)}, ${Math.round(character.ty)}). ` +
        `Current action: ${character.action}. ` +
        `Nearby objects: ${JSON.stringify(nearbyObjects)}. ` +
        `Nearby characters: ${JSON.stringify(nearbyCharacters)}. ` +
        `Choose one action:\n` +
        `  { "action": "move",     "targetTile": {"tx": N, "ty": N}, "dialogue": "...", "description": "..." }\n` +
        `  { "action": "interact", "targetId": "object_id",          "dialogue": "...", "description": "..." }\n` +
        `  { "action": "idle",                                        "dialogue": "...", "description": "..." }\n` +
        `  { "action": "talk",     "targetCharacter": "character_name", "dialogue": "what you say", "targetDialogue": "their response", "description": "..." }`;

      const headers = { 'Content-Type': 'application/json' };

      // Build body — compatible with Anthropic Messages API shape by default;
      // swap for OpenAI chat completions if needed by changing endpoint.
      const body = JSON.stringify({
        model: this.model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const res = await fetch(this.endpoint, { method: 'POST', headers, body });

      if (!res.ok) {
        console.warn(`[AIEngine] ${character.name}: HTTP ${res.status}`);
        return;
      }

      const data = await res.json();

      // Extract text from Anthropic-style response; fall back to OpenAI style
      let text = data?.content?.[0]?.text     // Anthropic
              ?? data?.choices?.[0]?.message?.content // OpenAI
              ?? null;

      if (!text) {
        console.warn(`[AIEngine] ${character.name}: unrecognised response shape`, data);
        return;
      }

      const decision = JSON.parse(text);
      this._applyDecision(character, decision, characters, objects, simState);
    } catch (err) {
      console.warn(`[AIEngine] ${character.name}:`, err);
    } finally {
      this._pending.delete(character.name);
    }
  }

  _applyDecision(character, decision, characters, objects, simState) {
    if (!decision?.action) return;

    switch (decision.action) {
      case 'move':
        if (decision.targetTile) {
          character.moveTo(decision.targetTile.tx, decision.targetTile.ty);
        }
        break;

      case 'interact': {
        const obj = objects.find(o => o.id === decision.targetId);
        if (obj) {
          // Walk to an adjacent walkable tile (same pattern as wander engine)
          const adjTile = simState?.findAdjacentWalkable?.(obj.tx, obj.ty);
          if (adjTile && character.moveTo(adjTile.tx, adjTile.ty)) {
            character.targetObjectId = obj.id;
            character.pendingAction  = 'use';
          }
        }
        break;
      }

      case 'idle':
        // Override wander timer — stay put for one full decision interval
        character.wanderTimer = this.decisionIntervalMs;
        break;

      case 'talk': {
        const target = characters.find(c => c.name === decision.targetCharacter);
        if (target) {
          // Walk Character A to a tile adjacent to Character B
          const adjTile = simState?.findAdjacentWalkable?.(Math.round(target.tx), Math.round(target.ty));
          if (adjTile && character.moveTo(adjTile.tx, adjTile.ty)) {
            // Character B responds when A arrives
            if (decision.targetDialogue) {
              target.pendingSpeech = decision.targetDialogue;
            }
            // Queue conversation event for the debug log
            if (simState?.pushEvent) {
              simState.pushEvent({
                type: 'conversation',
                speakerLabel: character.label,
                targetLabel: target.label,
                dialogue: decision.dialogue || '',
                response: decision.targetDialogue || '',
              });
            }
          }
        }
        break;
      }
    }

    if (decision.dialogue) {
      character.currentDialogue = decision.dialogue;
      character.dialogueTimer   = 5000;
    }

    if (decision.description) {
      console.log(`[${character.label}] ${decision.description}`);
    }

    if (this.onDecision) {
      this.onDecision(character, decision, objects, simState);
    }
  }
}
