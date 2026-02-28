/**
 * CafeScene — Lofi Café two-floor static scene using LimeZu 48×48 tiles.
 *
 * Map: 20 cols × 28 rows  (960×1344 px)
 * Row 0-11  : Upper floor — Nyx's Apartment
 * Row 12-13 : Ceiling slab (with stairs at cols 8-9)
 * Row 14-25 : Ground floor — Maple's Café
 * Row 26-27 : Entrance / sidewalk
 */

const T = 48;      // tile size (native 48 px)
const COLS = 20;
const ROWS = 28;

// ─── All sprite keys (must match assets/sprites/ filenames) ──────────────────
const SPRITES = [
  'floor_wood', 'floor_wood_dark', 'floor_tile', 'floor_carpet', 'floor_sidewalk',
  'ceiling', 'wall_top', 'wall_face', 'wall_face_apt', 'wall_window', 'wall_window_apt',
  'door', 'stairs', 'stairs_tile',
  'counter', 'counter_left', 'counter_right',
  'espresso_machine', 'coffee_maker', 'cash_register',
  'display_case_empty', 'display_case_stocked',
  'stove_off', 'fridge', 'sink',
  'cup_empty', 'cup_full', 'plate_food', 'pastry', 'book_closed', 'book_open',
  'shelf_wall',
  'table_large', 'table_small',
  'chair_front', 'chair_front_b', 'chair_left', 'chair_back', 'chair_right', 'stool',
  'sofa', 'fireplace', 'plant_tall',
  'lamp_floor', 'lamp_table', 'desk', 'coffee_table', 'rug', 'nightstand',
  'bed', 'bookshelf',
  'easel_blank', 'easel_painting', 'easel_finished',
  'wall_art_1', 'wall_art_2', 'wall_art_3', 'paint_supplies',
  'plant_small', 'window_sky',
];

