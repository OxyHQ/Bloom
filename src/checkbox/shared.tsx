import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

import type { Theme } from '../theme/types';
import {
  ACCENT_TABLE,
  BUTTON_SHADOW,
  colorRamp,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { TypeScaleVariant } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type { WebCssStyle } from '../styles/web-view-style';
import type { CheckboxSize } from './types';

/**
 * The checkbox glyph — the box and its tick — shared by `Checkbox` and
 * `CheckboxCard` so the two stay identical.
 *
 *              small   medium   large
 *   box        14      16       20      radius 4, 1px border when unmarked
 *   label      body-2-medium  body-medium  headline-medium
 *   gap        6       8        8
 */
export const CHECKBOX_SIZE_CONFIG: Record<
  CheckboxSize,
  { box: number; gap: number; label: TypeScaleVariant; description: TypeScaleVariant }
> = {
  small: { box: 14, gap: 6, label: 'body-2-medium', description: 'body-2-regular' },
  medium: { box: 16, gap: 8, label: 'body-medium', description: 'body-regular' },
  large: { box: 20, gap: 8, label: 'headline-medium', description: 'body-regular' },
};

/** `rounded-sm` — Tailwind v4's 4px. */
const BOX_RADIUS = 4;

/** `transition-[background-color,border-color,box-shadow] duration-150`. */
const TRANSITION_MS = 150;

/** `animate-check-draw`. */
const CHECK_DRAW_MS = 200;
const CHECK_DRAW_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** The tick, in a 16-unit viewBox. */
const CHECK_PATH =
  'M4 7.7002L6.64645 10.3466C6.84171 10.5419 7.15829 10.5419 7.35355 10.3466L12 5.7002';
/** The indeterminate bar, same viewBox. */
const DASH_PATH = 'M4.5 8H8H11.5';
/**
 * `getTotalLength()` of {@link CHECK_PATH}, measured in Chrome (11.099). The
 * draw-in dashes the stroke by this length and slides it into place.
 */
const CHECK_PATH_LENGTH = 11.1;

/**
 * `ring-2 ring-border-focus-ring ring-offset-2`: a 2px accent ring
 * outside a 2px offset. Tailwind's `ring-offset-color` defaults to `#fff` and
 * it is never overridden, so the offset is white in BOTH modes — measured on the
 * rendered component, dark included.
 */
export const FOCUS_RING_OFFSET_COLOR = '#FFFFFF';

export interface CheckboxPaint {
  surface: string;
  border: string;
  borderHover: string;
  shadow: string;
  gradient: readonly [string, string];
  gradientHover: readonly [string, string];
  markedShadow: string;
  mark: string;
  ring: string;
  /** `text-primary` — the label. */
  text: string;
  /** `text-secondary` — a description. */
  description: string;
  /** `border-button-default` — `CheckboxCard`'s edge. */
  cardBorder: string;
  /** `background-primary-default` — `CheckboxCard` at rest. */
  cardBackground: string;
  /** `background-primary-hover` — `CheckboxCard` under a pointer. */
  cardBackgroundHover: string;
}

/**
 * Every colour the checkbox paints. Pure, so it can be walked over presets.
 * A caller `color` replaces the accent ramp; the mark on it falls back to white
 * because Bloom cannot know the contrast of an arbitrary colour.
 */
export function resolveCheckboxPaint(theme: Theme, color?: string): CheckboxPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const ramp = color ? colorRamp(color, ACCENT_TABLE) : accent;
  const dark = theme.isDark;
  return {
    surface: dark ? n[800] : theme.colors.card,
    border: dark ? n[700] : n[300],
    borderHover: dark ? n[500] : n[400],
    shadow: BUTTON_SHADOW[dark ? 'dark' : 'light'],
    gradient: [ramp[500], ramp[600]],
    gradientHover: [ramp[400], ramp[500]],
    markedShadow: `inset 0 2px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 0 1px ${ramp[500]}`,
    mark: color == null ? theme.colors.primaryForeground : '#FFFFFF',
    ring: ramp[500],
    text: theme.colors.text,
    description: n[500],
    cardBorder: dark ? n[700] : n[200],
    cardBackground: dark ? n[800] : theme.colors.card,
    // Dark `color-mix(in srgb, neutral-700 60%, transparent)` over the page.
    cardBackgroundHover: dark ? mixColor(theme.colors.background, n[700], 0.6) : n[100],
  };
}

const IS_WEB = Platform.OS === 'web';

/**
 * The web-only `dataSet` hook an adopted sheet's selectors hang off, as spread
 * props: react-native-web's channel to a `data-*` attribute (a class never
 * reaches the DOM here), and nothing on native.
 */
export function webDataSet(entries: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: entries } : {};
}

/**
 * A top-to-bottom gradient as a style: `background-image` on web (react-native-web
 * passes it straight through and drops `experimental_backgroundImage`), the
 * native CSS-gradient style elsewhere.
 */
