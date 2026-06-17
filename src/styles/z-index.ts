/**
 * Shared stacking scale for Bloom primitives.
 *
 * Keep component layers on this scale instead of introducing local magic
 * numbers. App-specific surfaces can still sit above Bloom's inline layers,
 * while portaled overlays use `portalRoot` as the document-level host.
 */
export const Z_INDEX = {
  base: 0,
  raised: 1,
  floating: 10,
  sticky: 20,
  dropdown: 40,
  dropdownSurface: 41,
  overlayBackdrop: 50,
  overlaySurface: 60,
  tooltip: 70,
  toast: 80,
  fullscreen: 90,
  fullscreenControl: 91,
  sheetHandle: 100,
  portalRoot: 999999,
} as const;

export const Z_INDEX_LAYER_STEP = 10;

function layerOffset(layer = 0) {
  return Math.max(0, Math.floor(layer)) * Z_INDEX_LAYER_STEP;
}

export function createDropdownZIndex(layer = 0) {
  const offset = layerOffset(layer);
  return {
    root: Z_INDEX.dropdown + offset,
    surface: Z_INDEX.dropdownSurface + offset,
  } as const;
}

export function createOverlayZIndex(layer = 0) {
  const offset = layerOffset(layer);
  return {
    backdrop: Z_INDEX.overlayBackdrop + offset,
    surface: Z_INDEX.overlaySurface + offset,
  } as const;
}

export const zIndex = Z_INDEX;
