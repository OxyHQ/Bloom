import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Text as RNText,
  View,
  type LayoutChangeEvent,
  type TextStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AgentThinking } from '../agent-thinking';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import {
  AGENT_LOG_BRANCH,
  AGENT_LOG_ROW_INDENT,
  AGENT_LOG_SOFT_EASE,
  AGENT_LOG_UNIT_MOTION,
} from './constants';
import type {
  AgentLogGuideBridgeProps,
  AgentLogRevealProps,
  AgentLogRowConnectorProps,
  AgentLogRowProps,
  AgentLogShimmerTextProps,
  AgentLogWorkingRowProps,
} from './types';
import { useAgentLogMotion } from './use-agent-log-motion';

/**
 * The shared machinery behind a streaming agent transcript. Task List and Web
 * Search are both "a line of work drawing itself down the page": rows arrive
 * one at a time, each blurring in while a curved guide strokes itself
 * alongside them. All of that lives here so the two cannot drift apart.
 *
 * What is here: the reveal ticker that paces units (`useAgentLogRevealTicker`),
 * the blur-in reveal and its soft clipping edge (`AgentLogReveal`), the shimmer
 * for a line still in progress (`AgentLogShimmerText`), and the tree guide with
 * its draw animation (`AgentLogRow`, `AgentLogRowConnector`,
 * `AgentLogGuideBridge`). What is not here: anything about what a row SAYS.
 *
 * Platform notes: the 6px blur and the soft mask edge are web-only (React Native
 * has no cross-platform `filter: blur` or `mask-image`); native keeps the height,
 * opacity and lift. The label shimmer is web-only too (`background-clip: text`);
 * native shows the flat text-secondary it rests on under reduced motion.
 */

const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

/** Canonical theme surfaces, foregrounds and focus roles. */
function resolveLogPalette(theme: Theme) {
  return {
    guide: theme.colors.border,
    textSecondary: theme.colors.textSecondary,
    textPrimary: theme.colors.text,
  };
}

// ---------------------------------------------------------------------------
//  Reveal
// ---------------------------------------------------------------------------

/**
 * The reveal gradient. The transparent stop sits just past the box: with
 * both stops at exactly 100% the gradient is degenerate and browsers soften the
 * final pixel row, which shows up as breaks in the guide where rows meet.
 */
function revealMask(fadePx: number): string {
  return `linear-gradient(to bottom, #000 calc(100% - ${fadePx}px), transparent calc(100% + 1px))`;
}

const HIDDEN_CLIP: WebCssStyle = { overflow: 'hidden' };

/**
 * One unit of a log blurring in as it lands: 6px of blur and a 4px lift
 * resolving over 420ms, height growing from 0 over 380ms — the container settles
 * first, then the words arrive — and a 22px soft bottom edge (web) resolving over
 * 440ms so the row is faintest exactly where it is being clipped. Once settled,
 * the mask and blur are dropped entirely and the height goes back to `auto`.
 *
 * The outer node is the clip; `style` lands on the content box inside it.
 */
