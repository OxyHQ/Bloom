import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ACCENT_TABLE, BUTTON_SHADOW, SEGMENTED_THUMB_EASE_BEZIER, SEGMENTED_THUMB_MS, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiMoonLine } from '../icons/remix/RiMoonLine';
import { RiSunLine } from '../icons/remix/RiSunLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { withAlpha } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { useBloomTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ThemeToggleAppearance, ThemeToggleProps } from './types';
import { revealTheme, THEME_TRANSITION_DURATION, type RevealOrigin } from './view-transition';

/**
 * A theme toggle, driving Bloom's own mode through `useBloomTheme().setMode`
 * — it never reads or writes storage of its own; `BloomThemeProvider`
 * persists when configured to.
 *
 *   sidebar            row p8 radius 10, moon 20 + "Dark mode" body-medium,
 *                      28×16 pill switch on the right; hover secondary-hover
 *   collapsed          36×36 radius 10, sun (dark) / moon (light) 20;
 *                      hover secondary-hover + icon-primary
 *   segmented          track p4 gap4 full radius; two 32px circular segments,
 *                      icon 16; a 32px thumb with shadow-xs slides 36px (200ms)
 *   glass-segmented    no track; black / white literals (landing nav skin)
 *
 * Tokens:
 *
 *                                      light            dark
 *   background-secondary (segmented)   neutral-100      neutral-900
 *   background-primary   (its thumb)   card             neutral-800
 *   theme-toggle-sidebar-background    neutral-200      neutral-800
 *   theme-toggle-sidebar-selected      card             neutral-700
 *   background-secondary-hover         neutral-200      neutral-800
 *   foreground-icon-primary            text             text
 *   foreground-icon-secondary          neutral-500      neutral-500
 *   background-tertiary (switch off)   neutral-200      neutral-800
 *
 * On web the change is revealed as a growing circle from the pointer
 * (`view-transition.ts`); natively, and under reduced motion, it is immediate.
 */

const IS_WEB = Platform.OS === 'web';
const EASE = Easing.bezier(...SEGMENTED_THUMB_EASE_BEZIER);
const THUMB_MS = SEGMENTED_THUMB_MS;
const HOVER_MS = 150;

interface TogglePalette {
  icon: string;
  iconActive: string;
  text: string;
  hover: string;
  ring: string;
  track: Record<Exclude<ThemeToggleAppearance, 'sidebar'>, string>;
  thumb: Record<Exclude<ThemeToggleAppearance, 'sidebar'>, string>;
  thumbShadow: string;
  switchOff: string;
  switchOn: readonly [string, string];
  switchOnShadow: string;
  switchThumb: readonly [string, string];
  chipOff: { border: string; from: string; to: string };
  chipOn: { border: string; from: string; to: string };
  glassSelected: string;
  glassIdle: string;
  glassHover: string;
}

/** CSS `color-mix(in oklab, a p%, b)` approximated in sRGB — the stops are one hue apart. */
function mix(a: string, b: string, weightOfA: number): string {
  return mixColor(b, a, weightOfA);
}

