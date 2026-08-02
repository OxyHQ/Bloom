/**
 * Named avatar outlines.
 *
 * Each entry is an SVG path drawn in a 100×100 square coordinate space, scaled
 * at render time to the avatar's pixel size. That space is declared once in
 * {@link NAMED_SHAPE_VIEW_BOX} rather than baked into the numbers, so the paths
 * can be read and edited at human-friendly magnitudes. The built-in squircle
 * lives in `squircle-path.ts` and uses a 0–1 space; both are supported because
 * {@link AvatarShapePath} carries its own `viewBox`.
 *
 * `circle` is deliberately absent: a circular avatar is rendered with
 * `borderRadius` and never reaches the SVG renderer.
 */

/** Side length of the coordinate space every path below is drawn in. */
export const NAMED_SHAPE_VIEW_BOX = 100;

export type AvatarShapeName =
  | 'square' | 'slanted' | 'arch' | 'semicircle'
  | 'oval' | 'pill' | 'triangle' | 'arrow' | 'fan'
  | 'diamond' | 'clamshell' | 'pentagon' | 'gem' | 'very-sunny'
  | 'sunny' | '4-sided-cookie' | '6-sided-cookie' | '7-sided-cookie'
  | '9-sided-cookie' | '12-sided-cookie' | '4-leaf-clover'
  | '8-leaf-clover' | 'burst' | 'soft-burst' | 'boom' | 'soft-boom'
  | 'flower' | 'puffy' | 'puffy-diamond' | 'ghost-ish'
  | 'pixel-circle' | 'pixel-triangle' | 'bun' | 'heart';

export const AVATAR_SHAPE_PATHS: Record<AvatarShapeName, string> = {
  // --- Basic ---
  square:
    'M12 0H88Q100 0 100 12V88Q100 100 88 100H12Q0 100 0 88V12Q0 0 12 0Z',
  slanted:
    'M22 0H88Q100 0 100 12V78Q100 100 78 100H12Q0 100 0 88V22Q0 0 22 0Z',
  arch:
    'M50 0Q100 0 100 50V88Q100 100 88 100H12Q0 100 0 88V50Q0 0 50 0Z',
  semicircle:
    'M0 50A50 50 0 0 1 100 50V88Q100 100 88 100H12Q0 100 0 88Z',

  // --- Organic ---
  oval:
    'M50 2C78 2 96 22 96 50S78 98 50 98S4 78 4 50S22 2 50 2Z',
  pill:
    'M34 4H66Q96 4 96 34V66Q96 96 66 96H34Q4 96 4 66V34Q4 4 34 4Z',
  triangle:
    'M50 5L95 90Q97 95 92 95H8Q3 95 5 90Z',
  arrow:
    'M50 0L100 45Q100 52 94 52H68V92Q68 100 58 100H42Q32 100 32 92V52H6Q0 52 0 45Z',
  fan:
    'M50 8Q90 8 96 48Q100 78 70 96Q50 108 30 96Q0 78 4 48Q10 8 50 8Z',

  // --- Geometric ---
  diamond:
    'M50 2L96 50L50 98L4 50Z',
  clamshell:
    'M10 20Q10 4 26 4H74Q90 4 90 20V60Q90 96 50 96Q10 96 10 60Z',
  pentagon:
    'M50 2L97 36L79 96H21L3 36Z',
  gem:
    'M30 4H70L98 36L50 98L2 36Z',

  // --- Sunny/Cookie ---
  'very-sunny':
    'M50 0L58 20L78 6L72 28L96 22L82 42L100 50L82 58L96 78L72 72L78 94L58 80L50 100L42 80L22 94L28 72L4 78L18 58L0 50L18 42L4 22L28 28L22 6L42 20Z',
  sunny:
    'M50 4L60 24L80 10L74 32L98 28L84 48L100 50L84 52L98 72L74 68L80 90L60 76L50 96L40 76L20 90L26 68L2 72L16 52L0 50L16 48L2 28L26 32L20 10L40 24Z',
  '4-sided-cookie':
    'M50 2Q76 22 76 50Q76 78 50 98Q24 78 24 50Q24 22 50 2Z',
  '6-sided-cookie':
    'M50 2Q72 10 82 30Q92 52 80 74Q66 96 44 96Q22 96 10 74Q-2 52 10 30Q22 10 50 2Z',
  '7-sided-cookie':
    'M50 2Q70 6 84 22Q96 40 94 62Q90 82 74 94Q56 102 38 96Q20 88 10 70Q2 50 8 32Q18 10 50 2Z',
  '9-sided-cookie':
    'M50 2Q64 4 76 14Q86 26 92 42Q94 58 88 72Q78 86 64 94Q50 98 36 94Q22 86 12 72Q6 58 8 42Q14 26 24 14Q36 4 50 2Z',
  '12-sided-cookie':
    'M50 2L62 6L74 14L84 26L90 40L92 54L88 68L80 80L68 88L54 92L40 90L28 84L18 72L10 58L8 44L12 30L20 18L32 10L44 4Z',

  // --- Nature ---
  '4-leaf-clover':
    'M50 4Q70 4 70 26Q96 26 96 50Q96 74 70 74Q70 96 50 96Q30 96 30 74Q4 74 4 50Q4 26 30 26Q30 4 50 4Z',
  '8-leaf-clover':
    'M50 2Q60 16 72 8Q84 16 80 30Q96 32 92 46Q100 60 86 66Q92 80 78 84Q76 98 60 92Q52 100 42 92Q28 98 24 84Q10 80 16 66Q2 60 10 46Q6 32 22 30Q18 16 30 8Q42 16 50 2Z',
  burst:
    'M50 0L56 30L80 6L62 34L100 26L70 44L100 50L70 56L100 74L62 66L80 94L56 70L50 100L44 70L20 94L38 66L0 74L30 56L0 50L30 44L0 26L38 34L20 6L44 30Z',
  'soft-burst':
    'M50 4L58 28L78 8L66 32L96 24L76 44L98 50L76 56L96 76L66 68L78 92L58 72L50 96L42 72L22 92L34 68L4 76L24 56L2 50L24 44L4 24L34 32L22 8L42 28Z',
  boom:
    'M50 0L54 18L62 2L60 20L76 6L68 24L88 14L76 30L98 24L82 38L100 38L86 46L100 50L86 54L100 62L82 62L98 76L76 70L88 86L68 76L76 94L60 80L62 98L54 82L50 100L46 82L38 98L40 80L24 94L32 76L12 86L24 70L2 76L18 62L0 62L14 54L0 50L14 46L0 38L18 38L2 24L24 30L12 14L32 24L24 6L40 20L38 2L46 18Z',
  'soft-boom':
    'M50 4L56 22L68 6L64 26L82 14L74 32L94 24L82 40L100 36L86 48L100 50L86 52L100 64L82 60L94 76L74 68L82 86L64 74L68 94L56 78L50 96L44 78L32 94L36 74L18 86L26 68L6 76L18 60L0 64L14 52L0 50L14 48L0 36L18 40L6 24L26 32L18 14L36 26L32 6L44 22Z',
  flower:
    'M50 4Q62 18 72 10Q82 18 76 32Q90 30 88 44Q98 50 88 56Q90 70 76 68Q82 82 72 90Q62 82 50 96Q38 82 28 90Q18 82 24 68Q10 70 12 56Q2 50 12 44Q10 30 24 32Q18 18 28 10Q38 18 50 4Z',
  puffy:
    'M34 6Q50-4 66 6Q84 6 90 22Q104 34 96 50Q104 66 90 78Q84 94 66 94Q50 104 34 94Q16 94 10 78Q-4 66 4 50Q-4 34 10 22Q16 6 34 6Z',
  'puffy-diamond':
    'M50 2Q66 10 72 4Q86 12 84 28Q98 32 94 48Q100 64 86 70Q88 86 72 88Q62 98 48 94Q34 100 26 86Q12 88 8 72Q-2 62 6 48Q0 32 16 28Q14 12 28 4Q38 10 50 2Z',

  // --- Fun ---
  'ghost-ish':
    'M20 96V40Q20 4 50 4Q80 4 80 40V96L70 86L60 96L50 86L40 96L30 86Z',
  'pixel-circle':
    'M30 4H70V4H86V14H96V30H100V70H96V86H86V96H70V100H30V96H14V86H4V70H0V30H4V14H14V4H30Z',
  'pixel-triangle':
    'M42 4H58V18H70V32H82V46H94V60H100V100H0V60H6V46H18V32H30V18H42Z',
  bun:
    'M12 54Q-4 24 20 8Q44-6 68 8Q92 22 94 50Q96 72 76 88Q56 100 36 96Q14 90 12 54Z',
  heart:
    'M50 90C25 70 2 55 2 32Q2 10 24 6Q40 2 50 18Q60 2 76 6Q98 10 98 32Q98 55 75 70Z',
};

