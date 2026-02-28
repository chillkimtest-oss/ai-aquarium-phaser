# 08 — 48px Native Tile Migration Guide

> Migrating from 16×16 downscaled tiles to native 48×48 LimeZu RPG Maker MV tiles.

## TL;DR

Stop downscaling. LimeZu tiles are 48×48 natively. Crop them at 48×48 and render at 48×48. Multi-tile objects crop at their full native size (e.g., 2×2 = 96×96). No resize step needed anywhere.

---

## 1. What Changes

| Property | Before (16px) | After (48px) |
|----------|---------------|--------------|
| `TILE_SIZE` | 16 | 48 |
| Single tile sprite | 16×16 (downscaled 3×) | 48×48 (native crop) |
| 2×2 object sprite | 16×16 (crushed 6×) | 96×96 (native crop) |
| 1×3 object sprite | 16×16 (crushed 9×) | 48×144 (native crop) |
| Map grid | 16 cols × 24 rows | **Same** — grid dimensions don't change |
| Canvas resolution | 256×384 | 768×1152 |
| Extraction | Crop + `resize(NEAREST)` to 16×16 | Crop only, no resize |
| Character sprites | 16×16 | 48×48 (need new/upscaled sprites) |

### Map dimensions: Keep 16×24

The map layout (16 cols × 24 rows) is the game's logical structure — rooms, walls, furniture placement. This doesn't change. Only the pixel size per tile changes.

### Canvas: 768×1152

```
MAP_W = 16 * 48 = 768px
MAP_H = 24 * 48 = 1152px
```

This is a reasonable resolution for browser display. The existing CSS scaling (fit to window, maintain aspect ratio) works fine — the aspect ratio is identical (16:24 = 2:3).

---

## 2. Updated Extraction Approach

### Core change: Remove all downscaling

Every extraction handler currently ends with a resize to 16×16. Remove that entirely.

#### B-E sheets (objects, props, furniture)

```python
def extract_be(sheet, col, row, w=1, h=1):
    x = col * 48
    y = row * 48
    return sheet.crop((x, y, x + w * 48, y + h * 48))
    # That's it. No resize.
```

Output sizes:
- 1×1 → 48×48
- 2×2 → 96×96
- 1×2 → 48×96
- 1×3 → 48×144
- 2×1 → 96×48

#### A2 autotiles (floors)

Solid fill at sub-position (1,1) within each 2×3 block:

```python
def extract_a2_fill(sheet, block_col, block_row):
    x = block_col * 96 + 48  # sub-pos (1,1)
    y = block_row * 144 + 48
    return sheet.crop((x, y, x + 48, y + 48))
```

Output: 48×48 (no resize).

#### A4 autotiles (walls)

**Wall top (ceiling) fill** — sub-pos (1,1) in top 2×3 of wall block:
```python
def extract_a4_top(sheet, wall_col, wall_row):
    x = wall_col * 96 + 48
    y = wall_row * 240 + 48
    return sheet.crop((x, y, x + 48, y + 48))
```

**Wall face fill** — right column at row 3:
```python
def extract_a4_face(sheet, wall_col, wall_row):
    x = wall_col * 96 + 48
    y = wall_row * 240 + 144
    return sheet.crop((x, y, x + 48, y + 48))
```

#### A5 simple tiles

```python
def extract_a5(sheet, col, row):
    x = col * 48
    y = row * 48
    return sheet.crop((x, y, x + 48, y + 48))
```

---

## 3. Full Object Catalog at 48×48

All coordinates verified against docs/07-multi-tile-research.md and extract_config.py.

### Tile Sprites (floor/wall/terrain)

