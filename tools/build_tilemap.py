#!/usr/bin/env python3
"""
build_tilemap.py — Generate the café composite tileset and Tiled JSON tilemap.

Reads existing 48px sprites from assets/sprites/ and:
  1. Composites them into a single tileset PNG (16 cols × 12 rows × 48px = 768×576)
     Multi-tile sprites (96×96 beds, sofas, etc.) are split into 48×48 cells.
  2. Writes a Tiled 1.10 JSON tilemap (20 cols × 28 rows) with 4 layers:
     floor | walls | furniture | decorations

Outputs:
  assets/tilesets/cafe_tileset.png
  assets/maps/cafe.json

Usage:
    python tools/build_tilemap.py
"""

from pathlib import Path
from PIL import Image
import json

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
SPRITES_DIR  = PROJECT_ROOT / "assets/sprites"
TILESET_DIR  = PROJECT_ROOT / "assets/tilesets"
MAPS_DIR     = PROJECT_ROOT / "assets/maps"

TILE    = 48        # px per tile
TS_COLS = 16        # tileset columns
TS_ROWS = 12        # tileset rows
MAP_W   = 20        # map width  (tiles)
MAP_H   = 28        # map height (tiles)
FIRSTGID = 1

def gid(ts_row: int, ts_col: int) -> int:
    return FIRSTGID + ts_row * TS_COLS + ts_col


