/**
 * Bloom colour engine — scheme variants.
 *
 * The families of dynamic-colour scheme supported by the engine. Bloom exposes
 * the useful subset (Vibrant, Expressive, TonalSpot, Neutral, Fidelity); the
 * numeric values match Material Color Utilities so ported scheme logic lines up.
 */
export enum Variant {
  MONOCHROME = 0,
  NEUTRAL = 1,
  TONAL_SPOT = 2,
  VIBRANT = 3,
  EXPRESSIVE = 4,
  FIDELITY = 5,
  CONTENT = 6,
  RAINBOW = 7,
  FRUIT_SALAD = 8,
}
