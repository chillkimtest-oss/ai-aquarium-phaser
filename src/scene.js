/**
 * CafeScene — Pre-built LimeZu designs as background.
 * Apartment (672×642) on top, 48px ceiling slab, Café (576×480) below.
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    // Background layers
    this.load.image('cafe', 'assets/designs/Ice_Cream_Shop_Design_preview_48x48.png');
    this.load.image('apt',  'assets/designs/Generic_Home_1_preview_48x48.png');

    // Café wall art replacements (cover ice cream cones)
    this.load.image('wall_art_1', 'assets/sprites/cafe/wall_art_cafe_1.png');
    this.load.image('wall_art_2', 'assets/sprites/cafe/wall_art_cafe_2.png');
    this.load.image('wall_art_3', 'assets/sprites/cafe/wall_art_cafe_3.png');
    this.load.image('wall_shelf',  'assets/sprites/cafe/wall_shelf.png');
  }

  create() {
    // ── Backgrounds ──────────────────────────────────────
    const apt  = this.add.image(0, 0, 'apt').setOrigin(0, 0).setDepth(0);
    const cafeY = apt.height + 48;  // 642 + 48 = 690
    const cafe = this.add.image(0, cafeY, 'cafe').setOrigin(0, 0).setDepth(0);

    // Ceiling slab between floors
    const g = this.add.graphics();
    g.fillStyle(0x3a3a4a, 1);
    g.fillRect(0, apt.height, apt.width, 48);
    g.setDepth(1);

    // ── Cover ice cream cone wall art with café art ──────
    // Left cone at tiles (1-2, 0-1) → pixel pos (48, cafeY+0) spanning 96×96
    // Right cone at tiles (9-10, 0-1) → pixel pos (432, cafeY+0) spanning 96×96
    // We'll place wall art centered over those spots

    // Left wall: shelf + art piece
    this.add.image(48, cafeY + 8, 'wall_shelf').setOrigin(0, 0).setDepth(5);
    this.add.image(48 + 24, cafeY + 8, 'wall_art_1').setOrigin(0, 0).setDepth(6);

    // Right wall: shelf + art piece
    this.add.image(432, cafeY + 8, 'wall_shelf').setOrigin(0, 0).setDepth(5);
    this.add.image(432 + 24, cafeY + 8, 'wall_art_2').setOrigin(0, 0).setDepth(6);

    // ── Camera ───────────────────────────────────────────
    const totalW = Math.max(apt.width, cafe.width);
    const totalH = cafeY + cafe.height;
    this.cameras.main.setBounds(0, 0, totalW, totalH);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);
  }
}
