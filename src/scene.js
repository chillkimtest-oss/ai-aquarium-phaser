/**
 * CafeScene — Pre-built Ice Cream Shop design as café base.
 * Kim will customize in Tiled later (FRG-129).
 * For now: ship with the pre-built design + move to characters.
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    this.load.image('cafe', 'assets/designs/Ice_Cream_Shop_Design_preview_48x48.png');
  }

  create() {
    const cafe = this.add.image(0, 0, 'cafe').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, cafe.width, cafe.height);
    this.cameras.main.centerOn(cafe.width / 2, cafe.height / 2);
  }
}