# ── Tile Catalog ──────────────────────────────────────────────────────────────
# (tile_name, ts_row, ts_col, source_sprite_stem, crop_x, crop_y, crop_w, crop_h)
TILE_CATALOG = [
    # ── Row 0: floor + special base tiles ──────────────────────────────────
    ('floor_wood',          0,  0, 'floor_wood',            0,  0, 48, 48),
    ('floor_wood_dark',     0,  1, 'floor_wood_dark',       0,  0, 48, 48),
    ('floor_tile',          0,  2, 'floor_tile',            0,  0, 48, 48),
    ('floor_carpet',        0,  3, 'floor_carpet',          0,  0, 48, 48),
    ('floor_sidewalk',      0,  4, 'floor_sidewalk',        0,  0, 48, 48),
    ('ceiling',             0,  5, 'ceiling',               0,  0, 48, 48),
    ('stairs',              0,  6, 'stairs',                0,  0, 48, 48),
    ('stairs_tile',         0,  7, 'stairs_tile',           0,  0, 48, 48),
    ('wall_top',            0,  8, 'wall_top',              0,  0, 48, 48),
    ('door',                0,  9, 'door',                  0,  0, 48, 48),

    # ── Row 1: wall variants ────────────────────────────────────────────────
    ('wall_face',           1,  0, 'wall_face',             0,  0, 48, 48),
    ('wall_face_apt',       1,  1, 'wall_face_apt',         0,  0, 48, 48),
    ('wall_window',         1,  2, 'wall_window',           0,  0, 48, 48),
    ('wall_window_apt',     1,  3, 'wall_window_apt',       0,  0, 48, 48),

    # ── Row 2: counter + appliances ─────────────────────────────────────────
    ('counter',             2,  0, 'counter',               0,  0, 48, 48),
    ('counter_left',        2,  1, 'counter_left',          0,  0, 48, 48),
    ('counter_right',       2,  2, 'counter_right',         0,  0, 48, 48),
    ('shelf_wall',          2,  3, 'shelf_wall',            0,  0, 48, 48),
    ('espresso_machine',    2,  4, 'espresso_machine',      0,  0, 48, 48),
    ('coffee_maker',        2,  5, 'coffee_maker',          0,  0, 48, 48),
    ('sink',                2,  6, 'sink',                  0,  0, 48, 48),
    ('cash_register',       2,  7, 'cash_register',         0,  0, 48, 48),
    ('stove_off',           2,  8, 'stove_off',             0,  0, 48, 48),
    ('fridge',              2,  9, 'fridge',                0,  0, 48, 48),

    # ── Row 3: small items + wall art ───────────────────────────────────────
    ('cup_empty',           3,  0, 'cup_empty',             0,  0, 48, 48),
    ('cup_full',            3,  1, 'cup_full',              0,  0, 48, 48),
    ('plate_food',          3,  2, 'plate_food',            0,  0, 48, 48),
    ('pastry',              3,  3, 'pastry',                0,  0, 48, 48),
    ('book_closed',         3,  4, 'book_closed',           0,  0, 48, 48),
    ('book_open',           3,  5, 'book_open',             0,  0, 48, 48),
    ('desk',                3,  6, 'desk',                  0,  0, 48, 48),
    ('coffee_table',        3,  7, 'coffee_table',          0,  0, 48, 48),
    ('lamp_floor',          3,  8, 'lamp_floor',            0,  0, 48, 48),
    ('lamp_table',          3,  9, 'lamp_table',            0,  0, 48, 48),
    ('nightstand',          3, 10, 'nightstand',            0,  0, 48, 48),
    ('paint_supplies',      3, 11, 'paint_supplies',        0,  0, 48, 48),
    ('plant_small',         3, 12, 'plant_small',           0,  0, 48, 48),
    ('wall_art_1',          3, 13, 'wall_art_1',            0,  0, 48, 48),
    ('wall_art_2',          3, 14, 'wall_art_2',            0,  0, 48, 48),
    ('wall_art_3',          3, 15, 'wall_art_3',            0,  0, 48, 48),

    # ── Row 4: chairs + misc ────────────────────────────────────────────────
    ('chair_front',         4,  0, 'chair_front',           0,  0, 48, 48),
    ('chair_front_b',       4,  1, 'chair_front_b',         0,  0, 48, 48),
    ('chair_left',          4,  2, 'chair_left',            0,  0, 48, 48),
    ('chair_back',          4,  3, 'chair_back',            0,  0, 48, 48),
    ('chair_right',         4,  4, 'chair_right',           0,  0, 48, 48),
    ('stool',               4,  5, 'stool',                 0,  0, 48, 48),

    # ── Rows 5-6: 2×2 objects (source 96×96 → four 48×48 cells) ────────────
    # bed
    ('bed_TL',              5,  0, 'bed',                   0,  0, 48, 48),
    ('bed_TR',              5,  1, 'bed',                  48,  0, 48, 48),
    ('bed_BL',              6,  0, 'bed',                   0, 48, 48, 48),
    ('bed_BR',              6,  1, 'bed',                  48, 48, 48, 48),
    # bookshelf
    ('bookshelf_TL',        5,  2, 'bookshelf',             0,  0, 48, 48),
    ('bookshelf_TR',        5,  3, 'bookshelf',            48,  0, 48, 48),
    ('bookshelf_BL',        6,  2, 'bookshelf',             0, 48, 48, 48),
    ('bookshelf_BR',        6,  3, 'bookshelf',            48, 48, 48, 48),
    # sofa
    ('sofa_TL',             5,  4, 'sofa',                  0,  0, 48, 48),
    ('sofa_TR',             5,  5, 'sofa',                 48,  0, 48, 48),
    ('sofa_BL',             6,  4, 'sofa',                  0, 48, 48, 48),
    ('sofa_BR',             6,  5, 'sofa',                 48, 48, 48, 48),
    # fireplace
    ('fireplace_TL',        5,  6, 'fireplace',             0,  0, 48, 48),
    ('fireplace_TR',        5,  7, 'fireplace',            48,  0, 48, 48),
    ('fireplace_BL',        6,  6, 'fireplace',             0, 48, 48, 48),
    ('fireplace_BR',        6,  7, 'fireplace',            48, 48, 48, 48),
    # display case stocked
    ('display_stocked_TL',  5,  8, 'display_case_stocked',  0,  0, 48, 48),
    ('display_stocked_TR',  5,  9, 'display_case_stocked', 48,  0, 48, 48),
    ('display_stocked_BL',  6,  8, 'display_case_stocked',  0, 48, 48, 48),
    ('display_stocked_BR',  6,  9, 'display_case_stocked', 48, 48, 48, 48),
    # table large
    ('table_large_TL',      5, 10, 'table_large',           0,  0, 48, 48),
    ('table_large_TR',      5, 11, 'table_large',          48,  0, 48, 48),
    ('table_large_BL',      6, 10, 'table_large',           0, 48, 48, 48),
    ('table_large_BR',      6, 11, 'table_large',          48, 48, 48, 48),
    # display case empty
    ('display_empty_TL',    5, 12, 'display_case_empty',    0,  0, 48, 48),
    ('display_empty_TR',    5, 13, 'display_case_empty',   48,  0, 48, 48),
    ('display_empty_BL',    6, 12, 'display_case_empty',    0, 48, 48, 48),
    ('display_empty_BR',    6, 13, 'display_case_empty',   48, 48, 48, 48),

    # ── Rows 7-8: 1×2 objects (source 48×96) + rug (source 96×48) ──────────
    ('easel_blank_T',       7,  0, 'easel_blank',           0,  0, 48, 48),
    ('easel_painting_T',    7,  1, 'easel_painting',        0,  0, 48, 48),
    ('easel_finished_T',    7,  2, 'easel_finished',        0,  0, 48, 48),
    ('rug_L',               7,  3, 'rug',                   0,  0, 48, 48),
    ('rug_R',               7,  4, 'rug',                  48,  0, 48, 48),
    ('table_small',         7,  5, 'table_small',           0,  0, 48, 48),

    ('easel_blank_B',       8,  0, 'easel_blank',           0, 48, 48, 48),
    ('easel_painting_B',    8,  1, 'easel_painting',        0, 48, 48, 48),
    ('easel_finished_B',    8,  2, 'easel_finished',        0, 48, 48, 48),

    # ── Rows 9-11: plant_tall (source 48×144 → three 48×48 cells) ───────────
    ('plant_tall_T',        9,  0, 'plant_tall',            0,  0, 48, 48),
    ('plant_tall_M',       10,  0, 'plant_tall',            0, 48, 48, 48),
    ('plant_tall_B',       11,  0, 'plant_tall',            0, 96, 48, 48),
]

