import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { clamp } from '../styles/clamp';
import { useTheme } from '../theme/use-theme';
import {
  IS_WEB,
  MEDIA_CONTROLS_CSS,
  MEDIA_CONTROLS_STYLE_ID,
  resolveMediaControlsPaint,
} from './shared';

/** Height of the pointer target. The drawn rail is centred in it. */
export const MEDIA_TRACK_HIT = 16;
export const MEDIA_TRACK_RAIL = 4;
export const MEDIA_TRACK_THUMB = 12;

/** The position under a pointer `x` px into a `width` px track, clamped to `0..max`. */
export function valueAtPosition(x: number, width: number, max: number): number {
  if (width <= 0 || max <= 0) return 0;
  return clamp(x / width, 0, 1) * max;
}

export interface MediaTrackProps {
  value: number;
  max: number;
  buffered?: number;
  /** While dragging. */
  onPreview?: (value: number) => void;
  /** On release, and on every key press / accessibility action. */
  onCommit?: (value: number) => void;
  step: number;
  disabled: boolean;
  accessibilityLabel: string;
  /** Announced value for a given position. */
  valueText: (value: number) => string;
  /** The position being dragged to, or `null` when the drag ends. */
  onDragChange?: (value: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The scrubber shared by `PlaybackProgress` and `VolumeControl`: a 4px pill
 * rail (neutral-200, dark neutral-700), an optional buffered segment
 * (neutral-300, dark neutral-500), and the fill — the text colour at rest,
 * the accent under the pointer, while dragging or with keyboard focus
 * (`:focus-visible`, in the adopted sheet, so a click leaves nothing lit). The
 * 12px thumb (text colour) only shows in those same states.
 *
 * Gestures use RN's `PanResponder` (native, and web through react-native-web).
 * The element is a `slider` (`accessibilityRole="adjustable"`) carrying flat
 * `aria-value*` props; on web it takes focus and answers arrows (±`step`),
 * Home and End; on native the `increment`/`decrement` actions.
 */
export function MediaTrack({
  value,
  max,
  buffered,
  onPreview,
  onCommit,
  step,
  disabled,
  accessibilityLabel,
  valueText,
  onDragChange,
  style,
  testID,
}: MediaTrackProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MEDIA_CONTROLS_STYLE_ID, MEDIA_CONTROLS_CSS);
  }, []);
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [width, setWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  const safeMax = max > 0 ? max : 0;
  const shown = clamp(dragValue ?? value, 0, safeMax);

  const stateRef = useRef({ width, max: safeMax, disabled, value: shown });
  stateRef.current = { width, max: safeMax, disabled, value: shown };
  const callbacksRef = useRef({ onPreview, onCommit, onDragChange });
  callbacksRef.current = { onPreview, onCommit, onDragChange };
  const dragRef = useRef({ startX: 0, current: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !stateRef.current.disabled && stateRef.current.max > 0,
        onMoveShouldSetPanResponder: () => !stateRef.current.disabled && stateRef.current.max > 0,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const s = stateRef.current;
          const x = e.nativeEvent.locationX;
          const next = valueAtPosition(x, s.width, s.max);
          dragRef.current = { startX: x, current: next };
          setDragValue(next);
          callbacksRef.current.onDragChange?.(next);
          callbacksRef.current.onPreview?.(next);
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          const s = stateRef.current;
          const next = valueAtPosition(dragRef.current.startX + g.dx, s.width, s.max);
          if (next === dragRef.current.current) return;
          dragRef.current.current = next;
          setDragValue(next);
          callbacksRef.current.onDragChange?.(next);
          callbacksRef.current.onPreview?.(next);
        },
        onPanResponderRelease: () => {
          setDragValue(null);
          callbacksRef.current.onDragChange?.(null);
          callbacksRef.current.onCommit?.(dragRef.current.current);
        },
        onPanResponderTerminate: () => {
          setDragValue(null);
          callbacksRef.current.onDragChange?.(null);
          callbacksRef.current.onCommit?.(dragRef.current.current);
        },
      }),
    [],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const stepBy = useCallback(
    (target: number) => {
      if (disabled || safeMax <= 0) return;
      const next = clamp(target, 0, safeMax);
      if (next !== value) onCommit?.(next);
    },
    [disabled, safeMax, value, onCommit],
  );

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') stepBy(value + step);
      else if (e.nativeEvent.actionName === 'decrement') stepBy(value - step);
    },
    [stepBy, value, step],
  );

  const webProps: Record<string, unknown> = IS_WEB
    ? {
        tabIndex: disabled ? -1 : 0,
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
        onKeyDown: (e: { key: string; preventDefault: () => void }) => {
          switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
              e.preventDefault();
              stepBy(value + step);
              break;
            case 'ArrowLeft':
            case 'ArrowDown':
              e.preventDefault();
              stepBy(value - step);
              break;
            case 'Home':
              e.preventDefault();
              stepBy(0);
              break;
            case 'End':
              e.preventDefault();
              stepBy(safeMax);
              break;
            default:
              break;
          }
        },
      }
    : {};

  const active = !disabled && (hovered || dragValue !== null);
  const fraction = safeMax > 0 ? shown / safeMax : 0;
  const bufferedFraction =
    buffered != null && safeMax > 0 ? clamp(buffered / safeMax, 0, 1) : 0;
  const railTop = (MEDIA_TRACK_HIT - MEDIA_TRACK_RAIL) / 2;

  const rootStyle: WebCssStyle = {
    position: 'relative',
    height: MEDIA_TRACK_HIT,
    minWidth: 0,
    opacity: disabled ? 0.5 : 1,
    '--bloom-media-ring': paint.ring,
    '--bloom-media-accent': paint.accent,
    ...(IS_WEB ? { touchAction: 'none' } : null),
  };

  return (
    <View
      {...panResponder.panHandlers}
      {...webProps}
      {...webDataSet({ bloomMediaFocusable: '', bloomMediaTrack: '' })}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={shown}
      aria-valuetext={valueText(shown)}
      aria-disabled={disabled || undefined}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      onLayout={onLayout}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: railTop,
          height: MEDIA_TRACK_RAIL,
          borderRadius: borderRadius.full,
          backgroundColor: paint.rail,
          overflow: 'hidden',
        }}
      >
        {bufferedFraction > 0 && (
          <View
            testID={testID ? `${testID}-buffered` : undefined}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${bufferedFraction * 100}%`,
              backgroundColor: paint.buffered,
            }}
          />
        )}
        <View
          testID={testID ? `${testID}-fill` : undefined}
          {...webDataSet({ bloomMediaFill: '' })}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fraction * 100}%`,
            borderRadius: borderRadius.full,
            backgroundColor: active ? paint.accent : paint.text,
          }}
        />
      </View>
      <View
        pointerEvents="none"
        {...webDataSet({ bloomMediaThumb: '' })}
        style={{
          position: 'absolute',
          top: (MEDIA_TRACK_HIT - MEDIA_TRACK_THUMB) / 2,
          left: `${fraction * 100}%`,
          marginLeft: -MEDIA_TRACK_THUMB / 2,
          width: MEDIA_TRACK_THUMB,
          height: MEDIA_TRACK_THUMB,
          borderRadius: borderRadius.full,
          backgroundColor: paint.text,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.24)',
          opacity: active ? 1 : 0,
        }}
      />
    </View>
  );
}
