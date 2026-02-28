# 09 — Phaser 3 + RPG Maker MV Tileset Integration Guide

## The Problem

We've been manually cropping individual sprites from LimeZu RPG Maker MV tilesheets and placing them as individual Phaser sprites. This is fundamentally wrong — it produces cut-off furniture, misaligned multi-tile objects, and is unmaintainable. RPG Maker MV tilesets are designed to be used as **whole tilesheets** loaded into a **tilemap system**.

## TL;DR — The Correct Workflow

```
RPG Maker MV Tilesheet (768×768 PNG)
        ↓
   Tiled Map Editor (or programmatic JSON)
        ↓
   Tiled JSON export (.json)
        ↓
   Phaser 3 Tilemap loader
        ↓
   Rendered tilemap with layers
```

**Do NOT** manually crop tiles. **Do** load the full spritesheet and reference tiles by index.

---

## 1. RPG Maker MV Tileset Format Recap

### What We Have

Located in `assets/research/limzu/purchased/Modern_Interiors_RPG_Maker_Version/RPG_MAKER_MV/`:

| File | RPG Maker Slot | Type | Size | Purpose |
|------|---------------|------|------|---------|
| `Floors_TILESET_A2_.png` | A2 | Autotile | 768×576 | Ground/floor tiles (autotile format) |
| `Floors_2_TILESET_A2_.png` | A2 | Autotile | 768×576 | Additional floors |
| `Walls_TILESET_A4_.png` | A4 | Autotile | 768×720 | Wall tiles (autotile format) |
| `Walls_2_TILESET_A4_.png` | A4 | Autotile | 768×720 | Additional walls |
| `Interiors/Theme_Sorter_MV/*.png` | B-E | Regular | 768×768 | Furniture & objects (16×16 grid of 48px tiles) |

### Tile Size
- **48×48 pixels** per tile (RPG Maker MV standard)
- B-E sheets: 768÷48 = **16 tiles wide**, 768÷48 = **16 tiles tall** = 256 tiles per sheet

### Key Distinction: Autotiles (A2/A4) vs Regular Tiles (B-E)

- **B-E sheets** are simple grids. Each 48×48 cell is one tile. These work directly with Phaser/Tiled.
- **A2/A4 autotiles** use RPG Maker's special sub-tile compositing system (each "autotile" is a template of mini-tiles that RPG Maker combines based on neighbors). These do NOT work directly with Phaser.

---

## 2. Phaser 3 Tilemap System

### How Phaser Tilemaps Work

Phaser 3 has built-in tilemap support that loads Tiled JSON maps:

```javascript
// preload
this.load.image('interiors', 'assets/tilesets/Kitchen_01.png');
this.load.tilemapTiledJSON('cafe-map', 'assets/maps/cafe.json');

// create
const map = this.make.tilemap({ key: 'cafe-map' });
const tileset = map.addTilesetImage('Kitchen_01', 'interiors');
const floorLayer = map.createLayer('Floor', tileset, 0, 0);
const furnitureLayer = map.createLayer('Furniture', tileset, 0, 0);
```

### Key Concepts

- **Tileset**: A spritesheet image where tiles are arranged in a grid (our B-E sheets)
- **Tilemap**: A JSON file describing which tile goes where, organized in layers
- **Layer**: A grid of tile indices (floor, walls, furniture, decorations, etc.)
- **Global Tile ID (GID)**: Each tile gets a unique index. First tileset starts at GID 1. Tile at row 0, col 0 = GID 1, row 0 col 1 = GID 2, etc.
- **Multiple tilesets**: A single map can reference multiple tileset images

### Loading Multiple Tilesets

For a café scene using Kitchen + generic furniture:

```javascript
// preload - load multiple tileset images
this.load.image('kitchen', 'assets/tilesets/Kitchen_01.png');
this.load.image('bedroom', 'assets/tilesets/Bedroom_01_Revamped.png');
this.load.image('floors', 'assets/tilesets/floors_simple.png');
this.load.tilemapTiledJSON('cafe-map', 'assets/maps/cafe.json');

// create
const map = this.make.tilemap({ key: 'cafe-map' });
const kitchenTiles = map.addTilesetImage('Kitchen_01', 'kitchen');
const bedroomTiles = map.addTilesetImage('Bedroom_01', 'bedroom');
const floorTiles = map.addTilesetImage('floors_simple', 'floors');

// Layers can use multiple tilesets
const floor = map.createLayer('Floor', [floorTiles], 0, 0);
const furniture = map.createLayer('Furniture', [kitchenTiles, bedroomTiles], 0, 0);
```

---

## 3. The Autotile Problem & Solution

### The Problem

