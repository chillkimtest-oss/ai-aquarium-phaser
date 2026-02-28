/**
 * speechBubble.js — creates a transient speech bubble above a Phaser sprite.
 *
 * Usage:
 *   showSpeech(scene, sprite, "Hello!");
 *
 * The bubble fades out automatically after ~3 seconds. No teardown needed.
 */

const BUBBLE_PAD   = 7;   // px padding inside bubble
const BUBBLE_MAX_W = 150; // max bubble width (word-wrap threshold)
const BUBBLE_R     = 6;   // corner radius
const TRI_H        = 8;   // triangle pointer height
const DISPLAY_MS   = 2500; // ms before fade starts
const FADE_MS      = 600;  // fade duration

export function showSpeech(scene, sprite, text) {
  // ── Text object ───────────────────────────────────────────────────────────
  const txt = scene.add.text(0, 0, text, {
    fontSize: '10px',
    color: '#1a1a1a',
    fontFamily: 'monospace',
    wordWrap: { width: BUBBLE_MAX_W - BUBBLE_PAD * 2 },
  })
    .setOrigin(0.5, 0)
    .setDepth(21);

  const bw = Math.min(txt.width + BUBBLE_PAD * 2, BUBBLE_MAX_W);
  const bh = txt.height + BUBBLE_PAD * 2;

  // Position: above the sprite's head (sprite uses setOrigin(0.5,1) — feet at py)
  // Name label sits ~100px above feet; bubble goes above that
  const cx = sprite.x;
  const cy = sprite.y - 106 - bh - TRI_H; // top-left y of box

  // ── Graphics (background + pointer) ──────────────────────────────────────
  const gfx = scene.add.graphics().setDepth(20);

  // White rounded rect
  gfx.fillStyle(0xffffff, 0.92);
  gfx.fillRoundedRect(cx - bw / 2, cy, bw, bh, BUBBLE_R);

  // Subtle border
  gfx.lineStyle(1, 0xcccccc, 0.8);
  gfx.strokeRoundedRect(cx - bw / 2, cy, bw, BUBBLE_R * 2);
  gfx.strokeRoundedRect(cx - bw / 2, cy, bw, bh, BUBBLE_R);

  // Triangle pointer (pointing down to character)
  gfx.fillStyle(0xffffff, 0.92);
  gfx.fillTriangle(
    cx - 6, cy + bh,
    cx + 6, cy + bh,
    cx,     cy + bh + TRI_H,
  );

  // Position text centred inside box
  txt.setPosition(cx, cy + BUBBLE_PAD);

  // ── Fade out & destroy ────────────────────────────────────────────────────
  scene.time.delayedCall(DISPLAY_MS, () => {
    scene.tweens.add({
      targets: [gfx, txt],
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        gfx.destroy();
        txt.destroy();
      },
    });
  });
}
