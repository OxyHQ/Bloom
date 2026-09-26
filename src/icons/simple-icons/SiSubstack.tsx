import { createSinglePathSVG } from '../TEMPLATE';

/**
 * Simple Icons `substack` (simple-icons@16.32.0, CC0 1.0). Remix Icon has no
 * Substack glyph, so this one mark comes from the set `social-button` already
 * draws brand marks from. The path is verbatim.
 *
 * Simple Icons draws edge to edge on its 24 grid (this path spans y 0–24);
 * Remix Logos keep a 2-unit margin (Bluesky, X and Mastodon sit inside 2–22).
 * The `-2 -2 28 28` viewBox scales the same path onto that 20-unit live area,
 * so the mark sits at the same visual size as the Remix brand glyphs beside it.
 */
export const SiSubstack = createSinglePathSVG({
  path: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z',
  viewBox: '-2 -2 28 28',
});
