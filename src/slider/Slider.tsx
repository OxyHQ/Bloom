import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { withAlpha } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { Text } from '../typography';
import { borderRadius } from '../styles/tokens';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { BUTTON_SHADOW, mixColor, resolveButtonRamps } from '../button/shared';
import { FOCUS_RING_OFFSET_COLOR, webDataSet } from '../checkbox/shared';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import type { RangeSliderProps, SliderProps } from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function quantize(raw: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(raw, min, max);
  const steps = Math.round((raw - min) / step);
  const snapped = min + steps * step;
  // Avoid floating-point drift accumulating in the reported value.
  const decimals = (String(step).split('.')[1] ?? '').length;
  const rounded = decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
  return clamp(rounded, min, max);
}

/**
 * Bloom's slider (`Slider` and `RangeSlider`). Colours come from Bloom's
 * theme through the button recipe (`button/shared.ts` ramps).
 *
 *   track region   32 tall (plus 32 above it for the value bubble)
 *   rail           6 tall, full pill, neutral-200 (dark neutral-800) with an
 *                  inset 1px shade; hover neutral-300 (dark neutral-700)
 *   fill           accent-500 → accent-600 left-to-right, inset white/24% top
 *                  highlight and a 1px accent drop; between the two thumbs of
 *                  a range
 *   thumb          20, 1px neutral-200 (dark neutral-700) border, white, soft
 *                  2px drop + inset white top highlight, 8px accent-gradient dot
 *                  hover: border neutral-300 (dark neutral-500), `grab` cursor
 *                  drag:  border accent-500, accent-tinted 3px/8px drop, raised
 *                  focus: 2px accent ring outside a 2px white offset
 *   value bubble   28 tall, min 32 wide, px 8, radius 8, 1px border, surface
 *                  fill, caption-1-medium, shadow-xs, 8px arrow; lifts 2px with
 *                  the dropdown shadow (and the dot brightens) while the thumb
 *                  is dragged or focused
 *   label          body-medium, 8 above the track
 *   disabled       50% opacity, not-allowed cursor
 *
 * The thumb deliberately does not scale on hover (1.05) or drag (1.10): no
 * control scales on press.
 *
 * Universal: gestures use RN's `PanResponder` (React Native, and web through
 * react-native-web). On web every thumb is also focusable and answers arrow /
 * Home / End keys. A range's thumbs cannot pass each other.
 */

/** Track region (`h-8`). */
const TRACK_REGION = 32;
/** Space reserved above the track for the bubble (`mt-8`). */
const BUBBLE_SPACE = 32;
/** Gap from the thumb's padding box to the bubble's bottom edge (`calc(100% + 9px)`). */
const BUBBLE_OFFSET = 9;
const BUBBLE_HEIGHT = 28;
/** `-bottom-[4.5px]`: the arrow's bottom edge below the bubble's padding box. */
const ARROW_OVERHANG = 4.5;
const TRANSITION_MS = 150;

const IS_WEB = Platform.OS === 'web';

