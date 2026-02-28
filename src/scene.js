export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }
  preload() {
    this.load.image('jp', 'assets/designs/Japanese_Home_1_preview_48x48.png');
  }
  create() {
    const img = this.add.image(0, 0, 'jp').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, img.width, img.height);
    this.cameras.main.centerOn(img.width / 2, img.height / 2);
  }
}
