/**
 * CafeScene — Lofi Café two-floor scene rendered via Phaser 3 Tiled tilemap.
 *
 * Map:  20 cols × 28 rows  (960 × 1344 px at 48 px/tile)
 * Row  0-11 : Upper floor — Nyx's Apartment
 * Row 12-13 : Ceiling slab (stairs at cols 8-9)
 * Row 14-25 : Ground floor — Maple's Café
 * Row 26-27 : Entrance / sidewalk
 *
 * Assets:
 *   assets/tilesets/cafe_tileset.png  — composite 768×576 tileset
 *   assets/maps/cafe.json             — Tiled 1.10 JSON tilemap
 *
 * Regenerate assets with:  python tools/build_tilemap.py
 */

const TILE   = 48;
const MAP_W  = 20;
const MAP_H  = 28;

export class CafeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CafeScene' });
  }

  // ── Asset loading ──────────────────────────────────────────────────────────

  preload() {
    // Full composite tileset — 16×12 grid of 48px tiles
    this.load.image('cafe_tileset', 'assets/tilesets/cafe_tileset.png');
    // Tiled JSON tilemap
    this.load.tilemapTiledJSON('cafe_map', 'assets/maps/cafe.json');
  }

  // ── Scene creation ─────────────────────────────────────────────────────────

  create() {
    // Build the Phaser tilemap from the loaded Tiled JSON
    const map = this.make.tilemap({ key: 'cafe_map' });

    // Register the tileset image.
    // First arg = "name" field in the JSON tilesets array
    // Second arg = texture key used in preload
    const tileset = map.addTilesetImage('cafe_tileset', 'cafe_tileset');

    // Create layers in render order (bottom → top)
    map.createLayer('floor',        tileset, 0, 0);
    map.createLayer('walls',        tileset, 0, 0);
    map.createLayer('furniture',    tileset, 0, 0);
    map.createLayer('decorations',  tileset, 0, 0);

    // Floor labels
    this._addLabels();

    // Show the full map: restrict scrolling to map bounds and reset to origin.
    // Phaser.Scale.FIT (set in index.html) handles canvas ↔ viewport scaling.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.setScroll(0, 0);   // ensure top-left corner is always visible
    cam.setZoom(1);        // 1:1 with world pixels; Scale.FIT shrinks the canvas
  }

  // ── Labels ─────────────────────────────────────────────────────────────────

  _addLabels() {
    const style = {
      fontSize:        '16px',
      fontFamily:      '"Courier New", monospace',
      color:           '#ffffff',
      backgroundColor: '#00000066',
      padding:         { x: 6, y: 3 },
    };

    this.add.text(8, 2 * TILE + 8,  "Nyx's Apartment", style).setAlpha(0.8);
    this.add.text(8, 16 * TILE + 8, "Maple's Café",    style).setAlpha(0.8);
  }
}
