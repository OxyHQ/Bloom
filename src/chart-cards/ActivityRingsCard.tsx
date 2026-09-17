import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { chartHueTone, resolveTone, type ChartHue } from './palette';
import { PolarSurface, svgTransition } from './PolarSurface';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { TABULAR } from './primitives/ChartHeader';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useWebTransition } from './primitives/use-web-transition';

/** One goal ring and its stat tile. */
export interface ActivityRing {
  /** Tile label ("Move"). */
  label: string;
  /** Tile value, already formatted ("1,592 kcal"). */
  value: string;
  /** Progress toward the ring's own goal, 0–100. Keep it under 100 for a never-closed look. */
  goalPct: number;
  /** Ring / swatch colour; defaults to chart-3, chart-2, chart-4 (then the palette). */
  color?: string;
  /** Hover colour; defaults to that token's `-active` step (or `color` darkened). */
  activeColor?: string;
}

export interface ActivityRingsCardProps {
  /** Up to three rings, outermost first; tiles follow the same order. */
  rings: readonly ActivityRing[];
  /** Card title (defaults to `"Activity"`, or `"Activity for July 4, 2026"` for a picked day). */
  title?: string;
  /** Card height. Default 330. */
  height?: number;
  /** The hovered / pressed ring. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the rings for assistive tech. Defaults to a summary of each ring's progress. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `h-[330px]`. */
export const ACTIVITY_CARD_HEIGHT = 330;
/** `RING_RADII` in the 200×200 viewBox. */
const RING_RADII = [82, 58, 34] as const;
const RING_STROKE_WIDTH = 18;
const VIEWBOX = 200;
/** `max-h-[210px]`. */
const MAX_SVG_HEIGHT = 210;
/** Default ring tokens, outermost first: pink, lime, sky. */
const DEFAULT_HUES: readonly ChartHue[] = [3, 2, 4];
/** `duration-200 ease-out` on `stroke-dasharray`. */
const DASH_MS = 200;

const clampPct = (pct: number) => Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));

