/**
 * How strongly a solid control's fill tints the lens under it, as Apple's prominent controls are
 * tinted: the fill is the colour, and a fifth of the lens still shows through it (its frost, its
 * light and what moves behind), so a FAB or a prominent button reads as a tinted lens rather than
 * a solid disc on one.
 *
 * The language's material under a solid control takes the same strength (its
 * `CONTROL_FILL_OPACITY`), and its tests hold the two together. The web has no lens: a prominent
 * control's fill is the surface tint over the frost (`translucentTint`), as every tinted surface
 * there is.
 */
export const LENS_FILL_TINT = 0.8;