function AgentLogRevealComponent({
  children,
  reduce: reduceProp,
  role,
  onRevealed,
  style,
  testID,
}: AgentLogRevealProps) {
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;
  // Decided at mount: a unit that mounted settled never animates afterwards.
  const [animate] = useState(!reduce);
  const [revealing, setRevealing] = useState(animate);

  const reveal = useSharedValue(animate ? 0 : 1);
  const grow = useSharedValue(animate ? 0 : 1);
  const fade = useSharedValue(animate ? 0 : 1);
  const measured = useSharedValue(0);

  const settle = useCallback(() => {
    setRevealing(false);
    onRevealed?.();
  }, [onRevealed]);

  useEffect(() => {
    if (!animate) return;
    const { heightMs, revealMs, fadeMs } = AGENT_LOG_UNIT_MOTION;
    reveal.value = withTiming(1, { duration: revealMs, easing: AGENT_LOG_SOFT_EASE });
    grow.value = withTiming(1, { duration: heightMs, easing: AGENT_LOG_SOFT_EASE });
    fade.value = withTiming(1, { duration: fadeMs, easing: AGENT_LOG_SOFT_EASE }, (finished) => {
      'worklet';
      if (finished) runOnJS(settle)();
    });
    // Mount-only: the reveal plays once per unit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );

  const animatedStyle = useAnimatedStyle((): WebCssStyle => {
    const { liftPx, blurPx, fadePx } = AGENT_LOG_UNIT_MOTION;
    const base: WebCssStyle = {
      opacity: reveal.value,
      transform: [{ translateY: liftPx * (1 - reveal.value) }],
      height: grow.value >= 1 ? 'auto' : grow.value * measured.value,
    };
    if (!IS_WEB) return base;
    // Settled: drop the mask and blur outright (written as `none`, not omitted —
    // reanimated's web path never clears a key a later frame leaves out).
    if (fade.value >= 1) return { ...base, filter: 'none', maskImage: 'none', WebkitMaskImage: 'none' };
    const mask = revealMask(fadePx * (1 - fade.value));
    return {
      ...base,
      filter: `blur(${blurPx * (1 - reveal.value)}px)`,
      maskImage: mask,
      WebkitMaskImage: mask,
    };
  }, [reveal, grow, fade, measured]);

  return (
    <Animated.View
      testID={testID}
      role={role === 'listitem' ? 'listitem' : undefined}
      style={[HIDDEN_CLIP, animatedStyle]}
    >
      <View onLayout={revealing ? onLayout : undefined} style={style}>
        {children}
      </View>
    </Animated.View>
  );
}

export const AgentLogReveal = memo(AgentLogRevealComponent);
AgentLogReveal.displayName = 'AgentLogReveal';

// ---------------------------------------------------------------------------
//  Tree guide
// ---------------------------------------------------------------------------

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { y: BRANCH_Y, radius: BRANCH_RADIUS, width: BRANCH_WIDTH } = AGENT_LOG_BRANCH;

/** Down the trunk, round the corner, out to the label. */
const BRANCH_PATH = `M0.5 0 V${BRANCH_Y - BRANCH_RADIUS} Q0.5 ${BRANCH_Y} ${0.5 + BRANCH_RADIUS} ${BRANCH_Y} H11.5`;
/** The branch's length (8 down + the quadratic corner + 5 out), measured. */
const BRANCH_LENGTH = 22.7394;

/**
 * The guide draws as one pen, so the pieces run in sequence: when a row arrives
 * the row above's tail draws first (120ms) down through the space just opened,
 * then the new row's branch (140ms) picks the stroke up where the tail left it.
 * Both are `linear` at one pen speed (~160px/s) so the stroke never changes pace
 * at a junction. The first branch in a list has no tail to wait for.
 */
const TAIL_MS = 120;
const BRANCH_MS = 140;

/**
 * The curved guide for one row, drawn per row rather than as one measured SVG,
 * so rows of variable, animating height stay correct with no measurement. Two
 * pieces, because a single stroke cannot fork: the branch is an SVG path drawing
 * itself; the trunk below it is a 1px bar scaling from its top edge to meet the
 * next row's branch. The last row omits the trunk so the guide finishes on the
 * corner. Rendered by `AgentLogRow`; exported for rows that build their own.
 */
function AgentLogRowConnectorComponent({ first, last, reduce: reduceProp }: AgentLogRowConnectorProps) {
  const theme = useTheme();
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;
  const { guide } = resolveLogPalette(theme);

  const [animate] = useState(!reduce);
  const draw = useSharedValue(animate ? 0 : 1);
  const trunk = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    draw.value = withDelay(
      first ? 0 : TAIL_MS,
      withTiming(1, { duration: BRANCH_MS, easing: Easing.linear }),
    );
    trunk.value = withTiming(1, { duration: TAIL_MS, easing: Easing.linear });
    // Mount-only, like the reveal it rides with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const branchProps = useAnimatedProps(
    () => ({ strokeDashoffset: BRANCH_LENGTH * (1 - draw.value) }),
    [draw],
  );
  const trunkStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: trunk.value }] }), [trunk]);

  return (
    <View
      aria-hidden
      pointerEvents="none"
      testID="agent-log-row-connector"
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 12 }}
    >
      <Svg
        width={BRANCH_WIDTH}
        height={BRANCH_Y + 1}
        viewBox={`0 0 ${BRANCH_WIDTH} ${BRANCH_Y + 1}`}
        fill="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <AnimatedPath
          d={BRANCH_PATH}
          stroke={guide}
          strokeWidth={1}
          strokeDasharray={`${BRANCH_LENGTH} ${BRANCH_LENGTH}`}
          animatedProps={branchProps}
        />
      </Svg>
      {!last && (
        <Animated.View
          testID="agent-log-row-trunk"
          style={[
            {
              position: 'absolute',
              left: 0,
              width: 1,
              top: BRANCH_Y - BRANCH_RADIUS,
              bottom: 0,
              backgroundColor: guide,
              transformOrigin: 'top',
            },
            trunkStyle,
          ]}
        />
      )}
    </View>
  );
}

export const AgentLogRowConnector = memo(AgentLogRowConnectorComponent);
AgentLogRowConnector.displayName = 'AgentLogRowConnector';

/**
 * Drops from a parent row's glyph into a nested list's trunk. A second level of
 * the tree indents so its trunk sits under the parent's glyph, but that trunk
 * begins at the top of the nested row, below the parent's line — left alone it
 * starts in mid-air. This fills the gap, on the tail's timing; give the nested
 * list's first row `first={false}` so its branch waits for exactly this.
 *
 * Render it inside a `position: relative` wrapper directly above the nested
 * list, with the same `offset` as that list's left margin.
 */