# Build name→GID lookup
GIDS: dict[str, int] = {
    name: gid(ts_row, ts_col)
    for name, ts_row, ts_col, *_ in TILE_CATALOG
}


# ── Tileset image builder ─────────────────────────────────────────────────────

def build_tileset_image() -> Image.Image:
    """Composite all tile catalog entries into a 768×576 tileset image."""
    canvas = Image.new("RGBA", (TS_COLS * TILE, TS_ROWS * TILE), (0, 0, 0, 0))
    _sprite_cache: dict[str, Image.Image] = {}

    for name, ts_row, ts_col, sprite_stem, cx, cy, cw, ch in TILE_CATALOG:
        if sprite_stem not in _sprite_cache:
            path = SPRITES_DIR / f"{sprite_stem}.png"
            if not path.exists():
                print(f"  [WARN] Missing sprite: {path.name}")
                continue
            _sprite_cache[sprite_stem] = Image.open(path).convert("RGBA")

        src = _sprite_cache[sprite_stem]
        cell = src.crop((cx, cy, cx + cw, cy + ch))
        dest_x = ts_col * TILE
        dest_y = ts_row * TILE
        canvas.paste(cell, (dest_x, dest_y), cell)

    return canvas


# ── Layer helper ──────────────────────────────────────────────────────────────

class Layer:
    def __init__(self, name: str):
        self.name = name
        self.data = [0] * (MAP_W * MAP_H)

    def set(self, col: int, row: int, tile: str) -> None:
        if 0 <= col < MAP_W and 0 <= row < MAP_H:
            self.data[row * MAP_W + col] = GIDS[tile]
        elif tile:
            pass  # silently clip out-of-bounds

    def fill(self, c1: int, r1: int, c2: int, r2: int, tile: str) -> None:
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                self.set(c, r, tile)

    def fill_row(self, row: int, tile: str) -> None:
        self.fill(0, row, MAP_W - 1, row, tile)

    def to_tiled(self, layer_id: int) -> dict:
        return {
            "id":      layer_id,
            "name":    self.name,
            "type":    "tilelayer",
            "width":   MAP_W,
            "height":  MAP_H,
            "data":    self.data,
            "opacity": 1,
            "visible": True,
            "x":       0,
            "y":       0,
        }