function gradientStyle([top, bottom]: readonly [string, string]): WebCssStyle {
  const image = `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

// ---------------------------------------------------------------------------
//  Web stylesheet
//
//  react-native-web makes the row focusable and no inline style can carry a
//  `:focus-visible` rule. The hooks are `data-*` attributes through `dataSet` —
//  a class never reaches the DOM here (react-native-css consumes `className`
//  into `style`) — and `adoptStyleSheet` no-ops without a `document`, so the
//  file stays universal.
//
//  The focusable element is the row (or card), but the ring is drawn on the BOX
//  — so the row's own outline is suppressed and the ring is drawn on the glyph's ring
//  layer whenever its row has keyboard focus. The sheet also carries the box's
//  colour transitions and the check draw-in keyframes.
// ---------------------------------------------------------------------------

export const CHECKBOX_GLYPH_STYLE_ID = 'bloom-checkbox-glyph-web-css';
const GLYPH = '[data-bloom-checkbox-box]';
const RING = '[data-bloom-checkbox-ring]';
const FOCUSABLE = '[data-bloom-checkbox-focusable]';

export const CHECKBOX_GLYPH_CSS = `
${FOCUSABLE}:focus-visible {
  outline: none;
}
${FOCUSABLE}:focus-visible ${RING} {
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-checkbox-ring, currentColor);
}
${GLYPH} {
  transition: background-color ${TRANSITION_MS}ms ease, border-color ${TRANSITION_MS}ms ease, box-shadow ${TRANSITION_MS}ms ease;
}
@keyframes bloom-checkbox-draw {
  from { stroke-dashoffset: ${CHECK_PATH_LENGTH}; }
  to { stroke-dashoffset: 0; }
}
[data-bloom-checkbox-check] path {
  stroke-dasharray: ${CHECK_PATH_LENGTH};
  stroke-dashoffset: ${CHECK_PATH_LENGTH};
  animation: bloom-checkbox-draw ${CHECK_DRAW_MS}ms ${CHECK_DRAW_EASING} forwards;
}
@media (prefers-reduced-motion: reduce) {
${GLYPH} {
  transition: none;
}
[data-bloom-checkbox-check] path {
  animation: none;
  stroke-dashoffset: 0;
}
}`;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The tick. On web the adopted sheet draws it in; on native an `Animated`
 * dash offset does, since native has no stylesheet to carry a keyframe.
 */
function CheckMark({ size, color }: { size: number; color: string }) {
  const reducedMotion = useReducedMotion();
  const offset = useRef(new Animated.Value(IS_WEB || reducedMotion ? 0 : CHECK_PATH_LENGTH)).current;

  useEffect(() => {
    if (IS_WEB || reducedMotion) return;
    Animated.timing(offset, {
      toValue: 0,
      duration: CHECK_DRAW_MS,
      // `strokeDashoffset` is an SVG prop, which the native driver cannot animate.
      useNativeDriver: false,
    }).start();
  }, [offset, reducedMotion]);

  const svg = (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {IS_WEB ? (
        <Path
          d={CHECK_PATH}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <AnimatedPath
          d={CHECK_PATH}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_PATH_LENGTH}
          strokeDashoffset={offset}
        />
      )}
    </Svg>
  );

  return (
    <View
      pointerEvents="none"
      {...webDataSet({ bloomCheckboxCheck: '' })}
      style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}
    >
      {svg}
    </View>
  );
}

export interface CheckboxGlyphProps {
  size: CheckboxSize;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  /** Hover (web) or a held press (native) — the hovered paint. */
  highlighted: boolean;
  paint: CheckboxPaint;
  /** Vertical offset, to centre the box on a first line box. */
  marginTop?: number;
}

/**
 * The 16px (or 14 / 20px) box + tick / indeterminate bar.
 *
 *   unmarked   surface fill, 1px neutral-300 border (dark: neutral-800 fill,
 *              neutral-700 border), shadow-xs. Hover: border neutral-400
 *              (dark: neutral-500).
 *   marked     accent-500 → accent-600 gradient, inset 2px white/25% top
 *              highlight + inset 1px accent-500 edge, 2px rounded stroke.
 *              Hover: accent-400 → accent-500.
 *   disabled   the BOX at 50% opacity.
 *   focus      2px accent ring outside a 2px white offset, on the box.
 */
export function CheckboxGlyph({
  size,
  checked,
  indeterminate,
  disabled,
  highlighted,
  paint,
  marginTop = 0,
}: CheckboxGlyphProps) {
  const box = CHECKBOX_SIZE_CONFIG[size].box;
  const marked = checked || indeterminate;

  const boxStyle: WebCssStyle = marked
    ? {
        borderWidth: 0,
        backgroundColor: 'transparent',
        boxShadow: paint.markedShadow,
        ...gradientStyle(highlighted ? paint.gradientHover : paint.gradient),
      }
    : {
        borderWidth: 1,
        borderColor: highlighted ? paint.borderHover : paint.border,
        backgroundColor: paint.surface,
        boxShadow: paint.shadow,
      };

  return (
    // The ring layer: the same box, undimmed, so the ring the sheet draws on it
    // is not halved by the disabled opacity (a disabled row is not focusable,
    // but the two concerns stay on separate nodes).
    <View
      {...webDataSet({ bloomCheckboxRing: '' })}
      style={
        {
          width: box,
          height: box,
          borderRadius: BOX_RADIUS,
          flexShrink: 0,
          marginTop,
          '--bloom-checkbox-ring': paint.ring,
        } as WebCssStyle
      }
    >
      <View
        {...webDataSet({ bloomCheckboxBox: '' })}
        style={[
          {
            width: box,
            height: box,
            borderRadius: BOX_RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          },
          boxStyle,
        ]}
      >
        {indeterminate ? (
          <Svg width={box} height={box} viewBox="0 0 16 16" fill="none">
            <Path d={DASH_PATH} stroke={paint.mark} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        ) : checked ? (
          <CheckMark size={box} color={paint.mark} />
        ) : null}
      </View>
    </View>
  );
}

/** Line height of a size's label, to centre the box on its first line. */
export function checkboxLabelLineHeight(size: CheckboxSize): number {
  return TYPE_SCALE[CHECKBOX_SIZE_CONFIG[size].label].lineHeight;
}
