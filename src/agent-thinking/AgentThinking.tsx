import React, { memo, useEffect, useState } from 'react';
import { Platform, View, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { resolveButtonRamps } from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { withAlpha } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE, Text } from '../typography';
import type { AgentThinkingProps, AgentThinkingTone, AgentThinkingVariant } from './types';

/**
 * Agent Thinking: the agent "thinking" state that sits above a chat composer
 * while a response is worked on.
 *
 *   row        flex row, items centred, gap 10 (`gap-2.5`), `role="status"`
 *   wave/spin  3×3 grid of 4px dots, 2px gap, radius 1; an 80ms ticker moves a
 *              comet (trail 0.3, floor opacity 0.12) and each dot eases its
 *              opacity over 220ms
 *   stars      21×21 box, five 4-point sparkles (14px × scale) twinkling
 *              scale 0→1→0.8→0 over 1.4s, staggered 0.196s; light mode softens
 *              the glyphs to 75% of the tone
 *   infinity   32×16 figure-eight (viewBox 56×28, pulled in 4px per side), a
 *              15% track and an 11% comet lapping it every 1.2s
 *   label      `body-medium`, shimmer 2.6s (tone 55% → tone → tone 55%)
 *   timer      `caption-1-regular` mono, text-tertiary, tabular, `0.0s`
 *
 * Under reduced motion the dots rest on their seed frame, stars rest visible at
 * 0.7, the comet stops and the label drops its shimmer.
 */

const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Tone
// ---------------------------------------------------------------------------

const VARIANT_TONE: Record<AgentThinkingVariant, AgentThinkingTone> = {
  wave: 'default',
  spin: 'default',
  stars: 'subtle',
  infinity: 'default',
};

/**
 *                  light          dark
 *   subtle         neutral-400    neutral-600   (text-tertiary)
 *   default        neutral-500    neutral-500   (text-secondary)
 *   primary        text           text          (text-primary)
 *   accent         accent-500     accent-500    (blue-500)
 */
function resolveTone(theme: Theme, tone: AgentThinkingTone): string {
  const { accent, neutral } = resolveButtonRamps(theme);
  switch (tone) {
    case 'subtle':
      return theme.isDark ? neutral[600] : neutral[400];
    case 'primary':
      return theme.colors.text;
    case 'accent':
      return accent[500];
    default:
      return neutral[500];
  }
}

// ---------------------------------------------------------------------------
//  Web shimmer (the label). `background-clip: text` has no React Native
//  equivalent, so native renders the label in the flat tone — the same resting
//  state used under reduced motion.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-agent-thinking-web-css';
const LABEL_SELECTOR = '[data-bloom-agent-thinking-label]';
/**
 * `color` is `!important` because react-native-web writes the `Text`'s own
 * colour inline, and an inline declaration outranks any sheet rule without it.
 */
const WEB_CSS = `
@keyframes bloom-agent-thinking-shimmer {
  from { background-position: 200% center; }
  to { background-position: -100% center; }
}
${LABEL_SELECTOR} {
  color: transparent !important;
  background-image: linear-gradient(
    100deg,
    var(--bloom-agent-thinking-soft) 30%,
    var(--bloom-agent-thinking-tone) 50%,
    var(--bloom-agent-thinking-soft) 70%
  );
  background-position: 200% center;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: bloom-agent-thinking-shimmer 2.6s linear infinite;
  will-change: background-position;
}
@media (prefers-reduced-motion: reduce) {
  ${LABEL_SELECTOR} {
    color: var(--bloom-agent-thinking-tone) !important;
    background-image: none;
    animation: none;
  }
}
`;

type ShimmerTextStyle = TextStyle & {
  '--bloom-agent-thinking-tone'?: string;
  '--bloom-agent-thinking-soft'?: string;
};

// ---------------------------------------------------------------------------
//  Dots (wave / spin)
// ---------------------------------------------------------------------------

const DOTS_GRID = 3;
const DOTS_SIZE = 4;
const DOTS_GAP = 2;
const DOTS_TICK_MS = 80;
const DOTS_FADE_MS = 220;
const DOTS_TRAIL = 0.3;
const DOTS_MIN_OPACITY = 0.12;
const DOTS_PHASE_STEP = 1 / 8;
/** CSS `ease`. */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Static first frame, and the resting state under reduced motion. */
const DOTS_SEED = [0.55, 0.3, 0.15, 0.85, 0.55, 0.3, 1, 0.85, 0.55];

/**
 * How far along the pattern's travel direction each cell sits, in [0, 1). The
 * wave scalar is compressed below 1 so the phase wrap reads as the front leaving
 * the grid and re-entering; the spin angle is naturally cyclic.
 */
