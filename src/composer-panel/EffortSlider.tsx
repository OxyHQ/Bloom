import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import type { ComposerPalette } from './shared';
import { dataHook, IS_WEB } from './web-hooks';

const TRACK_HEIGHT = 27;
const THUMB_WIDTH = 21;

interface EffortSliderProps {
  /** The chosen stop, or `null` for no choice yet. */
  value: number | null;
  onChange: (value: number) => void;
  levels: ReadonlyArray<string>;
  label: string;
  /** What `aria-valuetext` reads with no stop chosen (the "Auto" label). */
  unsetLabel: string;
  palette: ComposerPalette;
  testID?: string;
}

/**
 * `EffortSlider`: a 27px neutral track (radius 8)
 * with one 3×13 tick per stop, a fill up to the thumb's right edge, and a 21×27
 * bordered thumb (radius 7, shadow-xs) that travels edge to edge — its centre
 * runs from 10.5px to (width − 10.5)px, and the ticks sit on those centres. Stops
 * past the value fade their tick to 30% over 300ms; the fill follows the thumb
 * over 150ms.
 *
 * With `value` `null` nothing is committed: the fill is empty, every tick is
 * faded and the thumb is hollow and dashed, so "no stop chosen" cannot be read
 * as "the first stop". The first press or key commits a stop, and there is no
 * way back — the caller owns the `null`.
 *
 * Drag or press anywhere on the track (PanResponder on both platforms); on web
 * the thumb is focusable and answers the arrow keys, Home and End.
 *
 * A WebGL rocket-exhaust-shader flourish at the Max stop (over a canvas
 * starfield, with the ticks blown off the track) has no native counterpart,
 * so at Max the slider simply rests at its last stop.
 */
export function EffortSlider({ value, onChange, levels, label, unsetLabel, palette, testID }: EffortSliderProps) {
  const [width, setWidth] = useState(0);
  const max = Math.max(0, levels.length - 1);
  const chosen = value === null ? null : Math.min(Math.max(value, 0), max);
  const fraction = chosen !== null && max > 0 ? chosen / max : 0;
  const rail = Math.max(0, width - THUMB_WIDTH);

  const stateRef = useRef<{ value: number | null; rail: number; max: number; onChange: (next: number) => void }>({
    value: chosen,
    rail,
    max,
    onChange,
  });
  stateRef.current = { value: chosen, rail, max, onChange };
  const startRef = useRef(chosen ?? 0);

  const valueAt = useCallback((x: number) => {
    const s = stateRef.current;
    if (s.rail <= 0 || s.max <= 0) return s.value ?? 0;
    const f = Math.min(Math.max((x - THUMB_WIDTH / 2) / s.rail, 0), 1);
    return Math.round(f * s.max);
  }, []);

  const commit = useCallback((next: number) => {
    const s = stateRef.current;
    if (next !== s.value) s.onChange(next);
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          const next = valueAt(event.nativeEvent.locationX);
          startRef.current = next;
          commit(next);
        },
        onPanResponderMove: (_event, gesture) => {
          const s = stateRef.current;
          const startX = THUMB_WIDTH / 2 + (s.max > 0 ? startRef.current / s.max : 0) * s.rail;
          commit(valueAt(startX + gesture.dx));
        },
      }),
    [valueAt, commit],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const webThumb: Record<string, unknown> = IS_WEB
    ? {
        tabIndex: 0,
        onKeyDown: (event: { key: string; preventDefault: () => void }) => {
          const s = stateRef.current;
          // With nothing chosen, either arrow commits the first stop.
          const current = s.value;
          const next =
            event.key === 'ArrowRight' || event.key === 'ArrowUp'
              ? current === null
                ? 0
                : Math.min(s.max, current + 1)
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                ? current === null
                  ? 0
                  : Math.max(0, current - 1)
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? s.max
                    : null;
          if (next === null) return;
          event.preventDefault();
          commit(next);
        },
      }
    : {};

  const thumbStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: fraction * rail,
    width: THUMB_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: chosen === null ? 'dashed' : 'solid',
    borderColor: palette.thumbBorder,
    backgroundColor: chosen === null ? 'transparent' : palette.surface,
    boxShadow: chosen === null ? undefined : palette.shadowXs,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={chosen ?? undefined}
      aria-valuetext={chosen === null ? unsetLabel : levels[chosen]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') commit(chosen === null ? 0 : Math.min(max, chosen + 1));
        if (event.nativeEvent.actionName === 'decrement') commit(chosen === null ? 0 : Math.max(0, chosen - 1));
      }}
      style={{ width: '100%' }}>
      <View
        {...responder.panHandlers}
        onLayout={onLayout}
        style={{
          position: 'relative',
          width: '100%',
          height: TRACK_HEIGHT,
          overflow: 'hidden',
          borderRadius: 8,
          backgroundColor: palette.secondary,
          cursor: 'pointer',
        }}>
        <View
          pointerEvents="none"
          {...dataHook('bloomComposerFill')}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: chosen === null ? 0 : fraction * rail + THUMB_WIDTH,
            borderRadius: 8,
            backgroundColor: palette.tertiaryHover,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 9,
            right: 9,
            top: 7,
            height: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {levels.map((level, index) => (
            <View
              key={level}
              {...dataHook('bloomComposerTick')}
              style={{
                width: 3,
                height: 13,
                borderRadius: 2,
                backgroundColor: palette.iconTertiary,
                opacity: chosen === null || index > chosen ? 0.3 : 1,
              }}
            />
          ))}
        </View>
        <View pointerEvents="none" {...dataHook('bloomComposerThumb')} {...webThumb} style={thumbStyle} />
      </View>
    </View>
  );
}
