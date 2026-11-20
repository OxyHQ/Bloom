import { StyleSheet } from 'react-native';
import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE, type TypeScaleFamily, type TypeScaleWeight } from '@oxy.so/bloom/typography';
import { sizes as BLOOM_ICON_SIZES } from '@oxy.so/bloom/icons/shared';
import { AVATAR_SIZES, type AvatarSizeToken } from '@oxy.so/bloom/avatar';
import type { ThemeColors } from '@oxy.so/bloom/theme';

/**
 * The token vocabulary of the language. Every modifier value is one of these
 * names. Each table reads Bloom's own scale by reference, so a rung cannot
 * exist here with a different number than it has in Bloom.
 */

// ── Space (padding, spacing, frame) ───────────────────────────────

const SPACE_SCALE = {
  none: 0,
  '2xs': tokens.space._2xs,
  xs: tokens.space.xs,
  sm: tokens.space.sm,
  md: tokens.space.md,
  lg: tokens.space.lg,
  xl: tokens.space.xl,
  '2xl': tokens.space._2xl,
  '3xl': tokens.space._3xl,
  '4xl': tokens.space._4xl,
  '5xl': tokens.space._5xl,
} as const;

export type SpaceName = keyof typeof SPACE_SCALE;
/** A space rung pulled outward. On padding it is SwiftUI's negative padding: the frame grows past its box. */
export type NegativeSpaceName = `-${SpaceName}`;

// ── Corner radius ────────────────────────────────────────────────

const CORNER_SCALE = {
  none: tokens.borderRadius.none,
  '2xs': tokens.borderRadius._2xs,
  xs: tokens.borderRadius.xs,
  sm: tokens.borderRadius.sm,
  md: tokens.borderRadius.md,
  lg: tokens.borderRadius.lg,
  xl: tokens.borderRadius.xl,
  '2xl': tokens.borderRadius._2xl,
  '3xl': tokens.borderRadius._3xl,
  full: tokens.borderRadius.full,
} as const;

export type CornerName = keyof typeof CORNER_SCALE;

// ── Type ─────────────────────────────────────────────────────────

/** Bloom's `fontSize` rungs: a size alone, the platform's own line height. */
const FONT_SIZE_SCALE = {
  '2xs': tokens.fontSize._2xs,
  xs: tokens.fontSize.xs,
  sm: tokens.fontSize.sm,
  md: tokens.fontSize.md,
  lg: tokens.fontSize.lg,
  xl: tokens.fontSize.xl,
  '2xl': tokens.fontSize._2xl,
  '3xl': tokens.fontSize._3xl,
  '4xl': tokens.fontSize._4xl,
  '5xl': tokens.fontSize._5xl,
} as const;

export type FontSizeName = keyof typeof FONT_SIZE_SCALE;
/**
 * A font is either a step of Bloom's type ramp (`body`, `headline`,
 * `caption-1`…: size, line height and tracking together, exactly as Bloom
 * `Text variant` sets them) or a bare size rung (`sm`, `md`…).
 */
export type FontName = TypeScaleFamily | FontSizeName;
export type WeightName = TypeScaleWeight;

const WEIGHTS: Record<WeightName, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/** Bloom's line-height multipliers. */
const LEADING_SCALE = tokens.lineHeight;
export type LeadingName = keyof typeof LEADING_SCALE;

// ── Icons and avatars ────────────────────────────────────────────

export type IconSizeName = keyof typeof BLOOM_ICON_SIZES;
export type AvatarSizeName = AvatarSizeToken;

// ── Colour ───────────────────────────────────────────────────────

/**
 * Colour roles, by their class-name spelling (`text-muted-foreground` is
 * `muted`), resolved against the theme's paint. Never a hex: the colour
 * engine owns every value.
 */
export const COLOR_ROLES = {
  foreground: 'text',
  muted: 'textSecondary',
  primary: 'primary',
  onPrimary: 'primaryForeground',
  secondary: 'secondary',
  onSecondary: 'secondaryForeground',
  tertiary: 'tertiary',
  onTertiary: 'tertiaryForeground',
  background: 'background',
  surface: 'backgroundSecondary',
  popover: 'backgroundTertiary',
  border: 'border',
  input: 'borderLight',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
} as const satisfies Record<string, keyof ThemeColors>;

export type ColorName = keyof typeof COLOR_ROLES;

// ── Other closed sets ────────────────────────────────────────────

export const OPACITY_SCALE = {
  transparent: 0,
  disabled: tokens.DISABLED_OPACITY,
  opaque: 1,
} as const;
export type OpacityName = keyof typeof OPACITY_SCALE;

