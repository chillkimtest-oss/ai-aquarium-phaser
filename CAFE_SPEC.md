# AI Aquarium — Café Setting Spec

## Vision
A cozy café scene where 3 AI characters live their daily routines. Think "lofi girl" stream — small space, rich details, warm vibes. Users watch AI characters make coffee, read books, cook, chat, and go about their day.

## Critical Visual Rules

**This is ONE indoor building.** Two floors of the same structure. There must be NO outdoor elements (grass, dirt, sky) between or around the floors. The only outdoor element is a small sidewalk/entrance at the very bottom edge (1-2 tile rows max).

### Floor/Ceiling Transitions
- Floors are separated by a **ceiling/floor slab** — a thin horizontal band (1-2 tiles) of dark wood or concrete. NOT grass. NOT sky.
- The slab should read as "the ceiling of the café / floor of the apartment."
- Stairs visually connect through this slab.

### Wall Materials
- **Café walls:** Warm cream/beige plaster with wood wainscoting (bottom half darker wood, top half lighter). Think European coffee shop.
- **Apartment walls:** Warm wood paneling (already looks decent in current build).
- **NO striped/awning patterns** on interior walls.

### Floor Materials
- **Café floor:** Warm wood planks OR checkerboard tile — but only in the seating area. Behind the counter should be darker wood or stone (staff area).
- **Apartment floor:** Wood planks (darker than café).

### Density & Coziness
- **No large empty spaces.** Every 3x3 area should have at least one piece of furniture, decoration, or prop.
- **Furniture grouping:** Chairs are ALWAYS next to tables. No lone chairs floating in space.
- **Wall decorations:** Every wall segment longer than 3 tiles should have something on it (art, shelf, menu board, hanging plant, clock, window).
- **Floor decorations:** Rugs under seating clusters, potted plants in corners, small items on tables (cups, books, plates).

### Size Target
- Total map: roughly 20 wide × 28 tall tiles (including both floors + slab between)
- Ground floor café: ~20×12
- Ceiling slab: ~20×2  
- Upper floor apartment: ~20×12
- Entrance strip: ~20×2

## Map Layout

### Ground Floor — Maple's Café (20×12)
```
┌────────────────────┐
│▓▓▓▓▓▓▓▓│  window   │  Row 0-1: Back wall + windows
│ espresso│  seats    │
│ display │  (2 seats │  COUNTER ZONE (left 8 cols):
│ counter │  facing   │  - L-shaped counter (4 tall × 2 wide)
│ register│  out)     │  - Espresso machine on counter
│─────────│───────────│  - Display case with pastries
│ bookshf │ table rug │  - Cash register
│ nook    │ 4chairs   │  
│ armchair│ table     │  SEATING ZONE (right 12 cols):
│ plant   │ 2chairs   │  - Window seat row (2-3 stools facing windows)
│         │  plant    │  - 2-3 table clusters (table + 2-4 chairs each)
│===door==│===========│  - Bookshelf reading nook (left corner)
└────────────────────┘   - Rug under main table cluster
```

### Upper Floor — Nyx's Apartment (20×12)
```
┌────────────────────┐
│ bed     │ kitchen   │  Row 0-1: Back wall + windows  
│ nightstd│ counter   │
│         │ stove     │  BEDROOM ZONE (left):
│─────────│ fridge    │  - Bed + nightstand
│ easel   │───────────│  - Desk + lamp
│ paint   │ sofa      │  - Bookshelf
│ supplies│ coffee tbl│
│ desk    │ rug       │  ART ZONE (left-center):
│ lamp    │ plant     │  - Easel + paint supplies + stool
│ bookshf │ fireplace │
│         │           │  LIVING ZONE (right):
│===stairs============│  - Sofa + coffee table + rug
└────────────────────┘   - Fireplace + plant
                         - Kitchen counter + stove + fridge
```

## Characters

### Maple (Barista) 🍁
- **Home base:** Behind the counter
- **Personality:** Warm, chatty, takes pride in coffee
- **Routine:**
  - Morning: Opens café, brews first pot, arranges pastries
  - Day: Makes coffee for customers, wipes counter, chats
  - Evening: Cleans up, reads a book at the counter
- **Objects:** Espresso machine, display case, counter, cleaning cloth

### Sol (Regular Customer) ☀️
- **Home base:** Window seat
- **Personality:** Quiet, bookish, friendly when approached
- **Routine:**
  - Morning: Arrives, orders coffee from Maple
  - Day: Reads at window seat, sketches in notebook, orders refills
  - Evening: Packs up, says goodbye, leaves
- **Objects:** Book, notebook, coffee cup

### Nyx (Upstairs Tenant) 🌙
- **Home base:** Apartment upstairs
- **Personality:** Creative, night owl, slightly scatterbrained
- **Routine:**
  - Morning: Sleeps in, eventually stumbles down for coffee
  - Day: Paints at easel, cooks lunch, waters plants
  - Evening: Most productive — painting, cooking experiments
- **Objects:** Easel, stove, watering can, bed

## Object State Machines

### Espresso Machine
```
idle → brewing (Maple starts) → done (cup appears) → idle (cup taken)
```

### Display Case
```
empty → stocked (Maple adds pastries) → partial (customer buys) → empty
```

### Easel (upstairs)
```
blank → sketching (Nyx draws) → painting (Nyx paints) → finished → blank
```

### Stove (upstairs)
```
off → heating (Nyx cooks) → cooking (steam particles) → done (food ready) → off
```

### Book (Sol's)
```
closed → reading (Sol reads, page turn animation) → closed
```

## AI Decision Format
Characters send perception to LLM, get back:
```json
{
  "action": "interact|move|talk",
  "target": "espresso_machine|sol|upstairs",
  "description": "Makes a latte for Sol",
  "dialogue": "Your usual? Coming right up!"
}
```

## Visible Feedback Loop
1. AI decides → character walks to target
2. Character arrives → interaction animation plays
3. Object state changes → particles/effects
4. If dialogue → speech bubble appears
5. Other characters react → creates chain of interactions

## Atmosphere
- Lofi beat (procedural or audio file)
- Day/night lighting through windows
- Steam from coffee cups
- Rain on windows (random events)
- Ambient café sounds (cups clinking, pages turning)

## Visual Quality Checklist
Before any deploy is considered "done," verify:
- [ ] No grass/outdoor tiles between floors
- [ ] Floors connected by visible ceiling/floor slab
- [ ] Stairs visually bridge both floors
- [ ] No lone chairs without adjacent tables
- [ ] No empty 3×3+ zones without furniture/decoration
- [ ] Walls have decorations (art, shelves, windows)
- [ ] Counter area has espresso machine, display case, register
- [ ] At least 2 table clusters with chairs in café
- [ ] Window seats visible along right/exterior wall
- [ ] Apartment has distinct bedroom, art, living, kitchen zones
- [ ] Rugs or floor variation break up large tile areas
- [ ] Potted plants in at least 3 corners
- [ ] Warm color palette — no cold grays or harsh whites dominating

## Technical Notes
- Map stored in tilemap.js as 2D array (same as current)
- Multi-tile objects need assembly (table = 2x2, counter = 4x1)
- LimeZu Modern Interiors has all furniture pre-made
- Character sprites from LimeZu character generator
- State machine in engine.js, AI decisions in ai.js
