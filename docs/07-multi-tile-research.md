# 07 — Multi-Tile Object Research

> How to properly render furniture that spans multiple tiles in the LimeZu RPG Maker MV tilesets.

## The Problem

Every sprite — whether it's a 1×1 cup or a 2×2 bed — is extracted as a single 16×16 PNG. A 2×2 object (96×96 source pixels) crushed to 16×16 loses 97% of its pixel data. Beds look like purple blobs, sofas look like brown blobs, bookshelves are unrecognizable.

## Source Tileset Structure

All LimeZu RPG Maker MV B/C/D/E sheets are **768×768 pixels** on a **48px grid** (16 cols × 16 rows). Multi-tile objects span multiple cells in this grid. Our game renders at **16px per tile** (3× downscale from 48px source).

---

## Multi-Tile Object Catalog

### Currently Extracted (with crushed dimensions)

| Object | Sheet | Grid (col,row) | Size | Actual px | Current | Category |
|--------|-------|-----------------|------|-----------|---------|----------|
| **Bed** | Bedroom_01_Revamped | (0,9) | 2×2 | 32×32 | 16×16 ❌ | OBJECT |
| **Bookshelf** | Bedroom_01_Revamped | (2,0) | 2×2 | 32×32 | 16×16 ❌ | PROP |
| **Sofa** | Living_Room_01 | (1,0) | 2×2 | 32×32 | 16×16 ❌ | PROP |
| **Fireplace** | Living_Room_01 | (3,8) | 2×2 | 32×32 | 16×16 ❌ | PROP |
| **Display case (empty)** | Kitchen_02 | (7,8) | 2×2 | 32×32 | 16×16 ❌ | OBJECT |
| **Display case (stocked)** | Kitchen_02 | (9,8) | 2×2 | 32×32 | 16×16 ❌ | OBJECT |
| **Table (large)** | Generic_01 | (0,2) | 2×2 | 32×32 | 16×16 ❌ | PROP |
| **Plant (tall)** | Living_Room_01 | (8,2) | 1×3 | 16×48 | 16×16 ❌ | PROP |
| **Easel (all states)** | Art_01 | (0/2/4, 13) | 1×2 | 16×32 | 16×16 ❌ | OBJECT |

### Single-Tile Objects (fine as-is)

| Object | Sheet | Grid (col,row) | Size | Category |
|--------|-------|-----------------|------|----------|
| Espresso machine | Kitchen_02 | (13,10) | 1×1 | OBJECT |
| Coffee maker | Kitchen_02 | (13,11) | 1×1 | OBJECT |
| Stove (off/on) | Kitchen_01 | (8,15) | 1×1 | OBJECT |
| Fridge | Kitchen_01 | (10,15) | 1×1 | OBJECT |
| Sink | Kitchen_01 | (6,8) | 1×1 | OBJECT |
| Cash register | Kitchen_01 | (1,12) | 1×1 | OBJECT |
| Desk | Living_Room_01 | (3,4) | 1×1 | OBJECT |
| Cup (empty/full) | Kitchen_01 | (11-12, 4) | 1×1 | OBJECT |
| Plate (food/empty) | Kitchen_02 | (5, 2-3) | 1×1 | OBJECT |
| Pastry | Kitchen_02 | (15,10) | 1×1 | OBJECT |
| Book (closed/open) | Kitchen_01 | (13-14, 4) | 1×1 | OBJECT |
| Table (small) | Generic_01 | (2,2) | 1×1 | PROP |
| All chairs/stools | Generic_01 | various | 1×1 | PROP |
| Lamp (floor/table) | Living_Room_01 | various | 1×1 | PROP |
| Shelf (wall) | Kitchen_01 | (5,6) | 1×1 | PROP |
| Plant (small) | Serene Village | (9,11) | 1×1 | PROP |
| Wall art (1-3) | Art_01 | (0-2, 16) | 1×1 | PROP |
| Paint supplies | Art_01 | (0,7) | 1×1 | PROP |