A2 (floors) and A4 (walls) autotiles use RPG Maker's proprietary sub-tile compositing:
- Each autotile block on the sheet is a **template** of mini-tiles, not a single tile
- RPG Maker composites 4 quarter-tiles to form each final 48×48 tile based on neighbor context
- There are **47 possible combinations** per autotile pattern
- Phaser has **zero built-in autotile support**
- There are **no maintained Phaser plugins** for RPG Maker MV autotiles

### Solutions (in order of recommendation)

#### Option A: Pre-render Autotiles (Most Complete)

Use a script to pre-render all 47 autotile combinations into a flat spritesheet, then use as a normal tileset. The 47-pattern lookup table is well-documented online.

#### Option B: Extract Center Tiles Only (RECOMMENDED — Quickest)

For our café scene, we don't need autotile transitions:
- **Floors**: Extract just the "full/center" tile from each A2 autotile block
- **Walls**: Extract flat wall tiles from A4
- Skip auto-transitions entirely — use solid fills

The A2 sheet layout: each autotile block is 2 tiles wide × 3 tiles tall (96×144px). The **bottom-right 48×48 cell** of each block is usually the "full center" tile — the one used when all neighbors are the same type.

#### Option C: Create Simple Custom Tiles

Make simple 48×48 floor/wall tiles from scratch or use the non-RPG-Maker LimeZu sheets.

### Recommendation for Café Scene

**Go with Option B.** Extract a handful of floor variants (wood, tile, carpet) as individual 48×48 tiles from the center of each A2 autotile block. Same for walls from A4. Combine into a small `cafe_base.png` spritesheet. Use the Theme_Sorter B-E sheets as-is for furniture.

---

## 4. Multi-Tile Object Placement (Furniture)

### How It Works in Tilemaps

Multi-tile objects (2×2 beds, 2×3 bookcases, etc.) are **multiple individual tiles** placed across the grid. Each 48×48 cell of the larger object is one tile in the tilemap.

Example: A 2×2 table in `Kitchen_01.png` occupying positions (3,4), (4,4), (3,5), (4,5) on the sheet. In the tilemap, you place all 4 tiles in their correct relative grid positions.

### Layer Structure (Recommended)

```
Tilemap layers (bottom to top):
  - Floor        — floor tiles
  - Walls        — wall tiles
  - Furniture    — tables, chairs, counters
  - Decorations  — items on top of furniture
  - Above-Player — ceiling elements, tall furniture tops
```

### Object Layer (for interactive elements)

Tiled supports "object layers" with metadata:

```json
{
  "type": "objectgroup",
  "name": "interactive",
  "objects": [
    {
      "name": "coffee_machine",
      "type": "interactable",
      "x": 192, "y": 96,
      "width": 48, "height": 96
    }
  ]
}
```

In Phaser:
```javascript
const objects = map.getObjectLayer('interactive').objects;
objects.forEach(obj => {
  // Create interactive sprite or zone at obj.x, obj.y
});
```

### Recommendation

Use **tile layers** for all static furniture. Use **object layers** only for interactive zones, spawn points, or camera triggers.

---

## 5. Creating Tiled Maps Programmatically

**Yes — the agent can generate Tiled JSON maps without the Tiled GUI.** The format is straightforward.

### Minimal Tiled JSON Structure

```json
{
  "compressionlevel": -1,
  "height": 12,
  "width": 16,
  "tileheight": 48,
  "tilewidth": 48,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "type": "map",
  "version": "1.10",
  "tiledversion": "1.10.2",
  "infinite": false,
  "nextlayerid": 4,
  "nextobjectid": 1,
  "tilesets": [
    {
      "firstgid": 1,
      "columns": 16,
      "image": "../tilesets/Kitchen_01.png",
      "imageheight": 768,
      "imagewidth": 768,
      "margin": 0,
      "name": "Kitchen_01",
      "spacing": 0,
      "tilecount": 256,
      "tileheight": 48,
      "tilewidth": 48
    }
  ],
  "layers": [
    {
      "id": 1,
      "name": "Floor",
      "type": "tilelayer",
      "width": 16,
      "height": 12,
      "data": [1, 1, 1, 1, ...],
      "opacity": 1,
      "visible": true,
      "x": 0,
      "y": 0
    }
  ]
}
```

### Key Rules

- **`data` array**: flat array of GIDs, length = width × height, row-major order. `0` = empty/no tile.
- **`firstgid`**: first GID for this tileset. Second tileset's firstgid = first tileset's tilecount + first's firstgid.
- **GID calculation**: For tile at row `r`, col `c` in a 16-column tileset with firstgid `F`: `GID = F + (r * 16) + c`
- **Multiple tilesets**: Add entries to `tilesets` array with sequential `firstgid` values.

### Programmatic Map Generator

