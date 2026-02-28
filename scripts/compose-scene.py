#!/usr/bin/env python3
"""
Compose the café + apartment scene from Room Builder tiles + individual sprites.
Output: assets/composed/scene_bg.png
"""
from PIL import Image
import os

TILE = 48
COLS = 12
APT_ROWS = 8
SLAB_ROWS = 1
CAFE_ROWS = 9
TOTAL_ROWS = APT_ROWS + SLAB_ROWS + CAFE_ROWS

W = COLS * TILE
H = TOTAL_ROWS * TILE

BASE = os.path.expanduser("~/Projects/ai-aquarium-phaser")
RB = os.path.join(BASE, "assets/research/limzu/purchased/Modern_Interiors_Full/1_Interiors/48x48/Room_Builder_subfiles_48x48")

def load_sheet(name):
    return Image.open(os.path.join(RB, name))

def tile(sheet, col, row):
    x, y = col * TILE, row * TILE
    return sheet.crop((x, y, x + TILE, y + TILE))

floors_sheet = load_sheet("Room_Builder_Floors_48x48.png")
walls_sheet = load_sheet("Room_Builder_Walls_48x48.png")

canvas = Image.new("RGBA", (W, H), (26, 26, 46, 255))

def place_tile(t, col, row):
    canvas.paste(t, (col * TILE, row * TILE), t)

def fill_rect(t, c1, r1, c2, r2):
    for r in range(r1, r2):
        for c in range(c1, c2):
            place_tile(t, c, r)

# === APARTMENT (rows 0-7) ===
apt_floor = tile(floors_sheet, 0, 34)
fill_rect(apt_floor, 0, 0, COLS, APT_ROWS)
apt_wall = tile(walls_sheet, 0, 18)
fill_rect(apt_wall, 0, 0, COLS, 2)

# === CEILING SLAB (row 8) ===
slab = Image.new("RGBA", (TILE, TILE), (58, 58, 74, 255))
fill_rect(slab, 0, APT_ROWS, COLS, APT_ROWS + 1)

# === CAFÉ (rows 9-17) ===
cafe_start = APT_ROWS + SLAB_ROWS
cafe_floor = tile(floors_sheet, 0, 12)
fill_rect(cafe_floor, 0, cafe_start, COLS, cafe_start + CAFE_ROWS)
cafe_wall = tile(walls_sheet, 22, 12)
fill_rect(cafe_wall, 0, cafe_start, COLS, cafe_start + 2)

# Save
out_dir = os.path.join(BASE, "assets/composed")
os.makedirs(out_dir, exist_ok=True)
canvas.save(os.path.join(out_dir, "scene_bg.png"))
print(f"Saved: {W}x{H}")
