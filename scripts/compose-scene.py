#!/usr/bin/env python3
"""
Data-driven scene composer. Reads scene-layout.json, outputs scene_bg.png.
"""
from PIL import Image
import os, json

TILE = 48
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RB = os.path.join(BASE, "assets/research/limzu/purchased/Modern_Interiors_Full/1_Interiors/48x48/Room_Builder_subfiles_48x48")
SPRITES = os.path.join(BASE, "assets/sprites")

# Load config
with open(os.path.join(BASE, "scripts/scene-layout.json")) as f:
    cfg = json.load(f)

COLS = cfg["cols"]
TOTAL_ROWS = 18
W, H = COLS * TILE, TOTAL_ROWS * TILE

# Load tilesets
floors = Image.open(os.path.join(RB, "Room_Builder_Floors_48x48.png"))
walls = Image.open(os.path.join(RB, "Room_Builder_Walls_48x48.png"))

def tile(sheet, col, row):
    x, y = col * TILE, row * TILE
    return sheet.crop((x, y, x + TILE, y + TILE))

canvas = Image.new("RGBA", (W, H), (26, 26, 46, 255))

def fill(t, c1, r1, c2, r2):
    for r in range(r1, r2):
        for c in range(c1, c2):
            canvas.paste(t, (c*TILE, r*TILE), t)

# === APARTMENT ===
fill(tile(walls, 0, 19), 0, 0, COLS, 2)     # cream walls
fill(tile(floors, 0, 34), 0, 2, COLS, 8)     # herringbone floor

# === SLAB ===
slab = Image.new("RGBA", (TILE, TILE), (58, 58, 74, 255))
fill(slab, 0, 8, COLS, 9)

# === CAFÉ ===
fill(tile(walls, 22, 13), 0, 9, COLS, 11)    # teal walls
fill(tile(floors, 0, 12), 0, 11, COLS, 18)   # golden wood floor

# === FURNITURE ===
def place_furniture(items):
    for item in items:
        path = os.path.join(SPRITES, item["sprite"])
        if not os.path.exists(path):
            print(f"  MISSING: {item['sprite']}")
            continue
        img = Image.open(path)
        px = item["col"] * TILE
        py = item["row"] * TILE + item.get("offset_y", 0)
        canvas.paste(img, (px, py), img)

print("Placing apartment furniture...")
place_furniture(cfg["apartment"]["furniture"])
print("Placing café furniture...")
place_furniture(cfg["cafe"]["furniture"])

# Save
out = os.path.join(BASE, "assets/composed/scene_bg.png")
os.makedirs(os.path.dirname(out), exist_ok=True)
canvas.save(out)
print(f"Done: {out} ({W}x{H})")