# ── Scene layout ──────────────────────────────────────────────────────────────
#
# Row  0-11 : Upper floor — Nyx's Apartment
# Row 12-13 : Ceiling slab (stairs at cols 8-9)
# Row 14-25 : Ground floor — Maple's Café
# Row 26-27 : Entrance / sidewalk

def build_floor_layer() -> Layer:
    L = Layer("floor")

    # ── Upper apartment floors — ONE tile for the whole apartment ──
    # (no zone-to-zone transitions = no autotile seams)
    L.fill(0, 2, 19, 11, 'floor_wood_dark')

    # ── Ceiling slab — solid dark tile repeated, NOT an autotile ──
    L.fill(0, 12, 19, 13, 'ceiling')

    # ── Ground café floors — ONE warm-wood tile for the entire café ──
    # Counter and seating share the same floor; furniture acts as visual boundary.
    L.fill(0, 16, 19, 25, 'floor_wood')

    # ── Entrance strip ──
    L.fill(0, 26, 19, 27, 'floor_sidewalk')

    return L


def build_walls_layer() -> Layer:
    L = Layer("walls")

    # ── Apartment back wall — both rows use the same solid wall tile ──
    # Using wall_face_apt for row 0 instead of wall_top eliminates the
    # seam caused by two different autotile center-fills touching.
    L.fill_row(0, 'wall_face_apt')
    for c in range(MAP_W):
        if c in range(2, 5) or c in range(10, 13):
            L.set(c, 1, 'wall_window_apt')
        else:
            L.set(c, 1, 'wall_face_apt')

    # ── Café back wall — same approach ──
    L.fill_row(14, 'wall_face')
    for c in range(MAP_W):
        if c in range(9, 12) or c in range(15, 18):
            L.set(c, 15, 'wall_window')
        else:
            L.set(c, 15, 'wall_face')

    # ── Door ──
    L.set(8, 26, 'door')
    L.set(9, 26, 'door')

    return L


