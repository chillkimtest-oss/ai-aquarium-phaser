/**
 * CafeScene — Uses LimeZu pre-built Home Design PNGs as background layers.
 * Ice Cream Shop (bottom) = Maple's Café
 * Generic Home (top) = Nyx's Apartment
 * 
 * Each design has multiple layers that stack to form the complete scene.
 * No tile extraction, no coordinate guessing.
 */

export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    // Ice Cream Shop layers (576×480 = 12×10 tiles)
    this.load.image('cafe_L1', 'assets/designs/Ice_Cream_Shop_Design_layer_1_48x48.png');
    this.load.image('cafe_L2', 'assets/designs/Ice_Cream_Shop_Design_layer_2_48x48.png');
    this.load.image('cafe_L3', 'assets/designs/Ice_Cream_Shop_Design_layer_3_48x48.png');
    
    // Generic Home layers (672×642 ≈ 14×13 tiles)  
    this.load.image('apt_L1', 'assets/designs/Generic_Home_1_Layer_1_48x48.png');
    this.load.image('apt_L2', 'assets/designs/Generic_Home_1_Layer_2_48x48.png');
  }

  create() {
    // Layout: apartment on top, café below, with a gap for ceiling slab
    const APT_W = 672;
    const APT_H = 642;
    const CAFE_W = 576;
    const CAFE_H = 480;
    const SLAB_H = 48; // ceiling slab between floors
    
    // Total scene width = max of both
    const SCENE_W = Math.max(APT_W, CAFE_W);
    const SCENE_H = APT_H + SLAB_H + CAFE_H;
    
    // Center both rooms horizontally
    const aptOffsetX = (SCENE_W - APT_W) / 2;
    const cafeOffsetX = (SCENE_W - CAFE_W) / 2;
    const cafeOffsetY = APT_H + SLAB_H;

    // Dark background for ceiling slab area
    this.add.rectangle(SCENE_W / 2, APT_H + SLAB_H / 2, SCENE_W, SLAB_H, 0x2a1a0e);
    
    // Background fill for any gaps
    this.add.rectangle(SCENE_W / 2, SCENE_H / 2, SCENE_W, SCENE_H, 0x1a1a2e).setDepth(-10);

    // ── Apartment (top) — layers stack bottom to top ──
    // setOrigin(0,0) so position = top-left corner
    this.add.image(aptOffsetX, 0, 'apt_L1').setOrigin(0, 0).setDepth(0);
    this.add.image(aptOffsetX, 0, 'apt_L2').setOrigin(0, 0).setDepth(1);

    // ── Café (bottom) — layers stack bottom to top ──
    this.add.image(cafeOffsetX, cafeOffsetY, 'cafe_L1').setOrigin(0, 0).setDepth(0);
    this.add.image(cafeOffsetX, cafeOffsetY, 'cafe_L2').setOrigin(0, 0).setDepth(1);
    this.add.image(cafeOffsetX, cafeOffsetY, 'cafe_L3').setOrigin(0, 0).setDepth(2);

    // ── Labels ──
    const style = {
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 4, y: 2 },
    };
    this.add.text(aptOffsetX + 8, 8, "Nyx's Apartment", style).setDepth(10).setAlpha(0.7);
    this.add.text(cafeOffsetX + 8, cafeOffsetY + 8, "Maple's Café", style).setDepth(10).setAlpha(0.7);

    // ── Camera: fit entire scene ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, SCENE_W, SCENE_H);
    cam.centerOn(SCENE_W / 2, SCENE_H / 2);
  }
}
