/** Vector bodies have their own registry; they are not entries in the 3D asset catalog. */
export const SVG_CHARACTER_SHAPES = [
  ['bot_blob', 'Blob bot'],
  ['bot_star', 'Star bot'],
  ['bot_hex', 'Hexagon bot'],
  ['bot_heart', 'Heart bot'],
  ['bot_square', 'Square bot'],
  ['bot_tablet', 'Tablet bot'],
  ['bot_sparkle', 'Sparkle bot'],
  ['bot_flower', 'Flower bot'],
  ['bot_wedge', 'Wedge bot'],
  ['bot_clover', 'Clover bot'],
  ['bot_teardrop', 'Teardrop bot'],
  ['bot_pebble', 'Pebble bot'],
  ['bot_cloud', 'Cloud bot'],
] as const;

export type SvgAvatarShapeId = (typeof SVG_CHARACTER_SHAPES)[number][0];
export const SVG_SHAPES: readonly SvgAvatarShapeId[] = SVG_CHARACTER_SHAPES.map(([id]) => id);

/** The bot face is also available when composing a character with an existing body. */
export const SVG_EYES = ['bot'] as const;
export type SvgAvatarEyesId = (typeof SVG_EYES)[number];

export function isSvgShape(value: string): value is SvgAvatarShapeId {
  return SVG_SHAPES.some((id) => id === value);
}

export function isSvgEyes(value: string): value is SvgAvatarEyesId {
  return SVG_EYES.some((id) => id === value);
}