def build_furniture_layer() -> Layer:
    L = Layer("furniture")

    # ── Stairs (connect apartment ↔ café through ceiling slab) ──
    L.set(8, 10, 'stairs');      L.set(9, 10, 'stairs')
    L.set(8, 11, 'stairs_tile'); L.set(9, 11, 'stairs_tile')
    L.set(8, 12, 'stairs_tile'); L.set(9, 12, 'stairs_tile')
    L.set(8, 13, 'stairs');      L.set(9, 13, 'stairs')

    # ════════════════════════════════════════════
    # UPPER FLOOR — Nyx's Apartment (rows 0-11)
    # ════════════════════════════════════════════

    # ── Bedroom zone (cols 0-6) ──
    # Bed 2×2 at (0,2)
    L.set(0, 2, 'bed_TL');   L.set(1, 2, 'bed_TR')
    L.set(0, 3, 'bed_BL');   L.set(1, 3, 'bed_BR')
    # Nightstand beside bed
    L.set(2, 2, 'nightstand')
    # Desk at (0,5)
    L.set(0, 5, 'desk')
    # Bookshelf 2×2 at (0,7)
    L.set(0, 7, 'bookshelf_TL'); L.set(1, 7, 'bookshelf_TR')
    L.set(0, 8, 'bookshelf_BL'); L.set(1, 8, 'bookshelf_BR')

    # ── Art zone (cols 3-7, rows 4-9) ──
    # Easel 1×2 at (4,4) — top-anchored
    L.set(4, 4, 'easel_painting_T')
    L.set(4, 5, 'easel_painting_B')
    # Stool for artist
    L.set(5, 6, 'stool')

    # ── Kitchen zone (cols 10-14) ──
    # Counter along back wall (row 2)
    L.set(10, 2, 'counter_left')
    L.set(11, 2, 'counter')
    L.set(12, 2, 'counter')
    L.set(13, 2, 'counter_right')
    # Fridge beside counter at (13,3)
    L.set(13, 3, 'fridge')

    # ── Living room zone (cols 14-19) ──
    # Fireplace 2×2 at (17,2)
    L.set(17, 2, 'fireplace_TL'); L.set(18, 2, 'fireplace_TR')
    L.set(17, 3, 'fireplace_BL'); L.set(18, 3, 'fireplace_BR')
    # Sofa 2×2 at (14,5)
    L.set(14, 5, 'sofa_TL'); L.set(15, 5, 'sofa_TR')
    L.set(14, 6, 'sofa_BL'); L.set(15, 6, 'sofa_BR')
    # Coffee table at (16,8)
    L.set(16, 8, 'coffee_table')

    # ════════════════════════════════════════════
    # GROUND FLOOR — Maple's Café (rows 14-25)
    # ════════════════════════════════════════════

    # ── Counter zone (cols 0-7) ──
    # Display case stocked 2×2 at (0,16)
    L.set(0, 16, 'display_stocked_TL'); L.set(1, 16, 'display_stocked_TR')
    L.set(0, 17, 'display_stocked_BL'); L.set(1, 17, 'display_stocked_BR')
    # Counter L-shape (row 18 horizontal + col 5 vertical arm)
    L.set(0, 18, 'counter_left')
    L.set(1, 18, 'counter')
    L.set(2, 18, 'counter')
    L.set(3, 18, 'counter')
    L.set(4, 18, 'counter_right')
    L.set(5, 16, 'counter'); L.set(5, 17, 'counter'); L.set(5, 18, 'counter')
    # Staff prep table at (4,20)
    L.set(4, 20, 'table_small')
    L.set(3, 20, 'stool'); L.set(5, 20, 'stool')
    # Reading nook bookshelf 2×2 at (0,21)
    L.set(0, 21, 'bookshelf_TL'); L.set(1, 21, 'bookshelf_TR')
    L.set(0, 22, 'bookshelf_BL'); L.set(1, 22, 'bookshelf_BR')
    # Armchair in reading nook
    L.set(2, 22, 'chair_front')

    # ── Seating zone (cols 8-19) ──
    # Window stools
    L.set(8, 16, 'stool');  L.set(9, 16, 'stool');  L.set(10, 16, 'stool')
    L.set(16, 16, 'stool'); L.set(17, 16, 'stool'); L.set(18, 16, 'stool')
    # Window ledge table at (11,17)
    L.set(11, 17, 'table_small')
    # Main table cluster 1 — large table 2×2 at (9,19)
    L.set(9,  19, 'table_large_TL'); L.set(10, 19, 'table_large_TR')
    L.set(9,  20, 'table_large_BL'); L.set(10, 20, 'table_large_BR')
    L.set(9,  18, 'chair_back');  L.set(10, 18, 'chair_back')
    L.set(9,  21, 'chair_front'); L.set(10, 21, 'chair_front')
    L.set(8,  19, 'chair_left');  L.set(11, 19, 'chair_right')
    # Table cluster 2 — small table at (14,20)
    L.set(14, 20, 'table_small')
    L.set(14, 19, 'chair_back');  L.set(14, 21, 'chair_front')
    L.set(13, 20, 'chair_left');  L.set(15, 20, 'chair_right')
    # Table cluster 3 — small table at (17,22)
    L.set(17, 22, 'table_small')
    L.set(17, 21, 'chair_back');  L.set(17, 23, 'chair_front')
    L.set(16, 22, 'chair_left');  L.set(18, 22, 'chair_right')
    # Table cluster 4 — Sol's reading spot at (13,23)
    L.set(13, 23, 'table_small')
    L.set(13, 22, 'chair_back');  L.set(13, 24, 'chair_front')

    return L