/**
 * Display labels for the named shapes, in the order a picker should show them.
 * Exported so consumers building a shape picker do not re-derive the order (or
 * the capitalisation) themselves.
 */
export const AVATAR_SHAPE_LABELS: { name: AvatarShapeName; label: string }[] = [
  { name: 'square', label: 'Square' },
  { name: 'slanted', label: 'Slanted' },
  { name: 'arch', label: 'Arch' },
  { name: 'semicircle', label: 'Semicircle' },
  { name: 'oval', label: 'Oval' },
  { name: 'pill', label: 'Pill' },
  { name: 'triangle', label: 'Triangle' },
  { name: 'arrow', label: 'Arrow' },
  { name: 'fan', label: 'Fan' },
  { name: 'diamond', label: 'Diamond' },
  { name: 'clamshell', label: 'Clamshell' },
  { name: 'pentagon', label: 'Pentagon' },
  { name: 'gem', label: 'Gem' },
  { name: 'very-sunny', label: 'Very Sunny' },
  { name: 'sunny', label: 'Sunny' },
  { name: '4-sided-cookie', label: '4-Sided Cookie' },
  { name: '6-sided-cookie', label: '6-Sided Cookie' },
  { name: '7-sided-cookie', label: '7-Sided Cookie' },
  { name: '9-sided-cookie', label: '9-Sided Cookie' },
  { name: '12-sided-cookie', label: '12-Sided Cookie' },
  { name: '4-leaf-clover', label: '4-Leaf Clover' },
  { name: '8-leaf-clover', label: '8-Leaf Clover' },
  { name: 'burst', label: 'Burst' },
  { name: 'soft-burst', label: 'Soft Burst' },
  { name: 'boom', label: 'Boom' },
  { name: 'soft-boom', label: 'Soft Boom' },
  { name: 'flower', label: 'Flower' },
  { name: 'puffy', label: 'Puffy' },
  { name: 'puffy-diamond', label: 'Puffy Diamond' },
  { name: 'ghost-ish', label: 'Ghost-ish' },
  { name: 'pixel-circle', label: 'Pixel Circle' },
  { name: 'pixel-triangle', label: 'Pixel Triangle' },
  { name: 'bun', label: 'Bun' },
  { name: 'heart', label: 'Heart' },
];
