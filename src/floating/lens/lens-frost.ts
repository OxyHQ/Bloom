/**
 * The lens's frost, as Apple's 2025 material: it blurs what is behind it slightly and bends it at
 * its edges, and a lens that grows into a menu frosts more ("a thicker, more substantial material
 * … a softer scattering of light", WWDC25 session 219). Each is the engine's blur radius in dp
 * (sigma = 0.577 radius + 0.5 px); the engine's own are 1 at rest and 16 for a menu.
 *
 * The language's regular material takes the same values from its spec (`lensBlur` and
 * `lensMenuBlur`), and its tests hold the two together.
 */
export const LENS_FROST = {
  /** A control, a group of controls or a bar at rest: about 3 dp of sigma. */
  control: 5,
  /** A menu's panel, the radius the lens grows into as the menu opens: about 14 dp of sigma. */
  panel: 24,
} as const;
