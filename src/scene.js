/**
 * CafeScene — Pre-built LimeZu designs as background with sprite overlays.
 * Apartment (672×642) on top, 48px gap, Café (576×480) below.
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    this.load.image('cafe', 'assets/designs/Ice_Cream_Shop_Design_preview_48x48.png');
    this.load.image('apt',  'assets/designs/Generic_Home_1_preview_48x48.png');
  }

  create() {
    // Backgrounds
    const apt  = this.add.image(0, 0, 'apt').setOrigin(0, 0).setDepth(0);
    const cafeY = apt.height + 48;
    const cafe = this.add.image(0, cafeY, 'cafe').setOrigin(0, 0).setDepth(0);

    // Ceiling slab between floors
    const g = this.add.graphics();
    g.fillStyle(0x3a3a4a, 1);
    g.fillRect(0, apt.height, apt.width, 48);
    g.setDepth(1);

    const totalW = Math.max(apt.width, cafe.width);
    const totalH = cafeY + cafe.height;

    this.cameras.main.setBounds(0, 0, totalW, totalH);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);
  }
}
