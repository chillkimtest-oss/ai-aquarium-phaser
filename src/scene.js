/**
 * CafeScene — Pre-built LimeZu designs as background.
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    this.load.image('cafe', 'assets/designs/Ice_Cream_Shop_Design_preview_48x48.png');
    this.load.image('apt', 'assets/designs/Generic_Home_1_preview_48x48.png');
  }

  create() {
    // Just show the two preview images stacked
    const apt = this.add.image(0, 0, 'apt').setOrigin(0, 0);
    const cafe = this.add.image(0, apt.height + 48, 'cafe').setOrigin(0, 0);
    
    const totalW = Math.max(apt.width, cafe.width);
    const totalH = apt.height + 48 + cafe.height;
    
    this.cameras.main.setBounds(0, 0, totalW, totalH);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);
  }
}
