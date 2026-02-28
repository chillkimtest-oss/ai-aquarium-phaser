/**
 * objects.js — interactive object definitions for the Japanese Home scene.
 *
 * Tile positions are approximate; Kim will refine after Tiled walkable-map pass.
 * All objects start in 'idle' state.
 *
 * Object shape:
 *   { id, label, tx, ty, state, interactable, interactDurationMs, busyTimer }
 */

export const OBJECTS = [
  // ── Café floor (rows 4–11 approx) ─────────────────────────────────────────

  {
    id: 'espresso_machine',
    label: 'Espresso Machine',
    tx: 2, ty: 9,
    state: 'idle',
    interactable: true,
    interactDurationMs: 5000,
    busyTimer: 0,
  },
  {
    id: 'coffee_maker',
    label: 'Coffee Maker',
    tx: 3, ty: 9,
    state: 'idle',
    interactable: true,
    interactDurationMs: 4000,
    busyTimer: 0,
  },
  {
    id: 'display_case',
    label: 'Display Case',
    tx: 5, ty: 9,
    state: 'idle',
    interactable: true,
    interactDurationMs: 2000,
    busyTimer: 0,
  },
  {
    id: 'bookshelf_cafe',
    label: 'Bookshelf',
    tx: 16, ty: 9,
    state: 'idle',
    interactable: true,
    interactDurationMs: 10000,
    busyTimer: 0,
  },
  {
    id: 'window_seat',
    label: 'Window Seat',
    tx: 14, ty: 11,
    state: 'idle',
    interactable: true,
    interactDurationMs: 8000,
    busyTimer: 0,
  },
  {
    id: 'cafe_table_1',
    label: 'Café Table (left)',
    tx: 8, ty: 10,
    state: 'idle',
    interactable: true,
    interactDurationMs: 6000,
    busyTimer: 0,
  },
  {
    id: 'cafe_table_2',
    label: 'Café Table (right)',
    tx: 12, ty: 10,
    state: 'idle',
    interactable: true,
    interactDurationMs: 6000,
    busyTimer: 0,
  },

  // ── Apartment floor (rows 4–8 approx) ────────────────────────────────────

  {
    id: 'easel',
    label: 'Easel',
    tx: 2, ty: 5,
    state: 'idle',
    interactable: true,
    interactDurationMs: 15000,
    busyTimer: 0,
  },
  {
    id: 'bookshelf_apt',
    label: 'Bookshelf (apt)',
    tx: 16, ty: 5,
    state: 'idle',
    interactable: true,
    interactDurationMs: 10000,
    busyTimer: 0,
  },
  {
    id: 'stove',
    label: 'Stove',
    tx: 14, ty: 5,
    state: 'idle',
    interactable: true,
    interactDurationMs: 8000,
    busyTimer: 0,
  },
  {
    id: 'bed',
    label: 'Bed',
    tx: 5, ty: 5,
    state: 'idle',
    interactable: true,
    interactDurationMs: 20000,
    busyTimer: 0,
  },
];
