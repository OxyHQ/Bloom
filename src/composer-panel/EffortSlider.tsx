import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import type { ComposerPalette } from './shared';
import { dataHook, IS_WEB } from './web-hooks';

const TRACK_HEIGHT = 27;
const THUMB_WIDTH = 21;

interface EffortSliderProps {
  value: number;
  onChange: (value: number) => void;
  levels: ReadonlyArray<string>;
  label: string;
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
 * Drag or press anywhere on the track (PanResponder on both platforms); on web
 * the thumb is focusable and answers the arrow keys, Home and End.
 *
 * A WebGL rocket-exhaust-shader flourish at the Max stop (over a canvas
 * starfield, with the ticks blown off the track) has no native counterpart,
 * so at Max the slider simply rests at its last stop.
 */
export function EffortSlider({ value, onChange, levels, label, palette, testID }: EffortSliderProps) {
  const [width, setWidth] = useState(0);
  const max = Math.max(0, levels.length - 1);
  const clamped = Math.min(Math.max(value, 0), max);
  const fraction = max > 0 ? clamped / max : 0;
  const rail = Math.max(0, width - THUMB_WIDTH);

  const stateRef = useRef({ value: clamped, rail, max, onChange });
  stateRef.current = { value: clamped, rail, max, onChange };
  const startRef = useRef(clamped);

  const valueAt = useCallback((x: number) => {
    const s = stateRef.current;
    if (s.rail <= 0 || s.max <= 0) return s.value;
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
          const next =
            event.key === 'ArrowRight' || event.key === 'ArrowUp'
              ? Math.min(s.max, s.value + 1)
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                ? Math.max(0, s.value - 1)
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
    borderColor: palette.thumbBorder,
    backgroundColor: palette.surface,
    boxShadow: palette.shadowXs,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={levels[clamped]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') commit(Math.min(max, clamped + 1));
        if (event.nativeEvent.actionName === 'decrement') commit(Math.max(0, clamped - 1));
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
            width: fraction * rail + THUMB_WIDTH,
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
                opacity: index > clamped ? 0.3 : 1,
              }}
            />
          ))}
        </View>
        <View pointerEvents="none" {...dataHook('bloomComposerThumb')} {...webThumb} style={thumbStyle} />
      </View>
    </View>
  );
}
