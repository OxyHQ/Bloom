import { StyleSheet } from 'react-native';
import type { MotionSpec } from '@oxy.so/bloom/motion';

import {
  ALIGNMENT,
  AVATAR_SIZE,
  BORDER_WIDTH,
  COLORS,
  CORNER,
  DURATION,
  ENVIRONMENT_DEFAULTS,
  ENUMS,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LENGTH,
  LEADING,
  LEADING_PX,
  OPACITY,
  SCALE,
  SHADOW,
  SHRINK,
  SPACE,
  TRACKING,
  TRACKING_PX,
  type TYPE_FAMILIES,
  TYPE_RAMP,
  WEIGHT,
  Z_INDEX,
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
/** A corner rung, or `concentric`: the radius of the shape it sits in, less the inset between them (Bloom `ConcentricView`). */
export type CornerName = keyof typeof CORNER | (typeof ENUMS.cornerExtra)[number];
/** A corner's curve, as Bloom's shapes draw it: `smooth` is the platform's continuous corner. */
export type CornerCurve = (typeof ENUMS.cornerCurve)[number];
/** Bloom `Divider`'s treatments: one hairline, two framing hairlines, a soft strip. */
export type DividerStyle = (typeof ENUMS.dividerStyle)[number];
/** How a grid places its cells once it has more than one column (Bloom `ResponsiveGrid`'s `flow`). */
export type GridFlow = (typeof ENUMS.gridFlow)[number];
/** Bloom's `fontSize` rungs: a size alone, the platform's own line height. */
export type FontSizeName = keyof typeof FONT_SIZE;
export type TypeFamily = (typeof TYPE_FAMILIES)[number];
/**
 * A font is either a step of Bloom's type ramp (`body`, `headline`,
 * `caption-1`…: size, line height and tracking together, exactly as Bloom
 * `Text variant` sets them) or a bare size rung (`sm`, `md`…).
 */
export type FontName = TypeFamily | FontSizeName | FontFamilyName;
/**
 * A family beside the size: `mono` is Bloom's monospaced face. It keeps the
 * size and weight the text has, as a size keeps the family.
 */
export type FontFamilyName = (typeof ENUMS.fontFamily)[number];
/** Letter spacing in em of the font size: Tailwind's `tracking-*`. */
export type TrackingName = keyof typeof TRACKING | keyof typeof TRACKING_PX;
export type WeightName = keyof typeof WEIGHT;
/** A line height: a named ratio of the size (Bloom's), or an exact one in px carried over from apps (`'28px'`). */
export type LeadingName = keyof typeof LEADING | keyof typeof LEADING_PX;
export type IconSizeName = keyof typeof ICON_SIZE;
export type AvatarSizeName = keyof typeof AVATAR_SIZE;
/**
 * Colour roles, by their class-name spelling (`text-muted-foreground` is
 * `muted`). Never a hex: native paints a role from the theme, the web from
 * the role's CSS variable, so the colour engine owns every value.
 */
export type ColorName = keyof typeof COLORS;
export type OpacityName = keyof typeof OPACITY;
/**
 * What a colour modifier takes: a role, or a role at an opacity token
 * (`'muted/70'` is `muted` at 70%): Tailwind's `/70`, from the spec's closed
 * set, never an arbitrary number.
 */
export type ColorToken = ColorName | `${ColorName}/${OpacityName}`;
/** What a view's background, foreground, border and ring paint with: a role (at an opacity), or an app's own colour. */
export type InkToken = ColorToken | AppToken<'color'>;
export type BorderWidthName = keyof typeof BORDER_WIDTH;
export type HitSlopName = keyof typeof HIT_SLOP;
export type ShrinkPriority = keyof typeof SHRINK;
export type Alignment = keyof typeof ALIGNMENT;
/** A frame's length relative to its parent: `full`, or a fraction (`1/2`, `1/3`…). */
export type LengthName = keyof typeof LENGTH;
/**
 * Bloom's stacking levels (`Z_INDEX`): `base`, `raised`, `floating`, `dropdown`;
 * or Tailwind's own `'20'`, `'30'`, `'50'`, each its value.
 */
export type ZIndexName = keyof typeof Z_INDEX;
/**
 * Bloom's elevation roles: `s` (cards, chips), `m` (menus, dialogs), `floating`
 * (a translucent pane); or one of Tailwind's own shadows, named by its exact
 * box-shadow (`'0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'` is `shadow-sm`).
 */
export type ShadowName = keyof typeof SHADOW;
/**
 * How much a view is scaled: Bloom's `dip` 0.7, `pressed` 0.98, `full` 1,
 * `swell` 1.2; or an exact factor from apps, in percent (`'105'` is 1.05).
 */
export type ScaleName = keyof typeof SCALE;
/** The corners a `corner()` rounds: all, a side's two, or one (`top-leading`…); leading and trailing follow the reading direction. */
export type CornerSide = (typeof ENUMS.cornerSide)[number];
/** Where a web line may break inside a word: `all` anywhere (`word-break: break-all`), `words` only a word too long for its line (`overflow-wrap: break-word`). */
export type WordBreak = (typeof ENUMS.wordBreak)[number];
/** The marker a web list draws before each of its rows: `disc` (Tailwind's `list-disc`) or `decimal`. */
export type ListMarker = (typeof ENUMS.listMarker)[number];
/** How a stack spreads its children along its axis. */
export type Justify = (typeof ENUMS.justify)[number];
export type Axis = (typeof ENUMS.axis)[number];
/**
 * When a variant (`when()`) holds: a breakpoint tier and up (`sm`…`2xl`), the
 * dark scheme, a state of the view (`hovered`, `focused`, `pressed`,
 * `disabled`) or a platform (`web`, `native`, `ios`, `android`).
 */
export type Condition = (typeof ENUMS.condition)[number];
/** Where an overlay or a view background sits in its view: SwiftUI's `Alignment`. */
export type OverlayAlignment = (typeof ENUMS.overlayAlignment)[number];
/** How much of a glass tint shows: a named transparency, never a number. */
export type GlassOpacityName = keyof typeof GLASS_OPACITY;
/** Bloom's motion durations (`animation.duration`): an image's cross-fade, by name. */
export type DurationName = keyof typeof DURATION;
export type Edge = (typeof ENUMS.edge)[number];
export type BorderEdge = (typeof ENUMS.borderEdge)[number];
export type Role = (typeof ENUMS.role)[number];
export type ButtonShape = (typeof ENUMS.buttonShape)[number];
/** A plain link button's ink (Bloom `Button`'s `linkTone`). */
export type ButtonLinkTone = (typeof ENUMS.linkTone)[number];
/** A control's geometry (Bloom's `BloomControlDensity`). */
export type ControlDensity = Exclude<(typeof ENUMS.density)[number], 'comfortable'>;
/** A list's row rhythm (Bloom's `BloomContentDensity`): the touch list, or a desktop form's. */
export type ContentDensity = Exclude<(typeof ENUMS.density)[number], 'default'>;
/** How an image fills its box: `BloomImage`'s `contentFit` vocabulary. */
export type ContentFit = (typeof ENUMS.contentFit)[number];
export type TitleDisplay = (typeof ENUMS.titleDisplay)[number];
export type ScrollEdge = (typeof ENUMS.scrollEdge)[number];
export type HeaderPresentation = (typeof ENUMS.headerPresentation)[number];
export type ScreenKind = (typeof ENUMS.screenKind)[number];
export type ScreenScroll = (typeof ENUMS.screenScroll)[number];
export type ChromePlacement = (typeof ENUMS.chromePlacement)[number];
export type NavigationScope = (typeof ENUMS.navigationScope)[number];
/** One of Bloom's colour presets (`AppColorName`), a screen's own recipe. */
export type ColorPreset = (typeof ENUMS.colorPreset)[number];
export type ActionPlacement = (typeof ENUMS.actionPlacement)[number];
export type ScrollIndicators = (typeof ENUMS.scrollIndicators)[number];
export type KeyboardDismiss = (typeof ENUMS.keyboardDismiss)[number];
export type KeyboardTaps = (typeof ENUMS.keyboardTaps)[number];
export type ScrollbarVisibility = (typeof ENUMS.scrollbarVisibility)[number];
export type ScrollbarSide = (typeof ENUMS.scrollbarSide)[number];
export type ScrollbarSize = (typeof ENUMS.scrollbarSize)[number];
export type ScrollSurfaceStyle = (typeof ENUMS.scrollSurfaceStyle)[number];
export type ResizeHandleStyle = (typeof ENUMS.resizeHandleStyle)[number];
export type ModePresentation = (typeof ENUMS.modePresentation)[number];
export type TeamPlacement = (typeof ENUMS.teamPlacement)[number];
export type DragIndicator = (typeof ENUMS.dragIndicator)[number];
export type SheetMaterial = (typeof ENUMS.sheetMaterial)[number];
export type SheetSizing = (typeof ENUMS.sheetSizing)[number];
export type SidebarVariant = (typeof ENUMS.sidebarVariant)[number];
export type SidebarSurface = (typeof ENUMS.sidebarSurface)[number];
export type SidebarSize = (typeof ENUMS.sidebarSize)[number];
export type FooterPinning = (typeof ENUMS.footerPinning)[number];
export type SettingsView = (typeof ENUMS.settingsView)[number];
export type ShellLayout = (typeof ENUMS.shellLayout)[number];
export type ShellPresentation = (typeof ENUMS.shellPresentation)[number];
export type PanelRole = (typeof ENUMS.panelRole)[number];
/** Bloom's typography components, as a text's style: `h1` is Bloom `H1`, `lead` is `Lead`… */
export type TextStyleName = (typeof ENUMS.textStyle)[number];
/** Where a text that does not fit its lines is cut (React Native's `ellipsizeMode`). */
export type Truncation = (typeof ENUMS.truncation)[number];
/** How a text's lines align: `start` and `end` follow the reading direction. */
export type TextAlignment = (typeof ENUMS.textAlign)[number];
export type TextCase = (typeof ENUMS.textCase)[number];
/** Bloom's silhouettes (`shapes`): `circle`, `squircle` and the named shapes. */
export type ShapeName = (typeof ENUMS.shapeName)[number];
/** The initials disc's tint (Bloom `Avatar`'s `color`). */
export type AvatarColor = (typeof ENUMS.avatarColor)[number];
/** A presence dot's state (Bloom `PresenceDot`). */
export type Presence = (typeof ENUMS.presence)[number];
export type AvatarLayout = (typeof ENUMS.avatarLayout)[number];
export type AvatarOverflow = (typeof ENUMS.avatarOverflow)[number];
/** How loudly a badge paints (Bloom `Badge`'s `variant`); `onMedia` reads over a photograph. */
export type BadgeStyle = (typeof ENUMS.badgeStyle)[number];
/** Bloom's badge rungs: the counters (`xs`…`lg`) and the labels (`label-small`, `label-medium`). */
export type BadgeSize = (typeof ENUMS.badgeSize)[number];
export type BadgePlacement = (typeof ENUMS.badgePlacement)[number];
/** Bloom `Loading`'s presentations: a spinner, the bar at the top, a line beside its text. */
export type LoadingStyle = (typeof ENUMS.loadingStyle)[number];
export type RatingSize = (typeof ENUMS.ratingSize)[number];
export type RatingStyle = (typeof ENUMS.ratingStyle)[number];
export type RatingCountStyle = (typeof ENUMS.ratingCountStyle)[number];
export type RatingInputSize = (typeof ENUMS.ratingInputSize)[number];
export type MeterCap = (typeof ENUMS.meterCap)[number];
export type TableSize = (typeof ENUMS.tableSize)[number];
export type TableAlign = (typeof ENUMS.tableAlign)[number];
export type TableSort = (typeof ENUMS.tableSort)[number];
export type ListSeparator = (typeof ENUMS.listSeparator)[number];
export type ArrowsPlacement = (typeof ENUMS.arrowsPlacement)[number];
export type ArrowsVisibility = (typeof ENUMS.arrowsVisibility)[number];
export type CarouselAlign = (typeof ENUMS.carouselAlign)[number];
export type DotsShape = (typeof ENUMS.dotsShape)[number];
export type DotsStyle = (typeof ENUMS.dotsStyle)[number];
export type MarkdownSize = (typeof ENUMS.markdownSize)[number];
export type CodeLinesSize = (typeof ENUMS.codeLinesSize)[number];
export type StepperSize = (typeof ENUMS.stepperSize)[number];
export type StepperStyle = (typeof ENUMS.stepperStyle)[number];
export type TooltipSide = (typeof ENUMS.tooltipSide)[number];
export type TooltipSize = (typeof ENUMS.tooltipSize)[number];
export type OtpCharacters = (typeof ENUMS.otpCharacters)[number];
/** A table column's width: a space rung, or `fit` to hug its content. */
export type ColumnWidthToken = SpaceToken | (typeof ENUMS.columnWidthExtra)[number];
/** How an agent's character feels: Bloom `AgentAvatar`'s moods. */
export type AgentMood = (typeof ENUMS.agentMood)[number];
export type ChatBackgroundStyle = (typeof ENUMS.chatBackgroundStyle)[number];
export type ChatDateHeaderStyle = (typeof ENUMS.chatDateHeaderStyle)[number];
export type ChatInfoPanelStyle = (typeof ENUMS.chatInfoPanelStyle)[number];
export type ChatStatusTone = (typeof ENUMS.chatStatusTone)[number];
export type MessageTone = (typeof ENUMS.messageTone)[number];
export type FileMessageStyle = (typeof ENUMS.fileMessageStyle)[number];
export type VideoMessageStyle = (typeof ENUMS.videoMessageStyle)[number];
export type AgentThinkingStyle = (typeof ENUMS.agentThinkingStyle)[number];
export type AgentThinkingTone = (typeof ENUMS.agentThinkingTone)[number];
export type PlayButtonSize = (typeof ENUMS.playButtonSize)[number];
export type PlayButtonStyle = (typeof ENUMS.playButtonStyle)[number];
export type PlaybackTimes = (typeof ENUMS.playbackTimes)[number];
export type StatCardsVariant = (typeof ENUMS.statCardsVariant)[number];
export type AiChatLineTone = (typeof ENUMS.aiChatLineTone)[number];
export type AreaVariant = (typeof ENUMS.areaVariant)[number];
export type ChartShape = (typeof ENUMS.chartShape)[number];
export type RadarVariant = (typeof ENUMS.radarVariant)[number];
export type SparklineTone = (typeof ENUMS.sparklineTone)[number];
export type ComposerButtonTone = (typeof ENUMS.composerButtonTone)[number];
export type AttachmentLayout = (typeof ENUMS.attachmentLayout)[number];
export type ReactionPickerSize = (typeof ENUMS.reactionPickerSize)[number];

export {
  COLORS,
  DURATION,
  GLASS_OPACITY,
  HIT_SLOP,
  LENGTH,
  OPACITY,
  SCALE,
  SHADOW,
  SHRINK,
  ALIGNMENT,
  Z_INDEX,
};

/** `hairline` is the platform's hairline (`StyleSheet.hairlineWidth`), the width a row separator uses. */
export function resolveBorderWidth(width: BorderWidthName): number {
  const value = BORDER_WIDTH[width];
  return value === 'hairline' ? StyleSheet.hairlineWidth : value;
}

// ── App tokens ───────────────────────────────────────────────────

/** The scales an app may extend with named values of its own. */
export type AppTokenScale = 'space' | 'iconSize' | 'avatarSize' | 'leading' | 'motion' | 'color';

/**
 * What a token of each scale holds: a number; for `motion` a Bloom `MotionSpec`;
 * for `color` a hex colour (`#1877f2`, `#1877f2cc`), the same in both schemes: an
 * app's brand colour, which no Bloom role is.
 */
type AppTokenValue<S extends AppTokenScale> = S extends 'motion'
  ? MotionSpec
  : S extends 'color'
    ? `#${string}`
    : number;

/** A scale's tokens as `defineTokens` returns them: a motion is its `MotionSpec`, anything else an `AppToken`. */
type AppTokenOf<S extends AppTokenScale> = S extends 'motion' ? MotionSpec : AppToken<S>;

/**
 * A named value an app declares once, for a measurement Bloom's scales do not
 * have. It is still a name at every call site, never a number.
 */
export interface AppToken<S extends AppTokenScale = AppTokenScale> {
  readonly scale: S;
  readonly name: string;
  readonly value: AppTokenValue<S>;
  /** Unique per declared token; what the style caches key on. */
  readonly key: string;
}

let nextAppToken = 0;

type AppTokenTable<T> = {
  readonly [S in keyof T & AppTokenScale]: { readonly [N in keyof T[S]]: AppTokenOf<S> };
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
export function defineTokens<T extends { [S in AppTokenScale]?: Record<string, AppTokenValue<S>> }>(
  table: T,
): AppTokenTable<T> {
  const out: Record<string, Record<string, AppToken>> = {};
  for (const scale of Object.keys(table) as AppTokenScale[]) {
    const entries = table[scale] ?? {};
    const named: Record<string, AppToken> = {};
    for (const name of Object.keys(entries)) {
      if (scale === 'motion') {
        // A motion token is the Bloom MotionSpec itself, so it plays wherever one does.
        named[name] = Object.freeze({ ...(entries[name] as MotionSpec) }) as unknown as AppToken;
        continue;
      }
      if (
        scale === 'color' &&
        !/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(entries[name]))
      )
        throw new Error(`[Bloom language] defineTokens: color.${name} is not a hex colour`);
      nextAppToken += 1;
      named[name] = Object.freeze({
        scale,
        name,
        value: entries[name] as AppTokenValue<AppTokenScale>,
        key: `@${nextAppToken}`,
      });
    }
    out[scale] = Object.freeze(named);
  }
  return Object.freeze(out) as unknown as AppTokenTable<T>;
}

export type SpaceToken = SpaceName | AppToken<'space'>;
/** A frame's length: a space rung or an app's own, or a length relative to the parent. */
export type LengthToken = SpaceToken | LengthName;
export type PaddingToken = SpaceName | NegativeSpaceName | AppToken<'space'>;
export type IconSizeToken = IconSizeName | AppToken<'iconSize'>;
/** An avatar rung, or an app's own diameter (Bloom's avatar takes any; it is 40 with none). */
export type AvatarSizeToken = AvatarSizeName | AppToken<'avatarSize'>;
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

/** A frame length: a relative length is its percentage; anything else a space. */
export function resolveLength(token: LengthToken): number | string {
  if (typeof token === 'string' && token in LENGTH) return LENGTH[token as LengthName];
  return resolveSpace(token as SpaceToken);
}

/** A rung's radius; `concentric` has none of its own (its shape's radius, drawn by Bloom). */
export function resolveCorner(token: Exclude<CornerName, 'concentric'>): number {
  return CORNER[token];
}

export function resolveIconSize(token: IconSizeToken): number {
  return typeof token === 'string' ? ICON_SIZE[token] : token.value;
}

export function resolveAvatarSize(token: AvatarSizeToken): number {
  return typeof token === 'string' ? AVATAR_SIZE[token] : token.value;
}

/** The ramp step of a family at a weight: that weight's step, else the regular one. */
export function rampStep(font: TypeFamily, weight: WeightName | undefined): keyof typeof TYPE_RAMP {
  const step = `${font}-${weight ?? ENVIRONMENT_DEFAULTS.rampWeight}`;
  return (step in TYPE_RAMP ? step : `${font}-regular`) as keyof typeof TYPE_RAMP;
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

/** Whether a font names a family (`mono`), which sets the face and not the size. */
export function isFontFamily(font: FontName): font is FontFamilyName {
  return (ENUMS.fontFamily as readonly string[]).includes(font);
}

/**
 * A text's type, from its font, weight and leading together. A ramp step
 * reads Bloom's ramp entry for that family and weight (the ramp's line height
 * can depend on the weight); a size rung sets the size, and the weight and
 * leading only when they are given.
 */
export function resolveFont(
  font: Exclude<FontName, FontFamilyName> | undefined,
  weight: WeightName | undefined,
  leading: LeadingToken | undefined,
  tracking?: TrackingName,
): FontStyle {
  const style: FontStyle = {};
  if (font !== undefined && !isFontSizeName(font)) {
    // A weight the ramp has no step for (`light`, `extrabold`) is the regular step at that weight.
    const stepped = rampStep(font, weight);
    const [fontSize, lineHeight, letterSpacing, fontWeight] = TYPE_RAMP[stepped];
    style.fontSize = fontSize;
    style.lineHeight = lineHeight;
    style.letterSpacing = letterSpacing;
    style.fontWeight =
      weight !== undefined && !stepped.endsWith(`-${weight}`) ? WEIGHT[weight] : fontWeight;
  } else {
    if (font !== undefined) style.fontSize = FONT_SIZE[font];
    if (weight !== undefined) style.fontWeight = WEIGHT[weight];
  }
  // Both measure from the size: the font's, else Bloom's `Text` with no variant (its size is not written).
  const size = style.fontSize ?? ENVIRONMENT_DEFAULTS.fontSize;
  if (leading !== undefined) {
    if (typeof leading !== 'string') style.lineHeight = size * leading.value;
    else if (leading in LEADING_PX)
      style.lineHeight = LEADING_PX[leading as keyof typeof LEADING_PX];
    else style.lineHeight = size * LEADING[leading as keyof typeof LEADING];
  }
  if (tracking !== undefined)
    style.letterSpacing =
      tracking in TRACKING_PX
        ? TRACKING_PX[tracking as keyof typeof TRACKING_PX]
        : size * TRACKING[tracking as keyof typeof TRACKING];
  return style;
}
