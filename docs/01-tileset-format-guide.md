# RPG Maker MV Tileset Format Guide

## Overview

LimeZu's Modern Interiors and Modern Exteriors are provided in **RPG Maker MV** format. In this format, the base tile size is **48×48 pixels**. Our game uses **16×16 pixels per tile unit**, so we downscale by 3× after extraction. Single-tile (1×1) objects become 16×16 PNGs. **Multi-tile objects keep their full dimensions:** a 2×2 object (96×96 source) becomes 32×32, a 3×2 object (144×96) becomes 48×32, etc.

**Critical rule:** The native tile unit is 48×48px. All coordinates, grid positions, and extraction math must use 48px as the base unit.

---

## Sheet Types

RPG Maker MV uses two categories of tileset sheets:

### A-series: Autotile Sheets (terrain, floors, walls)

| Sheet | Dimensions | Purpose | Layout |
|-------|-----------|---------|--------|
| **A1** | 768×576 | Animated water/terrain | Complex animated autotile blocks |
| **A2** | 768×576 | Ground/floor autotiles | 8 cols × 4 rows of autotile blocks (32 total) |
| **A3** | 768×384 | Building exterior walls | Autotile blocks for wall tops |
| **A4** | 768×720 | Wall autotiles (top+face) | 8 cols × 3 rows of wall pairs (24 total) |
| **A5** | 384×768 | Simple floor tiles (no auto) | 8 cols × 16 rows of plain 48×48 tiles |

### B-E series: Object Sheets (furniture, decorations, props)

| Sheet | Dimensions | Purpose |
|-------|-----------|---------|
| **B, C, D, E** | 768×768 | Furniture, objects, decorations |

All B-E sheets use the same format: **16 columns × 16 rows of 48×48px cells** = 256 cells per sheet.

---

## Grid Math for B-E Sheets (The Most Common Case)

These are the furniture/object sheets — what you'll extract from most often.

```
Sheet size:  768 × 768 px
Tile size:   48 × 48 px
Grid:        16 columns × 16 rows
Total cells: 256
```

**To get pixel coordinates from grid position:**
```python
pixel_x = col * 48  # col is 0-indexed (0..15)
pixel_y = row * 48  # row is 0-indexed (0..15)
```

**Example:** A tile at grid position (col=3, row=5) starts at pixel (144, 240).

### Multi-Tile Objects

Many objects span multiple cells. A 2×3 object (2 wide, 3 tall) starting at (col=4, row=2):
```python
x = 4 * 48  # = 192
y = 2 * 48  # = 96
w = 2 * 48  # = 96
h = 3 * 48  # = 144
# Crop region: (192, 96, 288, 240)  — (left, top, right, bottom)
```

Common multi-tile object sizes in LimeZu's tilesets:
- **1×1** (48×48): Small items — cups, bottles, plants, lamps, small appliances
- **1×2** (48×96): Floor lamps, standing mirrors, chair side views, tall plants
- **2×1** (96×48): Coffee tables, rugs, counter sections
- **2×2** (96×96): Refrigerators, wardrobes, dressers, TVs, fireplaces, dumpsters
- **2×3** (96×144): Tall cabinets with glass doors, large trees
- **3×1** (144×48): Long coffee tables, sideboards, counter runs
- **3×2** (144×96): Large couches, wide dressers
- **4×1** (192×48): Bed headboard strips, long shelves

---

## A2 Autotile Format (Floors)

**Sheet:** 768×576px = 8 autotile blocks across × 4 autotile rows = **32 floor autotiles**

Each autotile block is **2 columns × 3 rows of 48px cells = 96×144 pixels**.

### Sub-tile Layout Within Each 2×3 Block

```
+--------+--------+
| (0,0)  | (1,0)  |   Row 0: edge/corner patterns
+--------+--------+
| (0,1)  | (1,1)  |   Row 1: (1,1) = FULL FILL (solid center)
+--------+--------+
| (0,2)  | (1,2)  |   Row 2: more corner/edge patterns
+--------+--------+
```

**The "full fill" tile — what you want for a simple solid floor — is at sub-position (1,1) within the block.** This is the middle-right cell.

