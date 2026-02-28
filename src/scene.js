/**
 * CafeScene — Pre-built LimeZu designs as background with sprite overlays.
 *
 * Layout:
 *   Y=0:          Generic_Home_1 (Nyx's apartment) — ~642px tall
 *   Y=642+48=690: Ice_Cream_Shop (Maple's café base)
 *
 * Sprites are placed ON TOP of backgrounds at depth=5.
 * Tile helper: x = col * 48, y = row * 48 (within each section).
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    // Background layers
    this.load.image('cafe', 'assets/designs/Ice_Cream_Shop_Design_preview_48x48.png');
    this.load.image('apt',  'assets/designs/Generic_Home_1_preview_48x48.png');

    // Café sprites
    this.load.image('espresso_machine', 'assets/sprites/espresso_machine.png');
    this.load.image('coffee_maker',     'assets/sprites/coffee_maker.png');
    this.load.image('cup_full',         'assets/sprites/cup_full.png');
    this.load.image('cup_empty',        'assets/sprites/cup_empty.png');
    this.load.image('pastry',           'assets/sprites/pastry.png');
    this.load.image('plate_food',       'assets/sprites/plate_food.png');
    this.load.image('display_case_stocked', 'assets/sprites/display_case_stocked.png');
    this.load.image('cash_register',    'assets/sprites/cash_register.png');
    this.load.image('stool',            'assets/sprites/stool.png');

    // Art studio sprites
    this.load.image('easel_painting',   'assets/sprites/easel_painting.png');
    this.load.image('easel_blank',      'assets/sprites/easel_blank.png');
    this.load.image('paint_supplies',   'assets/sprites/paint_supplies.png');
    this.load.image('wall_art_1',       'assets/sprites/wall_art_1.png');
    this.load.image('wall_art_2',       'assets/sprites/wall_art_2.png');
    this.load.image('desk',             'assets/sprites/desk.png');

    // Shared décor
    this.load.image('plant_tall',   'assets/sprites/plant_tall.png');
    this.load.image('plant_small',  'assets/sprites/plant_small.png');
    this.load.image('lamp_floor',   'assets/sprites/lamp_floor.png');
    this.load.image('shelf_wall',   'assets/sprites/shelf_wall.png');
    this.load.image('bookshelf',    'assets/sprites/bookshelf.png');
  }

  create() {
    // ── Backgrounds ─────────────────────────────────────────────────────────
    const apt  = this.add.image(0, 0, 'apt').setOrigin(0, 0).setDepth(0);
    const cafeY = apt.height + 48;
    const cafe = this.add.image(0, cafeY, 'cafe').setOrigin(0, 0).setDepth(0);

    const totalW = Math.max(apt.width, cafe.width);
    const totalH = cafeY + cafe.height;

    // Helper: place a sprite by tile column/row within a Y section
    const place = (key, col, row, baseY = 0) =>
      this.add.image(col * 48, baseY + row * 48, key)
        .setOrigin(0, 0)
        .setDepth(5);

    // ── Café overlays (Maple's café, bottom section) ─────────────────────────
    //
    // The Ice Cream Shop design has:
    //   • A back counter running along row ~2–3
    //   • Seating area in the middle
    //   • Display windows / front area at the bottom
    //
    // We replace ice-cream flavour with coffee-shop flavour:

    // Back counter: espresso machine + coffee maker
    place('espresso_machine', 3, 2, cafeY);
    place('coffee_maker',     5, 2, cafeY);
    place('cash_register',    7, 2, cafeY);

    // Display case with pastries in the display shelf area
    place('display_case_stocked', 10, 2, cafeY);
    place('pastry',               10, 3, cafeY);

    // Cups on serving counter
    place('cup_full',  3, 3, cafeY);
    place('cup_empty', 4, 3, cafeY);
    place('plate_food', 6, 3, cafeY);

    // Bar stools along the counter
    place('stool', 3, 5, cafeY);
    place('stool', 5, 5, cafeY);
    place('stool', 7, 5, cafeY);

    // Plants near the café entrance / windows
    place('plant_tall',  1,  1, cafeY);
    place('plant_small', 13, 1, cafeY);
    place('plant_tall',  13, 7, cafeY);

    // Floor lamp in seating corner
    place('lamp_floor', 1, 7, cafeY);

    // ── Apartment overlays (Nyx's apartment, top section) ────────────────────
    //
    // The Generic Home design has rooms on two floors.
    // Art studio goes in the upper-left corner of the upper floor.

    // Easel (active painting) — art corner
    place('easel_painting', 2, 2);
    place('easel_blank',    4, 2);

    // Paint supplies scattered on the floor nearby
    place('paint_supplies', 2, 4);

    // Reference shelf on the wall above
    place('shelf_wall', 2, 1);

    // Finished artwork on the walls
    place('wall_art_1', 6, 1);
    place('wall_art_2', 8, 1);

    // Desk for sketching / laptop
    place('desk', 10, 3);

    // Bookshelf in the living area
    place('bookshelf', 14, 2);

    // Plants by windows
    place('plant_tall',  1,  1);
    place('plant_small', 15, 1);
    place('plant_tall',  15, 8);

    // Floor lamp
    place('lamp_floor', 12, 5);

    // ── Camera ──────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, totalW, totalH);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);
  }
}
