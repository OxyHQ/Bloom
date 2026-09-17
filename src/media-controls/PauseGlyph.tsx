import { createSinglePathSVG } from '../icons/TEMPLATE';

/**
 * Bloom's pause glyph — the play triangle's WEIGHT, in two bars.
 *
 * Measured in the shared 24 viewBox (`scripts/…` is not needed; the numbers are
 * the paths' own):
 *
 *   play triangle    (8, 4) · (8, 20) · (20, 12), corners rounded   95.5 units²
 *   two bars 2 × 14  the stock media pause                          56.0 units²  0.59 ×
 *   two bars 3 × 16  this                                           96.0 units²  1.005 ×
 *
 * At 0.59 the pause read a full step lighter than the play it replaces, at every
 * size, so a transport button changed WEIGHT as it toggled — the one thing a
 * play/pause pair must not do, since the two are the same control. Ink area is
 * the match that matters here: same vertical extent (y 4 → 20, the triangle's
 * own), bars widened from 2 to 3, and the gap left at 6 so the pair still reads
 * as two bars rather than a block.
 *
 * Bloom-LOCAL rather than an edit to `icons/remix/RiPauseFill`: that file is
 * generated, and the stock weight is right for a 16px list glyph. This is the
 * one for a filled transport button.
 */
export const PauseGlyph = createSinglePathSVG({
  path: 'M6 4H9V20H6V4ZM15 4H18V20H15V4Z',
});
