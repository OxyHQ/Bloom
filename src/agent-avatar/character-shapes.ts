/** Every body in the catalog and the English name the editors show for it. */
export const NATIVE_CHARACTER_SHAPES = [
  ['clippo', 'Clippo'],
  ['todd', 'Todd'],
  ['circle', 'Circle'],
  ['rounded_triangle', 'Rounded triangle'],
  ['capsule', 'Capsule'],
  ['rounded_head_two_ears', 'Rounded head with two ears'],
  ['six_lobed_flower', 'Six lobed flower'],
  ['heart', 'Heart'],
  ['four_lobed_butterfly', 'Four lobed butterfly'],
  ['circle_two_ears', 'Circle with two ears'],
  ['twelve_scalloped_rosette', 'Twelve scalloped rosette'],
  ['rounded_cube', 'Hexagon'],
  ['rounded_diamond', 'Rounded diamond'],
] as const;
export const MIGRATED_CHARACTER_SHAPES = [
  ['slender', 'Slender'],
  ['pocket', 'Pocket'],
  ['petal', 'Petal'],
  ['star', 'Star'],
  ['cloud', 'Cloud'],
  ['shield', 'Shield'],
  ['pebble', 'Pebble'],
  ['squircle', 'Squircle'],
] as const;
export const CHARACTER_SHAPES = [...NATIVE_CHARACTER_SHAPES, ...MIGRATED_CHARACTER_SHAPES] as const;