```javascript
function createTiledMap(width, height, tilesets, layers) {
  let nextGid = 1;
  const tilesetDefs = tilesets.map(ts => {
    const cols = Math.floor(ts.imageWidth / 48);
    const rows = Math.floor(ts.imageHeight / 48);
    const def = {
      firstgid: nextGid,
      columns: cols,
      image: ts.imagePath,
      imageheight: ts.imageHeight,
      imagewidth: ts.imageWidth,
      margin: 0,
      name: ts.name,
      spacing: 0,
      tilecount: cols * rows,
      tileheight: 48,
      tilewidth: 48
    };
    nextGid += cols * rows;
    return def;
  });

  return {
    compressionlevel: -1,
    height, width,
    tileheight: 48, tilewidth: 48,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    infinite: false,
    nextlayerid: layers.length + 1,
    nextobjectid: 1,
    tilesets: tilesetDefs,
    layers: layers.map((layer, i) => ({
      id: i + 1,
      name: layer.name,
      type: 'tilelayer',
      width, height,
      data: layer.data,
      opacity: 1,
      visible: true,
      x: 0, y: 0
    }))
  };
}
```

---

## 6. Step-by-Step Implementation Guide

### Phase 1: Prepare Tilesets

1. **Copy B-E sheets** (e.g., `Kitchen_01.png`) to `assets/tilesets/`
2. **Create `cafe_base.png`**: Extract center tiles from A2/A4 for floors and walls into a small grid spritesheet
3. **Document tile indices**: Map the 16×16 grid positions to furniture names

### Phase 2: Build the Map JSON

4. **Write a map generator** or hand-author the JSON
5. **Define layers**: Floor, Walls, Furniture, Decorations
6. **GID formula**: `GID = firstgid + (row * 16) + col`

### Phase 3: Load in Phaser

7. **Phaser scene:**
```javascript
class CafeScene extends Phaser.Scene {
  preload() {
    this.load.image('kitchen-tiles', 'assets/tilesets/Kitchen_01.png');
    this.load.image('base-tiles', 'assets/tilesets/cafe_base.png');
    this.load.tilemapTiledJSON('cafe-map', 'assets/maps/cafe.json');
  }
  create() {
    const map = this.make.tilemap({ key: 'cafe-map' });
    const baseTileset = map.addTilesetImage('cafe_base', 'base-tiles');
    const kitchenTileset = map.addTilesetImage('Kitchen_01', 'kitchen-tiles');
    map.createLayer('Floor', baseTileset);
    map.createLayer('Walls', baseTileset);
    map.createLayer('Furniture', kitchenTileset);
  }
}
```

### Phase 4: Two Floors

8. Create separate map JSONs: `cafe_floor1.json`, `cafe_floor2.json`
9. Switch between Phaser scenes for floor transitions

---

## 7. Alternative: Spritesheet Without Tilemap

If tilemap feels heavy, load as spritesheet and place tiles directly:

```javascript
this.load.spritesheet('kitchen', 'assets/tilesets/Kitchen_01.png', {
  frameWidth: 48, frameHeight: 48
});
// Place by frame index (0-indexed): frameIndex = row * 16 + col
this.add.image(x, y, 'kitchen', frameIndex).setOrigin(0);
```

This avoids manual cropping but loses tilemap benefits (collision, layers, easy editing). **For a café scene with furniture, prefer the tilemap approach.**

---

## 8. Summary of Decisions

| Question | Answer |
|----------|--------|
| Use Tiled GUI? | No — generate JSON programmatically |
| Handle A2/A4 autotiles? | Extract center tiles only; skip autotile compositing |
| Multi-tile furniture? | Multiple tiles on tile layers (standard tilemap approach) |
| Interactive objects? | Object layers in the tilemap JSON |
| B-E tilesheets? | Load directly as Phaser tilesets — they work as-is (48px grid) |
| Multiple floors? | Separate map JSON per floor |
| Map format? | Tiled JSON via `this.load.tilemapTiledJSON` |

## 9. Key References

- Phaser 3 Tilemap docs: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/tilemap/
- Tiled JSON format: https://doc.mapeditor.org/en/stable/reference/json-map-format/
- Phaser Tilemap examples: https://phaser.io/examples/v3.55.0/tilemap/view/tiled-json-map
- Phaser + Tiled tutorial (Michael Hadley): https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6
- RPG Maker MV autotile guide: https://www.rpgmakerweb.com/blog/classic-tutorial-how-autotiles-work
- Top-down Phaser + Tiled: https://gamedevacademy.org/html5-phaser-tutorial-top-down-games-with-tiled/

---

## 10. Next Steps

1. **Tile index map**: Open `Kitchen_01.png`, document what's at each grid position
2. **Simple floor tileset**: Create `cafe_base.png` with floor/wall tiles from A2/A4
3. **Map generator**: Write JS to output Tiled JSON for the café layout
4. **Phaser integration**: Replace manual sprite placement with tilemap rendering
5. **Second floor**: Create second map JSON and scene transition