/** Tweens a list of numbers toward `target` over `ms` with CSS `ease-out`; snaps under reduced motion. */
function useTween(target: readonly number[], ms: number): readonly number[] {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState<readonly number[]>(target);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const key = target.join(',');
  useEffect(() => {
    const from = shownRef.current;
    if (reducedMotion || typeof requestAnimationFrame !== 'function' || from.length !== target.length) {
      setShown(target);
      return;
    }
    if (from.every((v, i) => v === target[i])) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ms);
      // `ease-out` = cubic-bezier(0, 0, 0.58, 1) ≈ 1 − (1 − t)².
      const e = 1 - (1 - t) * (1 - t);
      setShown(target.map((v, i) => from[i]! + (v - from[i]!) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised values
  }, [key, ms, reducedMotion]);
  return shown.length === target.length ? shown : target;
}

/**
 * Three concentric goal rings, Apple Watch-style, under a row of stat tiles.
 *
 *   card     330 tall, radius 20, padding 10, background-secondary, 16 between
 *            the title block and the rings
 *   title    body-medium text-secondary, padded 6 / 6 / 0; the tiles 11 under it
 *   tiles    57 tall, 8 apart, radius 10, background-inner, padding 8 / 10,
 *            bottom-aligned: 12px swatch (radius 4) + body-regular label over a
 *            body-medium value; the others fade to 50% while a ring is hovered
 *   rings    a 200 viewBox (at most 210 tall) centred in the rest: r 82 / 58 / 34,
 *            18 wide, from twelve o'clock clockwise with round caps over a track of
 *            the same colour at 16%; a hovered ring takes its `-active` tone, the
 *            others drop to 50% (tracks to 6%), all eased over 200ms
 *
 * A change of `goalPct` sweeps the arc over 200ms (`stroke-dasharray`).
 * Hovering is per ring band on web; on native a finger presses and
 * scrubs, and lifting it clears. Moving into the gap between two rings keeps the
 * last one; it only clears when the pointer leaves the drawing.
 */
export function ActivityRingsCard({
  rings,
  title = 'Activity',
  height = ACTIVITY_CARD_HEIGHT,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: ActivityRingsCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const shown = useMemo(() => rings.slice(0, RING_RADII.length), [rings]);
  const tones = useMemo(
    () =>
      shown.map((ring, i) => {
        if (ring.color) return resolveTone(palettes, i, ring.color, ring.activeColor);
        const hue = DEFAULT_HUES[i];
        return hue !== undefined ? chartHueTone(theme, hue) : resolveTone(palettes, i);
      }),
    [shown, palettes, theme],
  );
  const [activeIndex, setActiveIndex] = useActiveIndex(shown.length, controlledIndex, onActiveIndexChange);
  const hovering = activeIndex !== null;
  const pcts = useTween(
    useMemo(() => shown.map((r) => clampPct(r.goalPct)), [shown]),
    DASH_MS,
  );

  const fade = useWebTransition('opacity', 200);
  const ringEase = useWebTransition('stroke, opacity', 200);

  /** The drawing's placement in the measured area: the 200 viewBox, fitted and centred. */
  const fit = (width: number, areaHeight: number) => {
    const svgHeight = Math.min(areaHeight, MAX_SVG_HEIGHT);
    const scale = Math.min(width, svgHeight) / VIEWBOX;
    const top = (areaHeight - svgHeight) / 2;
    return {
      svgHeight,
      top,
      toViewBox: (x: number, y: number) => ({
        x: (x - (width - VIEWBOX * scale) / 2) / scale,
        y: (y - top - (svgHeight - VIEWBOX * scale) / 2) / scale,
      }),
    };
  };

  const onPointerAt = (x: number, y: number, size: { width: number; height: number }) => {
    const { svgHeight, top, toViewBox } = fit(size.width, size.height);
    // Outside the <svg> element's own box: equivalent to `onMouseLeave`.
    if (y < top || y > top + svgHeight) {
      setActiveIndex(null);
      return;
    }
    const p = toViewBox(x, y);
    const distance = Math.hypot(p.x - VIEWBOX / 2, p.y - VIEWBOX / 2);
    const hit = shown.findIndex((_, i) => Math.abs(distance - RING_RADII[i]!) <= RING_STROKE_WIDTH / 2);
    if (hit >= 0) setActiveIndex(hit);
  };

  const a11y =
    accessibilityLabel ?? `${title}: ${shown.map((r) => `${r.label} ${r.value}, ${Math.round(clampPct(r.goalPct))}% of goal`).join('; ')}`;

  return (
    <ChartCardSurface
      height={height}
      testID={testID}
      style={[{ borderRadius: 20, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10 }, style]}>
      <View style={{ width: '100%', flexDirection: 'column', gap: 11 }}>
        <Text
          variant="body-medium"
          numberOfLines={1}
          testID={testID ? `${testID}-title` : undefined}
          style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 6, color: palette.textSecondary }}>
          {title}
        </Text>
        <View style={{ width: '100%', height: 57, flexShrink: 0, flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
          {shown.map((ring, i) => (
            <View
              key={`${ring.label}-${i}`}
              testID={testID ? `${testID}-tile-${i}` : undefined}
              style={[
                {
                  flex: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  gap: 1,
                  borderRadius: 10,
                  backgroundColor: palette.inner,
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingLeft: 10,
                  paddingRight: 10,
                  opacity: hovering && activeIndex !== i ? 0.5 : 1,
                },
                fade,
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 4, backgroundColor: tones[i]!.color }} />
                <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                  {ring.label}
                </Text>
              </View>
              <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
                {ring.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <PolarSurface
          accessibilityLabel={a11y}
          testID={testID ? `${testID}-plot` : undefined}
          onPointerAt={onPointerAt}
          onPointerLeave={() => setActiveIndex(null)}>
          {({ width, height: areaHeight }) => {
            const { svgHeight, top } = fit(width, areaHeight);
            return (
              <Svg
                width={width}
                height={svgHeight}
                viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                style={[StyleSheet.absoluteFill, { top, height: svgHeight }]}
                pointerEvents="none">
                {shown.map((ring, i) => {
                  const r = RING_RADII[i]!;
                  const circumference = 2 * Math.PI * r;
                  const dimmed = hovering && activeIndex !== i;
                  const arc = (circumference * (pcts[i] ?? 0)) / 100;
                  return (
                    <G key={`${ring.label}-${i}`} transform={`rotate(-90 ${VIEWBOX / 2} ${VIEWBOX / 2})`}>
                      <Circle
                        cx={VIEWBOX / 2}
                        cy={VIEWBOX / 2}
                        r={r}
                        fill="none"
                        stroke={tones[i]!.color}
                        strokeWidth={RING_STROKE_WIDTH}
                        opacity={dimmed ? 0.06 : 0.16}
                        {...svgTransition(fade)}
                      />
                      <Circle
                          testID={testID ? `${testID}-ring-${i}` : undefined}
                          cx={VIEWBOX / 2}
                          cy={VIEWBOX / 2}
                          r={r}
                          fill="none"
                          stroke={activeIndex === i ? tones[i]!.activeColor : tones[i]!.color}
                          strokeWidth={RING_STROKE_WIDTH}
                          strokeLinecap="round"
                          strokeDasharray={`${arc} ${circumference - arc}`}
                          opacity={dimmed ? 0.5 : 1}
                          {...svgTransition(ringEase)}
                        />
                    </G>
                  );
                })}
              </Svg>
            );
          }}
        </PolarSurface>
      </View>
    </ChartCardSurface>
  );
}
