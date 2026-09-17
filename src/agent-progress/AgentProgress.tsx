import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { BUTTON_SHADOW, mixColor, resolveButtonRamps } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { AgentProgressLoadingText } from './AgentProgressLoadingText';
import type { AgentProgressProps } from './types';

/**
 * The card that lists an agent's plan and ticks it off step by step.
 *
 *   header       progress ring (whole plan), "N steps left", minimize button
 *   step rows    32 tall, 6 apart: pending (dashed circle) → active (step ring,
 *                shimmering label, a pill border that springs from row to row)
 *                → complete (filled check, label struck through)
 *   minimized    44-tall bar: ring, "N steps left", the current step with an
 *                arrow; hovering reveals the expand glyph and fades the step out
 *
 * Geometry:
 *
 *   card         341 wide (max 100%), radius 16, 1px border, shadow-xs;
 *                height 45 + 38·n expanded, 44 minimized
 *   ring         16px at top 14 / left 14, stroke 2.5 on r 6.75
 *   expanded     padding 8 top (+4) / 10 sides / 10 bottom; header row 20 tall
 *                with 4px left inset and a 24px ring spacer; steps 9 below
 *   step row     padding 4 / 4, active 9 / 13 (360ms); gap 8; icon box 14;
 *                step ring stroke 1.5 on r 5.75; check / pending glyphs 15
 *   minimized    padding 6 / 10, gap 8; step area py 6, pr 24; expand glyph 20
 *                at right 10
 *
 * Motion (`cubic-bezier(0.22, 1, 0.36, 1)` unless noted): card
 * enters from opacity 0 / y -12 / blur 8 (350 / 500 / 400ms) while its height
 * grows 0 → full (650ms; 420 minimizing, 240 reopening); rows reveal 160ms apart
 * after the card (450ms each, 35ms apart on reopen); the active border springs
 * (stiffness 260, damping 30, mass 0.8); the header label crossfades with a 4px
 * rise (260ms). Blur is web-only — React Native has no cross-platform blur
 * filter — and every animation snaps under reduced motion.
 */

export const DEFAULT_AGENT_PROGRESS_STEPS = [
  'Read project files',
  'Update and install light mode tokens',
  'Implement dark mode tokens',
  'Add reusable registered theme toggle',
  'Run registry, lint and production build',
] as const;

const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Timing constants
// ---------------------------------------------------------------------------

const STEP_REVEAL_STAGGER_MS = 160;
const STEP_REVEAL_MS = 450;
const MODULE_EXPAND_MS = 650;
const MODULE_MINIMIZE_MS = 420;
const MODULE_REOPEN_MS = 240;
const STEP_REOPEN_STAGGER_MS = 35;
const DEFAULT_STEP_DURATION_MS = 3000;
const DEFAULT_COMPLETION_DELAY_MS = 1000;
const PROCESS_START_DELAY_MS = MODULE_EXPAND_MS + STEP_REVEAL_MS;

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
/** motion's `easeOut`. */
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
/** motion's default tween. */
const EASE_DEFAULT = Easing.bezier(0.25, 0.1, 0.35, 1);
const SPRING = { stiffness: 260, damping: 30, mass: 0.8 } as const;

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

const CARD_WIDTH = 341;
const CARD_RADIUS = 16;
const MINIMIZED_HEIGHT = 44;
const ROW_HEIGHT = 32;
const ROW_GAP = 6;
const RING_SIZE = 16;
const RING_R = 6.75;
const RING_C = 2 * Math.PI * RING_R;
const STEP_RING_R = 5.75;
const STEP_RING_C = 2 * Math.PI * STEP_RING_R;
const SPACER_WIDTH = 24;

export function agentProgressExpandedHeight(stepCount: number): number {
  return Math.max(44, 45 + stepCount * 38);
}

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

interface ProgressPalette {
  surface: string;
  border: string;
  quaternary: string;
  iconSecondary: string;
  textSecondary: string;
  textPrimary: string;
  ring: string;
  shadow: string;
}