function dotScalar(variant: 'wave' | 'spin', col: number, row: number): number {
  const m = DOTS_GRID - 1;
  if (variant === 'wave') {
    return ((col + row) / (2 * m)) * (DOTS_GRID / (DOTS_GRID + 1));
  }
  const center = m / 2;
  return (Math.atan2(row - center, col - center) / (2 * Math.PI) + 1) % 1;
}

/** @internal Exported for the test. */
export function dotOpacities(variant: 'wave' | 'spin', phase: number): number[] {
  return Array.from({ length: DOTS_GRID * DOTS_GRID }, (_, i) => {
    const s = dotScalar(variant, i % DOTS_GRID, Math.floor(i / DOTS_GRID));
    // Comet: bright head at the phase front, tail fading behind it.
    const behind = (phase - s + 1) % 1;
    const lit = Math.max(0, 1 - behind / DOTS_TRAIL) ** 1.5;
    return DOTS_MIN_OPACITY + (1 - DOTS_MIN_OPACITY) * lit;
  });
}

function Dot({ opacity, color }: { opacity: number; color: string }) {
  const value = useSharedValue(opacity);
  useEffect(() => {
    value.value = withTiming(opacity, { duration: DOTS_FADE_MS, easing: EASE });
  }, [opacity, value]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: value.value }), [value]);
  return <Animated.View style={[DOT_STYLE, { backgroundColor: color }, animatedStyle]} />;
}

const DOT_STYLE: ViewStyle = { width: DOTS_SIZE, height: DOTS_SIZE, borderRadius: 1 };

function DotsIndicator({
  variant,
  color,
  reducedMotion,
}: {
  variant: 'wave' | 'spin';
  color: string;
  reducedMotion: boolean;
}) {
  const [opacities, setOpacities] = useState<number[]>(DOTS_SEED);

  useEffect(() => {
    if (reducedMotion) return;
    let phase = 0;
    const id = setInterval(() => {
      phase = (phase + DOTS_PHASE_STEP) % 1;
      setOpacities(dotOpacities(variant, phase));
    }, DOTS_TICK_MS);
    return () => clearInterval(id);
  }, [variant, reducedMotion]);

  return (
    <View aria-hidden testID="agent-thinking-dots" style={DOTS_BOX}>
      {opacities.map((opacity, i) => (
        <Dot key={i} opacity={opacity} color={color} />
      ))}
    </View>
  );
}

const DOTS_EDGE = DOTS_GRID * DOTS_SIZE + (DOTS_GRID - 1) * DOTS_GAP;
const DOTS_BOX: ViewStyle = {
  width: DOTS_EDGE,
  flexDirection: 'row',
  flexWrap: 'wrap',
  rowGap: DOTS_GAP,
  columnGap: DOTS_GAP,
  flexShrink: 0,
};

// ---------------------------------------------------------------------------
//  Stars
// ---------------------------------------------------------------------------

const STAR_PERIOD_MS = 1400;
const STAR_SIZE = 14;
const STAR_BOX = STAR_SIZE * 1.5;
const STAR_LAYOUT = [
  { x: 50, y: 46, scale: 1 },
  { x: 18, y: 22, scale: 0.55 },
  { x: 82, y: 26, scale: 0.45 },
  { x: 78, y: 76, scale: 0.55 },
  { x: 22, y: 78, scale: 0.4 },
] as const;
const STAR_PATH = 'M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z';
/** CSS `ease-in-out`, applied per keyframe segment exactly as CSS does. */
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

