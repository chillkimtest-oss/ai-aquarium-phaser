/**
 * CafeScene — Load LimeZu source sheets directly. No extraction scripts.
 * B-E sheets: 768x768 = 16 cols x 16 rows of 48px tiles
 */
const TILE = 48;
const MAP_COLS = 20;
const MAP_ROWS = 24;

function fi(col, row) { return row * 16 + col; }

export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    const ss = { frameWidth: 48, frameHeight: 48 };
    this.load.spritesheet('k1', 'assets/tilesets/source/Kitchen_01.png', ss);
    this.load.spritesheet('k2', 'assets/tilesets/source/Kitchen_02.png', ss);
    this.load.spritesheet('bed', 'assets/tilesets/source/Bedroom_01_Revamped.png', ss);
    this.load.spritesheet('liv', 'assets/tilesets/source/Living_Room_01.png', ss);
    this.load.spritesheet('gen', 'assets/tilesets/source/Generic_01.png', ss);
    this.load.spritesheet('art', 'assets/tilesets/source/Art_01.png', ss);
    this.load.spritesheet('a2', 'assets/tilesets/source/Floors_TILESET_A2_.png', ss);
    this.load.spritesheet('a4', 'assets/tilesets/source/Walls_TILESET_A4_.png', ss);
  }

  create() {
    this._floors();
    this._walls();
    this._furniture();
    this._decor();
    this._labels();
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_COLS * TILE, MAP_ROWS * TILE);
    cam.centerOn((MAP_COLS * TILE) / 2, (MAP_ROWS * TILE) / 2);
  }

  // place single tile
  p(sheet, col, row, mx, my) {
    this.add.image(mx * TILE + TILE/2, my * TILE + TILE/2, sheet, fi(col, row));
  }
  // place 2x2
  p2(sheet, col, row, mx, my) {
    this.p(sheet, col, row, mx, my);
    this.p(sheet, col+1, row, mx+1, my);
    this.p(sheet, col, row+1, mx, my+1);
    this.p(sheet, col+1, row+1, mx+1, my+1);
  }
  // place 1x2 vertical
  p12(sheet, col, row, mx, my) {
    this.p(sheet, col, row, mx, my);
    this.p(sheet, col, row+1, mx, my+1);
  }
  // fill rect with one tile
  fill(sheet, col, row, x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        this.p(sheet, col, row, x, y);
  }

  _floors() {
    // A2 floor autotile center fills: block(bx,by) center = col bx*2+1, row by*3+1
    // Block(0,0)=(1,1) Block(1,0)=(3,1) Block(2,0)=(5,1) Block(3,0)=(7,1)
    // Block(0,1)=(1,4) Block(1,1)=(3,4) Block(2,1)=(5,4) Block(3,1)=(7,4)
    
    this.fill('a2', 3, 4, 0, 2, MAP_COLS-1, 9);     // apt floor
    this.fill('gen', 0, 7, 0, 10, MAP_COLS-1, 11);   // ceiling slab  
    this.fill('a2', 1, 1, 0, 12, MAP_COLS-1, 13);    // café wall bg
    this.fill('a2', 1, 1, 0, 14, MAP_COLS-1, 21);    // café floor
    this.fill('a2', 7, 1, 0, 22, MAP_COLS-1, 23);    // sidewalk
  }

  _walls() {
    // A4 wall: block(bx,by) -> 2 cols x 4 rows per block
    // Face fill at offset(1,3) within block
    // Block(0,0) face = col 1, row 3
    this.fill('a4', 1, 3, 0, 0, MAP_COLS-1, 1);      // apt back wall
    this.fill('a4', 1, 3, 0, 12, MAP_COLS-1, 13);     // café back wall
  }

  _furniture() {
    // ═══ APARTMENT (rows 2-9) ═══
    
    // Bed 2x2 — Bedroom_01 row 8-9, col 0-1
    this.p2('bed', 0, 8, 1, 3);
    // Bookshelf — Bedroom_01 row 2, col 0
    this.p2('bed', 0, 2, 0, 7);
    // Desk — Bedroom_01 
    this.p('bed', 8, 2, 1, 6);
    // Easel — Art_01 row 0
    this.p12('art', 0, 0, 5, 4);
    // Counter — Kitchen_01 row 6
    for (let i = 0; i < 4; i++) this.p('k1', i, 6, 10+i, 2);
    // Fridge — Kitchen_01
    this.p('k1', 10, 4, 14, 2);
    // Stove — Kitchen_01
    this.p('k1', 6, 4, 10, 4);
    // Sofa 2x2 — Living_Room_01 row 4
    this.p2('liv', 0, 4, 15, 5);
    // Bookshelf — Living_Room_01
    this.p2('liv', 0, 0, 18, 2);

    // ═══ STAIRS (rows 10-11, cols 8-9) ═══
    this.p('gen', 8, 0, 8, 10);
    this.p('gen', 9, 0, 9, 10);
    this.p('gen', 8, 1, 8, 11);
    this.p('gen', 9, 1, 9, 11);

    // ═══ CAFÉ (rows 14-21) ═══
    
    // Counter — Kitchen_02 row 6
    for (let i = 0; i < 5; i++) this.p('k2', i, 6, i, 16);
    // Espresso machine — Kitchen_02
    this.p('k2', 0, 2, 1, 15);
    // Display case 2x2 — Kitchen_02 row 4
    this.p2('k2', 0, 4, 3, 14);
    // Cash register
    this.p('k2', 4, 2, 5, 15);

    // Table cluster 1 — Generic_01 large table
    this.p2('gen', 4, 4, 9, 17);
    this.p('gen', 11, 1, 8, 17);
    this.p('gen', 13, 1, 12, 17);
    this.p('gen', 7, 1, 9, 16);
    this.p('gen', 7, 1, 10, 16);
    this.p('gen', 9, 1, 9, 19);
    this.p('gen', 9, 1, 10, 19);

    // Table cluster 2
    this.p('gen', 6, 8, 15, 18);
    this.p('gen', 7, 1, 15, 17);
    this.p('gen', 9, 1, 15, 19);
    this.p('gen', 11, 1, 14, 18);
    this.p('gen', 13, 1, 16, 18);

    // Table cluster 3
    this.p('gen', 6, 8, 18, 15);
    this.p('gen', 7, 1, 18, 14);
    this.p('gen', 9, 1, 18, 16);

    // Reading nook
    this.p2('bed', 0, 2, 0, 19);
    this.p('liv', 4, 4, 2, 20);

    // Plants
    this.p('liv', 8, 0, 6, 19);
    this.p('liv', 8, 0, 7, 20);
    this.p('liv', 8, 0, 6, 21);
  }

  _decor() {
    // Wall art — apartment
    this.p('liv', 0, 8, 3, 1);
    this.p('liv', 2, 8, 6, 1);
    this.p('liv', 4, 8, 10, 1);
    this.p('liv', 6, 8, 15, 1);
    // Wall art — café
    this.p('liv', 0, 8, 8, 13);
    this.p('liv', 2, 8, 12, 13);
    this.p('liv', 4, 8, 16, 13);
    // Cups on tables
    this.p('k1', 12, 0, 9, 17);
    this.p('k1', 13, 0, 10, 17);
  }

  _labels() {
    const s = { fontSize: '14px', fontFamily: '"Courier New", monospace',
                color: '#fff', backgroundColor: '#0006', padding: { x: 4, y: 2 } };
    this.add.text(8, 2*TILE+8, "Nyx's Apartment", s).setAlpha(0.7);
    this.add.text(8, 14*TILE+8, "Maple's Café", s).setAlpha(0.7);
  }
}