| Name | Sheet | Type | Position | Output Size | Output File |
|------|-------|------|----------|-------------|-------------|
| floor_wood | Floors_TILESET_A2_ | a2_fill | block(0,0) | 48×48 | floor_wood.png |
| floor_wood_dark | Floors_TILESET_A2_ | a2_fill | block(1,0) | 48×48 | floor_wood_dark.png |
| floor_tile | Floors_TILESET_A2_ | a2_fill | block(2,0) | 48×48 | floor_tile.png |
| floor_carpet | Floors_TILESET_A2_ | a2_fill | block(0,1) | 48×48 | floor_carpet.png |
| wall_cafe_top | Walls_TILESET_A4_ | a4_top | wall(0,0) | 48×48 | wall_cafe_top.png |
| wall_cafe | Walls_TILESET_A4_ | a4_face | wall(0,0) | 48×48 | wall_cafe.png |
| counter | Kitchen_01 | be | (1,14) 1×1 | 48×48 | counter.png |
| counter_left | Kitchen_01 | be | (0,14) 1×1 | 48×48 | counter_left.png |
| counter_right | Kitchen_01 | be | (2,14) 1×1 | 48×48 | counter_right.png |
| grass | Serene_Village_48x48 | a5 | (4,0) | 48×48 | grass.png |
| door | Serene_Village_48x48 | a5 | (8,23) | 48×48 | door.png |
| window | Serene_Village_48x48 | a5 | (4,19) | 48×48 | window.png |
| stairs | Serene_Village_48x48 | a5 | (1,5) | 48×48 | stairs.png |
| sidewalk | *procedural* | — | — | 48×48 | sidewalk.png |

### Props (decorative, baked into tilemap cache)

| Name | Sheet | Grid (col,row) | Size | Output Size | Output File | Multi? |
|------|-------|----------------|------|-------------|-------------|--------|
| chair_front | Generic_01 | (5,1) | 1×1 | 48×48 | chair_front.png | No |
| chair_front_b | Generic_01 | (6,1) | 1×1 | 48×48 | chair_front_b.png | No |
| chair_left | Generic_01 | (5,2) | 1×1 | 48×48 | chair_left.png | No |
| chair_back | Generic_01 | (5,3) | 1×1 | 48×48 | chair_back.png | No |
| chair_right | Generic_01 | (10,3) | 1×1 | 48×48 | chair_right.png | No |
| stool | Generic_01 | (3,11) | 1×1 | 48×48 | stool.png | No |
| table_small | Generic_01 | (2,2) | 1×1 | 48×48 | table_small.png | No |
| **table_large** | Generic_01 | (0,2) | **2×2** | **96×96** | table_large.png | **Yes** |
| **sofa** | Living_Room_01 | (1,0) | **2×2** | **96×96** | sofa.png | **Yes** |
| **bookshelf** | Bedroom_01_Revamped | (2,0) | **2×2** | **96×96** | bookshelf.png | **Yes** |
| **fireplace** | Living_Room_01 | (3,8) | **2×2** | **96×96** | fireplace.png | **Yes** |
| **plant_tall** | Living_Room_01 | (8,2) | **1×3** | **48×144** | plant_tall.png | **Yes** |
| plant_small | Serene_Village_48x48 | (9,11) a5 | 1×1 | 48×48 | plant_small.png | No |
| shelf_wall | Kitchen_01 | (5,6) | 1×1 | 48×48 | shelf_wall.png | No |
| lamp_floor | Living_Room_01 | (7,6) | 1×1 | 48×48 | lamp_floor.png | No |
| lamp_table | Living_Room_01 | (7,8) | 1×1 | 48×48 | lamp_table.png | No |
| wall_art_1 | Art_01 | (0,16) | 1×1 | 48×48 | wall_art_1.png | No |
| wall_art_2 | Art_01 | (1,16) | 1×1 | 48×48 | wall_art_2.png | No |
| wall_art_3 | Art_01 | (2,16) | 1×1 | 48×48 | wall_art_3.png | No |
| paint_supplies | Art_01 | (0,7) | 1×1 | 48×48 | paint_supplies.png | No |
| window_sky | Bedroom_01_Revamped | (0,5) | 1×1 | 48×48 | window_sky.png | No |

### Objects (interactive, rendered dynamically)

