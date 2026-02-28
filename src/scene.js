/**
 * CafeScene — Custom composed background from Room Builder tiles.
 * Apartment (rows 0-7) + ceiling slab (row 8) + Café (rows 9-17)
 * 12 tiles wide × 18 rows tall = 576×864
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    this.load.image('bg', 'assets/composed/scene_bg.png');
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, 576, 864);
    this.cameras.main.centerOn(288, 432);
  }
}
