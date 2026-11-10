import type { TypeScaleFamily, TypeScaleStyle, TypeScaleVariant, TypeScaleWeight } from './scale';
import { TYPE_SCALE } from './scale';

/**
 * Bloom's DESKTOP text styles: the one text system a desktop platform's chrome
 * is set in (`useDesktopPlatform()`: an OxyOS window or shell). A desktop is
 * read from arm's length with a pointer, so its body is 13px, not a phone's 14
 * or 15, and every size carries its own tracking: tighter through the body and
 * title sizes, a touch looser below 12 where the letters need the room.
 *
 * One style per ROLE, each with its size, line height and weight together, so a
 * menu row, a sidebar label, an alert's message and a form's caption never each
 * pick a size of their own:
 *
 * | Role          | Size/line | Weight   | Where                                    |
 * |---------------|-----------|----------|------------------------------------------|
 * | `large-title` | 26/32     | regular  | a window's one large heading             |
 * | `title-1`     | 22/26     | regular  | a page's title                           |
 * | `title-2`     | 17/22     | regular  | a section's title                        |
 * | `title-3`     | 15/20     | regular  | a group's title                          |
 * | `headline`    | 13/16     | bold     | an alert's title, a list's heading       |
 * | `body`        | 13/16     | regular  | everything a person reads: rows, labels  |
 * | `callout`     | 12/15     | regular  | a secondary line under a body line       |
 * | `subheadline` | 11/14     | regular  | a menu's group label, a field's caption  |
 * | `footnote`    | 10/13     | regular  | fine print                               |
 * | `caption-1`   | 10/13     | regular  | a chart's or an image's caption          |
 * | `caption-2`   | 10/13     | medium   | the same, emphasised                     |
 *
 * Set in Bloom's `sans` face. A desktop's chrome takes no display face: titles
 * are the sans at their own weight and tracking.
 */
export type DesktopTextStyle =
  | 'large-title'
  | 'title-1'
  | 'title-2'
  | 'title-3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption-1'
  | 'caption-2';

/**
 * Tracking by size, in px: a desktop's optical spacing for a UI sans. Read at
 * the exact size, else the nearest size below it; sizes past the table take its
 * last entry.
 */
export const DESKTOP_TRACKING: readonly (readonly [size: number, tracking: number])[] = [
  [10, 0.12],
  [11, 0.06],
  [12, 0],
  [13, -0.08],
  [14, -0.15],
  [15, -0.23],
  [16, -0.31],
  [17, -0.43],
  [18, -0.44],
  [20, -0.45],
  [22, -0.26],
  [24, 0.07],
  [26, 0.22],
  [28, 0.38],
];

/** {@link DESKTOP_TRACKING} at `fontSize`. */
export function desktopTracking(fontSize: number): number {
  let tracking = DESKTOP_TRACKING[0]![1];
  for (const [size, value] of DESKTOP_TRACKING) {
    if (size > fontSize) break;
    tracking = value;
  }
  return tracking;
}

function style(
  fontSize: number,
  lineHeight: number,
  fontWeight: TypeScaleStyle['fontWeight'],
): TypeScaleStyle {
  return { fontSize, lineHeight, letterSpacing: desktopTracking(fontSize), fontWeight };
}

/** The desktop text styles, one per role (see {@link DesktopTextStyle}). */
export const DESKTOP_TEXT_STYLES: Readonly<Record<DesktopTextStyle, TypeScaleStyle>> = {
  'large-title': style(26, 32, '400'),
  'title-1': style(22, 26, '400'),
  'title-2': style(17, 22, '400'),
  'title-3': style(15, 20, '400'),
  headline: style(13, 16, '700'),
  body: style(13, 16, '400'),
  callout: style(12, 15, '400'),
  subheadline: style(11, 14, '400'),
  footnote: style(10, 13, '400'),
  'caption-1': style(10, 13, '400'),
  'caption-2': style(10, 13, '500'),
};

/** One desktop text style. */
export function desktopTextStyle(role: DesktopTextStyle): TypeScaleStyle {
  return DESKTOP_TEXT_STYLES[role];
}

/**
 * Which desktop role each step of Bloom's ramp (`TYPE_SCALE`) is drawn as on a
 * desktop platform. The display steps (`large-title`, `display-*`) are a page's
 * hero and keep their size; every step a control or a list sets in moves onto
 * the desktop's roles, so `body` is 13px wherever a family asked for it. The
 * hierarchy is kept: a step never lands on the same size as the one below it.
 */
export const DESKTOP_ROLE_FOR_FAMILY: Readonly<Partial<Record<TypeScaleFamily, DesktopTextStyle>>> =
  {
    'title-1': 'title-1',
    'title-2': 'title-2',
    'title-3': 'title-3',
    headline: 'title-3',
    body: 'body',
    'body-2': 'callout',
    'caption-1': 'subheadline',
    'caption-2': 'footnote',
  };

const WEIGHT_VALUE: Record<TypeScaleWeight, TypeScaleStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

function desktopVariant(variant: TypeScaleVariant): TypeScaleStyle {
  const split = variant.lastIndexOf('-');
  const family = variant.slice(0, split) as TypeScaleFamily;
  const weight = variant.slice(split + 1) as TypeScaleWeight;
  const role = DESKTOP_ROLE_FOR_FAMILY[family];
  if (role === undefined) return TYPE_SCALE[variant];
  // The variant's own weight: `body-semibold` is the body role, semibold.
  return { ...DESKTOP_TEXT_STYLES[role], fontWeight: WEIGHT_VALUE[weight] };
}

/** Bloom's ramp as a desktop platform draws it, step for step. */
export const DESKTOP_TYPE_SCALE: Readonly<Record<TypeScaleVariant, TypeScaleStyle>> =
  Object.fromEntries(
    (Object.keys(TYPE_SCALE) as TypeScaleVariant[]).map((variant) => [
      variant,
      desktopVariant(variant),
    ]),
  ) as Record<TypeScaleVariant, TypeScaleStyle>;

/** One step of the ramp, as a desktop platform draws it when `desktop`, else as `TYPE_SCALE`. */
export function resolveTypeScale(variant: TypeScaleVariant, desktop: boolean): TypeScaleStyle {
  return desktop ? DESKTOP_TYPE_SCALE[variant] : TYPE_SCALE[variant];
}