def build_decorations_layer() -> Layer:
    L = Layer("decorations")

    # ════════════════════════════════════════════
    # UPPER FLOOR — Nyx's Apartment
    # ════════════════════════════════════════════

    # ── Wall art / shelves (row 1) ──
    L.set(0,  1, 'wall_art_3')
    L.set(5,  1, 'wall_art_1')
    L.set(7,  1, 'shelf_wall')
    L.set(8,  1, 'wall_art_3')
    L.set(9,  1, 'shelf_wall')
    L.set(13, 1, 'wall_art_2')
    L.set(14, 1, 'wall_art_1')
    L.set(15, 1, 'shelf_wall')
    L.set(16, 1, 'wall_art_2')

    # ── Bedroom ──
    L.set(2, 2, 'lamp_table')    # lamp on nightstand
    L.set(3, 3, 'rug_L'); L.set(4, 3, 'rug_R')   # rug beside bed
    L.set(1, 5, 'lamp_table')    # lamp on desk
    L.set(0, 5, 'book_closed')   # book on desk

    # ── Art zone ──
    L.set(3, 6, 'paint_supplies')
    L.set(4, 7, 'paint_supplies')
    L.set(6, 7, 'lamp_floor')
    L.set(3, 10, 'plant_small')
    L.set(6, 10, 'plant_small')
    L.set(7,  9, 'plant_small')

    # ── Kitchen ──
    L.set(10, 2, 'sink')
    L.set(11, 2, 'stove_off')
    L.set(12, 2, 'coffee_maker')
    L.set(10, 3, 'plate_food')
    L.set(11, 3, 'cup_empty')
    L.set(12, 3, 'pastry')

    # ── Living room ──
    # Tall plant at (19,2) — 3 tiles
    L.set(19, 2, 'plant_tall_T')
    L.set(19, 3, 'plant_tall_M')
    L.set(19, 4, 'plant_tall_B')
    L.set(14, 3, 'plant_small')
    L.set(13, 5, 'lamp_floor')
    L.set(15, 7, 'rug_L'); L.set(16, 7, 'rug_R')   # rug under sofa
    L.set(18, 7, 'lamp_floor')
    L.set(16, 8, 'book_open');  L.set(17, 8, 'cup_empty')
    L.set(13, 10, 'plant_small')
    L.set(19, 10, 'plant_small')

    # ════════════════════════════════════════════
    # GROUND FLOOR — Maple's Café
    # ════════════════════════════════════════════

    # ── Café wall art (row 15) ──
    L.set(2,  15, 'shelf_wall')
    L.set(3,  15, 'shelf_wall')
    L.set(4,  15, 'shelf_wall')
    L.set(6,  15, 'wall_art_1')
    L.set(7,  15, 'shelf_wall')
    L.set(8,  15, 'wall_art_2')
    L.set(12, 15, 'wall_art_2')
    L.set(18, 15, 'wall_art_3')

    # ── Counter zone ──
    # Machines behind counter (row 17)
    L.set(1, 17, 'espresso_machine')
    L.set(2, 17, 'coffee_maker')
    L.set(3, 17, 'sink')
    L.set(4, 17, 'cash_register')
    # Items on counter surface (row 18)
    L.set(1, 18, 'cup_empty')
    L.set(3, 18, 'cup_full')
    L.set(4, 18, 'plate_food')
    L.set(6, 17, 'lamp_table')
    # Plants near counter boundary
    L.set(6, 16, 'plant_small')
    L.set(7, 16, 'plant_small')
    # Staff prep area
    L.set(4, 20, 'cup_empty')
    L.set(5, 22, 'lamp_floor')
    L.set(6, 20, 'plant_small')
    # Reading nook
    L.set(2, 21, 'lamp_table')    # beside bookshelf
    L.set(2, 24, 'book_open')
    L.set(3, 23, 'book_closed')
    L.set(0, 24, 'plant_small')
    L.set(6, 24, 'plant_small')

    # ── Seating zone ──
    L.set(11, 17, 'cup_full')
    L.set(12, 17, 'book_open')
    L.set(8,  15, 'wall_art_2')
    L.set(13, 16, 'plant_small')
    # Table cluster 1 items
    L.set(9,  19, 'cup_empty')
    L.set(9,  20, 'plate_food')
    L.set(10, 20, 'pastry')
    # Table cluster 2 items
    L.set(14, 20, 'book_closed')
    L.set(13, 20, 'cup_full')
    # Table cluster 3 items
    L.set(17, 22, 'plate_food')
    L.set(18, 22, 'cup_empty')
    # Table cluster 4 (Sol's) items
    L.set(13, 23, 'book_open')
    L.set(12, 23, 'cup_full')
    # Plants in seating zone
    L.set(19, 16, 'plant_small')
    # Plant tall at (19,17) — 3 tiles
    L.set(19, 17, 'plant_tall_T')
    L.set(19, 18, 'plant_tall_M')
    L.set(19, 19, 'plant_tall_B')
    L.set(8,  25, 'plant_small')
    L.set(15, 25, 'plant_small')
    # Lamps
    L.set(12, 22, 'lamp_floor')
    L.set(16, 24, 'lamp_floor')

    # ── Entrance ──
    L.set(6,  26, 'plant_small')
    L.set(11, 26, 'plant_small')
    # Tall plant flanking entrance at col 19 (rows 24-26)
    L.set(19, 24, 'plant_tall_T')
    L.set(19, 25, 'plant_tall_M')
    L.set(19, 26, 'plant_tall_B')

    return L


