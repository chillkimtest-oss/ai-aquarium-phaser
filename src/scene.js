const CHARS = [
  { name: 'Amelia', label: 'Maple', x: 300, y: 420 },
  { name: 'Lucy',   label: 'Sol',   x: 500, y: 350 },
  { name: 'Ash',    label: 'Nyx',   x: 700, y: 300 },
];

const BOUNDS = { minX: 50, maxX: 860, minY: 200, maxY: 600 };
const WALK_SPEED = 30; // px/sec

export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    this.load.image('jp', 'assets/designs/Japanese_Home_1_preview_48x48.png');

    // Load character spritesheets — each frame is 48x96
    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      this.load.spritesheet(`${name}_idle`, `assets/characters/${name}_idle.png`, {
        frameWidth: 48, frameHeight: 96
      });
      this.load.spritesheet(`${name}_walk`, `assets/characters/${name}_walk.png`, {
        frameWidth: 48, frameHeight: 96
      });
    });
  }

  create() {
    const img = this.add.image(0, 0, 'jp').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, img.width, img.height);
    this.cameras.main.centerOn(img.width / 2, img.height / 2);

    // Create animations for each character
    ['Amelia', 'Lucy', 'Ash'].forEach(name => {
      // Idle: first 6 frames of the idle sheet
      this.anims.create({
        key: `${name}_idle_anim`,
        frames: this.anims.generateFrameNumbers(`${name}_idle`, { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });

      // Walk: row 1 of walk sheet (columns 0-7, row 1 = frames 48-55 in a 48-col sheet)
      // Row layout: row 0 = walk-up, row 1 = walk-left, row 2 = walk-down, row 3 = walk-right
      // We'll use row 2 (walk-down/toward camera) frames 96-103 as default walk
      this.anims.create({
        key: `${name}_walk_anim`,
        frames: this.anims.generateFrameNumbers(`${name}_walk`, { start: 96, end: 103 }),
        frameRate: 8,
        repeat: -1
      });
    });

    // Create character sprites with AI state
    this.characters = CHARS.map(({ name, label, x, y }) => {
      const sprite = this.add.sprite(x, y, `${name}_idle`)
        .setOrigin(0.5, 1)
        .setDepth(10);

      // Attach AI state
      sprite.charName = name;
      sprite.charLabel = label;
      sprite.state = 'idle';
      sprite.target = null;
      sprite.stateTimer = Phaser.Math.Between(2000, 5000); // ms until next action

      sprite.play(`${name}_idle_anim`);

      // Floating name label — stored so we can reposition it each frame
      sprite.nameLabel = this.add.text(x, y - 100, label, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(11);

      return sprite;
    });
  }

  update(time, delta) {
    const dt = delta / 1000; // convert to seconds

    this.characters.forEach(sprite => {
      if (sprite.state === 'idle') {
        sprite.stateTimer -= delta;
        if (sprite.stateTimer <= 0) {
          // Pick a random walkable destination
          sprite.target = {
            x: Phaser.Math.Between(BOUNDS.minX, BOUNDS.maxX),
            y: Phaser.Math.Between(BOUNDS.minY, BOUNDS.maxY),
          };
          sprite.state = 'walking';
          sprite.play(`${sprite.charName}_walk_anim`, true);
        }
      } else if (sprite.state === 'walking') {
        const dx = sprite.target.x - sprite.x;
        const dy = sprite.target.y - sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          // Arrived — switch to idle
          sprite.x = sprite.target.x;
          sprite.y = sprite.target.y;
          sprite.state = 'idle';
          sprite.target = null;
          sprite.stateTimer = Phaser.Math.Between(2000, 5000);
          sprite.play(`${sprite.charName}_idle_anim`, true);
        } else {
          // Move toward target
          const step = WALK_SPEED * dt;
          const ratio = Math.min(step / dist, 1);
          sprite.x += dx * ratio;
          sprite.y += dy * ratio;

          // Flip sprite based on horizontal direction
          sprite.setFlipX(dx < 0);
        }
      }

      // Keep name label above sprite's head
      sprite.nameLabel.setPosition(sprite.x, sprite.y - 100);
    });
  }
}