| Name | Sheet | Grid (col,row) | Size | Output Size | Output File | Multi? |
|------|-------|----------------|------|-------------|-------------|--------|
| espresso_machine | Kitchen_02 | (13,10) | 1×1 | 48×48 | espresso_machine.png | No |
| coffee_maker | Kitchen_02 | (13,11) | 1×1 | 48×48 | coffee_maker.png | No |
| cash_register | Kitchen_01 | (1,12) | 1×1 | 48×48 | cash_register.png | No |
| stove_off | Kitchen_01 | (8,15) | 1×1 | 48×48 | stove_off.png | No |
| stove_on | Kitchen_01 | (8,15) | 1×1 | 48×48 | stove_on.png | No |
| fridge | Kitchen_01 | (10,15) | 1×1 | 48×48 | fridge.png | No |
| sink | Kitchen_01 | (6,8) | 1×1 | 48×48 | sink.png | No |
| desk | Living_Room_01 | (3,4) | 1×1 | 48×48 | desk.png | No |
| cup_empty | Kitchen_01 | (11,4) | 1×1 | 48×48 | cup_empty.png | No |
| cup_full | Kitchen_01 | (12,4) | 1×1 | 48×48 | cup_full.png | No |
| plate_food | Kitchen_02 | (5,2) | 1×1 | 48×48 | plate_food.png | No |
| plate_empty | Kitchen_02 | (5,3) | 1×1 | 48×48 | plate_empty.png | No |
| pastry | Kitchen_02 | (15,10) | 1×1 | 48×48 | pastry.png | No |
| book_closed | Kitchen_01 | (13,4) | 1×1 | 48×48 | book_closed.png | No |
| book_open | Kitchen_01 | (14,4) | 1×1 | 48×48 | book_open.png | No |
| **bed** | Bedroom_01_Revamped | (0,9) | **2×2** | **96×96** | bed.png | **Yes** |
| **display_case_empty** | Kitchen_02 | (7,8) | **2×2** | **96×96** | display_case_empty.png | **Yes** |
| **display_case_stocked** | Kitchen_02 | (9,8) | **2×2** | **96×96** | display_case_stocked.png | **Yes** |
| **easel_blank** | Art_01 | (0,13) | **1×2** | **48×96** | easel_blank.png | **Yes** |
| **easel_painting** | Art_01 | (2,13) | **1×2** | **48×96** | easel_painting.png | **Yes** |
| **easel_finished** | Art_01 | (4,13) | **1×2** | **48×96** | easel_finished.png | **Yes** |

### Additional objects available (not yet used)

| Name | Sheet | Grid (col,row) | Size | Output Size | Notes |
|------|-------|----------------|------|-------------|-------|
| Bed (single) | Bedroom_01_Revamped | (0,7) | 2×2 | 96×96 | Alternative style |
| Wardrobe | Bedroom_01_Revamped | (4,0) | 2×2 | 96×96 | Closet |
| Dresser | Bedroom_01_Revamped | (6,0) | 2×2 | 96×96 | Bedroom storage |
| TV stand + TV | Living_Room_01 | (0,8) | 2×2 | 96×96 | Entertainment |
| Sofa (right) | Living_Room_01 | (3,0) | 2×2 | 96×96 | Alt orientation |
| Kitchen island | Kitchen_01 | (0,0) | 2×2 | 96×96 | Prep surface |
| Oven (built-in) | Kitchen_01 | (6,0) | 2×2 | 96×96 | Separate appliance |
| Fridge (tall) | Kitchen_01 | (12,0) | 1×2 | 48×96 | Better looking |

---

## 4. Codebase Impact

### `tools/extract_all.py` — Major changes

**Remove `_downscale()` function entirely.** Remove `TARGET_SIZE = 16`.

```python
# BEFORE
TARGET_SIZE = 16
def _downscale(img, w_px, h_px):
    return img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.NEAREST)

# AFTER — no _downscale function at all
# Each handler returns the crop directly
```

**Remove the assertion** `assert sprite.size == (TARGET_SIZE, TARGET_SIZE)` — multi-tile objects will have various sizes. Replace with:
```python
expected_w = cfg.get("w", 1) * 48
expected_h = cfg.get("h", 1) * 48
assert sprite.size == (expected_w, expected_h)
```