function gradientStyle(angle: number, top: string, bottom: string): WebCssStyle {
  const image = `linear-gradient(${angle}deg, ${top} 0%, ${bottom} 100%)`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

/** A `transition` on web; nothing on native, which has no CSS transitions. */
function webTransition(properties: string): WebCssStyle {
  return IS_WEB
    ? {
        transitionProperty: properties,
        transitionDuration: `${TRANSITION_MS}ms`,
        transitionTimingFunction: 'ease',
      }
    : {};
}

function resolveSliderPaint(theme: Theme) {
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    rail: theme.colors.backgroundSecondary,
    railHover: theme.colors.backgroundTertiary,
    fillTop: accent[500],
    fillBottom: accent[600],
    // accent-600 → accent-700 mix (`rgb(4 80 226 / 0.16)`).
    fillShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 1px 2px ${withAlpha(mixColor(accent[700], accent[600], 0.16), 0.16)}`,
    thumbBorder: theme.colors.borderLight,
    thumbBorderHover: theme.colors.border,
    thumbBorderDrag: accent[500],
    thumb: theme.colors.card,
    thumbShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    thumbShadowDrag: `0 3px 8px ${withAlpha(accent[600], 0.22)}`,
    surface: theme.colors.card,
    bubbleShadow: BUTTON_SHADOW[dark ? 'dark' : 'light'],
    bubbleShadowLifted: dark
      ? '0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 4px 4px 0 rgba(0, 0, 0, 0.1)'
      : '0 1px 1px 0 rgba(0, 0, 0, 0.04), 0 4px 4px 0 rgba(0, 0, 0, 0.02)',
    text: theme.colors.text,
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web — a `ring-2 ring-offset-2` on the thumb: a
//  white 2px offset (Tailwind's default offset colour, both modes) and a 2px
//  accent ring, composed with the thumb's own shadow. The thumb is a
//  react-native-web `View`, so the rule hangs off a `dataSet` attribute (a class
//  never reaches the DOM; see `chip/Chip.tsx`) and the colours arrive as
//  per-instance custom properties. `!important` because the resting shadow is
//  an inline style.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-slider-web-css';
const THUMB = '[data-bloom-slider-thumb]';
const BLOOM_SLIDER_CSS = `
${THUMB} {
  outline: none;
}
[data-bloom-slider][aria-disabled="true"],
[data-bloom-slider][aria-disabled="true"] * {
  cursor: not-allowed;
}
[data-bloom-slider-cursor="grab"] {
  cursor: grab;
}
[data-bloom-slider-cursor="grabbing"] {
  cursor: grabbing;
}
${THUMB}:focus-visible:not([data-bloom-slider-pointer="true"]) {
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-slider-ring, currentColor), var(--bloom-slider-shadow) !important;
}
@media (prefers-reduced-motion: reduce) {
${THUMB}, ${THUMB} * {
  transition: none !important;
}
}
`;

interface SliderBaseProps {
  values: number[];
  onValuesChange: (values: number[]) => void;
  onSlidingComplete?: (values: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  trackHeight: number;
  thumbSize: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  label?: string;
  showTooltip: boolean;
  formatValue?: (value: number, index: number) => string;
  /** One accessible name per thumb; only a range's thumbs carry their own. */
  thumbLabels: string[];
  style: SliderProps['style'];
  accessibilityLabel?: string;
  testID?: string;
}

function SliderBase({
  values,
  onValuesChange,
  onSlidingComplete,
  min,
  max,
  step,
  disabled,
  trackHeight,
  thumbSize,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  label,
  showTooltip,
  formatValue,
  thumbLabels,
  style,
  accessibilityLabel,
  testID,
}: SliderBaseProps) {
  const theme = useTheme();
  React.useEffect(() => {
    adoptStyleSheet(STYLE_ID, BLOOM_SLIDER_CSS);
  }, []);
  const paint = useMemo(() => resolveSliderPaint(theme), [theme]);
  const isRange = values.length > 1;
  const [trackWidth, setTrackWidth] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [trackHovered, setTrackHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // The thumb a press focused. Chrome matches `:focus-visible` on a scripted
  // focus that follows a pointer-down, but this follows React Aria's modality:
  // rings only keyboard focus, so the sheet skips a pointer-focused thumb until a key.
  const [pointerFocusIndex, setPointerFocusIndex] = useState<number | null>(null);
  const thumbRefs = useRef<Array<View | null>>([]);

  // Latest props captured in refs so the PanResponder (created once) always
  // reads current values without being re-created mid-gesture.
  const stateRef = useRef({ values, trackWidth, min, max, step, disabled });
  stateRef.current = { values, trackWidth, min, max, step, disabled };
  const callbacksRef = useRef({ onValuesChange, onSlidingComplete });
  callbacksRef.current = { onValuesChange, onSlidingComplete };
  const gestureRef = useRef({ index: 0, startValue: 0 });

  const range = max - min;
  const fractionOf = (v: number) => (range > 0 ? clamp((v - min) / range, 0, 1) : 0);

  /** Write `next` into thumb `index`, kept between its neighbours. */
  const withValue = useCallback((index: number, next: number): number[] => {
    const s = stateRef.current;
    const lower = index > 0 ? (s.values[index - 1] as number) : s.min;
    const upper = index < s.values.length - 1 ? (s.values[index + 1] as number) : s.max;
    const out = s.values.slice();
    out[index] = clamp(next, lower, upper);
    return out;
  }, []);

  const valueFromX = useCallback((x: number): number => {
    const s = stateRef.current;
    if (s.trackWidth <= 0) return s.values[0] ?? s.min;
    const f = clamp(x / s.trackWidth, 0, 1);
    return quantize(s.min + f * (s.max - s.min), s.min, s.max, s.step);
  }, []);

  const commit = useCallback((next: number[]) => {
    const current = stateRef.current.values;
    if (next.some((v, i) => v !== current[i])) callbacksRef.current.onValuesChange(next);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !stateRef.current.disabled,
        onMoveShouldSetPanResponder: () => !stateRef.current.disabled,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const s = stateRef.current;
          if (s.disabled) return;
          // Every visual inside the track region is `pointerEvents="none"`, so
          // `locationX` is always measured against the track region itself.
          const target = valueFromX(e.nativeEvent.locationX);
          // The nearest thumb takes the gesture; on a tie, the one the pointer
          // is past (so two stacked thumbs can still be pulled apart).
          let index = 0;
          let best = Infinity;
          s.values.forEach((v, i) => {
            const d = Math.abs(v - target);
            if (d < best || (d === best && target > v)) {
              best = d;
              index = i;
            }
          });
          const next = withValue(index, target);
          gestureRef.current = { index, startValue: next[index] as number };
          setDraggingIndex(index);
          // The thumb takes focus on press (matching React Aria's behaviour of
          // focusing its input), which is what keeps the bubble lifted after the drag ends.
          // Deferred: the pointer-down's own default action moves focus after
          // this handler runs, and would blur a thumb focused synchronously.
          if (IS_WEB) {
            setPointerFocusIndex(index);
            setTimeout(() => {
              (thumbRefs.current[index] as unknown as HTMLElement | null)?.focus?.({ preventScroll: true });
            }, 0);
          }
          commit(next);
        },
        onPanResponderMove: (
          _e: GestureResponderEvent,
          g: PanResponderGestureState,
        ) => {
          const s = stateRef.current;
          if (s.disabled) return;
          const { index, startValue } = gestureRef.current;
          const startFraction = s.max - s.min > 0 ? (startValue - s.min) / (s.max - s.min) : 0;
          commit(withValue(index, valueFromX(startFraction * s.trackWidth + g.dx)));
        },
        onPanResponderRelease: () => {
          setDraggingIndex(null);
          callbacksRef.current.onSlidingComplete?.(stateRef.current.values);
        },
        onPanResponderTerminate: () => {
          setDraggingIndex(null);
          callbacksRef.current.onSlidingComplete?.(stateRef.current.values);
        },
      }),
    [valueFromX, withValue, commit],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const onKeyStep = (index: number, delta: number, toEdge?: 'min' | 'max') => {
    if (disabled) return;
    const current = values[index] as number;
    const target =
      toEdge === 'min' ? min : toEdge === 'max' ? max : quantize(current + delta, min, max, step);
    const next = withValue(index, target);
    if (next[index] !== current) {
      onValuesChange(next);
      onSlidingComplete?.(next);
    }
  };

  const centers = values.map((v) => fractionOf(v) * trackWidth);

  // Web-only hover: the track region is the pointer target (everything drawn in
  // it is `pointerEvents="none"`), so thumb hover is a hit test against it.
  const webTrackProps: Record<string, unknown> =
    IS_WEB && !disabled
      ? {
          onPointerEnter: () => setTrackHovered(true),
          onPointerLeave: () => {
            setTrackHovered(false);
            setHoveredIndex(null);
          },
          onPointerMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
            const x = e.nativeEvent.offsetX ?? -1;
            const y = e.nativeEvent.offsetY ?? -1;
            const r = thumbSize / 2;
            const hit = centers.findIndex(
              (c) => Math.abs(x - c) <= r && Math.abs(y - TRACK_REGION / 2) <= r,
            );
            setHoveredIndex(hit === -1 ? null : hit);
          },
        }
      : {};

  const startFraction = isRange ? fractionOf(values[0] as number) : 0;
  const endFraction = fractionOf(values[values.length - 1] as number);
  const thumbBorderWidth = 1;
  // The thumb cursor (`cursor-grab active:cursor-grabbing`); the track
  // region is the hit target here, so it carries the cursor for the thumb —
  // through a `dataSet` hook, since RN's `cursor` type has no `grab`.
  const cursor = disabled
    ? undefined
    : draggingIndex !== null
      ? 'grabbing'
      : hoveredIndex !== null
        ? 'grab'
        : undefined;

  return (
    <View
      testID={testID}
      {...(isRange
        ? { accessibilityLabel: accessibilityLabel ?? label }
        : {
            accessibilityRole: 'adjustable' as const,
            accessibilityLabel: accessibilityLabel ?? label,
            // react-native-web reads the FLAT `aria-value*` props; it has no
            // handling for the `accessibilityValue` object at all, so this
            // rendered a `role="slider"` carrying no value whatsoever. React
            // Native folds these three back into `accessibilityValue`, and
            // `aria-disabled` into `accessibilityState`.
            'aria-valuemin': min,
            'aria-valuemax': max,
            'aria-valuenow': values[0],
          })}
      aria-disabled={disabled || undefined}
      {...webDataSet({ bloomSlider: '' })}
      style={[
        {
          width: '100%',
          minWidth: 0,
          flexDirection: 'column',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {label != null && (
        <Text
          variant="body-medium"
          style={{ color: paint.text }}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {label}
        </Text>
      )}

      <View
        {...panResponder.panHandlers}
        {...webTrackProps}
        {...webDataSet({ bloomSliderTrack: '', bloomSliderCursor: cursor ?? 'auto' })}
        onLayout={onLayout}
        style={{
          position: 'relative',
          width: '100%',
          height: TRACK_REGION,
          marginTop: showTooltip ? BUBBLE_SPACE : 0,
          ...(IS_WEB ? ({ touchAction: 'none' } as WebCssStyle) : null),
        }}
      >
        {/* Rail. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (TRACK_REGION - trackHeight) / 2,
            height: trackHeight,
            borderRadius: borderRadius.full,
            backgroundColor:
              maximumTrackTintColor ?? (trackHovered ? paint.railHover : paint.rail),
            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.06)',
            ...webTransition('background-color'),
          }}
        />
        {/* Selected range. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${startFraction * 100}%`,
            width: `${(endFraction - startFraction) * 100}%`,
            top: (TRACK_REGION - trackHeight) / 2,
            height: trackHeight,
            borderRadius: borderRadius.full,
            boxShadow: paint.fillShadow,
            ...(minimumTrackTintColor
              ? { backgroundColor: minimumTrackTintColor }
              : gradientStyle(90, paint.fillTop, paint.fillBottom)),
          }}
        />
        {values.map((value, index) => {
          const dragging = draggingIndex === index;
          const lifted = dragging || focusedIndex === index;
          const valueLabel = formatValue ? formatValue(value, index) : String(value);
          const shadow = dragging ? paint.thumbShadowDrag : paint.thumbShadow;

          // Web-only: keyboard handling and focus tracking for the focusable
          // thumb, and the `dataSet` hook its focus ring hangs off.
          const webThumbProps: Record<string, unknown> = IS_WEB
            ? {
                dataSet: {
                  bloomSliderThumb: '',
                  bloomSliderPointer: pointerFocusIndex === index ? 'true' : 'false',
                },
                tabIndex: disabled ? -1 : 0,
                onFocus: () => setFocusedIndex(index),
                onBlur: () => {
                  setFocusedIndex((f) => (f === index ? null : f));
                  setPointerFocusIndex((f) => (f === index ? null : f));
                },
                onKeyDown: (e: { key: string; preventDefault: () => void }) => {
                  setPointerFocusIndex(null);
                  switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowUp':
                      e.preventDefault();
                      onKeyStep(index, step);
                      break;
                    case 'ArrowLeft':
                    case 'ArrowDown':
                      e.preventDefault();
                      onKeyStep(index, -step);
                      break;
                    case 'Home':
                      e.preventDefault();
                      onKeyStep(index, 0, 'min');
                      break;
                    case 'End':
                      e.preventDefault();
                      onKeyStep(index, 0, 'max');
                      break;
                    default:
                      break;
                  }
                },
              }
            : {};

          const thumbStyle: WebCssStyle = {
            position: 'absolute',
            left: (centers[index] as number) - thumbSize / 2,
            top: (TRACK_REGION - thumbSize) / 2,
            width: thumbSize,
            height: thumbSize,
            borderRadius: borderRadius.full,
            borderWidth: thumbBorderWidth,
            borderColor: dragging
              ? paint.thumbBorderDrag
              : hoveredIndex === index
                ? paint.thumbBorderHover
                : paint.thumbBorder,
            backgroundColor: paint.thumb,
            boxShadow: shadow,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: dragging ? 20 : 1,
            '--bloom-slider-ring': paint.ring,
            '--bloom-slider-shadow': shadow,
            ...webTransition('box-shadow, border-color'),
          };

          return (
            <View
              key={index}
              ref={(node) => {
                thumbRefs.current[index] = node;
              }}
              pointerEvents="none"
              {...webThumbProps}
              {...(isRange
                ? {
                    accessibilityRole: 'adjustable' as const,
                    accessibilityLabel: thumbLabels[index] ?? `Value ${index + 1}`,
                    'aria-valuemin': index > 0 ? (values[index - 1] as number) : min,
                    'aria-valuemax': index < values.length - 1 ? (values[index + 1] as number) : max,
                    'aria-valuenow': value,
                    'aria-disabled': disabled || undefined,
                  }
                : {})}
              style={thumbStyle}
            >
              {showTooltip && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    // Wide enough to centre any bubble over the thumb without a
                    // measured translate.
                    left: -100,
                    right: -100,
                    bottom: thumbSize - 2 * thumbBorderWidth + BUBBLE_OFFSET,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      height: BUBBLE_HEIGHT,
                      minWidth: 32,
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: paint.thumbBorder,
                      backgroundColor: paint.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: lifted ? paint.bubbleShadowLifted : paint.bubbleShadow,
                      transform: [{ translateY: lifted ? -2 : 0 }],
                      ...webTransition('transform, box-shadow'),
                    }}
                  >
                    <Text
                      variant="caption-1-medium"
                      numberOfLines={1}
                      style={{ color: paint.text }}
                    >
                      {valueLabel}
                    </Text>
                    {/* The arrow: a bordered square turned 45°, half under the bubble. */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -ARROW_OVERHANG,
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRightWidth: 1,
                          borderBottomWidth: 1,
                          borderColor: paint.thumbBorder,
                          backgroundColor: paint.surface,
                          transform: [{ rotate: '45deg' }],
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: borderRadius.full,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.24)',
                  ...(thumbTintColor
                    ? { backgroundColor: thumbTintColor }
                    : gradientStyle(180, paint.fillTop, paint.fillBottom)),
                  ...(lifted ? { filter: 'brightness(1.1)' } : null),
                  ...webTransition('filter'),
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const SliderComponent = function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  size: sizeProp,
  tone: toneProp,
  trackHeight: trackHeightProp,
  thumbSize: thumbSizeProp,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  label,
  showTooltip = true,
  formatValue,
  style,
  accessibilityLabel,
  testID,
}: SliderProps) {
  const theme = useTheme();
  const {size, tone} = useBloomAppearance({size: sizeProp, tone: toneProp}, {size: 'md', tone: 'accent'});
  const geometry = {xs: [4, 14], sm: [4, 16], md: [6, 20], lg: [8, 24]} as const;
  const trackHeight = trackHeightProp ?? geometry[size][0];
  const thumbSize = thumbSizeProp ?? geometry[size][1];
  const toneColor = tone === 'accent' ? undefined : resolveBloomColors(theme.colors, tone, 'solid').background;
  useAccessibleNameWarning('Slider', accessibilityLabel ?? label);
  const values = useMemo(() => [value], [value]);
  const format = useMemo(
    () => (formatValue ? (v: number) => formatValue(v) : undefined),
    [formatValue],
  );
  return (
    <SliderBase
      values={values}
      onValuesChange={(next) => onValueChange(next[0] as number)}
      onSlidingComplete={onSlidingComplete ? (next) => onSlidingComplete(next[0] as number) : undefined}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      trackHeight={trackHeight}
      thumbSize={thumbSize}
      minimumTrackTintColor={minimumTrackTintColor ?? toneColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor ?? toneColor}
      label={label}
      showTooltip={showTooltip}
      formatValue={format}
      thumbLabels={[]}
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
};

export const Slider = memo(SliderComponent);
Slider.displayName = 'Slider';

const RangeSliderComponent = function RangeSlider({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  size: sizeProp,
  tone: toneProp,
  trackHeight: trackHeightProp,
  thumbSize: thumbSizeProp,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  label,
  showTooltip = true,
  formatValue,
  thumbLabels = ['Minimum', 'Maximum'],
  style,
  accessibilityLabel,
  testID,
}: RangeSliderProps) {
  const theme = useTheme();
  const {size, tone} = useBloomAppearance({size: sizeProp, tone: toneProp}, {size: 'md', tone: 'accent'});
  const geometry = {xs: [4, 14], sm: [4, 16], md: [6, 20], lg: [8, 24]} as const;
  const trackHeight = trackHeightProp ?? geometry[size][0];
  const thumbSize = thumbSizeProp ?? geometry[size][1];
  const toneColor = tone === 'accent' ? undefined : resolveBloomColors(theme.colors, tone, 'solid').background;
  const values = useMemo(() => [value[0], value[1]], [value]);
  return (
    <SliderBase
      values={values}
      onValuesChange={(next) => onValueChange([next[0] as number, next[1] as number])}
      onSlidingComplete={
        onSlidingComplete
          ? (next) => onSlidingComplete([next[0] as number, next[1] as number])
          : undefined
      }
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      trackHeight={trackHeight}
      thumbSize={thumbSize}
      minimumTrackTintColor={minimumTrackTintColor ?? toneColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor ?? toneColor}
      label={label}
      showTooltip={showTooltip}
      formatValue={formatValue}
      thumbLabels={thumbLabels}
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
};

export const RangeSlider = memo(RangeSliderComponent);
RangeSlider.displayName = 'RangeSlider';
