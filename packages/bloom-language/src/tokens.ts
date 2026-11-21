import { StyleSheet } from 'react-native';

import {
  ALIGNMENT,
  AVATAR_SIZE,
  BORDER_WIDTH,
  COLORS,
  CORNER,
  DURATION,
  ENVIRONMENT_DEFAULTS,
  type ENUMS,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LEADING,
  OPACITY,
  SHRINK,
  SPACE,
  type TYPE_FAMILIES,
  TYPE_RAMP,
  WEIGHT,
} from './generated/spec.generated';

/**
 * The token vocabulary of the language. Every modifier value is one of these
 * names. The tables are generated from `spec/language.json`, the one spec the
 * compiler's tables come from too, and `spec.test.ts` holds every rung equal
 * to Bloom's own.
 */

export type SpaceName = keyof typeof SPACE;
/** A space rung pulled outward. On padding it is SwiftUI's negative padding: the frame grows past its box. */
export type NegativeSpaceName = `-${SpaceName}`;
export type CornerName = keyof typeof CORNER;
/** Bloom's `fontSize` rungs: a size alone, the platform's own line height. */
export type FontSizeName = keyof typeof FONT_SIZE;
export type TypeFamily = (typeof TYPE_FAMILIES)[number];
/**
 * A font is either a step of Bloom's type ramp (`body`, `headline`,
 * `caption-1`…: size, line height and tracking together, exactly as Bloom
 * `Text variant` sets them) or a bare size rung (`sm`, `md`…).
 */
export type FontName = TypeFamily | FontSizeName;
export type WeightName = keyof typeof WEIGHT;
export type LeadingName = keyof typeof LEADING;
export type IconSizeName = keyof typeof ICON_SIZE;
export type AvatarSizeName = keyof typeof AVATAR_SIZE;
/**
 * Colour roles, by their class-name spelling (`text-muted-foreground` is
 * `muted`). Never a hex: native paints a role from the theme, the web from
 * the role's CSS variable, so the colour engine owns every value.
 */
export type ColorName = keyof typeof COLORS;
export type OpacityName = keyof typeof OPACITY;
export type BorderWidthName = keyof typeof BORDER_WIDTH;
export type HitSlopName = keyof typeof HIT_SLOP;
export type ShrinkPriority = keyof typeof SHRINK;
export type Alignment = keyof typeof ALIGNMENT;
/** How much of a glass tint shows: a named transparency, never a number. */
export type GlassOpacityName = keyof typeof GLASS_OPACITY;
/** Bloom's motion durations (`animation.duration`): an image's cross-fade, by name. */
export type DurationName = keyof typeof DURATION;
export type Edge = (typeof ENUMS.edge)[number];
export type BorderEdge = (typeof ENUMS.borderEdge)[number];
export type Role = (typeof ENUMS.role)[number];
export type ButtonShape = (typeof ENUMS.buttonShape)[number];
/** How an image fills its box: `BloomImage`'s `contentFit` vocabulary. */
export type ContentFit = (typeof ENUMS.contentFit)[number];
export type TitleDisplay = (typeof ENUMS.titleDisplay)[number];
export type ScrollEdge = (typeof ENUMS.scrollEdge)[number];
export type HeaderPresentation = (typeof ENUMS.headerPresentation)[number];
/** Bloom's typography components, as a text's style: `h1` is Bloom `H1`, `lead` is `Lead`… */
export type TextStyleName = (typeof ENUMS.textStyle)[number];
/** Where a text that does not fit its lines is cut (React Native's `ellipsizeMode`). */
export type Truncation = (typeof ENUMS.truncation)[number];
/** How a text's lines align: `start` and `end` follow the reading direction. */
export type TextAlignment = (typeof ENUMS.textAlign)[number];
export type TextCase = (typeof ENUMS.textCase)[number];

export { COLORS, DURATION, GLASS_OPACITY, HIT_SLOP, OPACITY, SHRINK, ALIGNMENT };

/** `hairline` is the platform's hairline (`StyleSheet.hairlineWidth`), the width a row separator uses. */
export function resolveBorderWidth(width: BorderWidthName): number {
  const value = BORDER_WIDTH[width];
  return value === 'hairline' ? StyleSheet.hairlineWidth : value;
}

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
 *
 * The table is frozen, so a chain that reads it is as static as one that
 * names a Bloom rung (the compiler hoists both).
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
  if (token.startsWith('-')) return -SPACE[token.slice(1) as SpaceName];
  return SPACE[token as SpaceName];
}

export function resolveCorner(token: CornerName): number {
  return CORNER[token];
}

export function resolveIconSize(token: IconSizeToken): number {
  return typeof token === 'string' ? ICON_SIZE[token] : token.value;
}

export function resolveAvatarSize(token: AvatarSizeName): number {
  return AVATAR_SIZE[token];
}

export interface FontStyle {
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: string;
}

function isFontSizeName(font: FontName): font is FontSizeName {
  return font in FONT_SIZE;
}

/**
 * A text's type, from its font, weight and leading together. A ramp step
 * reads Bloom's ramp entry for that family and weight (the ramp's line height
 * can depend on the weight); a size rung sets the size, and the weight and
 * leading only when they are given.
 */
export function resolveFont(
  font: FontName | undefined,
  weight: WeightName | undefined,
  leading: LeadingToken | undefined,
): FontStyle {
  const style: FontStyle = {};
  if (font !== undefined && !isFontSizeName(font)) {
    const [fontSize, lineHeight, letterSpacing, fontWeight] =
      TYPE_RAMP[`${font}-${weight ?? ENVIRONMENT_DEFAULTS.rampWeight}`];
    style.fontSize = fontSize;
    style.lineHeight = lineHeight;
    style.letterSpacing = letterSpacing;
    style.fontWeight = fontWeight;
  } else {
    if (font !== undefined) style.fontSize = FONT_SIZE[font];
    if (weight !== undefined) style.fontWeight = WEIGHT[weight];
  }
  if (leading !== undefined && style.fontSize !== undefined) {
    const ratio = typeof leading === 'string' ? LEADING[leading] : leading.value;
    style.lineHeight = style.fontSize * ratio;
  }
  return style;
}