function Star({
  index,
  star,
  color,
  reducedMotion,
}: {
  index: number;
  star: (typeof STAR_LAYOUT)[number];
  color: string;
  reducedMotion: boolean;
}) {
  const size = STAR_SIZE * star.scale;
  const scale = useSharedValue(reducedMotion ? 1 : 0);
  const opacity = useSharedValue(reducedMotion ? 0.7 : 0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 0.7;
      return;
    }
    // Keyframes 0% (0, 0) → 40% (1, 1) → 60% (0.8, 0.9) → 100% (0, 0).
    const seg = (fraction: number) => ({ duration: STAR_PERIOD_MS * fraction, easing: EASE_IN_OUT });
    const delay = (index * STAR_PERIOD_MS * 0.7) / STAR_LAYOUT.length;
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, seg(0.4)), withTiming(0.8, seg(0.2)), withTiming(0, seg(0.4))),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, seg(0.4)), withTiming(0.9, seg(0.2)), withTiming(0, seg(0.4))),
        -1,
      ),
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [index, reducedMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }),
    [scale, opacity],
  );

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          left: (STAR_BOX * star.x) / 100 - size / 2,
          top: (STAR_BOX * star.y) / 100 - size / 2,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={STAR_PATH} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function StarsIndicator({
  color,
  reducedMotion,
}: {
  color: string;
  reducedMotion: boolean;
}) {
  return (
    <View
      aria-hidden
      testID="agent-thinking-stars"
      style={{ position: 'relative', width: STAR_BOX, height: STAR_BOX, flexShrink: 0 }}
    >
      {STAR_LAYOUT.map((star, i) => (
        <Star key={i} index={i} star={star} color={color} reducedMotion={reducedMotion} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Infinity
// ---------------------------------------------------------------------------

const AnimatedPath = Animated.createAnimatedComponent(Path);

const INFINITY_WIDTH = 32;
/** Share of the lap the comet occupies, in `pathLength=100` units. */
const INFINITY_TRAIL = 11;
const INFINITY_STROKE = 2.75;
const INFINITY_DURATION_MS = 1200;
const INFINITY_PATH = 'M28 14C33 5 47 5 47 14C47 23 33 23 28 14C23 5 9 5 9 14C9 23 23 23 28 14Z';
/**
 * The figure-eight's real length in viewBox units (four cubics, measured).
 * Normalising with `pathLength={100}` is not honoured by react-native-svg on
 * every platform, so the dash is scaled to this length instead.
 */
const INFINITY_LENGTH = 101.2956;

function InfinityIndicator({
  color,
  reducedMotion,
}: {
  color: string;
  reducedMotion: boolean;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      offset.value = 0;
      return;
    }
    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-INFINITY_LENGTH, { duration: INFINITY_DURATION_MS, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(offset);
  }, [reducedMotion, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }), [offset]);
  const dash = (INFINITY_TRAIL / 100) * INFINITY_LENGTH;

  return (
    <View
      aria-hidden
      testID="agent-thinking-infinity"
      // The figure-eight spans x 9–47 of the 56-wide viewBox, so the box carries
      // ~4px of dead space per side at this width; pull it back in so the label
      // sits at the loader's real gap.
      style={{
        width: INFINITY_WIDTH,
        height: INFINITY_WIDTH / 2,
        marginLeft: -4,
        marginRight: -4,
        flexShrink: 0,
      }}
    >
      <Svg width={INFINITY_WIDTH} height={INFINITY_WIDTH / 2} viewBox="0 0 56 28" fill="none">
        <Path
          d={INFINITY_PATH}
          fill="none"
          stroke={color}
          strokeWidth={INFINITY_STROKE}
          opacity={0.15}
        />
        <AnimatedPath
          d={INFINITY_PATH}
          fill="none"
          stroke={color}
          strokeWidth={INFINITY_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${INFINITY_LENGTH - dash}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Timer
// ---------------------------------------------------------------------------

const MONO_FAMILY = IS_WEB ? 'var(--bloom-font-mono)' : 'JetBrains Mono';

function ElapsedTimer({ color }: { color: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - started) / 1000), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <Text
      testID="agent-thinking-timer"
      variant="caption-1-regular"
      style={{ color, fontFamily: MONO_FAMILY, fontVariant: ['tabular-nums'] }}
    >
      {`${elapsed.toFixed(1)}s`}
    </Text>
  );
}

// ---------------------------------------------------------------------------
//  Loader
// ---------------------------------------------------------------------------

function AgentThinkingComponent({
  variant = 'wave',
  label = 'Thinking',
  tone,
  shimmer = true,
  showTimer = true,
  style,
  testID,
}: AgentThinkingProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const color = resolveTone(theme, tone ?? VARIANT_TONE[variant]);
  // Read at render, not import, so a host that flips `Platform.OS` (tests) is honoured.
  const shimmering = Platform.OS === 'web' && shimmer;

  useEffect(() => {
    if (shimmering) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, [shimmering]);

  const labelStyle: ShimmerTextStyle = shimmering
    ? {
        ...TYPE_SCALE['body-medium'],
        color,
        '--bloom-agent-thinking-tone': color,
        '--bloom-agent-thinking-soft': withAlpha(color, 0.55),
      }
    : { ...TYPE_SCALE['body-medium'], color };

  return (
    <View
      role="status"
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}
    >
      {(variant === 'wave' || variant === 'spin') && (
        <DotsIndicator variant={variant} color={color} reducedMotion={reducedMotion} />
      )}
      {variant === 'stars' && (
        <StarsIndicator
          // Light mode softens the glyphs (not the label) to 75% of the tone:
          // they read heavier than the dot grids there. Dark keeps the full tone.
          color={theme.isDark ? color : withAlpha(color, 0.75)}
          reducedMotion={reducedMotion}
        />
      )}
      {variant === 'infinity' && (
        <InfinityIndicator color={color} reducedMotion={reducedMotion} />
      )}
      <Text
        testID={testID ? `${testID}-label` : undefined}
        style={labelStyle}
        {...(shimmering
          ? ({ dataSet: { bloomAgentThinkingLabel: '' } } as Record<string, unknown>)
          : {})}
      >
        {label}
      </Text>
      {showTimer && <ElapsedTimer color={resolveTone(theme, 'subtle')} />}
    </View>
  );
}

export const AgentThinking = memo(AgentThinkingComponent);
AgentThinking.displayName = 'AgentThinking';