export function resolveThemeTogglePalette(theme: Theme): TogglePalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const text = theme.colors.text;
  const dark = theme.isDark;
  const ramp = colorRamp(theme.colors.primary, ACCENT_TABLE);
  return {
    icon: n[500],
    iconActive: text,
    text: n[500],
    hover: dark ? n[800] : n[200],
    ring: accent[500],
    track: {
      segmented: dark ? n[900] : n[100],
      'sidebar-segmented': dark ? n[800] : n[200],
      'glass-segmented': 'transparent',
    },
    thumb: {
      segmented: dark ? n[800] : theme.colors.card,
      'sidebar-segmented': dark ? n[700] : theme.colors.card,
      'glass-segmented': dark ? '#2e2e33' : '#ffffff',
    },
    thumbShadow: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    switchOff: dark ? n[800] : n[200],
    switchOn: [ramp[500], ramp[600]],
    switchOnShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 0 0.5px ${ramp[500]}`,
    // `control-indicator-background` → `-subtle`: white → neutral-100 in both modes.
    switchThumb: ['#ffffff', n[100]],
    chipOff: dark
      ? { border: withAlpha(n[700], 0.5), from: n[800], to: n[800] }
      : { border: withAlpha(n[200], 0.5), from: '#ffffff', to: n[100] },
    chipOn: {
      border: ramp[600],
      from: mix(ramp[500], ramp[600], 0.63),
      to: mix(ramp[600], ramp[700], 0.16),
    },
    glassSelected: dark ? '#ffffff' : '#000000',
    glassIdle: dark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
    glassHover: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  };
}

// ---------------------------------------------------------------------------
//  Web: keyboard focus ring (`focus-visible:ring-2 ring-border-focus-ring`) and
//  the colour transitions. The controls are react-native-web `Pressable`s, so
//  the rules hang off a `dataSet` attribute — a class never reaches the DOM.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-theme-toggle-web-css';
const SEL = '[data-bloom-theme-toggle]';
const INSET = '[data-bloom-theme-toggle="inset"]';
const WEB_CSS = `
${SEL} {
  cursor: pointer;
  outline: none;
  transition: background-color ${HOVER_MS}ms ease, color ${HOVER_MS}ms ease;
}
${SEL}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-theme-toggle-ring);
}
${INSET}:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-theme-toggle-ring);
}
`;

function webHook(kind: 'ring' | 'inset'): Record<string, unknown> {
  return IS_WEB ? { dataSet: { bloomThemeToggle: kind } } : {};
}

/** The native tooltip (`title`), a web-only DOM attribute. */
function webTitle(title: string): Record<string, unknown> {
  return IS_WEB ? { title } : {};
}

/** The pointer that pressed, or null for keyboard activation (the 0,0 rule). */
function pointerOrigin(event: GestureResponderEvent): RevealOrigin | null {
  const native = event.nativeEvent as unknown as { clientX?: number; clientY?: number };
  const x = native.clientX;
  const y = native.clientY;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (x === 0 && y === 0) return null;
  return { x, y };
}

function centerOf(node: unknown): RevealOrigin | null {
  const el = node as { getBoundingClientRect?: () => DOMRect } | null;
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

let gradientIds = 0;

/** A top-to-bottom two-stop gradient layer (opaque stops — SVG drops alpha). */
function GradientLayer({
  from,
  to,
  radius,
  fromOffset = 0,
  reverse = false,
}: {
  from: string;
  to: string;
  radius: number;
  fromOffset?: number;
  reverse?: boolean;
}) {
  const id = useMemo(() => `bloom-theme-toggle-gradient${gradientIds++}`, []);
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1={reverse ? '1' : '0'} x2="0" y2={reverse ? '0' : '1'}>
            <Stop offset={String(fromOffset)} stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * A small pill switch track, the visual only: 28×16 track, 12px thumb 2px
 * in, 12px travel, 5px embossed chip. Decorative — the row that holds it is
 * the switch.
 */
function SwitchTrackSm({
  on,
  palette,
  reducedMotion,
}: {
  on: boolean;
  palette: TogglePalette;
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: THUMB_MS, easing: EASE });
  }, [on, reducedMotion, progress]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 12 }] }), [progress]);
  const chip = on ? palette.chipOn : palette.chipOff;

  const trackStyle: WebCssStyle = {
    width: 28,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: on ? palette.switchOn[0] : palette.switchOff,
    flexShrink: 0,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: `${THUMB_MS}ms` } : null),
  };

  return (
    <View aria-hidden style={trackStyle} testID="theme-toggle-switch-track">
      {on ? <GradientLayer from={palette.switchOn[0]} to={palette.switchOn[1]} radius={borderRadius.full} /> : null}
      {on ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.full, boxShadow: palette.switchOnShadow }]} />
      ) : null}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 2,
            top: 2,
            width: 12,
            height: 12,
            borderRadius: borderRadius.full,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 3px 0 rgba(0, 0, 0, 0.03), 0 0.75px 0 0 rgba(0, 0, 0, 0.05)',
          },
          thumbStyle,
        ]}
      >
        <GradientLayer
          from={palette.switchThumb[0]}
          to={palette.switchThumb[1]}
          fromOffset={0.43837}
          radius={borderRadius.full}
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: borderRadius.full,
            borderWidth: 0.25,
            borderColor: chip.border,
            overflow: 'hidden',
            boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.03)',
          }}
        >
          <GradientLayer from={chip.from} to={chip.to} fromOffset={0.43837} reverse radius={borderRadius.full} />
        </View>
      </Animated.View>
    </View>
  );
}

function SegmentButton({
  mode,
  selected,
  glass,
  palette,
  onSelect,
}: {
  mode: 'light' | 'dark';
  selected: boolean;
  glass: boolean;
  palette: TogglePalette;
  onSelect: (mode: 'light' | 'dark', event: GestureResponderEvent, node: unknown) => void;
}) {
  const ref = useRef<View>(null);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = mode === 'light' ? RiSunLine : RiMoonLine;
  const color = glass
    ? selected
      ? palette.glassSelected
      : hovered
        ? palette.glassHover
        : palette.glassIdle
    : selected || hovered
      ? palette.iconActive
      : palette.icon;
  const style: WebCssStyle = {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    '--bloom-theme-toggle-ring': palette.ring,
  };
  const label = mode === 'light' ? 'Use light mode' : 'Use dark mode';
  return (
    <Pressable
      ref={ref}
      {...webHook('ring')}
      {...webTitle(mode === 'light' ? 'Light mode' : 'Dark mode')}
      role="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event) => {
        if (selected) return;
        onSelect(mode, event, ref.current);
      }}
      style={style}
      testID={`theme-toggle-${mode}`}
    >
      <Icon width={16} height={16} fill={color} />
    </Pressable>
  );
}

const ThemeToggleComponent: React.FC<ThemeToggleProps> = ({
  collapsed = false,
  appearance = 'sidebar',
  transitionDuration = THEME_TRANSITION_DURATION,
  style,
  testID,
}) => {
  const { theme, setMode } = useBloomTheme();
  const palette = useMemo(() => resolveThemeTogglePalette(theme), [theme]);
  const reducedMotion = useReducedMotion();
  const dark = theme.isDark;

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  const change = useCallback(
    (next: 'light' | 'dark', event: GestureResponderEvent | null, node: unknown) => {
      void revealTheme(() => setMode(next), {
        origin: event ? pointerOrigin(event) : null,
        fallback: centerOf(node),
        duration: transitionDuration,
      });
    },
    [setMode, transitionDuration],
  );

  if (appearance !== 'sidebar') {
    return (
      <SegmentedToggle
        appearance={appearance}
        dark={dark}
        palette={palette}
        reducedMotion={reducedMotion}
        onSelect={(mode, event, node) => change(mode, event, node)}
        style={style}
        testID={testID}
      />
    );
  }

  if (collapsed) {
    return (
      <CollapsedToggle
        dark={dark}
        palette={palette}
        onToggle={(event, node) => change(dark ? 'light' : 'dark', event, node)}
        style={style}
        testID={testID}
      />
    );
  }

  return (
    <SidebarRowToggle
      dark={dark}
      palette={palette}
      reducedMotion={reducedMotion}
      onToggle={(event, node) => change(dark ? 'light' : 'dark', event, node)}
      style={style}
      testID={testID}
    />
  );
};

function SegmentedToggle({
  appearance,
  dark,
  palette,
  reducedMotion,
  onSelect,
  style,
  testID,
}: {
  appearance: Exclude<ThemeToggleAppearance, 'sidebar'>;
  dark: boolean;
  palette: TogglePalette;
  reducedMotion: boolean;
  onSelect: (mode: 'light' | 'dark', event: GestureResponderEvent, node: unknown) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const glass = appearance === 'glass-segmented';
  const progress = useSharedValue(dark ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion ? (dark ? 1 : 0) : withTiming(dark ? 1 : 0, { duration: THUMB_MS, easing: EASE });
  }, [dark, reducedMotion, progress]);
  // Segment width + the 4px gap.
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 36 }] }), [progress]);

  return (
    <View
      role="group"
      accessibilityLabel="Theme"
      testID={testID}
      style={[
        {
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          padding: 4,
          borderRadius: borderRadius.full,
          backgroundColor: palette.track[appearance],
          zIndex: glass ? 10 : undefined,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        aria-hidden
        testID={testID ? `${testID}-thumb` : 'theme-toggle-thumb'}
        style={[
          {
            position: 'absolute',
            top: 4,
            left: 4,
            width: 32,
            height: 32,
            borderRadius: borderRadius.full,
            backgroundColor: palette.thumb[appearance],
            boxShadow: palette.thumbShadow,
          },
          thumbStyle,
        ]}
      />
      <SegmentButton mode="light" selected={!dark} glass={glass} palette={palette} onSelect={onSelect} />
      <SegmentButton mode="dark" selected={dark} glass={glass} palette={palette} onSelect={onSelect} />
    </View>
  );
}

function CollapsedToggle({
  dark,
  palette,
  onToggle,
  style,
  testID,
}: {
  dark: boolean;
  palette: TogglePalette;
  onToggle: (event: GestureResponderEvent, node: unknown) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const ref = useRef<View>(null);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = dark ? RiSunLine : RiMoonLine;
  const box: WebCssStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered ? palette.hover : 'transparent',
    '--bloom-theme-toggle-ring': palette.ring,
  };
  return (
    <Pressable
      ref={ref}
      {...webHook('ring')}
      {...webTitle(dark ? 'Light mode' : 'Dark mode')}
      role="button"
      accessibilityLabel={dark ? 'Use light mode' : 'Use dark mode'}
      accessibilityState={{ selected: dark }}
      aria-pressed={dark}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event) => onToggle(event, ref.current)}
      style={[box, style]}
      testID={testID}
    >
      <Icon width={20} height={20} fill={hovered ? palette.iconActive : palette.icon} />
    </Pressable>
  );
}

function SidebarRowToggle({
  dark,
  palette,
  reducedMotion,
  onToggle,
  style,
  testID,
}: {
  dark: boolean;
  palette: TogglePalette;
  reducedMotion: boolean;
  onToggle: (event: GestureResponderEvent, node: unknown) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const ref = useRef<View>(null);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const row: WebCssStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    backgroundColor: hovered ? palette.hover : 'transparent',
    '--bloom-theme-toggle-ring': palette.ring,
  };
  return (
    <Pressable
      ref={ref}
      {...webHook('inset')}
      role="switch"
      accessibilityLabel="Dark mode"
      aria-checked={dark}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event) => onToggle(event, ref.current)}
      style={[row, style]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <RiMoonLine width={20} height={20} fill={palette.icon} />
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
          Dark mode
        </Text>
      </View>
      <SwitchTrackSm on={dark} palette={palette} reducedMotion={reducedMotion} />
    </Pressable>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);
ThemeToggle.displayName = 'ThemeToggle';