function AgentLogGuideBridgeComponent({ height, offset = 8, reduce: reduceProp }: AgentLogGuideBridgeProps) {
  const theme = useTheme();
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;
  const { guide } = resolveLogPalette(theme);

  const [animate] = useState(!reduce);
  const scale = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    scale.value = withTiming(1, { duration: TAIL_MS, easing: Easing.linear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }), [scale]);

  return (
    <Animated.View
      aria-hidden
      pointerEvents="none"
      testID="agent-log-guide-bridge"
      style={[
        {
          position: 'absolute',
          width: 1,
          top: -height,
          height,
          left: offset,
          backgroundColor: guide,
          transformOrigin: 'top',
        },
        animatedStyle,
      ]}
    />
  );
}

export const AgentLogGuideBridge = memo(AgentLogGuideBridgeComponent);
AgentLogGuideBridge.displayName = 'AgentLogGuideBridge';

/**
 * One row of a log: the reveal, and the length of guide that belongs to it.
 * Content box: `position: relative`, 16px left inset for the guide.
 */
function AgentLogRowComponent({ first, last, reduce, style, children, testID }: AgentLogRowProps) {
  return (
    <AgentLogReveal
      reduce={reduce}
      role="listitem"
      testID={testID}
      style={[{ position: 'relative', paddingLeft: AGENT_LOG_ROW_INDENT }, style]}
    >
      <AgentLogRowConnector first={first} last={last} reduce={reduce} />
      {children}
    </AgentLogReveal>
  );
}

export const AgentLogRow = memo(AgentLogRowComponent);
AgentLogRow.displayName = 'AgentLogRow';

/**
 * The tail indicator while the log is still running: the `stars` thinking
 * state, 4px above and below, revealed like any unit. Deliberately OFF the
 * guide — the tree records what the agent did, and this line has not happened
 * yet; sitting loose on the rows' left edge it reads as the log still going.
 */
function AgentLogWorkingRowComponent({ label, reduce, style, testID }: AgentLogWorkingRowProps) {
  return (
    <AgentLogReveal reduce={reduce} testID={testID} style={style}>
      <View style={{ paddingTop: 4, paddingBottom: 4 }}>
        <AgentThinking variant="stars" label={label} />
      </View>
    </AgentLogReveal>
  );
}

export const AgentLogWorkingRow = memo(AgentLogWorkingRowComponent);
AgentLogWorkingRow.displayName = 'AgentLogWorkingRow';

// ---------------------------------------------------------------------------
//  Shimmer
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-agent-log-web-css';
const SHIMMER_SELECTOR = '[data-bloom-agent-log-shimmer]';
/**
 * The shimmer text: text-secondary with a text-primary highlight travelling
 * across it every 3.4s. `color` is `!important` because react-native-web
 * writes the text's own colour inline.
 */
const WEB_CSS = `
@keyframes bloom-agent-log-shimmer {
  from { background-position: 200% center; }
  to { background-position: -100% center; }
}
${SHIMMER_SELECTOR} {
  color: transparent !important;
  background-image: linear-gradient(
    100deg,
    var(--bloom-agent-log-secondary) 16%,
    var(--bloom-agent-log-secondary) 38%,
    var(--bloom-agent-log-primary) 50%,
    var(--bloom-agent-log-secondary) 62%,
    var(--bloom-agent-log-secondary) 84%
  );
  background-position: 200% center;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: bloom-agent-log-shimmer 3.4s linear infinite;
  will-change: background-position;
}
@media (prefers-reduced-motion: reduce) {
  ${SHIMMER_SELECTOR} {
    color: var(--bloom-agent-log-secondary) !important;
    background-image: none;
    animation: none;
  }
}
`;

type ShimmerStyle = TextStyle & {
  '--bloom-agent-log-secondary'?: string;
  '--bloom-agent-log-primary'?: string;
};

/**
 * A line the agent is still working on, with a highlight travelling across it.
 *
 * A bare React Native `Text`, so it NESTS: render it inside the row's own
 * `Text` and it inherits that text's size, weight and font — the same way a
 * `<span>` inherits its paragraph's `text-body-regular`.
 */
function AgentLogShimmerTextComponent({ children, style }: AgentLogShimmerTextProps) {
  const theme = useTheme();
  const { textSecondary, textPrimary } = resolveLogPalette(theme);

  useEffect(() => {
    if (Platform.OS === 'web') adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  const isWeb = Platform.OS === 'web';
  const shimmerStyle: ShimmerStyle = isWeb
    ? {
        color: textSecondary,
        '--bloom-agent-log-secondary': textSecondary,
        '--bloom-agent-log-primary': textPrimary,
      }
    : { color: textSecondary };

  return (
    <RNText
      style={[shimmerStyle, style]}
      {...(isWeb ? ({ dataSet: { bloomAgentLogShimmer: '' } } as Record<string, unknown>) : {})}
    >
      {children}
    </RNText>
  );
}

export const AgentLogShimmerText = memo(AgentLogShimmerTextComponent);
AgentLogShimmerText.displayName = 'AgentLogShimmerText';