# ── Tiled JSON builder ────────────────────────────────────────────────────────

def build_tiled_json(layers: list[Layer]) -> dict:
    tilecount = TS_COLS * TS_ROWS
    return {
        "compressionlevel": -1,
        "height":           MAP_H,
        "width":            MAP_W,
        "tileheight":       TILE,
        "tilewidth":        TILE,
        "orientation":      "orthogonal",
        "renderorder":      "right-down",
        "type":             "map",
        "version":          "1.10",
        "tiledversion":     "1.10.2",
        "infinite":         False,
        "nextlayerid":      len(layers) + 1,
        "nextobjectid":     1,
        "tilesets": [
            {
                "firstgid":   FIRSTGID,
                "columns":    TS_COLS,
                "image":      "../tilesets/cafe_tileset.png",
                "imageheight": TS_ROWS * TILE,
                "imagewidth":  TS_COLS * TILE,
                "margin":     0,
                "name":       "cafe_tileset",
                "spacing":    0,
                "tilecount":  tilecount,
                "tileheight": TILE,
                "tilewidth":  TILE,
            }
        ],
        "layers": [L.to_tiled(i + 1) for i, L in enumerate(layers)],
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    TILESET_DIR.mkdir(parents=True, exist_ok=True)
    MAPS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Build tileset PNG
    print("Building tileset image …")
    tileset_img = build_tileset_image()
    tileset_path = TILESET_DIR / "cafe_tileset.png"
    tileset_img.save(tileset_path)
    print(f"  Saved {tileset_path.relative_to(PROJECT_ROOT)}  "
          f"({tileset_img.width}×{tileset_img.height})")

    # 2. Build layers
    print("Building map layers …")
    floor_layer  = build_floor_layer()
    walls_layer  = build_walls_layer()
    furn_layer   = build_furniture_layer()
    deco_layer   = build_decorations_layer()

    # 3. Assemble Tiled JSON
    print("Assembling Tiled JSON …")
    tiled = build_tiled_json([floor_layer, walls_layer, furn_layer, deco_layer])

    map_path = MAPS_DIR / "cafe.json"
    with open(map_path, "w") as f:
        json.dump(tiled, f, separators=(",", ":"))
    print(f"  Saved {map_path.relative_to(PROJECT_ROOT)}")

    # 4. Summary
    used = sum(1 for v in tiled["tilesets"][0].items())
    print(f"\nDone — {len(TILE_CATALOG)} named tiles, "
          f"{MAP_W}×{MAP_H} map, "
          f"4 layers (floor/walls/furniture/decorations)")


if __name__ == "__main__":
    main()
