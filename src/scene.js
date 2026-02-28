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
    this._fill('floor_carpet', 0, 22, 3, 24);      // reading nook carpet
  }

  // ── Ground floor — Maple's Café (rows 14-25) ──────────────────────────────

  _buildGroundFloor() {
    // Back wall
    this._fillRow('wall_top', 14);
    // Wall face — left half interior, right half with windows
    for (let c = 0; c < COLS; c++) {
      if ((c >= 9 && c <= 11) || (c >= 15 && c <= 17)) {
        this._tile('wall_window', c, 15);
      } else {
        this._tile('wall_face', c, 15);
      }
    }

    // ── Counter zone (cols 0-7) ──
    // Display case (2×2) — top-left at (0, 16)
    this._prop('display_case_stocked', 0, 16);

    // Shelves + art on back wall (row 15, counter side)
    this._prop('shelf_wall', 2, 15);
    this._prop('shelf_wall', 4, 15);
    this._prop('shelf_wall', 3, 15);
    this._prop('wall_art_1', 6, 15);
    this._prop('shelf_wall', 7, 15);  // decor at counter/seating boundary

    // Counter top row (row 17): machines behind counter
    this._prop('espresso_machine', 1, 17);
    this._prop('coffee_maker', 2, 17);
    this._prop('sink', 3, 17);         // sink for washing cups
    this._prop('cash_register', 4, 17);

    // Counter surface (row 18) — L-shape
    this._prop('counter_left', 0, 18);
    this._prop('counter', 1, 18);
    this._prop('counter', 2, 18);
    this._prop('counter', 3, 18);
    this._prop('counter_right', 4, 18);
    // Vertical counter arm (col 5, rows 16-18)
    this._prop('counter', 5, 16);
    this._prop('counter', 5, 17);
    this._prop('counter', 5, 18);

    // Items on counter
    this._prop('cup_full',   3, 18);
    this._prop('cup_empty',  1, 18);
    this._prop('plate_food', 4, 18);
    this._prop('lamp_table', 6, 17);   // lamp in staff area beside counter

    // Corner plant by counter boundary
    this._prop('plant_small', 6, 16);
    this._prop('plant_small', 7, 16);  // double-plant corner

    // ── Staff back area (rows 19-25, cols 3-7) ──
    // Small prep table for staff
    this._prop('table_small', 4, 20);
    this._prop('cup_empty',   4, 20);
    this._prop('stool',       3, 20);   // staff stool by prep table
    this._prop('stool',       5, 20);   // second stool
    // Floor lamp for staff/reading nook area
    this._prop('lamp_floor',  5, 22);
    // Prop near counter base
    this._prop('plant_small', 6, 20);

    // Reading nook bookshelf (2×2) at col 0, row 21
    this._prop('bookshelf', 0, 21);

    // Armchair in reading nook
    this._prop('chair_front', 2, 22);

    // Items in reading nook
    this._prop('book_open',   2, 24);
    this._prop('book_closed', 3, 23);
    this._prop('lamp_table',  2, 21);  // lamp on top of bookshelf

    // Plants in corners
    this._prop('plant_small', 0, 24);
    this._prop('plant_small', 6, 24);

    // ── Seating zone (cols 8-19) ──

    // Window stools — full run along back wall row 16
    this._prop('stool', 8, 16);
    this._prop('stool', 9, 16);
    this._prop('stool', 10, 16);  // cluster facing windows 9-11
    this._prop('stool', 16, 16);
    this._prop('stool', 17, 16);
    this._prop('stool', 18, 16);  // cluster facing windows 15-17

    // Small ledge table for window stools (row 17, between stool groups)
    this._prop('table_small', 11, 17);
    this._prop('cup_full',    11, 17);
    this._prop('book_open',   12, 17);

    // Seating zone wall decorations (row 15)
    this._prop('wall_art_2',  8, 15);   // above window seat cluster
    this._prop('wall_art_2', 12, 15);   // center seating area
    this._prop('wall_art_3', 18, 15);   // far right

    // Plant in upper seating area
    this._prop('plant_small', 13, 16);

    // Main table cluster 1 — large table (2×2) at col 9, row 19
    this._prop('table_large', 9, 19);
    // Chairs around it
    this._prop('chair_back',  9, 18);
    this._prop('chair_back',  10, 18);
    this._prop('chair_front', 9, 21);
    this._prop('chair_front', 10, 21);
    this._prop('chair_left',  8, 19);
    this._prop('chair_right', 11, 19);
    // Items on table
    this._prop('cup_empty',  9, 19);
    this._prop('pastry',     10, 20);
    this._prop('plate_food', 9, 20);

    // Table cluster 2 — small table at col 14, row 20
    this._prop('table_small', 14, 20);
    this._prop('chair_back',  14, 19);
    this._prop('chair_front', 14, 21);
    this._prop('chair_left',  13, 20);
    this._prop('chair_right', 15, 20);
    this._prop('book_closed', 14, 20);
    this._prop('cup_full',    13, 20);

    // Table cluster 3 — small table at col 17, row 22
    this._prop('table_small', 17, 22);
    this._prop('chair_back',  17, 21);
    this._prop('chair_front', 17, 23);
    this._prop('chair_left',  16, 22);
    this._prop('chair_right', 18, 22);
    this._prop('plate_food',  17, 22);
    this._prop('cup_empty',   18, 22);

    // Table cluster 4 — small table at col 13, row 23 (Sol's reading spot)
    this._prop('table_small', 13, 23);
    this._prop('chair_back',  13, 22);
    this._prop('chair_front', 13, 24);
    this._prop('book_open',   13, 23);
    this._prop('cup_full',    12, 23);

    // Plants
    this._prop('plant_small', 19, 16);
    this._prop('plant_tall',  19, 17);   // 1×3, extends down to row 19
    this._prop('plant_small', 8, 25);
    this._prop('plant_small', 15, 25);
    this._prop('plant_small', 19, 25);

    // Lamps in seating area
    this._prop('lamp_floor', 12, 22);
    this._prop('lamp_floor', 16, 24);
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
    this._prop('lamp_table', 2, 2);   // lamp on nightstand

    // Desk at col 0, row 5
    this._prop('desk', 0, 5);
    this._prop('lamp_table', 1, 5);
    this._prop('book_closed', 0, 5);  // book on desk

    // Bookshelf (2×2) at col 0, row 7
    this._prop('bookshelf', 0, 7);

    // Wall art — only on wall_face_apt tiles (NOT on windows at cols 2-4, 10-12)
    this._prop('wall_art_3', 0, 1);   // bedroom, col 0 — wall tile
    this._prop('wall_art_1', 5, 1);   // col 5 — wall tile (between windows)
    this._prop('wall_art_3', 8, 1);   // col 8 — wall tile (between windows)
    this._prop('shelf_wall', 7, 1);   // col 7 — bedroom-to-art transition

    // Rug beside bed
    this._prop('rug', 3, 3);

    // ── Art zone (cols 3-7, rows 3-9) ──
    // Easel (1×2) at col 4, row 4 — top-anchored
    this._prop('easel_painting', 4, 4);
    // Paint supplies on floor
    this._prop('paint_supplies', 3, 6);
    this._prop('paint_supplies', 4, 7);  // extra supplies
    // Stool for artist
    this._prop('stool', 5, 6);
    // Lamp in art zone
    this._prop('lamp_floor', 6, 7);
    // Plants in art zone
    this._prop('plant_small', 3, 10);
    this._prop('plant_small', 6, 10);
    this._prop('plant_small', 7, 9);

    // ── Kitchen zone (cols 10-14) ──
    // Counter along back wall (row 2)
    this._prop('counter_left', 10, 2);
    this._prop('counter',      11, 2);
    this._prop('counter',      12, 2);
    this._prop('counter_right',13, 2);
    // Appliances sitting on counter
    this._prop('sink',         10, 2);
    this._prop('stove_off',    11, 2);
    this._prop('coffee_maker', 12, 2);
    this._prop('fridge',       13, 3);  // fridge beside counter

    // Kitchen items on/near counter
    this._prop('plate_food', 10, 3);
    this._prop('cup_empty',  11, 3);
    this._prop('pastry',     12, 3);

    // Wall art above kitchen (on wall tiles, not window tiles)
    this._prop('wall_art_2', 13, 1);   // col 13 — wall tile

    // Shelf on kitchen wall
    this._prop('shelf_wall', 9, 1);    // between art and kitchen walls

    // ── Living room zone (cols 14-19) ──
    // Fireplace (2×2) at col 17, row 2
    this._prop('fireplace', 17, 2);
    // Tall plant (1×3) at col 19, row 2 (top anchor)
    this._prop('plant_tall', 19, 2);

    // Wall art in living zone — cols 14-16, 18-19 (not windows)
    this._prop('wall_art_1', 14, 1);   // col 14 — wall tile
    this._prop('wall_art_2', 16, 1);   // col 16 — wall tile
    this._prop('shelf_wall', 15, 1);   // shelf above sofa area

    // Sofa (2×2) at col 14, row 5
    this._prop('sofa', 14, 5);

    // Floor lamp beside sofa
    this._prop('lamp_floor', 13, 5);

    // Coffee table at col 16, row 8
    this._prop('coffee_table', 16, 8);

    // Rug under sofa area
    this._prop('rug', 15, 7);

    // Plants in living zone
    this._prop('plant_small', 13, 10);
    this._prop('plant_small', 19, 10);
    this._prop('plant_small', 14, 3);   // plant near kitchen/living divide

    // Items on coffee table
    this._prop('book_open',  16, 8);
    this._prop('cup_empty',  17, 8);

    // Lamp in living zone
    this._prop('lamp_floor', 18, 7);    // floor lamp in living room corner

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