function hex(color: string): string {
  const c = parseRgba(color);
  if (!c) return color;
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/**
 * Semantic tokens onto Bloom's ramps:
 *
 *                                   light          dark
 *   background-primary-default      card           neutral-800
 *   border-button-default           neutral-200    neutral-700
 *   background-quaternary-default   neutral-300    neutral-700
 *   foreground-icon-secondary       neutral-500    neutral-500
 *   text-secondary                  neutral-500    neutral-500
 *   text-primary                    text           text
 *   agent-progress-ring             neutral-700    white 50% (over the neutral-700 track)
 */
function resolvePalette(theme: Theme): ProgressPalette {
  const { neutral: n } = resolveButtonRamps(theme);
  return {
    surface: theme.isDark ? n[800] : theme.colors.card,
    border: hex(theme.isDark ? n[700] : n[200]),
    quaternary: hex(theme.isDark ? n[700] : n[300]),
    iconSecondary: hex(n[500]),
    textSecondary: n[500],
    textPrimary: theme.colors.text,
    ring: hex(theme.isDark ? mixColor(n[700], '#ffffff', 0.5) : n[700]),
    shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
  };
}

// ---------------------------------------------------------------------------
//  Web CSS: focus ring on the bar, expand glyph on keyboard focus
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-agent-progress-web-css';
const BAR = '[data-bloom-agent-progress-bar]';
const WEB_CSS = `
${BAR}:focus { outline: none; }
${BAR}:focus-visible { outline: auto; }
${BAR}:focus-visible [data-bloom-agent-progress-expand] { opacity: 1 !important; }
[data-bloom-agent-progress-minimize] { transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1); }
`;

// ---------------------------------------------------------------------------
//  Presence: AnimatePresence + motion initial/animate/exit, for one child
// ---------------------------------------------------------------------------

interface Pose {
  opacity?: number;
  y?: number;
  blur?: number;
  scale?: number;
  rotate?: number;
}

interface Timing {
  duration: number;
  delay?: number;
  easing?: EasingFunction | EasingFunctionFactory;
}

const REST = { opacity: 1, y: 0, blur: 0, scale: 1, rotate: 0 } as const;

function Presence({
  show,
  initial = true,
  from,
  exit,
  enter,
  leave,
  style,
  pointerEvents,
  testID,
  children,
}: {
  show: boolean;
  /** Animate `from` → rest when present on first render (`AnimatePresence initial`). */
  initial?: boolean;
  from: Pose;
  /** Omitted: unmounts at once. */
  exit?: Pose;
  enter: Timing;
  leave?: Timing;
  style?: ViewStyle | ViewStyle[];
  pointerEvents?: 'auto' | 'none' | 'box-none';
  testID?: string;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(show);
  const firstRender = useRef(true);
  const start = show && initial && !reducedMotion ? { ...REST, ...from } : REST;
  const opacity = useSharedValue<number>(start.opacity);
  const y = useSharedValue<number>(start.y);
  const blur = useSharedValue<number>(start.blur);
  const scale = useSharedValue<number>(start.scale);
  const rotate = useSharedValue<number>(start.rotate);

  const drive = useCallback(
    (pose: Required<Pose>, timing: Timing, onDone?: () => void) => {
      const pairs: Array<[SharedValue<number>, number]> = [
        [opacity, pose.opacity],
        [y, pose.y],
        [blur, pose.blur],
        [scale, pose.scale],
        [rotate, pose.rotate],
      ];
      if (reducedMotion) {
        for (const [sv, v] of pairs) sv.value = v;
        onDone?.();
        return;
      }
      pairs.forEach(([sv, v], index) => {
        const t = withTiming(
          v,
          { duration: timing.duration, easing: timing.easing ?? EASE },
          index === 0 && onDone
            ? (finished?: boolean) => {
                'worklet';
                if (finished) runOnJS(onDone)();
              }
            : undefined,
        );
        sv.value = timing.delay ? withDelay(timing.delay, t) : t;
      });
    },
    [opacity, y, blur, scale, rotate, reducedMotion],
  );

  useEffect(() => {
    const isFirst = firstRender.current;
    firstRender.current = false;
    if (show) {
      if (isFirst && !initial) return;
      if (!mounted) {
        // Re-entering after an exit finished: start from the initial pose.
        opacity.value = from.opacity ?? 1;
        y.value = from.y ?? 0;
        blur.value = from.blur ?? 0;
        scale.value = from.scale ?? 1;
        rotate.value = from.rotate ?? 0;
        setMounted(true);
      }
      drive(REST, enter);
      return;
    }
    if (isFirst) return;
    if (!exit) {
      setMounted(false);
      return;
    }
    drive({ ...REST, ...exit }, leave ?? enter, () => setMounted(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => {
    const out: WebCssStyle = {
      opacity: opacity.value,
      transform: [
        { translateY: y.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
    if (IS_WEB) out.filter = `blur(${blur.value}px)`;
    return out;
  }, [opacity, y, blur, scale, rotate]);

  if (!mounted && !show) return null;
  return (
    <Animated.View pointerEvents={pointerEvents} testID={testID} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Glyphs
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A ring whose arc follows `progress` (0–1), drawn clockwise from 12 o'clock. */
function ArcRing({
  progress,
  size,
  viewBox,
  r,
  circumference,
  strokeWidth,
  track,
  color,
  testID,
}: {
  progress: SharedValue<number>;
  size: number;
  viewBox: number;
  r: number;
  circumference: number;
  strokeWidth: number;
  track: string;
  color: string;
  testID?: string;
}) {
  const c = viewBox / 2;
  // The dash is animated by OFFSET, not length: an animated `strokeDasharray`
  // array never reaches the DOM through react-native-svg on web (measured: it
  // stayed at its first value). Cost: at exactly 0 a zero-length dash would
  // draw its round cap as a dot at 12 o'clock; this draws nothing.
  const animatedProps = useAnimatedProps(
    () => ({ strokeDashoffset: circumference * (1 - progress.value) }),
    [progress, circumference],
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`} aria-hidden testID={testID}>
      <G transform={`rotate(-90 ${c} ${c})`}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[circumference, circumference]}
        />
      </G>
    </Svg>
  );
}

function MinimizeIcon({ palette }: { palette: ProgressPalette }) {
  return (
    <View aria-hidden style={glyph.minimize}>
      <View style={[glyph.minimizeSquare, { backgroundColor: palette.quaternary }]} />
      <View style={[glyph.minimizeBar, { backgroundColor: palette.iconSecondary }]} />
    </View>
  );
}

function CompletedStepIcon({ palette }: { palette: ProgressPalette }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 14 14" aria-hidden>
      <Circle cx={7} cy={7} r={7} fill={palette.quaternary} />
      <Path
        d="M4 7.5 5.646 9.146a.5.5 0 0 0 .708 0L10 5.5"
        fill="none"
        stroke={palette.iconSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PendingStepIcon({ palette }: { palette: ProgressPalette }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" aria-hidden>
      <Circle
        cx={7.5}
        cy={7.5}
        r={7}
        fill="none"
        stroke={palette.quaternary}
        strokeDasharray={[2, 2]}
      />
    </Svg>
  );
}

function CurrentStepIcon({ palette }: { palette: ProgressPalette }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" aria-hidden style={glyph.noShrink}>
      <Path
        d="M7.47 2.47a.75.75 0 0 1 1.06 0l4.177 4.176a.5.5 0 0 1 0 .708L8.53 11.53a.75.75 0 0 1-1.06-1.06l2.72-2.72H2a.75.75 0 0 1 0-1.5h8.19L7.47 3.53a.75.75 0 0 1 0-1.06Z"
        fill={palette.iconSecondary}
      />
    </Svg>
  );
}

function ExpandIcon({ palette }: { palette: ProgressPalette }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
      <Rect x={1} y={1} width={18} height={18} rx={4} ry={4} fill={palette.quaternary} />
      <Path
        d="M7.553 6.109a.75.75 0 0 1 .75-.75h5.907a.5.5 0 0 1 .5.5v5.906a.75.75 0 0 1-1.5 0V7.919l-5.79 5.791a.75.75 0 1 1-1.061-1.06l5.79-5.791H8.303a.75.75 0 0 1-.75-.75Z"
        fill={palette.iconSecondary}
      />
    </Svg>
  );
}

const glyph = StyleSheet.create({
  minimize: { width: 20, height: 20, position: 'relative', flexShrink: 0 },
  minimizeSquare: { position: 'absolute', top: 1, left: 1, width: 18, height: 18, borderRadius: 4 },
  minimizeBar: { position: 'absolute', top: 13, left: 4, width: 12, height: 2, borderRadius: 3 },
  noShrink: { flexShrink: 0 },
});

// ---------------------------------------------------------------------------
//  Pieces
// ---------------------------------------------------------------------------

/** The 24px slot the persistent ring sits over; collapses to 0 once complete (400ms). */
function RingSpacer({ complete }: { complete: boolean }) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(complete ? 0 : SPACER_WIDTH);
  const opacity = useSharedValue(complete ? 0 : 1);
  useEffect(() => {
    const w = complete ? 0 : SPACER_WIDTH;
    const o = complete ? 0 : 1;
    if (reducedMotion) {
      width.value = w;
      opacity.value = o;
      return;
    }
    width.value = withTiming(w, { duration: 400, easing: EASE });
    opacity.value = withTiming(o, { duration: 400, easing: EASE });
  }, [complete, reducedMotion, width, opacity]);
  const style = useAnimatedStyle(
    () => ({ width: width.value, opacity: opacity.value }),
    [width, opacity],
  );
  return <Animated.View aria-hidden style={[{ height: 16, flexShrink: 0, overflow: 'hidden' }, style]} />;
}

/** The header label: a new label rises in as the old one rises out (popLayout, 260ms). */
function StatusLabel({
  label,
  color,
  grow,
  testID,
}: {
  label: string;
  color: string;
  grow?: boolean;
  testID?: string;
}) {
  const [shown, setShown] = useState({ current: label, previous: null as string | null, n: 0 });
  useEffect(() => {
    setShown((s) => (s.current === label ? s : { current: label, previous: s.current, n: s.n + 1 }));
  }, [label]);
  const textStyle = [TYPE_SCALE['body-medium'], { color }];
  const clear = useCallback(() => setShown((s) => ({ ...s, previous: null })), []);
  const timing = { duration: 260, easing: EASE };
  return (
    <View style={[labelStyles.box, grow ? labelStyles.grow : null]} testID={testID}>
      <Presence
        key={`in-${shown.n}`}
        show
        initial={shown.n > 0}
        from={{ opacity: 0, y: 4, blur: 3 }}
        enter={timing}
      >
        <Text numberOfLines={1} style={textStyle}>
          {shown.current}
        </Text>
      </Presence>
      {shown.previous !== null ? (
        <OutgoingLabel key={`out-${shown.n}`} onDone={clear} timing={timing}>
          <Text numberOfLines={1} style={textStyle}>
            {shown.previous}
          </Text>
        </OutgoingLabel>
      ) : null}
    </View>
  );
}

function OutgoingLabel({
  children,
  onDone,
  timing,
}: {
  children: React.ReactNode;
  onDone: () => void;
  timing: Timing;
}) {
  const [show, setShow] = useState(true);
  useEffect(() => setShow(false), []);
  useEffect(() => {
    if (show) return;
    const id = setTimeout(onDone, timing.duration);
    return () => clearTimeout(id);
  }, [show, onDone, timing.duration]);
  return (
    <Presence
      show={show}
      initial={false}
      from={{}}
      exit={{ opacity: 0, y: -4, blur: 3 }}
      enter={timing}
      style={labelStyles.outgoing}
      pointerEvents="none"
    >
      {children}
    </Presence>
  );
}

const labelStyles = StyleSheet.create({
  box: { position: 'relative', flexDirection: 'row', minWidth: 0, overflow: 'hidden' },
  grow: { flex: 1 },
  outgoing: { position: 'absolute', top: 0, left: 0 },
});

/** The strikethrough drawn across a completed label: scaleX 0 → 1 from the left, opacity → 0.8 (380ms). */
function StrikeLine({ color }: { color: string }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0);
  const opacity = useSharedValue(reducedMotion ? 0.8 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withTiming(1, { duration: 380, easing: EASE });
    opacity.value = withTiming(0.8, { duration: 380, easing: EASE });
  }, [reducedMotion, scale, opacity]);
  const style = useAnimatedStyle(
    () => ({ opacity: opacity.value, transform: [{ scaleX: scale.value }] }),
    [scale, opacity],
  );
  return (
    <Animated.View
      aria-hidden
      style={[
        {
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: color,
          transformOrigin: 'left center',
        },
        style,
      ]}
    />
  );
}

function revealTiming(index: number, reopening: boolean): Timing {
  return reopening
    ? { delay: STEP_REOPEN_STAGGER_MS * index, duration: MODULE_REOPEN_MS }
    : { delay: MODULE_EXPAND_MS + STEP_REVEAL_STAGGER_MS * index, duration: STEP_REVEAL_MS };
}

function StepLoader({
  running,
  duration,
  palette,
}: {
  running: boolean;
  duration: number;
  palette: ProgressPalette;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!running || reducedMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withTiming(1, { duration, easing: Easing.linear });
  }, [running, duration, reducedMotion, progress]);
  return (
    <ArcRing
      progress={progress}
      size={14}
      viewBox={14}
      r={STEP_RING_R}
      circumference={STEP_RING_C}
      strokeWidth={1.5}
      track={palette.border}
      color={palette.ring}
    />
  );
}

function StepRow({
  label,
  index,
  completedCount,
  processingStarted,
  reopening,
  stepCount,
  stepDuration,
  palette,
  testID,
}: {
  label: string;
  index: number;
  completedCount: number;
  processingStarted: boolean;
  reopening: boolean;
  stepCount: number;
  stepDuration: number;
  palette: ProgressPalette;
  testID: string;
}) {
  const reducedMotion = useReducedMotion();
  const complete = index < completedCount;
  const active = index === completedCount && completedCount < stepCount;
  const pending = !complete && !active;

  // The label carries a `transition-colors duration-300`: the step that
  // just finished fades from `text-primary` to `text-secondary` as the shimmer
  // drops. Only for a completion seen by this row, not one it mounted with.
  const [completedHere, setCompletedHere] = useState(false);
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && complete && !reducedMotion) setCompletedHere(true);
    wasActive.current = active;
  }, [active, complete, reducedMotion]);

  const padLeft = useSharedValue(active ? 9 : 4);
  const padRight = useSharedValue(active ? 13 : 4);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const l = active ? 9 : 4;
    const r = active ? 13 : 4;
    if (reducedMotion) {
      padLeft.value = l;
      padRight.value = r;
      return;
    }
    padLeft.value = withTiming(l, { duration: 360, easing: EASE });
    padRight.value = withTiming(r, { duration: 360, easing: EASE });
  }, [active, reducedMotion, padLeft, padRight]);
  const padStyle = useAnimatedStyle(
    () => ({ paddingLeft: padLeft.value, paddingRight: padRight.value }),
    [padLeft, padRight],
  );

  return (
    <Presence
      show
      from={{ opacity: 0, y: -4, blur: 6 }}
      enter={revealTiming(index, reopening)}
      style={rowStyles.row}
      testID={testID}
    >
      <Animated.View style={[rowStyles.inner, padStyle]}>
        <View style={rowStyles.iconBox}>
          <Presence
            show={complete}
            initial={false}
            from={{ opacity: 0, scale: 0.72, rotate: -18 }}
            enter={{ duration: 340 }}
            style={rowStyles.iconBleed}
          >
            <CompletedStepIcon palette={palette} />
          </Presence>
          <Presence
            key={`active-${index}`}
            show={active}
            initial={false}
            from={{ opacity: 0, scale: 0.82 }}
            exit={{ opacity: 0, scale: 0.82 }}
            enter={{ duration: 250, easing: EASE_OUT }}
            style={rowStyles.iconFill}
          >
            <StepLoader running={processingStarted && active} duration={stepDuration} palette={palette} />
          </Presence>
          <Presence
            show={pending}
            initial={false}
            from={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            enter={{ duration: 300, easing: EASE_DEFAULT }}
            style={rowStyles.iconBleed}
          >
            <PendingStepIcon palette={palette} />
          </Presence>
        </View>

        <View style={rowStyles.labelArea}>
          <View style={rowStyles.labelWrap}>
            {active ? (
              <AgentProgressLoadingText>{label}</AgentProgressLoadingText>
            ) : (
              <Text
                variant="body-medium"
                numberOfLines={1}
                style={{ color: palette.textSecondary }}
              >
                {label}
              </Text>
            )}
            {completedHere ? (
              <ColorFade key="fade" label={label} color={palette.textPrimary} />
            ) : null}
            {complete ? <StrikeLine color={palette.textSecondary} /> : null}
          </View>
        </View>
      </Animated.View>
    </Presence>
  );
}

/**
 * A `text-primary` copy of the label over the `text-secondary` one, fading out
 * over 300ms (CSS `ease`): the colour transition, as a cross-fade.
 */
function ColorFade({ label, color }: { label: string; color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  return (
    <Animated.View aria-hidden pointerEvents="none" style={[rowStyles.fade, style]}>
      <Text variant="body-medium" numberOfLines={1} style={{ color }}>
        {label}
      </Text>
    </Animated.View>
  );
}

/**
 * A shared `layoutId` border: one pill outline that springs from the
 * finished row to the next. It reveals with the row it first lands on.
 */
function ActiveBorder({
  index,
  reopening,
  palette,
}: {
  index: number;
  reopening: boolean;
  palette: ProgressPalette;
}) {
  const reducedMotion = useReducedMotion();
  const top = useSharedValue(index * (ROW_HEIGHT + ROW_GAP));
  useEffect(() => {
    const target = index * (ROW_HEIGHT + ROW_GAP);
    top.value = reducedMotion ? target : withSpring(target, SPRING);
  }, [index, reducedMotion, top]);
  const style = useAnimatedStyle(() => ({ top: top.value }), [top]);
  return (
    <Presence
      show
      from={{ opacity: 0, y: -4, blur: 6 }}
      enter={revealTiming(index, reopening)}
      style={rowStyles.borderLayer}
      pointerEvents="none"
    >
      <Animated.View
        aria-hidden
        pointerEvents="none"
        style={[rowStyles.border, { borderColor: palette.border }, style]}
      />
    </Presence>
  );
}

const rowStyles = StyleSheet.create({
  row: { height: ROW_HEIGHT, width: '100%' },
  inner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: '100%',
    width: '100%',
    borderRadius: 9999,
  },
  iconBox: {
    position: 'relative',
    width: 14,
    height: 14,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBleed: { position: 'absolute', top: -0.5, left: -0.5, right: -0.5, bottom: -0.5 },
  iconFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  labelArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  labelWrap: { position: 'relative', flexShrink: 1, minWidth: 0, maxWidth: '100%' },
  borderLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  border: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    borderWidth: 1,
    borderRadius: 9999,
  },
});

// ---------------------------------------------------------------------------
//  AgentProgress
// ---------------------------------------------------------------------------

function defaultStepsLeft(remaining: number): string {
  return `${remaining} ${remaining === 1 ? 'step' : 'steps'} left`;
}

function AgentProgressComponent({
  steps = DEFAULT_AGENT_PROGRESS_STEPS,
  stepDuration = DEFAULT_STEP_DURATION_MS,
  completionDelay = DEFAULT_COMPLETION_DELAY_MS,
  onFinished,
  paused = false,
  completedCount: completedCountProp,
  minimized: minimizedProp,
  defaultMinimized = false,
  onMinimizedChange,
  labels,
  style,
  testID = 'agent-progress',
}: AgentProgressProps) {
  const theme = useTheme();
  const palette = resolvePalette(theme);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  const progressSteps: readonly string[] = steps.length > 0 ? steps : DEFAULT_AGENT_PROGRESS_STEPS;
  const stepCount = progressSteps.length;
  const safeStepDuration = Math.max(0, stepDuration);
  const expandedHeight = agentProgressExpandedHeight(stepCount);

  const [internalCompleted, setInternalCompleted] = useState(0);
  const controlled = completedCountProp !== undefined;
  const completedCount = Math.max(
    0,
    Math.min(stepCount, controlled ? completedCountProp : internalCompleted),
  );
  const [minimized, setMinimized] = useControllableState({
    value: minimizedProp,
    defaultValue: defaultMinimized,
    onChange: onMinimizedChange,
  });
  const [fastReopen, setFastReopen] = useState(false);
  const fastReopenRef = useRef(false);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [minimizeHovered, setMinimizeHovered] = useState(false);

  const remainingCount = stepCount - completedCount;
  const currentStep = progressSteps[Math.min(completedCount, stepCount - 1)] ?? '';
  const complete = completedCount >= stepCount;

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setProcessingStarted(true), PROCESS_START_DELAY_MS);
    return () => clearTimeout(id);
  }, [paused]);

  useEffect(() => {
    if (controlled || !processingStarted || complete || paused) return;
    const id = setTimeout(() => {
      setInternalCompleted((count) => Math.min(count + 1, stepCount));
    }, safeStepDuration);
    return () => clearTimeout(id);
  }, [controlled, complete, completedCount, paused, processingStarted, stepCount, safeStepDuration]);

  useEffect(() => {
    if (!complete || !onFinished || paused) return;
    const id = setTimeout(onFinished, Math.max(0, completionDelay));
    return () => clearTimeout(id);
  }, [complete, completionDelay, onFinished, paused]);

  // ---- card motion --------------------------------------------------------
  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardY = useSharedValue(reducedMotion ? 0 : -12);
  const cardBlur = useSharedValue(reducedMotion ? 0 : 8);
  const cardHeight = useSharedValue(
    reducedMotion ? (minimized ? MINIMIZED_HEIGHT : expandedHeight) : 0,
  );

  useEffect(() => {
    if (reducedMotion) return;
    cardOpacity.value = withTiming(1, { duration: 350, easing: EASE });
    cardY.value = withTiming(0, { duration: 500, easing: EASE });
    cardBlur.value = withTiming(0, { duration: 400, easing: EASE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endReopen = useCallback(() => {
    fastReopenRef.current = false;
    setFastReopen(false);
  }, []);

  useEffect(() => {
    const target = minimized ? MINIMIZED_HEIGHT : expandedHeight;
    if (reducedMotion) {
      cardHeight.value = target;
      if (!minimized) endReopen();
      return;
    }
    const duration = minimized
      ? MODULE_MINIMIZE_MS
      : fastReopenRef.current
        ? MODULE_REOPEN_MS
        : MODULE_EXPAND_MS;
    const expanding = !minimized;
    cardHeight.value = withTiming(target, { duration, easing: EASE }, (finished?: boolean) => {
      'worklet';
      if (finished && expanding) runOnJS(endReopen)();
    });
  }, [minimized, expandedHeight, reducedMotion, cardHeight, endReopen]);

  const cardStyle = useAnimatedStyle(() => {
    const out: WebCssStyle = {
      opacity: cardOpacity.value,
      height: cardHeight.value,
      transform: [{ translateY: cardY.value }],
    };
    if (IS_WEB) out.filter = `blur(${cardBlur.value}px)`;
    return out;
  }, [cardOpacity, cardY, cardBlur, cardHeight]);

  // ---- plan ring ----------------------------------------------------------
  // This runs piecewise per step rather than one linear pass over
  // `steps × stepDuration` — the same line, and it stays honest when progress
  // is controlled.
  const ring = useSharedValue(0);
  useEffect(() => {
    if (!processingStarted) {
      ring.value = 0;
      return;
    }
    if (complete) {
      cancelAnimation(ring);
      ring.value = 1;
      return;
    }
    const from = completedCount / stepCount;
    const to = (completedCount + 1) / stepCount;
    if (reducedMotion) {
      ring.value = from;
      return;
    }
    if (paused) {
      cancelAnimation(ring);
      return;
    }
    const current = Math.min(Math.max(ring.value, from), to);
    ring.value = current;
    const remaining = safeStepDuration * ((to - current) * stepCount);
    ring.value = withTiming(to, { duration: remaining, easing: Easing.linear });
  }, [processingStarted, complete, completedCount, stepCount, paused, reducedMotion, safeStepDuration, ring]);

  const statusLabel = complete
    ? (labels?.allCompleted ?? 'All steps completed')
    : (labels?.stepsLeft ?? defaultStepsLeft)(remainingCount);

  const minimize = () => setMinimized(true);
  const expand = () => {
    fastReopenRef.current = true;
    setFastReopen(true);
    setMinimized(false);
  };

  const cardStatic: ViewStyle = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    boxShadow: palette.shadow,
  };
  const stepMask: WebCssStyle = IS_WEB
    ? {
        maskImage: hovered
          ? 'linear-gradient(to right, #000 0%, #000 68%, transparent 94%)'
          : 'linear-gradient(to right, #000 0%, #000 100%)',
        WebkitMaskImage: hovered
          ? 'linear-gradient(to right, #000 0%, #000 68%, transparent 94%)'
          : 'linear-gradient(to right, #000 0%, #000 100%)',
        transitionProperty: 'mask-image',
        transitionDuration: '300ms',
      }
    : {};
  const activeIndex = complete ? -1 : completedCount;

  return (
    <Animated.View
      aria-live="polite"
      testID={testID}
      style={[styles.card, cardStatic, style, cardStyle]}
    >
      <Presence
        show={minimized}
        initial={false}
        from={{ opacity: 0, blur: 3 }}
        exit={{ opacity: 0, blur: 3 }}
        enter={{ duration: 200, delay: 120 }}
        style={styles.fill}
      >
        <Pressable
          testID={`${testID}-minimized`}
          accessibilityRole="button"
          accessibilityLabel={labels?.expand ?? 'Expand steps'}
          onPress={expand}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={styles.bar}
          {...(IS_WEB ? ({ dataSet: { bloomAgentProgressBar: '' } } as Record<string, unknown>) : {})}
        >
          <View style={styles.barLead}>
            <RingSpacer complete={complete} />
            <StatusLabel label={statusLabel} color={palette.textSecondary} />
          </View>

          {!complete ? (
            <View style={[styles.barStep, stepMask]}>
              <CurrentStepIcon palette={palette} />
              <View style={styles.barStepText}>
                <AgentProgressLoadingText>{currentStep}</AgentProgressLoadingText>
              </View>
            </View>
          ) : null}

          <View
            aria-hidden
            pointerEvents="none"
            style={[styles.expandGlyph, { opacity: hovered ? 1 : 0 }, EXPAND_TRANSITION]}
            {...(IS_WEB ? ({ dataSet: { bloomAgentProgressExpand: '' } } as Record<string, unknown>) : {})}
          >
            <ExpandIcon palette={palette} />
          </View>
        </Pressable>
      </Presence>

      <Presence
        show={!minimized}
        from={{ opacity: 0, blur: 3 }}
        exit={{ opacity: 0, y: -4, blur: 3 }}
        enter={{ duration: fastReopen ? 160 : 220 }}
        style={[styles.expanded, { height: expandedHeight }]}
        testID={`${testID}-expanded`}
      >
        <View style={styles.expandedInner}>
          <View style={styles.header}>
            <RingSpacer complete={complete} />
            <StatusLabel label={statusLabel} color={palette.textSecondary} grow />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels?.minimize ?? 'Minimize steps'}
              onPress={minimize}
              onHoverIn={() => setMinimizeHovered(true)}
              onHoverOut={() => setMinimizeHovered(false)}
              style={[styles.minimize, { opacity: minimizeHovered ? 0.8 : 1 }]}
              testID={`${testID}-minimize`}
              {...(IS_WEB ? ({ dataSet: { bloomAgentProgressMinimize: '' } } as Record<string, unknown>) : {})}
            >
              <MinimizeIcon palette={palette} />
            </Pressable>
          </View>

          <View style={styles.steps}>
            {activeIndex >= 0 ? (
              <ActiveBorder index={activeIndex} reopening={fastReopen} palette={palette} />
            ) : null}
            {progressSteps.map((step, index) => (
              <StepRow
                key={step}
                label={step}
                index={index}
                completedCount={completedCount}
                processingStarted={processingStarted}
                reopening={fastReopen}
                stepCount={stepCount}
                stepDuration={safeStepDuration}
                palette={palette}
                testID={`${testID}-step-${index}`}
              />
            ))}
          </View>
        </View>
      </Presence>

      <Presence
        show={!complete}
        initial={false}
        from={{ opacity: 0, scale: 0.82 }}
        exit={{ opacity: 0, scale: 0.82 }}
        enter={{ duration: 250 }}
        style={styles.ring}
        pointerEvents="none"
      >
        <ArcRing
          progress={ring}
          size={RING_SIZE}
          viewBox={16}
          r={RING_R}
          circumference={RING_C}
          strokeWidth={2.5}
          track={palette.border}
          color={palette.ring}
          testID={`${testID}-ring`}
        />
      </Presence>
    </Animated.View>
  );
}

const EXPAND_TRANSITION: WebCssStyle = IS_WEB
  ? { transitionProperty: 'opacity', transitionDuration: '200ms' }
  : {};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: CARD_WIDTH,
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
  },
  barLead: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, minWidth: 0, paddingLeft: 4 },
  barStep: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 24,
  },
  barStepText: { flex: 1, minWidth: 0 },
  expandGlyph: { position: 'absolute', right: 10, top: '50%', marginTop: -10, width: 20, height: 20 },
  expanded: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  expandedInner: { paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', height: 20, width: '100%', paddingLeft: 4 },
  minimize: { width: 20, height: 20, borderRadius: 4 },
  steps: { position: 'relative', marginTop: 9, flexDirection: 'column', gap: ROW_GAP },
  ring: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 20,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AgentProgress = memo(AgentProgressComponent);
AgentProgress.displayName = 'AgentProgress';
