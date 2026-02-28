#!/usr/bin/env python3
"""
Tile extractor for LimeZu Modern Interiors RPG Maker MV tilesets.

Crops tiles at native 48x48. Multi-tile objects crop the full region
(e.g. 2x2 = 96x96). No downscaling.

Falls back to procedurally generated placeholder tiles if source
sheets are not found at the expected paths.

Usage:
    python tools/extract.py
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

# ─── Paths ────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
THEME_DIR = PROJECT_ROOT / "assets/research/limzu/purchased/Modern_Interiors_RPG_Maker_Version/RPG_MAKER_MV/Interiors/Theme_Sorter_MV"
AUTO_DIR  = PROJECT_ROOT / "assets/research/limzu/purchased/Modern_Interiors_RPG_Maker_Version/RPG_MAKER_MV"
OUT_DIR   = PROJECT_ROOT / "assets/sprites"
TILE      = 48  # native tile size

# ─── Sheet loaders ────────────────────────────────────────────────────────────

_sheet_cache: dict = {}

def _load_sheet(path: Path) -> Image.Image | None:
    if path in _sheet_cache:
        return _sheet_cache[path]
    if path.exists():
        img = Image.open(path).convert("RGBA")
        _sheet_cache[path] = img
        return img
    return None

def _find_sheet(sheet_name: str) -> Image.Image | None:
    """Try common path patterns for a sheet name."""
    candidates = [
        THEME_DIR / f"{sheet_name}.png",
        THEME_DIR / f"{sheet_name}_MV.png",
        THEME_DIR / f"{sheet_name}.png".replace(" ", "_"),
        AUTO_DIR / f"{sheet_name}.png",
        AUTO_DIR / f"{sheet_name}_MV.png",
    ]
    # Also search one level deeper
    for d in [THEME_DIR, AUTO_DIR]:
        for f in d.glob(f"**/{sheet_name}*.png"):
            candidates.append(f)
    for p in candidates:
        img = _load_sheet(p)
        if img:
            return img
    return None

# ─── Extraction helpers ────────────────────────────────────────────────────────

def extract_be(sheet: Image.Image, col: int, row: int, w: int = 1, h: int = 1) -> Image.Image:
    """Extract from a B/C/D/E object sheet (16×16 grid of 48px cells)."""
    x = col * TILE
    y = row * TILE
    return sheet.crop((x, y, x + w * TILE, y + h * TILE))

def extract_a2_fill(sheet: Image.Image, block_col: int, block_row: int) -> Image.Image:
    """Extract the solid fill tile from an A2 autotile block."""
    x = block_col * 96 + 48   # sub-position (1,1)
    y = block_row * 144 + 48
    return sheet.crop((x, y, x + TILE, y + TILE))

def extract_a4_top(sheet: Image.Image, wall_col: int, wall_row: int) -> Image.Image:
    """Extract the ceiling/wall-top fill from an A4 wall block."""
    x = wall_col * 96 + 48
    y = wall_row * 240 + 48
    return sheet.crop((x, y, x + TILE, y + TILE))

def extract_a4_face(sheet: Image.Image, wall_col: int, wall_row: int) -> Image.Image:
    """Extract the wall face fill from an A4 wall block."""
    x = wall_col * 96 + 48
    y = wall_row * 240 + 144
    return sheet.crop((x, y, x + TILE, y + TILE))

def extract_a5(sheet: Image.Image, col: int, row: int) -> Image.Image:
    """Extract from an A5 simple tile sheet (8×16 grid of 48px cells)."""
    x = col * TILE
    y = row * TILE
    return sheet.crop((x, y, x + TILE, y + TILE))

# ─── Placeholder generator ────────────────────────────────────────────────────

def _px(img: Image.Image, x: int, y: int, color: tuple, size: int = 1) -> None:
    """Draw a pixel block at (x, y) with given color."""
    draw = ImageDraw.Draw(img)
    draw.rectangle([x, y, x + size - 1, y + size - 1], fill=color)

def _rect(img: Image.Image, x1: int, y1: int, x2: int, y2: int, fill: tuple, outline: tuple | None = None) -> None:
    draw = ImageDraw.Draw(img)
    draw.rectangle([x1, y1, x2, y2], fill=fill, outline=outline)

def _new(w: int, h: int, fill: tuple = (0, 0, 0, 0)) -> Image.Image:
    return Image.new("RGBA", (w, h), fill)

def _solid(w: int, h: int, color: tuple) -> Image.Image:
    return Image.new("RGBA", (w, h), color)

# Color palette
C = {
    # floors
    "wood":       (185, 133,  74, 255),
    "wood_dark":  (140,  90,  52, 255),
    "wood_line":  (159, 109,  58, 255),
    "tile_bg":    (224, 210, 185, 255),
    "tile_grout": (190, 175, 152, 255),
    "carpet":     (100, 140, 120, 255),
    "carpet_alt": ( 90, 128, 110, 255),
    "sidewalk":   (170, 165, 158, 255),
    "swalk_line": (148, 143, 137, 255),
    "ceiling":    ( 68,  55,  45, 255),
    "ceil_line":  ( 58,  47,  37, 255),
    # walls
    "wall_top":   ( 92,  62,  44, 255),
    "wall_bg":    (240, 228, 210, 255),
    "wall_wains": (160, 110,  68, 255),
    "wall_trim":  (130,  88,  50, 255),
    "apt_wall":   (210, 185, 155, 255),
    "apt_plank":  (190, 162, 128, 255),
    # furniture
    "counter":    (110,  75,  45, 255),
    "counter_top":(140, 100,  60, 255),
    "machine":    (180, 180, 190, 255),
    "machine_d":  (130, 130, 140, 255),
    "register":   ( 40,  40,  40, 255),
    "glass":      (180, 220, 220, 150),
    "stool_top":  ( 80, 160, 190, 255),
    "table":      (160, 115,  65, 255),
    "table_leg":  (120,  80,  40, 255),
    "chair":      (190, 140,  80, 255),
    "chair_dark": (150, 100,  50, 255),
    "sofa_main":  ( 90, 110, 150, 255),
    "sofa_dark":  ( 70,  90, 130, 255),
    "sofa_cush":  (110, 130, 170, 255),
    "shelf":      (140,  95,  55, 255),
    "shelf_bk":   ( 60,  40,  25, 255),
    "book1":      (200,  80,  80, 255),
    "book2":      ( 80, 140, 200, 255),
    "book3":      (200, 180,  80, 255),
    "book4":      ( 80, 160,  80, 255),
    "plant_pot":  (160, 110,  60, 255),
    "plant_leaf": ( 60, 140,  70, 255),
    "plant_stem": ( 50, 100,  50, 255),
    "plant_dk":   ( 40, 120,  55, 255),
    "bed_frame":  (160, 115,  65, 255),
    "bed_sheet":  (200, 220, 240, 255),
    "bed_pillow": (240, 240, 255, 255),
    "bed_blank":  (210, 190, 220, 255),
    "lamp_post":  (160, 140, 100, 255),
    "lamp_shade": (240, 200, 120, 220),
    "art_frame":  (100,  75,  45, 255),
    "art_canvas": (245, 240, 230, 255),
    "art_paint":  (180,  90,  60, 255),
    "easel_wood": (160, 120,  70, 255),
    "fire_brick": (170,  80,  60, 255),
    "fire_mantel":(140, 100,  60, 255),
    "fire_glow":  (240, 160,  60, 200),
    "fire_dark":  ( 80,  40,  30, 255),
    "stove":      ( 60,  60,  65, 255),
    "stove_ring": ( 40,  40,  44, 255),
    "stove_hot":  (200,  80,  40, 255),
    "fridge":     (200, 205, 210, 255),
    "fridge_hnd": (150, 155, 160, 255),
    "sink":       (190, 195, 200, 255),
    "sink_drain": (140, 145, 150, 255),
    "desk":       (160, 115,  65, 255),
    "desk_top":   (175, 130,  75, 255),
    "door_frame": ( 90,  60,  35, 255),
    "door_panel": (120,  85,  50, 255),
    "door_knob":  (200, 180, 100, 255),
    "window_fr":  (140, 100,  60, 255),
    "window_gl":  (180, 215, 230, 180),
    "window_sky": (160, 200, 230, 255),
    "stairs_step": (160, 115,  65, 255),
    "stairs_side": (130,  90,  45, 255),
    "stairs_shdw": (110,  75,  35, 200),
    "display_fr": (140, 100,  60, 255),
    "display_gl": (180, 220, 215, 180),
    "pastry1":    (230, 190, 140, 255),
    "pastry2":    (200, 160, 100, 255),
    "cup":        (240, 240, 240, 255),
    "coffee":     ( 80,  50,  30, 255),
    "rug1":       (180, 100,  80, 255),
    "rug2":       (200, 120,  90, 255),
    "rug_border": (140,  70,  50, 255),
    "art1":       (200,  80,  80, 255),
    "art2":       ( 80, 130, 200, 255),
    "art3":       (150, 200,  80, 255),
    "paint_sup":  (140, 100,  60, 255),
    "nightstand": (150, 105,  58, 255),
    "curtain":    (180, 120,  80, 200),
    "tv":         ( 30,  30,  35, 255),
    "screen":     ( 50,  80, 120, 255),
    "transp":     (  0,   0,   0,   0),
}

def make_floor_wood() -> Image.Image:
    img = _solid(TILE, TILE, C["wood"])
    d = ImageDraw.Draw(img)
    for y in range(0, TILE, 8):
        d.line([(0, y), (TILE-1, y)], fill=C["wood_line"], width=1)
    # plank edges every 16px horizontal
    for x in range(0, TILE, 16):
        d.line([(x, 0), (x, TILE-1)], fill=C["wood_line"], width=1)
    return img

def make_floor_wood_dark() -> Image.Image:
    img = _solid(TILE, TILE, C["wood_dark"])
    d = ImageDraw.Draw(img)
    for y in range(0, TILE, 8):
        d.line([(0, y), (TILE-1, y)], fill=(110, 70, 38, 255), width=1)
    for x in range(0, TILE, 16):
        d.line([(x, 0), (x, TILE-1)], fill=(110, 70, 38, 255), width=1)
    return img

def make_floor_tile() -> Image.Image:
    img = _solid(TILE, TILE, C["tile_bg"])
    d = ImageDraw.Draw(img)
    # checkerboard pattern
    half = TILE // 2
    d.rectangle([0, 0, half-1, half-1], fill=C["tile_grout"])
    d.rectangle([half, half, TILE-1, TILE-1], fill=C["tile_grout"])
    # grout lines
    d.line([(half, 0), (half, TILE-1)], fill=(170, 155, 132, 255), width=1)
    d.line([(0, half), (TILE-1, half)], fill=(170, 155, 132, 255), width=1)
    return img

def make_floor_carpet() -> Image.Image:
    img = _solid(TILE, TILE, C["carpet"])
    d = ImageDraw.Draw(img)
    for y in range(0, TILE, 6):
        for x in range(0, TILE, 6):
            if (x // 6 + y // 6) % 2 == 0:
                d.rectangle([x, y, x+5, y+5], fill=C["carpet_alt"])
    return img

def make_floor_sidewalk() -> Image.Image:
    img = _solid(TILE, TILE, C["sidewalk"])
    d = ImageDraw.Draw(img)
    for y in range(0, TILE, 12):
        d.line([(0, y), (TILE-1, y)], fill=C["swalk_line"], width=1)
    for x in range(0, TILE, 16):
        d.line([(x, 0), (x, TILE-1)], fill=C["swalk_line"], width=1)
    return img

def make_ceiling() -> Image.Image:
    img = _solid(TILE, TILE, C["ceiling"])
    d = ImageDraw.Draw(img)
    for y in range(0, TILE, 10):
        d.line([(0, y), (TILE-1, y)], fill=C["ceil_line"], width=1)
    for x in range(0, TILE, 16):
        d.line([(x, 0), (x, TILE-1)], fill=C["ceil_line"], width=1)
    return img

def make_wall_top() -> Image.Image:
    img = _solid(TILE, TILE, C["wall_top"])
    d = ImageDraw.Draw(img)
    for x in range(0, TILE, 6):
        d.line([(x, 0), (x, TILE-1)], fill=(72, 48, 32, 255), width=1)
    d.line([(0, TILE-4), (TILE-1, TILE-4)], fill=(112, 80, 55, 255), width=2)
    return img

def make_wall_face(apartment: bool = False) -> Image.Image:
    bg = C["apt_wall"] if apartment else C["wall_bg"]
    wains = C["apt_plank"] if apartment else C["wall_wains"]
    img = _solid(TILE, TILE, bg)
    d = ImageDraw.Draw(img)
    # Wainscoting: bottom 16px
    d.rectangle([0, TILE-16, TILE-1, TILE-1], fill=wains)
    d.line([(0, TILE-16), (TILE-1, TILE-16)], fill=C["wall_trim"], width=2)
    if apartment:
        # vertical plank lines
        for x in range(0, TILE, 8):
            d.line([(x, 0), (x, TILE-1)], fill=C["apt_plank"], width=1)
    return img

def make_wall_window(apartment: bool = False) -> Image.Image:
    img = make_wall_face(apartment)
    d = ImageDraw.Draw(img)
    # Window inset
    wx, wy, ww, wh = 4, 4, TILE-8, TILE-22
    d.rectangle([wx, wy, wx+ww, wy+wh], fill=C["window_gl"])
    d.rectangle([wx, wy, wx+ww, wy+wh], outline=C["window_fr"], width=2)
    # mullion
    mid = wx + ww // 2
    d.line([(mid, wy), (mid, wy+wh)], fill=C["window_fr"], width=1)
    d.line([(wx, wy+wh//2), (wx+ww, wy+wh//2)], fill=C["window_fr"], width=1)
    return img

def make_door() -> Image.Image:
    img = _solid(TILE, TILE, C["sidewalk"])
    d = ImageDraw.Draw(img)
    # Door frame
    d.rectangle([4, 0, TILE-5, TILE-1], fill=C["door_frame"])
    d.rectangle([6, 2, TILE-7, TILE-1], fill=C["door_panel"])
    # Panel details
    d.rectangle([8, 6, TILE-9, TILE//2-2], fill=(100, 70, 40, 255), outline=(80, 55, 30, 255))
    d.rectangle([8, TILE//2+2, TILE-9, TILE-8], fill=(100, 70, 40, 255), outline=(80, 55, 30, 255))
    # Knob
    d.ellipse([TILE-13, TILE//2-3, TILE-9, TILE//2+3], fill=C["door_knob"])
    return img

def make_stairs() -> Image.Image:
    img = _solid(TILE, TILE, C["stairs_side"])
    d = ImageDraw.Draw(img)
    step_h = TILE // 6
    for i in range(6):
        y = TILE - (i + 1) * step_h
        shade = max(80, 160 - i * 12)
        d.rectangle([i * 4, y, TILE-1, y + step_h - 1],
                    fill=(shade, shade - 30, shade - 60, 255))
        d.line([(i * 4, y), (TILE-1, y)], fill=(200, 170, 120, 255), width=1)
    return img

def make_counter() -> Image.Image:
    img = _solid(TILE, TILE, C["counter"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, TILE-1, 8], fill=C["counter_top"])
    d.rectangle([2, 2, TILE-3, 6], fill=(150, 110, 70, 255))
    # front panel
    d.line([(0, 10), (TILE-1, 10)], fill=(90, 60, 35, 255), width=2)
    # wood grain vertical
    for x in range(6, TILE, 8):
        d.line([(x, 12), (x, TILE-4)], fill=(90, 58, 32, 255), width=1)
    return img

def make_counter_left() -> Image.Image:
    img = make_counter()
    d = ImageDraw.Draw(img)
    # Left end cap
    d.rectangle([0, 0, 6, TILE-1], fill=C["counter_top"])
    return img

def make_counter_right() -> Image.Image:
    img = make_counter()
    d = ImageDraw.Draw(img)
    d.rectangle([TILE-7, 0, TILE-1, TILE-1], fill=C["counter_top"])
    return img

def make_espresso_machine() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Body
    d.rectangle([6, 8, TILE-7, TILE-4], fill=C["machine"], outline=C["machine_d"])
    # Portafilter area
    d.rectangle([10, TILE-18, TILE-11, TILE-8], fill=C["machine_d"])
    # Cup tray
    d.rectangle([8, TILE-8, TILE-9, TILE-4], fill=C["machine_d"])
    # Steam wand
    d.line([(TILE-8, 10), (TILE-8, 26)], fill=C["machine_d"], width=3)
    d.ellipse([(TILE-10, 8), (TILE-6, 12)], fill=(220, 220, 230, 255))
    # Screen
    d.rectangle([10, 10, 22, 18], fill=(60, 80, 120, 255))
    return img

def make_cash_register() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Base
    d.rectangle([4, 16, TILE-5, TILE-4], fill=C["register"], outline=(60, 60, 60, 255))
    # Screen
    d.rectangle([6, 8, 26, 18], fill=(40, 40, 44, 255))
    d.rectangle([8, 10, 24, 17], fill=(50, 80, 120, 255))
    # Keys
    for row in range(3):
        for col in range(4):
            d.rectangle([6+col*7, 20+row*5, 10+col*7, 23+row*5], fill=(80, 80, 80, 255))
    return img

def make_display_case(stocked: bool = False) -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Frame
    d.rectangle([2, 2, 93, 93], fill=C["display_fr"], outline=(100, 70, 40, 255))
    # Glass interior
    d.rectangle([8, 8, 87, 87], fill=C["display_gl"])
    # Shelf lines
    d.line([(8, 40), (87, 40)], fill=C["display_fr"], width=2)
    d.line([(8, 64), (87, 64)], fill=C["display_fr"], width=2)
    if stocked:
        # Pastries
        for i, (cx, cy, col) in enumerate([
            (20, 22, C["pastry1"]), (40, 22, C["pastry2"]), (60, 22, C["pastry1"]),
            (20, 50, C["pastry2"]), (42, 50, C["pastry1"]), (62, 50, C["pastry2"]),
            (25, 72, C["pastry1"]), (55, 72, C["pastry2"]),
        ]):
            d.ellipse([cx-8, cy-6, cx+8, cy+6], fill=col)
            d.ellipse([cx-6, cy-4, cx+6, cy+4], fill=(220, 180, 120, 255))
    return img

def make_table_large() -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Table top
    d.rectangle([6, 6, 89, 89], fill=C["table"], outline=C["table_leg"])
    d.rectangle([10, 10, 85, 85], fill=(170, 125, 72, 255))
    # Legs
    for (x, y) in [(8, 8), (78, 8), (8, 78), (78, 78)]:
        d.rectangle([x, y, x+9, y+9], fill=C["table_leg"])
    # Wood grain
    for x in range(14, 85, 8):
        d.line([(x, 12), (x, 84)], fill=(155, 112, 62, 255), width=1)
    return img

def make_table_small() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, TILE-5, TILE-5], fill=C["table"], outline=C["table_leg"])
    d.rectangle([7, 7, TILE-8, TILE-8], fill=(170, 125, 72, 255))
    for (x, y) in [(5, 5), (TILE-13, 5), (5, TILE-13), (TILE-13, TILE-13)]:
        d.rectangle([x, y, x+5, y+5], fill=C["table_leg"])
    return img

def make_chair_front() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Seat
    d.rectangle([6, 20, TILE-7, TILE-8], fill=C["chair"], outline=C["chair_dark"])
    # Back
    d.rectangle([6, 8, TILE-7, 20], fill=C["chair_dark"])
    d.rectangle([8, 10, TILE-9, 18], fill=(170, 120, 65, 255))
    # Legs
    d.line([(9, TILE-8), (9, TILE-1)], fill=C["chair_dark"], width=3)
    d.line([(TILE-10, TILE-8), (TILE-10, TILE-1)], fill=C["chair_dark"], width=3)
    return img

def make_chair_back() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Seat (perspective from back)
    d.rectangle([6, 12, TILE-7, 28], fill=C["chair"], outline=C["chair_dark"])
    # Back rail (closest to viewer = bottom of image)
    d.rectangle([6, 28, TILE-7, TILE-8], fill=C["chair_dark"])
    d.line([(9, TILE-8), (9, TILE-1)], fill=C["chair_dark"], width=3)
    d.line([(TILE-10, TILE-8), (TILE-10, TILE-1)], fill=C["chair_dark"], width=3)
    return img

def make_chair_left() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([8, 16, TILE-6, 32], fill=C["chair"], outline=C["chair_dark"])
    d.rectangle([TILE-12, 8, TILE-6, 32], fill=C["chair_dark"])
    d.line([(10, 32), (10, TILE-1)], fill=C["chair_dark"], width=3)
    d.line([(TILE-8, 32), (TILE-8, TILE-1)], fill=C["chair_dark"], width=3)
    return img

def make_chair_right() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([6, 16, TILE-10, 32], fill=C["chair"], outline=C["chair_dark"])
    d.rectangle([6, 8, 12, 32], fill=C["chair_dark"])
    d.line([(8, 32), (8, TILE-1)], fill=C["chair_dark"], width=3)
    d.line([(TILE-10, 32), (TILE-10, TILE-1)], fill=C["chair_dark"], width=3)
    return img

def make_stool() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.ellipse([8, 8, TILE-9, TILE-9], fill=C["stool_top"], outline=(60, 130, 160, 255))
    d.line([(TILE//2, TILE//2), (TILE//2, TILE-2)], fill=(90, 90, 90, 255), width=4)
    d.line([(10, TILE-4), (TILE-11, TILE-4)], fill=(90, 90, 90, 255), width=3)
    return img

def make_sofa() -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Back cushion
    d.rectangle([4, 4, 91, 32], fill=C["sofa_main"], outline=C["sofa_dark"])
    # Seat cushions
    d.rectangle([4, 32, 44, 86], fill=C["sofa_cush"], outline=C["sofa_dark"])
    d.rectangle([50, 32, 91, 86], fill=C["sofa_cush"], outline=C["sofa_dark"])
    d.line([(47, 32), (47, 86)], fill=C["sofa_dark"], width=4)
    # Armrests
    d.rectangle([4, 28, 14, 86], fill=C["sofa_main"])
    d.rectangle([81, 28, 91, 86], fill=C["sofa_main"])
    # Feet
    for x in [8, 82]:
        d.rectangle([x, 82, x+6, 91], fill=C["chair_dark"])
    return img

def make_bookshelf() -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Frame
    d.rectangle([2, 2, 93, 93], fill=C["shelf"], outline=C["shelf_bk"])
    d.rectangle([6, 6, 89, 89], fill=(50, 35, 20, 255))
    # Shelves
    shelf_ys = [24, 48, 72]
    for sy in shelf_ys:
        d.rectangle([4, sy, 91, sy+4], fill=C["shelf"])
    # Books
    book_colors = [C["book1"], C["book2"], C["book3"], C["book4"],
                   (180, 80, 160, 255), (100, 180, 100, 255)]
    sections = [(8, 4), (28, 0), (48, 24), (72, 4)]
    for bx, by_offset in sections:
        y_start = 8 + by_offset
        for j, bcol in enumerate(book_colors[:5]):
            bw = 8 + (j % 2) * 2
            d.rectangle([bx + j*9, y_start, bx + j*9 + bw, 22 + by_offset], fill=bcol)
    # Second row of books
    for i, bcol in enumerate(book_colors):
        d.rectangle([8 + i*13, 30, 8 + i*13 + 10, 44], fill=bcol)
    for i, bcol in enumerate(book_colors):
        d.rectangle([8 + i*13, 54, 8 + i*13 + 10, 68], fill=bcol)
    return img

def make_plant_tall() -> Image.Image:
    """1×3 = 48×144"""
    img = _solid(48, 144, C["transp"])
    d = ImageDraw.Draw(img)
    # Pot at bottom
    d.rectangle([12, 118, 35, 140], fill=C["plant_pot"], outline=(130, 88, 45, 255))
    d.rectangle([15, 116, 32, 122], fill=(140, 95, 50, 255))
    # Stem
    d.line([(23, 118), (23, 40)], fill=C["plant_stem"], width=3)
    # Leaves
    for (lx, ly, lw, lh, ang) in [
        (4,  90, 20, 12, 0), (22, 80, 20, 12, 0),
        (2,  60, 24, 14, 0), (20, 50, 24, 14, 0),
        (0,  30, 28, 16, 0), (18, 20, 28, 16, 0),
        (4,  10, 22, 12, 0),
    ]:
        d.ellipse([lx, ly, lx+lw, ly+lh], fill=C["plant_leaf"])
    # Darker spots on leaves
    for (lx, ly) in [(8, 92), (26, 82), (6, 62), (24, 52), (4, 32), (22, 22)]:
        d.ellipse([lx, ly, lx+8, ly+6], fill=C["plant_dk"])
    return img

def make_plant_small() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([14, 34, 33, 45], fill=C["plant_pot"], outline=(130, 88, 45, 255))
    d.ellipse([10, 14, 37, 36], fill=C["plant_leaf"])
    d.ellipse([13, 16, 34, 34], fill=C["plant_dk"])
    d.ellipse([16, 10, 30, 22], fill=C["plant_leaf"])
    return img

def make_lamp_floor() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Base
    d.ellipse([16, TILE-10, 31, TILE-3], fill=C["lamp_post"])
    # Post
    d.line([(23, TILE-8), (23, 18)], fill=C["lamp_post"], width=3)
    # Shade
    d.polygon([(12, 8), (33, 8), (28, 20), (17, 20)], fill=C["lamp_shade"], outline=(200, 160, 80, 255))
    d.ellipse([19, 6, 26, 10], fill=(255, 240, 200, 255))
    return img

def make_lamp_table() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([16, TILE-8, 31, TILE-3], fill=C["lamp_post"])
    d.line([(23, TILE-8), (23, 20)], fill=C["lamp_post"], width=2)
    d.polygon([(14, 14), (32, 14), (28, 22), (18, 22)], fill=C["lamp_shade"])
    d.ellipse([20, 10, 26, 15], fill=(255, 240, 200, 255))
    return img

def make_wall_art(variant: int = 1) -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Frame
    d.rectangle([4, 4, TILE-5, TILE-5], fill=C["art_frame"])
    # Canvas
    d.rectangle([8, 8, TILE-9, TILE-9], fill=C["art_canvas"])
    if variant == 1:
        # Simple landscape
        d.rectangle([8, 24, TILE-9, TILE-9], fill=(120, 170, 120, 255))
        d.ellipse([14, 10, 32, 24], fill=(80, 130, 200, 255))
        d.ellipse([20, 8, 30, 20], fill=(255, 240, 180, 255))
    elif variant == 2:
        # Abstract
        d.ellipse([10, 10, 26, 26], fill=(200, 80, 80, 255))
        d.ellipse([22, 18, TILE-10, TILE-10], fill=(80, 120, 200, 255))
        d.line([(10, TILE-10), (TILE-10, 10)], fill=(200, 180, 60, 255), width=3)
    elif variant == 3:
        # Portrait silhouette
        d.rectangle([8, 20, TILE-9, TILE-9], fill=(200, 180, 140, 255))
        d.ellipse([14, 10, 33, 22], fill=(160, 120, 90, 255))
    return img

def make_paint_supplies() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Palette
    d.ellipse([4, 18, 28, 36], fill=(235, 225, 210, 255))
    for (px, py, pc) in [(8, 20, (200, 80, 80, 255)), (16, 20, (80, 120, 200, 255)),
                          (8, 30, (200, 180, 60, 255)), (18, 28, (80, 160, 80, 255))]:
        d.ellipse([px, py, px+5, py+5], fill=pc)
    # Brushes
    for i in range(3):
        d.line([(30 + i*5, 38), (32 + i*5, 10)], fill=C["easel_wood"], width=2)
        d.ellipse([28+i*5, 8, 34+i*5, 14], fill=(50, 50, 50, 255))
    return img

def make_bed() -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Frame
    d.rectangle([2, 2, 93, 93], fill=C["bed_frame"], outline=(130, 88, 44, 255))
    # Mattress
    d.rectangle([8, 24, 87, 87], fill=C["bed_sheet"])
    # Pillow
    d.rectangle([12, 24, 83, 42], fill=C["bed_pillow"], outline=(180, 185, 210, 255))
    d.rectangle([14, 26, 45, 40], fill=(245, 245, 255, 255))
    d.rectangle([50, 26, 81, 40], fill=(245, 245, 255, 255))
    # Blanket fold
    d.rectangle([8, 55, 87, 87], fill=(180, 200, 220, 255))
    d.line([(8, 55), (87, 55)], fill=(160, 180, 200, 255), width=2)
    # Headboard
    d.rectangle([4, 2, 91, 26], fill=(140, 98, 52, 255))
    d.rectangle([8, 4, 87, 22], fill=(150, 105, 58, 255))
    return img

def make_easel(state: str = "blank") -> Image.Image:
    """1×2 = 48×96"""
    img = _solid(48, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Legs
    d.line([(10, 90), (24, 30)], fill=C["easel_wood"], width=4)
    d.line([(37, 90), (24, 30)], fill=C["easel_wood"], width=4)
    d.line([(18, 90), (24, 40)], fill=C["easel_wood"], width=3)
    # Cross brace
    d.line([(12, 75), (35, 75)], fill=C["easel_wood"], width=2)
    # Canvas
    if state == "blank":
        d.rectangle([8, 8, 39, 42], fill=C["art_canvas"], outline=C["art_frame"])
    elif state == "painting":
        d.rectangle([8, 8, 39, 42], fill=C["art_canvas"], outline=C["art_frame"])
        d.rectangle([10, 10, 37, 40], fill=(240, 235, 220, 255))
        d.ellipse([12, 12, 24, 22], fill=(200, 80, 80, 255))
        d.ellipse([20, 18, 36, 38], fill=(80, 130, 200, 255))
        d.rectangle([12, 28, 20, 38], fill=(200, 180, 60, 255))
    elif state == "finished":
        d.rectangle([8, 8, 39, 42], fill=C["art_canvas"], outline=C["art_frame"])
        d.rectangle([10, 20, 37, 40], fill=(120, 170, 120, 255))
        d.ellipse([12, 10, 36, 22], fill=(80, 130, 200, 255))
        d.ellipse([16, 12, 28, 20], fill=(255, 240, 180, 255))
    return img

def make_stove(on: bool = False) -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([2, 4, TILE-3, TILE-3], fill=C["stove"], outline=(40, 40, 45, 255))
    # Burner rings
    ring_col = C["stove_hot"] if on else C["stove_ring"]
    for (cx, cy) in [(14, 18), (33, 18), (14, 33), (33, 33)]:
        d.ellipse([cx-7, cy-7, cx+7, cy+7], fill=ring_col, outline=(30, 30, 35, 255))
        d.ellipse([cx-4, cy-4, cx+4, cy+4], fill=(30, 30, 35, 255))
    # Control knobs
    for i in range(4):
        d.ellipse([6+i*9, TILE-10, 10+i*9, TILE-5], fill=(80, 80, 85, 255))
    return img

def make_fridge() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([2, 2, TILE-3, TILE-3], fill=C["fridge"], outline=(160, 165, 170, 255))
    # Handle
    d.rectangle([TILE-10, 10, TILE-7, 28], fill=C["fridge_hnd"])
    # Freezer line
    d.line([(4, 20), (TILE-5, 20)], fill=(160, 165, 170, 255), width=2)
    # Door seal lines
    d.rectangle([4, 4, TILE-5, 18], fill=(190, 195, 200, 255))
    d.rectangle([4, 22, TILE-5, TILE-5], fill=(195, 200, 205, 255))
    return img

def make_sink() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([4, 8, TILE-5, TILE-5], fill=C["sink"], outline=(160, 165, 170, 255))
    d.rectangle([8, 14, TILE-9, TILE-9], fill=(160, 175, 185, 255))
    # Drain
    d.ellipse([18, 28, 29, 36], fill=C["sink_drain"])
    # Faucet
    d.rectangle([18, 6, 29, 14], fill=(170, 175, 180, 255))
    d.ellipse([20, 4, 27, 10], fill=(180, 185, 190, 255))
    return img

def make_desk() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([2, 4, TILE-3, 18], fill=C["desk_top"], outline=C["desk"])
    d.rectangle([2, 18, 10, TILE-3], fill=C["desk"])
    d.rectangle([TILE-11, 18, TILE-3, TILE-3], fill=C["desk"])
    # Drawer
    d.rectangle([4, 8, TILE-5, 16], fill=(155, 112, 62, 255), outline=C["desk"])
    d.rectangle([20, 10, 27, 14], fill=C["door_knob"])
    return img

def make_shelf_wall() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([2, 16, TILE-3, 22], fill=C["shelf"], outline=(110, 72, 35, 255))
    # Items on shelf
    d.rectangle([4, 8, 10, 17], fill=C["book1"])
    d.rectangle([12, 10, 18, 17], fill=C["book2"])
    d.rectangle([20, 6, 26, 17], fill=C["book3"])
    d.ellipse([30, 8, 38, 17], fill=(180, 160, 130, 255))
    # Brackets
    d.polygon([(2, 22), (2, TILE-4), (8, 22)], fill=(110, 72, 35, 255))
    d.polygon([(TILE-3, 22), (TILE-3, TILE-4), (TILE-9, 22)], fill=(110, 72, 35, 255))
    return img

def make_fireplace() -> Image.Image:
    """2×2 = 96×96"""
    img = _solid(96, 96, C["transp"])
    d = ImageDraw.Draw(img)
    # Mantel
    d.rectangle([2, 2, 93, 30], fill=C["fire_mantel"], outline=(110, 72, 35, 255))
    d.rectangle([4, 4, 91, 28], fill=(150, 110, 65, 255))
    # Brick surround
    d.rectangle([8, 30, 87, 93], fill=C["fire_brick"])
    # Firebox
    d.rectangle([14, 38, 81, 88], fill=C["fire_dark"])
    # Fire glow
    d.ellipse([20, 60, 75, 86], fill=(200, 100, 40, 200))
    d.ellipse([28, 52, 66, 80], fill=C["fire_glow"])
    d.ellipse([35, 46, 58, 70], fill=(255, 220, 100, 200))
    # Logs
    d.ellipse([18, 78, 42, 88], fill=(60, 40, 20, 255))
    d.ellipse([50, 78, 78, 88], fill=(60, 40, 20, 255))
    # Decorative elements on mantel
    d.ellipse([14, 6, 26, 18], fill=(180, 150, 110, 255))
    d.rectangle([35, 4, 58, 18], fill=(160, 130, 90, 255))
    d.ellipse([68, 6, 80, 18], fill=(180, 150, 110, 255))
    return img

def make_window_sky() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, TILE-1, TILE-1], fill=C["window_sky"])
    # Window frame on top
    d.rectangle([0, 0, TILE-1, 6], fill=C["window_fr"])
    # Glass with sky gradient
    d.rectangle([4, 8, TILE-5, TILE-5], fill=(160, 210, 240, 255))
    # Cloud
    d.ellipse([6, 12, 22, 20], fill=(240, 245, 255, 200))
    d.ellipse([14, 10, 28, 18], fill=(245, 250, 255, 220))
    return img

def make_nightstand() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([4, 8, TILE-5, TILE-4], fill=C["nightstand"], outline=(120, 82, 40, 255))
    d.rectangle([6, 10, TILE-7, 22], fill=(140, 98, 50, 255), outline=(110, 75, 35, 255))
    # Knob
    d.ellipse([18, 13, 28, 19], fill=C["door_knob"])
    # Item on top (cup/lamp)
    d.ellipse([14, 4, 22, 10], fill=(220, 215, 200, 255))
    return img

def make_coffee_table() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([2, 10, TILE-3, TILE-10], fill=C["table"], outline=C["table_leg"])
    d.rectangle([5, 12, TILE-6, TILE-12], fill=(170, 125, 72, 255))
    # Items: cup and book
    d.ellipse([8, 14, 16, 22], fill=C["cup"])
    d.rectangle([20, 13, 38, 20], fill=C["book2"])
    return img

def make_rug() -> Image.Image:
    img = _solid(TILE, TILE, C["carpet"])
    d = ImageDraw.Draw(img)
    # Border pattern
    d.rectangle([2, 2, TILE-3, TILE-3], outline=C["rug_border"], width=3)
    d.rectangle([6, 6, TILE-7, TILE-7], outline=C["rug2"], width=1)
    # Center pattern
    d.ellipse([14, 14, TILE-15, TILE-15], outline=C["rug_border"], width=2)
    return img

def make_cup(full: bool = False) -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.rectangle([14, 20, 33, 38], fill=C["cup"], outline=(180, 180, 180, 255))
    if full:
        d.rectangle([16, 22, 31, 28], fill=C["coffee"])
    # Handle
    d.arc([30, 24, 40, 34], start=270, end=90, fill=(180, 180, 180, 255), width=2)
    # Saucer
    d.ellipse([10, 36, 37, 44], fill=(200, 200, 200, 255))
    return img

def make_book(open: bool = False) -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    if open:
        d.rectangle([6, 14, 41, 36], fill=(240, 235, 220, 255), outline=(140, 100, 60, 255))
        d.line([(23, 14), (23, 36)], fill=(180, 160, 130, 255), width=1)
        for y in [18, 22, 26, 30]:
            d.line([(8, y), (21, y)], fill=(160, 150, 140, 255), width=1)
            d.line([(25, y), (39, y)], fill=(160, 150, 140, 255), width=1)
    else:
        d.rectangle([12, 10, 35, 38], fill=C["book2"], outline=(60, 90, 160, 255))
        d.line([(14, 12), (14, 36)], fill=(80, 110, 180, 255), width=2)
        d.line([(16, 16), (33, 16)], fill=(200, 210, 230, 255), width=1)
        d.line([(16, 20), (33, 20)], fill=(200, 210, 230, 255), width=1)
    return img

def make_pastry() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.ellipse([8, 12, 39, 34], fill=C["pastry1"], outline=(190, 150, 90, 255))
    d.ellipse([12, 14, 35, 30], fill=C["pastry2"])
    d.arc([10, 10, 20, 20], start=0, end=180, fill=(220, 190, 140, 255), width=2)
    return img

def make_plate(food: bool = False) -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    d.ellipse([6, 10, 41, 38], fill=(235, 230, 220, 255), outline=(200, 195, 185, 255))
    d.ellipse([10, 14, 37, 34], fill=(245, 240, 232, 255))
    if food:
        d.ellipse([14, 16, 26, 26], fill=(180, 140, 80, 255))
        d.rectangle([26, 18, 34, 28], fill=(120, 170, 90, 255))
    return img

def make_coffee_maker() -> Image.Image:
    img = _solid(TILE, TILE, C["transp"])
    d = ImageDraw.Draw(img)
    # Body
    d.rectangle([8, 6, TILE-9, TILE-4], fill=C["machine"], outline=C["machine_d"])
    # Carafe
    d.polygon([(14, TILE-16), (14, TILE-4), (33, TILE-4), (31, TILE-16)], fill=(180, 195, 200, 255))
    # Filter basket
    d.rectangle([12, 14, 35, 24], fill=C["machine_d"])
    # On light
    d.ellipse([28, 8, 34, 12], fill=(80, 200, 80, 255))
    return img

def make_stairs_tile() -> Image.Image:
    """Stair tile for ceiling slab area."""
    img = _solid(TILE, TILE, C["stairs_side"])
    d = ImageDraw.Draw(img)
    for i in range(4):
        y = i * 12
        d.rectangle([0, y, TILE-1, y+10], fill=(int(140 + i*10), int(98 + i*5), int(50+i*4), 255))
        d.line([(0, y+10), (TILE-1, y+10)], fill=(200, 170, 120, 255), width=1)
    return img

# ─── Catalog definition ────────────────────────────────────────────────────────

# Each entry: (output_filename, sheet_name, extractor_args, placeholder_fn)
# extractor_args: dict with 'type', coords, etc.
# placeholder_fn: callable that returns Image

CATALOG = [
    # Floors
    ("floor_wood.png",        "Floors_TILESET_A2_", {"type": "a2_fill", "block_col": 0, "block_row": 0}, make_floor_wood),
    ("floor_wood_dark.png",   "Floors_TILESET_A2_", {"type": "a2_fill", "block_col": 1, "block_row": 0}, make_floor_wood_dark),
    ("floor_tile.png",        "Floors_TILESET_A2_", {"type": "a2_fill", "block_col": 2, "block_row": 0}, make_floor_tile),
    ("floor_carpet.png",      "Floors_TILESET_A2_", {"type": "a2_fill", "block_col": 0, "block_row": 1}, make_floor_carpet),
    # floor_sidewalk: exterior A5 sheet, row 10 (gray pavement block)
    ("floor_sidewalk.png",    "Outside_A5_MV",      {"type": "a5", "col": 0, "row": 10}, make_floor_sidewalk),
    # ceiling: use dark-wood wall-top from A4 (second wall style, col 1)
    ("ceiling.png",           "Walls_TILESET_A4_",  {"type": "a4_top", "wall_col": 1, "wall_row": 0}, make_ceiling),

    # Walls
    ("wall_top.png",          "Walls_TILESET_A4_", {"type": "a4_top",  "wall_col": 0, "wall_row": 0}, make_wall_top),
    ("wall_face.png",         "Walls_TILESET_A4_", {"type": "a4_face", "wall_col": 0, "wall_row": 0}, make_wall_face),
    # wall_face_apt: apartment warm-wood wall variant (A4 col 1)
    ("wall_face_apt.png",     "Walls_TILESET_A4_",  {"type": "a4_face", "wall_col": 1, "wall_row": 0}, lambda: make_wall_face(apartment=True)),
    # wall_window / wall_window_apt: Generic_01 wall tiles with window opening
    ("wall_window.png",       "Generic_01",          {"type": "be", "col": 0, "row": 8, "w": 1, "h": 1}, lambda: make_wall_window(apartment=False)),
    ("wall_window_apt.png",   "Generic_01",          {"type": "be", "col": 1, "row": 8, "w": 1, "h": 1}, lambda: make_wall_window(apartment=True)),
    # door: wooden door tile from Generic_01
    ("door.png",              "Generic_01",          {"type": "be", "col": 8, "row": 0, "w": 1, "h": 1}, make_door),
    # stairs: interior staircase from Generic_01
    ("stairs.png",            "Generic_01",          {"type": "be", "col": 12, "row": 0, "w": 1, "h": 1}, make_stairs),
    # stairs_tile: stair landing tile from Generic_01
    ("stairs_tile.png",       "Generic_01",          {"type": "be", "col": 13, "row": 0, "w": 1, "h": 1}, make_stairs_tile),

    # Counter / kitchen furniture
    ("counter.png",           "Kitchen_01", {"type": "be", "col": 1, "row": 14, "w": 1, "h": 1}, make_counter),
    ("counter_left.png",      "Kitchen_01", {"type": "be", "col": 0, "row": 14, "w": 1, "h": 1}, make_counter_left),
    ("counter_right.png",     "Kitchen_01", {"type": "be", "col": 2, "row": 14, "w": 1, "h": 1}, make_counter_right),
    ("espresso_machine.png",  "Kitchen_02", {"type": "be", "col": 13, "row": 10, "w": 1, "h": 1}, make_espresso_machine),
    ("coffee_maker.png",      "Kitchen_02", {"type": "be", "col": 13, "row": 11, "w": 1, "h": 1}, make_coffee_maker),
    ("cash_register.png",     "Kitchen_01", {"type": "be", "col": 1, "row": 12, "w": 1, "h": 1}, make_cash_register),
    ("display_case_empty.png","Kitchen_02", {"type": "be", "col": 7, "row": 8, "w": 2, "h": 2}, lambda: make_display_case(False)),
    ("display_case_stocked.png","Kitchen_02", {"type": "be", "col": 9, "row": 8, "w": 2, "h": 2}, lambda: make_display_case(True)),
    ("stove_off.png",         "Kitchen_01", {"type": "be", "col": 8, "row": 15, "w": 1, "h": 1}, lambda: make_stove(False)),
    ("stove_on.png",          "Kitchen_01", {"type": "be", "col": 8, "row": 15, "w": 1, "h": 1}, lambda: make_stove(True)),
    ("fridge.png",            "Kitchen_01", {"type": "be", "col": 10, "row": 15, "w": 1, "h": 1}, make_fridge),
    ("sink.png",              "Kitchen_01", {"type": "be", "col": 6, "row": 8, "w": 1, "h": 1}, make_sink),
    ("cup_empty.png",         "Kitchen_01", {"type": "be", "col": 11, "row": 4, "w": 1, "h": 1}, lambda: make_cup(False)),
    ("cup_full.png",          "Kitchen_01", {"type": "be", "col": 12, "row": 4, "w": 1, "h": 1}, lambda: make_cup(True)),
    ("plate_food.png",        "Kitchen_02", {"type": "be", "col": 5, "row": 2, "w": 1, "h": 1}, lambda: make_plate(True)),
    ("plate_empty.png",       "Kitchen_02", {"type": "be", "col": 5, "row": 3, "w": 1, "h": 1}, lambda: make_plate(False)),
    ("pastry.png",            "Kitchen_02", {"type": "be", "col": 15, "row": 10, "w": 1, "h": 1}, make_pastry),
    ("book_closed.png",       "Kitchen_01", {"type": "be", "col": 13, "row": 4, "w": 1, "h": 1}, lambda: make_book(False)),
    ("book_open.png",         "Kitchen_01", {"type": "be", "col": 14, "row": 4, "w": 1, "h": 1}, lambda: make_book(True)),
    ("shelf_wall.png",        "Kitchen_01", {"type": "be", "col": 5, "row": 6, "w": 1, "h": 1}, make_shelf_wall),

    # Tables and chairs
    ("table_large.png",       "Generic_01", {"type": "be", "col": 0, "row": 2, "w": 2, "h": 2}, make_table_large),
    ("table_small.png",       "Generic_01", {"type": "be", "col": 2, "row": 2, "w": 1, "h": 1}, make_table_small),
    ("chair_front.png",       "Generic_01", {"type": "be", "col": 5, "row": 1, "w": 1, "h": 1}, make_chair_front),
    ("chair_front_b.png",     "Generic_01", {"type": "be", "col": 6, "row": 1, "w": 1, "h": 1}, make_chair_front),
    ("chair_left.png",        "Generic_01", {"type": "be", "col": 5, "row": 2, "w": 1, "h": 1}, make_chair_left),
    ("chair_back.png",        "Generic_01", {"type": "be", "col": 5, "row": 3, "w": 1, "h": 1}, make_chair_back),
    ("chair_right.png",       "Generic_01", {"type": "be", "col": 10, "row": 3, "w": 1, "h": 1}, make_chair_right),
    ("stool.png",             "Generic_01", {"type": "be", "col": 3, "row": 11, "w": 1, "h": 1}, make_stool),

    # Living room / bedroom
    ("sofa.png",              "Living_Room_01", {"type": "be", "col": 1, "row": 0, "w": 2, "h": 2}, make_sofa),
    ("fireplace.png",         "Living_Room_01", {"type": "be", "col": 3, "row": 8, "w": 2, "h": 2}, make_fireplace),
    ("plant_tall.png",        "Living_Room_01", {"type": "be", "col": 8, "row": 2, "w": 1, "h": 3}, make_plant_tall),
    ("lamp_floor.png",        "Living_Room_01", {"type": "be", "col": 7, "row": 6, "w": 1, "h": 1}, make_lamp_floor),
    ("lamp_table.png",        "Living_Room_01", {"type": "be", "col": 7, "row": 8, "w": 1, "h": 1}, make_lamp_table),
    ("desk.png",              "Living_Room_01", {"type": "be", "col": 3, "row": 4, "w": 1, "h": 1}, make_desk),
    # coffee_table: small living-room table from Living_Room_01
    ("coffee_table.png",      "Living_Room_01",      {"type": "be", "col": 1, "row": 2, "w": 1, "h": 1}, make_coffee_table),
    # rug: carpet/rug object from Living_Room_01
    ("rug.png",               "Living_Room_01",      {"type": "be", "col": 0, "row": 10, "w": 2, "h": 1}, make_rug),
    # nightstand: small bedside table from Bedroom_01_Revamped
    ("nightstand.png",        "Bedroom_01_Revamped", {"type": "be", "col": 4, "row": 2, "w": 1, "h": 1}, make_nightstand),

    # Bedroom
    ("bed.png",               "Bedroom_01_Revamped", {"type": "be", "col": 0, "row": 9, "w": 2, "h": 2}, make_bed),
    ("bookshelf.png",         "Bedroom_01_Revamped", {"type": "be", "col": 2, "row": 0, "w": 2, "h": 2}, make_bookshelf),

    # Art
    ("easel_blank.png",       "Art_01", {"type": "be", "col": 0, "row": 13, "w": 1, "h": 2}, lambda: make_easel("blank")),
    ("easel_painting.png",    "Art_01", {"type": "be", "col": 2, "row": 13, "w": 1, "h": 2}, lambda: make_easel("painting")),
    ("easel_finished.png",    "Art_01", {"type": "be", "col": 4, "row": 13, "w": 1, "h": 2}, lambda: make_easel("finished")),
    ("wall_art_1.png",        "Art_01", {"type": "be", "col": 0, "row": 16, "w": 1, "h": 1}, lambda: make_wall_art(1)),
    ("wall_art_2.png",        "Art_01", {"type": "be", "col": 1, "row": 16, "w": 1, "h": 1}, lambda: make_wall_art(2)),
    ("wall_art_3.png",        "Art_01", {"type": "be", "col": 2, "row": 16, "w": 1, "h": 1}, lambda: make_wall_art(3)),
    ("paint_supplies.png",    "Art_01", {"type": "be", "col": 0, "row": 7, "w": 1, "h": 1}, make_paint_supplies),

    # Plants / misc
    # plant_small: small potted plant from Living_Room_01
    ("plant_small.png",       "Living_Room_01",      {"type": "be", "col": 9, "row": 2, "w": 1, "h": 1}, make_plant_small),
    ("window_sky.png",        "Bedroom_01_Revamped", {"type": "be", "col": 0, "row": 5, "w": 1, "h": 1}, make_window_sky),
]

# ─── Main extraction ──────────────────────────────────────────────────────────

def extract_sprite(entry) -> Image.Image:
    """Try to extract from source sheet; fall back to placeholder."""
    filename, sheet_name, args, placeholder_fn = entry

    if sheet_name and args:
        sheet = _find_sheet(sheet_name)
        if sheet:
            t = args["type"]
            try:
                if t == "be":
                    return extract_be(sheet, args["col"], args["row"],
                                      args.get("w", 1), args.get("h", 1))
                elif t == "a2_fill":
                    return extract_a2_fill(sheet, args["block_col"], args["block_row"])
                elif t == "a4_top":
                    return extract_a4_top(sheet, args["wall_col"], args["wall_row"])
                elif t == "a4_face":
                    return extract_a4_face(sheet, args["wall_col"], args["wall_row"])
                elif t == "a5":
                    return extract_a5(sheet, args["col"], args["row"])
            except Exception as e:
                print(f"  [warn] Extraction failed for {filename}: {e}")

    return placeholder_fn()

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output: {OUT_DIR}")
    source_avail = THEME_DIR.exists() or AUTO_DIR.exists()
    if not source_avail:
        print("Note: LimeZu source sheets not found — generating placeholder tiles.")
    else:
        print(f"Source sheets found at {THEME_DIR}")

    for entry in CATALOG:
        filename = entry[0]
        out_path = OUT_DIR / filename
        img = extract_sprite(entry)
        img.save(out_path)
        w, h = img.size
        mode = "extracted" if (entry[1] and _find_sheet(entry[1])) else "drawn"
        print(f"  {filename:40s} {w}x{h} [{mode}]")

    print(f"\nDone. {len(CATALOG)} sprites written to {OUT_DIR}")

if __name__ == "__main__":
    main()