For A-series tiles, expected size is always 48×48.

### `tools/extract_config.py` — No structural changes

All coordinates are already in 48px grid units. The config entries work as-is. Only the extraction script's behavior changes (crop without resize).

### `src/tilemap.js` — Small changes

```js
// BEFORE
export const TILE_SIZE = 16;

// AFTER
export const TILE_SIZE = 48;
```

**MAP array:** Unchanged. It's a logical grid — the tile IDs and layout stay the same.

**MAP_W / MAP_H:** Auto-calculated from `MAP_COLS * TILE_SIZE`, so they update automatically:
- `MAP_W = 16 * 48 = 768`
- `MAP_H = 24 * 48 = 1152`

**PROPS array:** Add `tw`/`th` to multi-tile props (already needed before this migration, per doc-07):

```js
// Multi-tile props need dimensions
{ type: 'table_large', tx: 3, ty: 16, tw: 2, th: 2 },
{ type: 'sofa',        tx: 10, ty: 5, tw: 2, th: 2 },
{ type: 'bookshelf',   tx: 1, ty: 17, tw: 2, th: 2 },
{ type: 'fireplace',   tx: 13, ty: 4, tw: 2, th: 2 },
{ type: 'plant_tall',  tx: 8, ty: 2, tw: 1, th: 3 },  // anchor = top
```

### `src/renderer.js` — Small changes

**`_bakeTilemapCache()`** — Use `tw`/`th` for props (already identified in doc-07):

```js
// BEFORE
octx.drawImage(sprite, prop.tx * TILE_SIZE, prop.ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);

// AFTER
const pw = (prop.tw || 1) * TILE_SIZE;
const ph = (prop.th || 1) * TILE_SIZE;
octx.drawImage(sprite, prop.tx * TILE_SIZE, prop.ty * TILE_SIZE, pw, ph);
```

**`renderObjects()`** — Already supports `tw`/`th`. No changes needed.

**Comment update:** Change `"Native resolution: 288×512"` to `"Native resolution: 768×1152"`.

**Canvas creation:** Already uses `MAP_W`/`MAP_H` — auto-updates. ✅

**CSS scaling / `_resize()`:** Works on aspect ratio — unchanged since 16:24 = same ratio. ✅

**`imageSmoothingEnabled = false`:** Keep it. Still pixel art. ✅

### `src/characters.js` — Minor changes

```js
// BEFORE
const TILE_SIZE = 16;

// AFTER — import from tilemap.js instead of hardcoding
import { TILE_SIZE } from './tilemap.js';
// (it already imports MAP, T, MAP_COLS, MAP_ROWS from tilemap.js)
```

**Movement speed:** Currently in px/ms. At 48px tiles, characters need to move 3× faster in pixels to traverse one tile in the same time. Or better: express speed as tiles/ms and multiply by TILE_SIZE at render time.

**Pathfinding grid:** Unchanged — operates on tile coordinates, not pixels. ✅

**`isWalkable()`:** Unchanged — uses tile grid. ✅

### Character sprites — Need re-creation

Current character sprites are 16×16. At 48px they'll be stretched (blurry). Options:
1. **Create new 48×48 character sprites** — best quality
2. **Use the LimeZu character sheets** at native 48×48 if available
3. **Upscale existing 16×16 with NEAREST** — 48×48 but blocky (acceptable short-term)

### What stays the same

- MAP array (logical grid, all tile IDs)
- PROPS array structure (just add tw/th to multi-tile entries)
- Object definitions and state machines
- Pathfinding algorithm
- Day/night cycle (operates on tile coords, overlays scale with canvas)
- Particle system (pixel-based — may need particle size/speed tuning for larger canvas)
- Speech bubbles / UI (rendered on text overlay at display resolution)

---

## 5. Canvas / Viewport Considerations

### Resolution analysis

| Config | Resolution | Verdict |
|--------|-----------|---------|
| 16×24 @ 48px | 768×1152 | **Good.** Fits most screens with CSS scaling. |
| 20×28 @ 48px | 960×1344 | Larger but still reasonable. |
| 16×24 @ 48px, 2× display | 1536×2304 | Still under 4K, fine. |