### Additional Multi-Tile Objects Available (not yet extracted)

| Object | Sheet | Grid (col,row) | Size | Notes |
|--------|-------|-----------------|------|-------|
| Bed (single) | Bedroom_01_Revamped | (0,7) | 2×2 | alternative bed style |
| Wardrobe/closet | Bedroom_01_Revamped | (4,0) | 2×2 | could add to apartment |
| Dresser | Bedroom_01_Revamped | (6,0) | 2×2 | bedroom furniture |
| TV stand + TV | Living_Room_01 | (0,8) | 2×2 | entertainment center |
| Sofa (facing right) | Living_Room_01 | (3,0) | 2×2 | alternative sofa |
| Kitchen island | Kitchen_01 | (0,0) | 2×2 | large prep surface |
| Oven (built-in) | Kitchen_01 | (6,0) | 2×2 | separate from stovetop |
| Fridge (large) | Kitchen_01 | (12,0) | 1×2 | tall fridge variant |

---

## Current Code Analysis

### How PROPS render (tilemap.js + renderer.js)

**PROPS** are baked into an offscreen tilemap cache during `_bakeTilemapCache()`:
```js
for (const prop of PROPS) {
  const sprite = this.propSprites?.get(prop.type);
  if (sprite) {
    octx.drawImage(sprite, prop.tx * TILE_SIZE, prop.ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}
```

**Problem:** Every prop is drawn as exactly `TILE_SIZE × TILE_SIZE` (16×16), regardless of the object's actual size. A 2×2 bookshelf sprite (which should be 32×32) gets squished into 16×16.

**PROPS array** entries have only `{ type, tx, ty }` — no width/height fields.

### How OBJECTS render (renderer.js)

```js
const w = (obj.position.tw || 1) * TILE_SIZE;
const h = (obj.position.th || 1) * TILE_SIZE;
ctx.drawImage(sprite, pxX, pxY, w, h);
```

**Good news:** The renderer already supports `tw`/`th` for objects. If we pass `tw:2, th:2` for a bed, it would draw the sprite at 32×32.

**Bad news:** The sprite itself is still a 16×16 image (crushed during extraction). Drawing a 16×16 image at 32×32 just makes a bigger blob.

### How extraction works (extract_config.py)

The extraction script takes a region of `w×h` tiles from the source sheet and downscales the entire region to 16×16:
- 1×1 (48×48 → 16×16): 3× downscale ✅ looks great
- 2×2 (96×96 → 16×16): 6× downscale ❌ detail destroyed
- 1×3 (48×144 → 16×16): 9× downscale ❌ unrecognizable

---

## Recommended Approach: Option B — Extract at Actual Size

**Extract multi-tile objects at their proper pixel dimensions** (matching the tile grid), then render them at actual size in the game.

### What this means

| Object Size | Source Region | Extracted PNG | Rendered Size |
|-------------|--------------|---------------|---------------|
| 1×1 | 48×48 | 16×16 | 16×16 (no change) |
| 2×2 | 96×96 | 32×32 | 32×32 |
| 1×2 | 48×96 | 16×32 | 16×32 |
| 1×3 | 48×144 | 16×48 | 16×48 |
| 2×1 | 96×48 | 32×16 | 32×16 |

Each tile in the object still maps to 16×16 game pixels. The 3× downscale ratio is preserved uniformly.

### Why this approach

1. **Renderer already supports it** — `renderObjects` uses `tw`/`th` and draws at `w × h` pixel size. Zero renderer changes for objects.
2. **Consistent downscale ratio** — Everything is 48px → 16px (3×). No special cases.
3. **Looks correct** — A 2×2 bed occupies 2×2 tiles on screen, matching the tilemap layout.
4. **Easy extraction change** — Modify the extraction script to output `(w*16) × (h*16)` instead of always 16×16.

### Why NOT Option A (split into individual tiles)

