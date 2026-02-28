#!/usr/bin/env python3
"""
Compose the café + apartment scene from local tileset tiles + individual sprites.
Output: assets/composed/scene_bg.png

Layout (12 cols × 18 rows, each tile 48×48 px):
  Rows  0-1 : Apartment walls (cream)
  Rows  2-7 : Apartment floor (wood)
  Row   8   : Ceiling slab (dark gray)
  Rows  9-10: Café walls (teal)
  Rows 11-17: Café floor (golden wood)
"""
from PIL import Image
import os

TILE = 48
COLS = 12
APT_ROWS = 8
SLAB_ROWS = 1
CAFE_ROWS = 9
TOTAL_ROWS = APT_ROWS + SLAB_ROWS + CAFE_ROWS

W = COLS * TILE   # 576
H = TOTAL_ROWS * TILE  # 864

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(BASE, "assets/sprites")
RB = os.path.join(BASE, "assets/research/limzu/purchased/Modern_Interiors_Full/1_Interiors/48x48/Room_Builder_subfiles_48x48")

floors_sheet = Image.open(os.path.join(RB, "Room_Builder_Floors_48x48.png"))
walls_sheet  = Image.open(os.path.join(RB, "Room_Builder_Walls_48x48.png"))

canvas = Image.new("RGBA", (W, H), (26, 26, 46, 255))


def tile(sheet, col, row):
    x, y = col * TILE, row * TILE
    return sheet.crop((x, y, x + TILE, y + TILE))


def place_tile(t, col, row):
    canvas.paste(t, (col * TILE, row * TILE), t)


def fill_rect(t, c1, r1, c2, r2):
    for r in range(r1, r2):
        for c in range(c1, c2):
            place_tile(t, c, r)


def place_sprite(name, px, py, subdir=None):
    """Paste a sprite PNG at pixel coordinates (top-left corner)."""
    if subdir:
        path = os.path.join(SPRITES, subdir, name)
    else:
        path = os.path.join(SPRITES, name)
    sprite = Image.open(path).convert("RGBA")
    canvas.paste(sprite, (px, py), sprite)


# ── BACKGROUND ────────────────────────────────────────────────────────────────

# Apartment floor: medium-brown wood planks (Floors col 14, row 0)
apt_floor = tile(floors_sheet, 0, 34)  # herringbone wood
fill_rect(apt_floor, 0, 0, COLS, APT_ROWS)

# Apartment walls: cream/warm-white (Walls col 0, row 3)
apt_wall = tile(walls_sheet, 0, 19)  # cream
fill_rect(apt_wall, 0, 0, COLS, 2)

# Ceiling slab
slab = Image.new("RGBA", (TILE, TILE), (58, 58, 74, 255))
fill_rect(slab, 0, APT_ROWS, COLS, APT_ROWS + 1)

# Café floor: warm golden planks (Floors col 8, row 9)
cafe_start = APT_ROWS + SLAB_ROWS   # row 9  →  y = 432
cafe_floor = tile(floors_sheet, 0, 12)  # golden honey wood
fill_rect(cafe_floor, 0, cafe_start, COLS, cafe_start + CAFE_ROWS)

# Café walls: teal (Walls col 12, row 13)
cafe_wall = tile(walls_sheet, 22, 13)  # deep teal
fill_rect(cafe_wall, 0, cafe_start, COLS, cafe_start + 2)


# ── FURNITURE HELPERS ─────────────────────────────────────────────────────────
# Coordinate shorthands:  px(col) / py(row) convert tile coords → pixels.
def px(c): return c * TILE
def py(r): return r * TILE


# ══════════════════════════════════════════════════════════════════════════════
# APARTMENT  (rows 0-7  →  y 0-384)
# ══════════════════════════════════════════════════════════════════════════════

# ── Wall art on cream walls (rows 0-1, y 0-96) ───────────────────────────────
place_sprite("wall_art_1.png",    px(2),  py(0))   # col 2
place_sprite("wall_art_2.png",    px(6),  py(0))   # col 6
place_sprite("wall_art_3.png",    px(9),  py(0))   # col 9

# ── Art studio – left corner (cols 0-2, rows 2-5) ────────────────────────────
# Easels first (48×96 – 2 rows tall), paint supplies below
place_sprite("easel_blank.png",    px(0), py(2))   # rows 2-3
place_sprite("easel_painting.png", px(1), py(2))   # rows 2-3
place_sprite("paint_supplies.png", px(2), py(4))   # row 4

