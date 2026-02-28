# LimeZu Asset Inventory — What We Actually Have

We purchased the full Modern Interiors + Modern Exteriors pack. It contains FAR more than the RPG Maker MV tilesets we've been using.

## Directory Structure

```
Modern_Interiors_Full/
├── 1_Interiors/
│   ├── 48x48/                          ← OUR PRIMARY SOURCE
│   │   ├── Theme_Sorter_Singles_48x48/ ← INDIVIDUAL SPRITES (each item = own PNG)
│   │   │   ├── 2_Living_Room_Singles/  (per-item PNGs)
│   │   │   ├── 3_Bathroom_Singles/
│   │   │   ├── 4_Bedroom_Singles/
│   │   │   ├── 5_Classroom_and_Library_Singles/
│   │   │   ├── 7_Art_Singles/          (easels, paint supplies, canvases)
│   │   │   ├── 12_Kitchen_Singles/     (408 items! counters, appliances, cups, food)
│   │   │   ├── 24_Ice_Cream_Shop_Singles/ (display cases, soft-serve machines)
│   │   │   └── ... (24 theme folders total)
│   │   │
│   │   ├── Room_Builder_subfiles_48x48/ ← BUILD ROOMS FROM PARTS
│   │   │   ├── Room_Builder_Floors_48x48.png       (floor tiles)
│   │   │   ├── Room_Builder_Walls_48x48.png        (wall tiles)
│   │   │   ├── Room_Builder_baseboards_48x48.png   (trim between wall/floor)
│   │   │   ├── Room_Builder_borders_48x48.png      (room borders)
│   │   │   ├── Room_Builder_3d_walls_48x48.png     (3D perspective walls)
│   │   │   ├── Room_Builder_Arched_Entryways_48x48.png (doorways)
│   │   │   ├── Room_Builder_Floor_Connectors_48x48.png (transitions)
│   │   │   └── Room_Builder_Floor_Shadows_48x48.png
│   │   │
│   │   ├── Theme_Sorter_48x48/         ← PACKED SHEETS (what we've been using — HARDER)
│   │   ├── Room_Builder_48x48.png       ← All room-building tiles in one sheet
│   │   └── Interiors_48x48.png          ← ALL interiors in one mega-sheet
│   │
│   └── 16x16/                           (same structure but 16px tiles)
│
├── 2_Characters/
│   └── Character_Generator/             ← CREATE CUSTOM CHARACTERS
│
├── 3_Animated_objects/                   ← ANIMATED SPRITES (ovens, coffee machines, etc.)
│
├── 4_User_Interface_Elements/            ← UI sprites
│
└── 6_Home_Designs/                       ← PRE-BUILT ROOM DESIGNS
    ├── Generic_Home_Designs/48x48/       (complete home, layered PNGs)
    ├── Ice-Cream_Shop_Designs/48x48/     (counter + seating layout)
    ├── Condominium_Designs/48x48/        (multi-floor building)
    ├── Gym_Designs/
    ├── Japanese_Interiors_Home_Designs/
    ├── Museum_Designs/
    ├── Shooting_Range_Designs/
    └── TV_Studio_Designs/
```

## What's Relevant for Our Café

### Pre-built Designs (use as base)
| Design | Use For | Path |
|--------|---------|------|
| Ice Cream Shop | Café ground floor (counter + seating) | 6_Home_Designs/Ice-Cream_Shop_Designs/48x48/ |
| Generic Home | Nyx's apartment | 6_Home_Designs/Generic_Home_Designs/48x48/ |

### Individual Sprites (for customization)
| Theme | Items | Use For |
|-------|-------|---------|
| Kitchen Singles | 408 sprites | Café appliances, counters, cups, food, plates |
| Living Room Singles | ~200+ | Apartment furniture, sofa, bookshelves, lamps |
| Bedroom Singles | ~200+ | Nyx's bedroom area |
| Art Singles | ~100+ | Nyx's art studio (easels, paint, canvases) |
| Ice Cream Shop Singles | ~100+ | Display cases, machines (swap to espresso) |
| Classroom/Library | ~100+ | Bookshelves, reading nook |

### Room Builder (for walls/floors)
| File | Use For |
|------|---------|
| Room_Builder_Floors_48x48.png | Proper floor tiles with variants |
| Room_Builder_Walls_48x48.png | Proper wall tiles (no autotile needed!) |
| Room_Builder_baseboards_48x48.png | Wall-floor transitions |
| Room_Builder_borders_48x48.png | Room edge borders |

### Animated Objects
For later (simulation phase): animated coffee machines, ovens, etc.

### Characters
Character_Generator for creating Maple, Sol, Nyx sprites.

## What We Were Doing Wrong

1. **Using RPG Maker MV packed sheets** (Theme_Sorter_MV/) instead of the 48×48 singles
2. **Guessing grid coordinates** on packed sheets instead of using individual PNGs
3. **Fighting autotile format** instead of using Room Builder wall/floor tiles
4. **Not using pre-built Home Designs** as room layout bases
5. **Not knowing about individual sprites** — each item has its own PNG, no extraction needed

## Recommended Approach

1. Use **Home Design PNGs** as background layer (pre-built rooms)
2. Overlay **individual sprite PNGs** for customization (swap ice cream → coffee items)
3. Use **Room Builder** tiles for any custom room construction
4. Use **Character Generator** for character sprites
5. Zero extraction scripts needed — everything is already at 48×48 in individual files