export class CafeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CafeScene' });
  }

  preload() {
    for (const key of SPRITES) {
      this.load.image(key, `assets/sprites/${key}.png`);
    }
  }

  create() {
    this._buildBackground();
    this._buildGroundFloor();
    this._buildCeilingSlab();
    this._buildUpperFloor();
    this._buildEntrance();
    this._addLabels();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Place a tile (origin top-left). */
  _tile(key, col, row) {
    return this.add.image(col * T, row * T, key).setOrigin(0, 0);
  }

  /**
   * Place a furniture sprite (origin top-left).
   * w/h are in tiles — multi-tile sprites are already the right pixel size.
   */
  _prop(key, col, row) {
    return this.add.image(col * T, row * T, key).setOrigin(0, 0);
  }

  /** Fill a rectangular region with the given tile. */
  _fill(key, c1, r1, c2, r2) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        this._tile(key, c, r);
      }
    }
  }

  /** Fill one full row with a tile. */
  _fillRow(key, row) {
    this._fill(key, 0, row, COLS - 1, row);
  }

  // ── Background pass (floors + walls for entire map) ────────────────────────

  _buildBackground() {
    // Upper floor floor tiles (rows 2-11)
    this._fill('floor_wood_dark', 0, 2, 9, 11);    // bedroom + art zone
    this._fill('floor_wood_dark', 10, 2, 14, 11);  // kitchen zone
    this._fill('floor_carpet', 14, 4, 19, 11);     // living room carpet

    // Ground floor floor tiles (rows 16-25)
    this._fill('floor_wood_dark', 0, 16, 7, 25);   // counter/staff zone
    this._fill('floor_wood', 8, 16, 19, 25);       // seating zone
    this._fill('floor_carpet', 9, 18, 12, 21);     // rug under main table cluster
  }

  // ── Ground floor — Maple's Café (rows 14-25) ──────────────────────────────

  _buildGroundFloor() {
    // Back wall
    this._fillRow('wall_top', 14);
    // Wall face — left half interior, right half with windows
    for (let c = 0; c < COLS; c++) {
      if (c >= 9 && c <= 11) {
        this._tile('wall_window', c, 15);
      } else if (c >= 15 && c <= 17) {
        this._tile('wall_window', c, 15);
      } else {
        this._tile('wall_face', c, 15);
      }
    }

    // ── Counter zone (cols 0-7) ──
    // Display case (2×2) — top-left at (0, 16)
    this._prop('display_case_stocked', 0, 16);

    // Shelf on wall above counter
    this._prop('shelf_wall', 2, 15);
    this._prop('shelf_wall', 4, 15);
    this._prop('wall_art_1', 6, 15);

    // Counter top row (row 17): machines behind counter
    this._prop('espresso_machine', 1, 17);
    this._prop('coffee_maker', 2, 17);
    this._prop('cash_register', 4, 17);

    // Counter surface (row 18) — L-shape
    this._prop('counter_left', 0, 18);
    this._prop('counter', 1, 18);
    this._prop('counter', 2, 18);
    this._prop('counter', 3, 18);
    this._prop('counter_right', 4, 18);
    // Vertical counter (col 5, rows 16-19)
    this._prop('counter', 5, 16);
    this._prop('counter', 5, 17);
    this._prop('counter', 5, 18);

    // Cup on counter
    this._prop('cup_full', 3, 18);

    // Reading nook bookshelf (2×2) at col 0, row 21
    this._prop('bookshelf', 0, 21);

    // Armchair in reading nook
    this._prop('chair_front', 2, 22);

    // Book on chair/floor
    this._prop('book_open', 2, 24);

    // Plants in corners
    this._prop('plant_small', 0, 24);
    this._prop('plant_small', 6, 24);
    this._prop('plant_small', 6, 16);

    // ── Seating zone (cols 8-19) ──

    // Window stools along back wall (row 16)
    this._prop('stool', 16, 16);
    this._prop('stool', 17, 16);
    this._prop('stool', 18, 16);

    // Main table cluster 1 — large table (2×2) at col 9, row 19
    this._prop('table_large', 9, 19);
    // Chairs around it
    this._prop('chair_back',  9, 18);
    this._prop('chair_back',  10, 18);
    this._prop('chair_front', 9, 21);
    this._prop('chair_front', 10, 21);
    this._prop('chair_left',  8, 19);
    this._prop('chair_right', 11, 19);
    // Cup on table
    this._prop('cup_empty', 9, 19);
    this._prop('pastry',    10, 20);

    // Table cluster 2 — small table at col 14, row 20
    this._prop('table_small', 14, 20);
    this._prop('chair_back',  14, 19);
    this._prop('chair_front', 14, 21);
    this._prop('chair_left',  13, 20);
    this._prop('chair_right', 15, 20);
    this._prop('book_closed', 14, 20);

    // Table cluster 3 — small table at col 17, row 22
    this._prop('table_small', 17, 22);
    this._prop('chair_back',  17, 21);
    this._prop('chair_front', 17, 23);
    this._prop('chair_right', 18, 22);
    this._prop('plate_food',  17, 22);

    // Wall decorations along right wall
    this._prop('wall_art_2', 12, 15);
    this._prop('wall_art_3', 18, 15);

    // Plants
    this._prop('plant_small', 19, 16);
    this._prop('plant_tall',  19, 17);   // 1×3, extends down to row 19
    this._prop('plant_small', 8, 25);
    this._prop('plant_small', 19, 25);

    // Lamp in seating area
    this._prop('lamp_floor', 12, 22);
  }

  // ── Ceiling slab (rows 12-13) ─────────────────────────────────────────────

  _buildCeilingSlab() {
    // Full ceiling slab
    this._fill('ceiling', 0, 12, COLS - 1, 13);

    // Stairs opening at cols 8-9
    this._tile('stairs_tile', 8, 12);
    this._tile('stairs_tile', 9, 12);
    this._tile('stairs',      8, 13);
    this._tile('stairs',      9, 13);
  }

  // ── Upper floor — Nyx's Apartment (rows 0-11) ─────────────────────────────

  _buildUpperFloor() {
    // Back wall
    this._fillRow('wall_top', 0);
    // Wall face with windows
    for (let c = 0; c < COLS; c++) {
      if ((c >= 2 && c <= 4) || (c >= 10 && c <= 12)) {
        this._tile('wall_window_apt', c, 1);
      } else {
        this._tile('wall_face_apt', c, 1);
      }
    }

    // ── Bedroom zone (cols 0-6) ──
    // Bed (2×2) at col 0, row 2
    this._prop('bed', 0, 2);
    // Nightstand beside bed
    this._prop('nightstand', 2, 2);
    this._prop('lamp_table', 2, 2);  // lamp on nightstand (draws over it, OK)

    // Desk at col 0, row 6
    this._prop('desk', 0, 6);
    this._prop('lamp_table', 1, 6);

    // Bookshelf (2×2) at col 0, row 8
    this._prop('bookshelf', 0, 8);

    // Wall art above bed / on bedroom wall
    this._prop('wall_art_3', 0, 1);
    this._prop('wall_art_1', 4, 1);

    // ── Art zone (cols 3-7, rows 3-9) ──
    // Easel (1×2) at col 4, row 4 — top-anchored
    this._prop('easel_painting', 4, 4);
    // Paint supplies on floor
    this._prop('paint_supplies', 3, 6);
    // Stool for artist
    this._prop('stool', 5, 6);
    // Plant in art zone
    this._prop('plant_small', 6, 10);
    this._prop('plant_small', 3, 10);

    // ── Kitchen zone (cols 10-14) ──
    // Counter along back wall (row 3)
    this._prop('counter_left', 10, 3);
    this._prop('counter', 11, 3);
    this._prop('counter_right', 12, 3);
    // Appliances on counter
    this._prop('sink',         10, 3);  // overlays counter top
    this._prop('stove_off',    11, 3);
    this._prop('coffee_maker', 12, 3);
    this._prop('fridge',       13, 3);

    // Kitchen items
    this._prop('plate_food', 10, 4);
    this._prop('cup_empty',  11, 4);

    // Wall art above kitchen
    this._prop('wall_art_2', 12, 1);

    // ── Living room zone (cols 14-19) ──
    // Fireplace (2×2) at col 17, row 2
    this._prop('fireplace', 17, 2);
    // Tall plant (1×3) at col 19, row 2 (top anchor)
    this._prop('plant_tall', 19, 2);

    // Sofa (2×2) at col 14, row 5
    this._prop('sofa', 14, 5);
    // Coffee table at col 15, row 8
    this._prop('coffee_table', 15, 8);

    // Floor lamp
    this._prop('lamp_floor', 13, 5);

    // Wall art
    this._prop('wall_art_1', 16, 1);
    this._prop('wall_art_2', 18, 1);

    // Rug under sofa (already carpet tiles, add visual rug object)
    this._prop('rug', 15, 7);

    // More plants
    this._prop('plant_small', 13, 10);
    this._prop('plant_small', 19, 10);

    // Book on coffee table
    this._prop('book_open', 15, 8);

    // Stairs at bottom of apartment (cols 8-9, rows 10-11)
    this._tile('stairs', 8, 10);
    this._tile('stairs', 9, 10);
    this._tile('stairs_tile', 8, 11);
    this._tile('stairs_tile', 9, 11);
  }

  // ── Entrance / sidewalk (rows 26-27) ──────────────────────────────────────

  _buildEntrance() {
    // Sidewalk floor
    this._fill('floor_sidewalk', 0, 26, COLS - 1, 27);

    // Door to café at col 8-9
    this._tile('door', 8, 26);
    this._tile('door', 9, 26);

    // Plants flanking door
    this._prop('plant_small', 6, 26);
    this._prop('plant_small', 11, 26);
    this._prop('plant_tall',  19, 24);
  }

  // ── Floor labels ──────────────────────────────────────────────────────────

  _addLabels() {
    const style = {
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 6, y: 3 },
    };

    this.add.text(8, 2 * T + 8, "Nyx's Apartment", style).setAlpha(0.8);
    this.add.text(8, 16 * T + 8, "Maple's Café", style).setAlpha(0.8);
  }
}