### How to Extract a Solid Floor Tile

To extract the solid fill for autotile block at position (block_col, block_row):
```python
# block_col: 0..7, block_row: 0..3
x = block_col * 96 + 48   # +48 to get sub-position (1,1)
y = block_row * 144 + 48  # +48 to skip first sub-row
# Crop a 48×48 region at (x, y)
```

**Example:** First autotile block (0,0) → full fill at pixel (48, 48).
**Example:** Fifth autotile (4,0) → full fill at pixel (432, 48).

---

## A4 Autotile Format (Walls)

**Sheet:** 768×720px

A4 tiles represent walls with two components stacked vertically:
1. **Wall-top autotile** (ceiling/top edge): 2×3 cells = 96×144px (same format as A2)
2. **Wall-face** (the vertical wall surface): 2×2 cells = 96×96px

Each wall type occupies **2 columns × 5 rows = 96×240 pixels**.

```
Horizontally: 768 / 96 = 8 wall types across
Vertically:   720 / 240 = 3 rows of wall types
Total: 24 wall types
```

### Sub-tile Layout Within Each Wall Block (2×5 cells)

```
+--------+--------+
| Top    | Top    |  ← Row 0 of wall-top autotile
+--------+--------+
| Top    | FILL   |  ← Row 1 — (1,1) is full-fill for ceiling
+--------+--------+
| Top    | Top    |  ← Row 2
+--------+--------+
| Face   | Face   |  ← Row 3 — wall face top half
+--------+--------+
| Face   | Face   |  ← Row 4 — wall face bottom half
+--------+--------+
```

**For the wall top/ceiling fill:** Same as A2, sub-position (1,1) within the top 2×3 block.

**For the wall face:** The bottom 2×2 block contains the wall face autotile. The solid fill for the wall face is at sub-position (1,0) of the 2×2 block — i.e., pixel offset (48, 144) from the wall block's top-left.

### Extracting a Wall Top Fill

```python
# wall_col: 0..7, wall_row: 0..2
x = wall_col * 96 + 48   # sub-position (1,1) of top autotile
y = wall_row * 240 + 48
```

### Extracting a Wall Face Fill

```python
x = wall_col * 96 + 48   # right column of face block
y = wall_row * 240 + 144  # skip 3 rows of top autotile
```

---

## A5 Simple Tiles (Non-Autotile Floors)

**Sheet:** 384×768px = **8 columns × 16 rows** of plain 48×48 tiles.

No autotile logic — each cell is a standalone tile. Simple extraction:
```python
x = col * 48   # col: 0..7
y = row * 48   # row: 0..15
```

---

## Common Pitfalls

### ❌ DON'T: Use 16×16 grid math on MV sheets
The MV sheets use 48×48 tiles. If you divide 768 by 16 you get 48px-wide columns, but there are 16 of them, NOT 48. The grid is 16×16 cells of 48px each.

### ❌ DON'T: Grab a random sub-tile from an autotile block
Autotile blocks contain 6 sub-tiles for edge/corner transitions. Only sub-position (1,1) gives you the solid fill. Grabbing (0,0) gives you an inner-corner pattern that looks wrong as a standalone tile.

### ❌ DON'T: Forget to handle transparency
All sheets use PNG alpha transparency. The transparent areas (magenta in some editors) are genuinely transparent in the PNG files. When compositing, use RGBA mode.

### ❌ DON'T: Upscale to "improve quality"
These are pixel art tilesets. Always use **nearest-neighbor** interpolation when resizing. Bilinear/bicubic/Lanczos will blur the pixel art and produce the "blobby" look.

### ✅ DO: Downscale with NEAREST neighbor
48×48 → 16×16 is a clean 3× reduction. Use `Image.NEAREST` (also called `Image.Resampling.NEAREST` in newer Pillow).

### ✅ DO: Verify visually after extraction
After extracting a tile, look at it! Does it look like a recognizable object? If it's an amorphous blob of colors, your coordinates are wrong.

### ✅ DO: Account for multi-tile objects
A chair isn't always 1×1. Beds are typically 2×2 or larger. Couches can be 3×2. You need to composite all cells of a multi-tile object together.