Splitting a 2×2 bed into `bed_tl.png`, `bed_tr.png`, `bed_bl.png`, `bed_br.png` means:
- 4× the number of PROPS entries for one object
- Placement errors if any tile is off by one
- Harder to swap object states (display_empty → display_stocked requires changing 4 entries)
- More files to manage

### Why NOT keeping current approach

A 96×96 region crushed to 16×16 is a 6× downscale. The game's base tile size is 16px with a 3× downscale from source. Going to 6× breaks the visual consistency — multi-tile objects look blurrier than surrounding single-tile objects.

---

## Implementation Plan

### Phase 1: Fix extraction (~30 min)

**Change:** When `w > 1` or `h > 1`, output PNG at `(w * 16) × (h * 16)` instead of `16 × 16`.

**Files to change:**
- `tools/extract_cafe_tiles.py` (or equivalent) — change the resize target from `(16, 16)` to `(w * 16, h * 16)` for `be` type extractions
- `tools/extract_config.py` — no structural changes needed (w/h already defined)

### Phase 2: Add dimensions to PROPS (~15 min)

**Change:** Add `tw` and `th` fields to PROPS entries for multi-tile objects.

```js
// Before:
{ type: 'bookshelf', tx: 1, ty: 1 },

// After:
{ type: 'bookshelf', tx: 1, ty: 1, tw: 2, th: 2 },
```

**File:** `src/tilemap.js` — add `tw`/`th` to ~9 PROPS entries

### Phase 3: Fix PROP rendering (~5 min)

**Change:** Use `tw`/`th` when baking props into tilemap cache.

```js
// Before:
octx.drawImage(sprite, prop.tx * TILE_SIZE, prop.ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);

// After:
const pw = (prop.tw || 1) * TILE_SIZE;
const ph = (prop.th || 1) * TILE_SIZE;
octx.drawImage(sprite, prop.tx * TILE_SIZE, prop.ty * TILE_SIZE, pw, ph);
```

**File:** `src/renderer.js` — one line change in `_bakeTilemapCache()`

### Phase 4: Verify OBJECT dimensions (~15 min)

Objects already support `tw`/`th` in the renderer. Verify that object definitions pass correct dimensions for bed (2×2), display cases (2×2), easels (1×2).

---

## Impact Summary

| File | Change | Effort |
|------|--------|--------|
| `tools/extract_cafe_tiles.py` | Resize to `w*16 × h*16` | Small |
| `tools/extract_config.py` | No changes needed | None |
| `src/tilemap.js` | Add `tw`/`th` to ~9 PROPS | Small |
| `src/renderer.js` | 1 line in `_bakeTilemapCache` | Trivial |
| Object definition file | Verify `tw`/`th` values | Small |
| All multi-tile sprite PNGs | Re-extract at correct size | Re-run script |

**Total effort:** ~1-2 hours including re-extraction and visual verification.

**Risk:** Low. The renderer already handles multi-tile objects. We're just feeding it correctly-sized sprites and telling props their actual dimensions.

---

## Design Decisions Needed

### Bookshelf placement conflict

Multiple bookshelves are placed adjacent (tx=1 and tx=2 at ty=17). If each bookshelf is 2×2, they'd overlap. Options:
1. Extract a 1×2 tall single-bookshelf variant (just left or right half)
2. Space bookshelves 2 tiles apart
3. Keep as 1×1 "bookshelf section" tiles (accept lower detail)

### Plant (tall) anchor point

A 1×3 plant rendered at 16×48 extends 3 tiles vertically. The `ty` should be the **top** of the plant. Current placements set `ty` to the *base* tile — these need adjusting up by 2 rows so the plant's bottom lands at the intended position.

### Fridge — single or tall?

Current extraction uses Kitchen_01 (10,15) as 1×1. There's a 1×2 tall fridge variant at (12,0). The tall version looks more realistic. Design choice: keep compact 1×1 or upgrade to 1×2?