/** `hairline` is the platform's hairline (`StyleSheet.hairlineWidth`), the width a row separator uses. */
export const BORDER_WIDTHS = { hairline: StyleSheet.hairlineWidth, thin: 1 } as const;
export type BorderWidthName = keyof typeof BORDER_WIDTHS;

export const HIT_SLOP_SCALE = tokens.hitSlop;
export type HitSlopName = keyof typeof HIT_SLOP_SCALE;

// ── App tokens ───────────────────────────────────────────────────

/** The scales an app may extend with named values of its own. */
export type AppTokenScale = 'space' | 'iconSize' | 'leading';

/**
 * A named value an app declares once, for a measurement Bloom's scales do not
 * have. It is still a name at every call site, never a number.
 */
export interface AppToken<S extends AppTokenScale = AppTokenScale> {
  readonly scale: S;
  readonly name: string;
  readonly value: number;
  /** Unique per declared token; what the style caches key on. */
  readonly key: string;
}

let nextAppToken = 0;

type AppTokenTable<T> = {
  readonly [S in keyof T & AppTokenScale]: { readonly [N in keyof T[S]]: AppToken<S> };
};

/**
 * Declares an app's own tokens, for values Bloom's scales lack:
 *
 * ```ts
 * export const postTokens = defineTokens({ space: { gutter: 64 }, iconSize: { context: 13 } });
 * HStack(...).padding('leading', postTokens.space.gutter)
 * ```
 */
export function defineTokens<T extends { [S in AppTokenScale]?: Record<string, number> }>(
  table: T,
): AppTokenTable<T> {
  const out: Record<string, Record<string, AppToken>> = {};
  for (const scale of Object.keys(table) as AppTokenScale[]) {
    const entries = table[scale] ?? {};
    const named: Record<string, AppToken> = {};
    for (const name of Object.keys(entries)) {
      nextAppToken += 1;
      named[name] = Object.freeze({
        scale,
        name,
        value: entries[name] as number,
        key: `@${nextAppToken}`,
      });
    }
    out[scale] = Object.freeze(named);
  }
  return Object.freeze(out) as unknown as AppTokenTable<T>;
}

export type SpaceToken = SpaceName | AppToken<'space'>;
export type PaddingToken = SpaceName | NegativeSpaceName | AppToken<'space'>;
export type IconSizeToken = IconSizeName | AppToken<'iconSize'>;
export type LeadingToken = LeadingName | AppToken<'leading'>;

// ── Resolution (pure; the renderer caches the results) ──────────

export function tokenKey(token: string | AppToken): string {
  return typeof token === 'string' ? token : token.key;
}

export function resolveSpace(token: PaddingToken): number {
  if (typeof token !== 'string') return token.value;
  if (token.startsWith('-')) return -SPACE_SCALE[token.slice(1) as SpaceName];
  return SPACE_SCALE[token as SpaceName];
}

export function resolveCorner(token: CornerName): number {
  return CORNER_SCALE[token];
}

export function resolveIconSize(token: IconSizeToken): number {
  return typeof token === 'string' ? BLOOM_ICON_SIZES[token] : token.value;
}

export function resolveAvatarSize(token: AvatarSizeName): number {
  return AVATAR_SIZES[token];
}

export function resolveColor(colors: ThemeColors, token: ColorName): string {
  return colors[COLOR_ROLES[token]];
}

export interface FontStyle {
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: '400' | '500' | '600' | '700';
}

function isFontSizeName(font: FontName): font is FontSizeName {
  return font in FONT_SIZE_SCALE;
}

/**
 * A text's type, from its font, weight and leading together. A ramp step
 * reads Bloom's `TYPE_SCALE` entry for that family and weight (the ramp's line
 * height can depend on the weight); a size rung sets the size, and the weight
 * and leading only when they are given.
 */
export function resolveFont(
  font: FontName | undefined,
  weight: WeightName | undefined,
  leading: LeadingToken | undefined,
): FontStyle {
  const style: FontStyle = {};
  if (font !== undefined && !isFontSizeName(font)) {
    const step = TYPE_SCALE[`${font}-${weight ?? 'regular'}`];
    style.fontSize = step.fontSize;
    style.lineHeight = step.lineHeight;
    style.letterSpacing = step.letterSpacing;
    style.fontWeight = step.fontWeight as FontStyle['fontWeight'];
  } else {
    if (font !== undefined) style.fontSize = FONT_SIZE_SCALE[font];
    if (weight !== undefined) style.fontWeight = WEIGHTS[weight];
  }
  if (leading !== undefined && style.fontSize !== undefined) {
    const ratio = typeof leading === 'string' ? LEADING_SCALE[leading] : leading.value;
    style.lineHeight = style.fontSize * ratio;
  }
  return style;
}
