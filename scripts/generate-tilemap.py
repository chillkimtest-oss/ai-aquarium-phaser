#!/usr/bin/env python3
"""
Generate a Tiled-compatible JSON tilemap from scene-layout.json.
Outputs: assets/maps/cafe.json

Tileset: Room_Builder_Floors (floors) + Room_Builder_Walls (walls)
Objects: placed as an object layer referencing individual sprite images.

For tile layers, we use GIDs from the embedded tilesets.
"""
import json, os

TILE = 48
COLS = 12
ROWS = 18
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Tileset info
# Floors: 720x1920 = 15 cols x 40 rows = 600 tiles, firstgid=1
# Walls: 1536x1920 = 32 cols x 40 rows = 1280 tiles, firstgid=601
FLOOR_COLS = 15
FLOOR_ROWS = 40
FLOOR_FIRSTGID = 1

WALL_COLS = 32
WALL_ROWS = 40
WALL_FIRSTGID = FLOOR_COLS * FLOOR_ROWS + 1  # 601

def floor_gid(col, row):
    """Get GID for a floor tile at (col, row) in the floors sheet."""
    return FLOOR_FIRSTGID + row * FLOOR_COLS + col

def wall_gid(col, row):
    """Get GID for a wall tile at (col, row) in the walls sheet."""
    return WALL_FIRSTGID + row * WALL_COLS + col

# Build tile layers
def make_layer(name, layer_id, data):
    return {
        "id": layer_id,
        "name": name,
        "type": "tilelayer",
        "width": COLS,
        "height": ROWS,
        "x": 0, "y": 0,
        "opacity": 1,
        "visible": True,
        "data": data
    }

def make_object_layer(name, layer_id, objects):
    return {
        "id": layer_id,
        "name": name,
        "type": "objectgroup",
        "draworder": "topdown",
        "x": 0, "y": 0,
        "opacity": 1,
        "visible": True,
        "objects": objects
    }

# === Floor layer ===
floor_data = [0] * (COLS * ROWS)
# Apartment floor: rows 2-7 → floors sheet (col 0, row 34)
apt_floor_gid = floor_gid(0, 34)
for r in range(2, 8):
    for c in range(COLS):
        floor_data[r * COLS + c] = apt_floor_gid

# Café floor: rows 11-17 → floors sheet (col 0, row 12)
cafe_floor_gid = floor_gid(0, 12)
for r in range(11, 18):
    for c in range(COLS):
        floor_data[r * COLS + c] = cafe_floor_gid

# === Wall layer ===
wall_data = [0] * (COLS * ROWS)
# Apartment walls: rows 0-1 → walls sheet (col 0, row 19)
apt_wall_gid = wall_gid(0, 19)
for r in range(0, 2):
    for c in range(COLS):
        wall_data[r * COLS + c] = apt_wall_gid

# Ceiling slab: row 8 → use a dark floor tile as slab
slab_gid = floor_gid(0, 0)  # first floor tile (light, but we'll override)
for c in range(COLS):
    wall_data[8 * COLS + c] = slab_gid

# Café walls: rows 9-10 → walls sheet (col 22, row 13)
cafe_wall_gid = wall_gid(22, 13)
for r in range(9, 11):
    for c in range(COLS):
        wall_data[r * COLS + c] = cafe_wall_gid

# === Furniture as object layer ===
with open(os.path.join(BASE, "scripts/scene-layout.json")) as f:
    cfg = json.load(f)

obj_id = 1
objects = []
for section in ["apartment", "cafe"]:
    for item in cfg[section]["furniture"]:
        obj = {
            "id": obj_id,
            "name": item["sprite"].replace(".png", ""),
            "type": "furniture",
            "x": item["col"] * TILE,
            "y": item["row"] * TILE + item.get("offset_y", 0),
            "width": TILE,
            "height": TILE,
            "visible": True,
            "properties": [
                {"name": "sprite", "type": "string", "value": item["sprite"]}
            ]
        }
        objects.append(obj)
        obj_id += 1

# === Assemble map ===
tilemap = {
    "compressionlevel": -1,
    "height": ROWS,
    "width": COLS,
    "infinite": False,
    "orientation": "orthogonal",
    "renderorder": "right-down",
    "tileheight": TILE,
    "tilewidth": TILE,
    "type": "map",
    "version": "1.10",
    "tiledversion": "1.11.0",
    "nextlayerid": 4,
    "nextobjectid": obj_id,
    "layers": [
        make_layer("floor", 1, floor_data),
        make_layer("walls", 2, wall_data),
        make_object_layer("furniture", 3, objects)
    ],
    "tilesets": [
        {
            "firstgid": FLOOR_FIRSTGID,
            "name": "floors",
            "image": "../assets/tilesets/Room_Builder_Floors_48x48.png",
            "imagewidth": 720,
            "imageheight": 1920,
            "tilewidth": TILE,
            "tileheight": TILE,
            "tilecount": FLOOR_COLS * FLOOR_ROWS,
            "columns": FLOOR_COLS
        },
        {
            "firstgid": WALL_FIRSTGID,
            "name": "walls",
            "image": "../assets/tilesets/Room_Builder_Walls_48x48.png",
            "imagewidth": 1536,
            "imageheight": 1920,
            "tilewidth": TILE,
            "tileheight": TILE,
            "tilecount": WALL_COLS * WALL_ROWS,
            "columns": WALL_COLS
        }
    ]
}

out_dir = os.path.join(BASE, "assets/maps")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "cafe.json")
with open(out_path, "w") as f:
    json.dump(tilemap, f, indent=2)
print(f"Saved: {out_path}")
print(f"  Floor GIDs: apt={apt_floor_gid}, cafe={cafe_floor_gid}")
print(f"  Wall GIDs: apt={apt_wall_gid}, cafe={cafe_wall_gid}")
print(f"  Furniture objects: {len(objects)}")
