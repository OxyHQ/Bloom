/**
 * The window a character is drawn through.
 *
 * Every vector frame is authored on a 320×320 canvas, which leaves the figure room to move: at
 * rest the characters span about x 72–248 and y 77–286 of it, so drawn through the whole canvas
 * they fill barely half of their box and look tiny beside the text next to them. The avatar is
 * drawn through this crop instead, a square around the figures (the tallest, the paperclip, is
 * the one that sets its height), so a character fills its box with a margin of about a tenth.
 *
 * One crop for all of them, not one per character, so characters shown side by side keep their
 * relative size. A frame that already carries a viewBox of its own (an eyes-only preview fits its
 * own bounds) is left as it is.
 */
export const VECTOR_CANVAS_VIEWBOX = '0 0 320 320';
export const VECTOR_AVATAR_VIEWBOX = '52 70 216 216';

/** The viewBox an avatar draws a frame through. */
export function avatarViewBox(frameViewBox: string): string {
  return frameViewBox === VECTOR_CANVAS_VIEWBOX ? VECTOR_AVATAR_VIEWBOX : frameViewBox;
}