### Recommendation: Keep current map, no viewport needed

768×1152 is a modest resolution. The CSS scaling system already handles fitting this to any window size. No viewport/camera system needed.

For comparison:
- A typical phone screen: ~390×844 CSS pixels — the canvas scales down to fit
- A 1080p monitor: 1920×1080 — canvas fits with letterboxing on sides
- A 1440p monitor: 2560×1440 — plenty of room

The existing `_resize()` method handles all of this with aspect-ratio-preserving CSS scaling + `imageRendering: pixelated`.

### If we want a larger map later

If the map grows beyond ~20×28 tiles (960×1344), consider:
1. **Viewport/camera** — render only a window of the map, scroll to follow characters
2. **CSS scale only** — at 960×1344 native, CSS scaling still works fine on most displays

For now: **no viewport needed.** The current 16×24 map at 48px = 768×1152 is ideal.

### Display quality

48px pixel art on a high-DPI display looks beautiful with `imageRendering: pixelated`. The current system already does this. Each source pixel becomes a crisp square block on screen.

At 48px native, the art retains full LimeZu detail — no more 3× downscale artifacts or crushed multi-tile objects.

---

## 6. Migration Checklist

### Phase 1: Extraction (re-extract all assets)
- [ ] Remove `_downscale()` from `extract_all.py`
- [ ] Remove `TARGET_SIZE = 16` constant
- [ ] Update size assertion to check native dimensions
- [ ] Re-run extraction: `python tools/extract_all.py`
- [ ] Verify: single-tile PNGs are 48×48, multi-tile PNGs are proportional
- [ ] Update procedural sidewalk.png to 48×48

### Phase 2: Tilemap (`tilemap.js`)
- [ ] Change `TILE_SIZE = 16` → `TILE_SIZE = 48`
- [ ] Add `tw`/`th` to multi-tile PROPS entries
- [ ] Verify MAP_W/MAP_H compute correctly (768×1152)

### Phase 3: Renderer (`renderer.js`)
- [ ] Update `_bakeTilemapCache()` to use `tw`/`th` for props
- [ ] Update header comment (resolution)
- [ ] Verify `renderObjects()` — should work as-is with `tw`/`th`

### Phase 4: Characters (`characters.js`)
- [ ] Import `TILE_SIZE` from tilemap.js (remove hardcoded `16`)
- [ ] Adjust movement speed constants for 48px tiles
- [ ] Create/source 48×48 character sprites (or NEAREST upscale as stopgap)

### Phase 5: Verify
- [ ] Run the app — visual check of all tiles, props, objects
- [ ] Verify multi-tile objects render at correct size and position
- [ ] Check day/night cycle, particles, speech bubbles
- [ ] Test on different screen sizes

---

## 7. Key Decisions

### Bookshelf placement
Multiple bookshelves placed at adjacent tx values (tx=1, tx=2) will overlap if each is 2×2. Options:
- Space them 2 tiles apart
- Extract as 1×2 (tall single-width) variant if available
- Accept overlap as intentional "bookshelf wall" effect

### plant_tall anchor
1×3 plant (48×144) — the `ty` value should be the **top** of the plant. Current PROPS entries may have `ty` at the base. Adjust: `ty = base_ty - 2` so the plant's bottom aligns with the intended floor position.

### Fridge upgrade
Consider upgrading from 1×1 fridge (Kitchen_01 col=10, row=15) to 1×2 tall fridge (Kitchen_01 col=12, row=0) — looks much better at 48px.

### Character sprites
48×48 character sprites are the biggest open question. The LimeZu pack may include character sheets in the RPG Maker MV format (which uses 48×48 frames). If not, we need custom pixel art or NEAREST-upscaled placeholders.

### Particle system tuning
Particle sizes, speeds, and counts were tuned for a 256×384 canvas. At 768×1152 (3× larger), particles may look too small. Consider scaling particle `size` by ~2-3× and adjusting `speed` proportionally.