# ── Living area – centre (cols 3-8, rows 2-5) ────────────────────────────────
# Bookshelf against wall (96×96), lamp, sofa, rug+coffee table
place_sprite("bookshelf.png",    px(3), py(2))     # cols 3-4, rows 2-3 (96×96)
place_sprite("lamp_floor.png",   px(5), py(2))     # col 5, row 2
place_sprite("sofa.png",         px(5), py(3))     # cols 5-6, rows 3-4 (96×96)
place_sprite("rug.png",          px(5), py(5))     # cols 5-6, row 5 (96×48)
place_sprite("coffee_table.png", px(5) + 24, py(5))  # centred on rug

# ── Bedroom nook – right corner (cols 9-11, rows 2-5) ────────────────────────
place_sprite("bed.png",       px(9),  py(2))       # cols 9-10, rows 2-3 (96×96)
place_sprite("lamp_table.png",px(11), py(2))       # col 11, row 2
place_sprite("nightstand.png",px(11), py(3))       # col 11, row 3

# ── Apartment plants ──────────────────────────────────────────────────────────
# plant_tall is 48×144 (3 rows).  Place base at row 4 so top is at row 2.
place_sprite("plant_tall.png",  px(0),  py(4))    # col 0, rows 4-6 (48×144)
place_sprite("plant_small.png", px(11), py(5))    # col 11, row 5


# ══════════════════════════════════════════════════════════════════════════════
# CAFÉ  (rows 9-17  →  y 432-864)
# ══════════════════════════════════════════════════════════════════════════════

# ── Wall art on teal walls (rows 9-10, y 432-528) ────────────────────────────
# wall_art_cafe pieces are 48×80; placed at y 448 to sit nicely in the wall
place_sprite("wall_art_cafe_1.png", px(0),  py(9) + 16, subdir="cafe")
place_sprite("wall_art_cafe_2.png", px(10), py(9) + 8,  subdir="cafe")
place_sprite("wall_art_cafe_3.png", px(11), py(9) + 8,  subdir="cafe")
# wall_shelf: 96×64, mounted mid-wall on the right
place_sprite("wall_shelf.png",      px(9),  py(9) + 16, subdir="cafe")

# ── Back counter (cols 1-9, row 10, y = 480) ─────────────────────────────────
place_sprite("counter_left.png",       px(1), py(10))
place_sprite("counter.png",            px(2), py(10))
place_sprite("espresso_machine.png",   px(3), py(10))
place_sprite("coffee_maker.png",       px(4), py(10))
# display_case_stocked is 96×96 – spans rows 9-10 (against the wall)
place_sprite("display_case_stocked.png", px(5), py(9))
place_sprite("cash_register.png",      px(7), py(10))
place_sprite("counter.png",            px(8), py(10))
place_sprite("counter_right.png",      px(9), py(10))

# Stools in front of counter (row 11, y = 528)
place_sprite("stool.png", px(3), py(11))   # by espresso machine
place_sprite("stool.png", px(7), py(11))   # by cash register

# ── Seating area: three tables (rows 12-15) ──────────────────────────────────

# --- Table 1: col 2, row 13 ---
place_sprite("chair_back.png",  px(2), py(12))   # behind
place_sprite("table_small.png", px(2), py(13))
place_sprite("chair_right.png", px(1), py(13))   # left side
place_sprite("chair_front.png", px(2), py(14))   # in front

# --- Table 2: col 5, row 13 ---
place_sprite("chair_back.png",   px(5), py(12))
place_sprite("table_small.png",  px(5), py(13))
place_sprite("chair_left.png",   px(6), py(13))  # right side
place_sprite("chair_front_b.png",px(5), py(14))

# --- Large table: cols 9-10, rows 12-13 ---
# Chairs behind at row 11 (first floor row), in front at row 14
place_sprite("chair_back.png",   px(9),  py(11))
place_sprite("chair_back.png",   px(10), py(11))
place_sprite("table_large.png",  px(9),  py(12))   # 96×96
place_sprite("chair_front.png",  px(9),  py(14))
place_sprite("chair_front_b.png",px(10), py(14))

# ── Café plants ───────────────────────────────────────────────────────────────
# plant_tall: 48×144 (3 rows). Place base so it fills rows 14-16.
place_sprite("plant_tall.png",  px(11), py(14))   # col 11, rows 14-16
place_sprite("plant_small.png", px(0),  py(16))   # col 0, row 16


# ── Save ──────────────────────────────────────────────────────────────────────
out_dir = os.path.join(BASE, "assets/composed")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "scene_bg.png")
canvas.save(out_path)
print(f"Saved {out_path}  ({W}×{H} px)")
