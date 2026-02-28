# Custom Scene Build Spec

## Overview
Build a two-floor indoor scene from scratch using LimeZu Room Builder tiles + individual singles.
No pre-built designs — full creative control.

## Layout (12 tiles wide × 18 tiles tall = 576×864 px)

### Floor 2: Nyx's Apartment (rows 0-7, 8 rows tall)
- **Walls:** Cream/off-white (Walls sheet, left group, rows 6-7)
- **Floor:** Warm wood herringbone or diagonal plank
- **Rooms:**
  - Art studio corner (left): easel, canvas, paint supplies, desk
  - Living area (center): couch, coffee table, bookshelf, rug
  - Bedroom nook (right): bed, nightstand, lamp
  - Plants near windows, wall art throughout

### Ceiling slab (row 8, 1 row)
- Dark gray/charcoal bar separating floors

### Floor 1: Maple's Café (rows 9-17, 9 rows tall)
- **Walls:** Teal/deep cyan (Walls sheet, right group, rows 8-9)
- **Floor:** Light tile or warm wood
- **Layout:**
  - Back wall (row 9-10): counter with espresso machine, coffee maker, display case, cash register
  - Behind counter: shelves, menu board, bottles
  - Middle area (rows 11-14): seating — 2-3 small tables with chairs
  - Left wall: bookshelf, plants, wall art
  - Right wall: window with plants, coat rack
  - Front (rows 15-17): entrance area, welcome mat, more seating, potted plants

## Asset Sources

### Room Builder (walls + floors)
- `Room_Builder_subfiles_48x48/Room_Builder_Walls_48x48.png` — wall tiles
- `Room_Builder_subfiles_48x48/Room_Builder_Floors_48x48.png` — floor tiles
- `Room_Builder_subfiles_48x48/Room_Builder_baseboards_48x48.png` — baseboards

### Individual Singles
- `Theme_Sorter_Singles_48x48/12_Kitchen_Singles_48x48/` — 408 sprites (counters, machines, cups, plates, food)
- `Theme_Sorter_Singles_48x48/2_Living_Room_Singles_48x48/` — sofas, shelves, lamps, plants
- `Theme_Sorter_Singles_48x48/4_Bedroom_Singles_48x48/` — beds, desks, nightstands
- `Theme_Sorter_Singles_48x48/7_Art_Singles_48x48/` — easels, wall art, canvases
- `Theme_Sorter_Singles_48x48/19_Bathroom_Singles_48x48/` — if needed for apartment

## Technical Approach

### Option A: Python pre-compose (recommended)
1. Write a Python script that:
   - Creates a blank canvas (576×864)
   - Tiles the floor from the Floors spritesheet
   - Draws walls from the Walls spritesheet
   - Places furniture sprites from Singles folders
   - Outputs a single composed PNG per layer (background, furniture, foreground)
2. Load the composed PNGs in Phaser as simple images (like we do now)
3. Benefits: pixel-perfect control, no runtime coordinate math, easy to iterate

### Option B: Phaser tilemap
1. Create a Tiled JSON map programmatically
2. Load into Phaser as a tilemap
3. More complex but supports collision data

**Go with Option A** — simpler, we proved the image-loading approach works.

## Build Steps
1. Create `scripts/compose-scene.py`
2. Extract wall/floor tiles from Room Builder sheets
3. Browse Singles folders to find the best sprites for each furniture item
4. Compose the scene layer by layer
5. Output to `assets/composed/cafe_bg.png` and `assets/composed/apt_bg.png`
6. Update scene.js to load composed images
7. Deploy and QA
