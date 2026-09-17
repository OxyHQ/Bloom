import React, { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AgentProgressLoadingText } from '../agent-progress';
import { withAlpha } from '../composer-panel/shared';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { AiChatFeedbackRowBase } from './AiChatFeedbackRowBase';
import { RevealFade, RevealLine, RevealSequence } from './AiChatReveal';
import { CARD_RADIUS, dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss, type AiChatPalette } from './shared';
import type { AiChatImageGenerationProps } from './types';

const FRAME_WIDTH = 200;
const FRAME_HEIGHT = 250;
const EASE_QUINT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE_STANDARD = Easing.bezier(0.4, 0, 0.2, 1);

const DEFAULT_LABELS = {
  generated: 'Image generated',
  generating: 'Generating image',
  remaining: (seconds: number) => `${seconds} seconds remaining`,
  likeToast: 'Thanks for the feedback',
  dislikeToast: "Thanks — we'll use this to improve",
};

// ---------------------------------------------------------------------------
//  Dot wave
// ---------------------------------------------------------------------------

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** The ripple energy: rings expanding from the centre every 1.3s, fading in and out. */
function energyAt(x: number, y: number, elapsedSeconds: number, aspect: number) {
  const dx = (x - 0.5) * aspect;
  const dy = y - 0.5;
  const coordinate = Math.sqrt(dx * dx + dy * dy) / 0.5;
  const duration = 1.8 / 0.7;
  const sigma = 0.34 * 0.22;
  const newestAge = elapsedSeconds % 1.3;
  const visibleWaveCount = Math.ceil(duration / 1.3) + 1;
  let combined = 0;
  for (let wave = 0; wave < visibleWaveCount; wave += 1) {
    const progress = (newestAge + wave * 1.3) / duration;
    if (progress > 1) continue;
    const distance = coordinate - progress;
    const ring = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    combined += ring * smoothstep(0, 0.1, progress) * (1 - smoothstep(0.62, 1, progress));
  }
  return Math.min(1, combined);
}

interface DotGrid {
  columns: number;
  rows: number;
  offsetX: number;
  offsetY: number;
}

const SPACING = 9;

function dotGrid(width: number, height: number): DotGrid {
  const columns = Math.ceil(width / SPACING) + 1;
  const rows = Math.ceil(height / SPACING) + 1;
  return {
    columns,
    rows,
    offsetX: (width - (columns - 1) * SPACING) / 2,
    offsetY: (height - (rows - 1) * SPACING) / 2,
  };
}

/**
 * The generating canvas (web): a 9px dot grid whose dots swell and brighten as
 * rings of "energy" ripple out from the centre — icon-primary where a ring
 * passes, icon-quaternary elsewhere, faded at the edges. Reduced motion holds a
 * still field.
 */
function DotWaveCanvas({ palette, running }: { palette: AiChatPalette; running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = useRef({ active: palette.iconPrimary, neutral: palette.iconQuaternary });
  colors.current = { active: palette.iconPrimary, neutral: palette.iconQuaternary };
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !running) return;
    const startedAt = performance.now();
    let frame = 0;
    let stopped = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = FRAME_WIDTH;
    const height = FRAME_HEIGHT;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grid = dotGrid(width, height);

    const draw = (now: number) => {
      if (stopped) return;
      const elapsed = (now - startedAt) / 1000;
      const { active, neutral } = colors.current;
      context.clearRect(0, 0, width, height);
      for (let row = 0; row < grid.rows; row += 1) {
        const py = grid.offsetY + row * SPACING;
        const ny = py / height;
        for (let column = 0; column < grid.columns; column += 1) {
          const px = grid.offsetX + column * SPACING;
          const nx = px / width;
          const energy = reducedMotion ? 0.24 : energyAt(nx, ny, elapsed, width / height);
          const edgeFade = Math.min(1, nx * 7, (1 - nx) * 7, ny * 7, (1 - ny) * 7);
          context.globalAlpha = Math.max(0, edgeFade * (0.08 + energy * 0.68 * 0.92));
          context.fillStyle = energy > 0.22 ? active : neutral;
          context.beginPath();
          context.arc(px, py, 0.72 + energy * 0.48, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
    };
  }, [running, reducedMotion]);

  return createElement('canvas', {
    ref: canvasRef,
    'aria-hidden': true,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  });
}

/** Native: the same field, still (react-native-svg has no per-frame canvas). */
function DotField({ palette }: { palette: AiChatPalette }) {
  const grid = useMemo(() => dotGrid(FRAME_WIDTH, FRAME_HEIGHT), []);
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const px = grid.offsetX + column * SPACING;
      const py = grid.offsetY + row * SPACING;
      const nx = px / FRAME_WIDTH;
      const ny = py / FRAME_HEIGHT;
      const edgeFade = Math.min(1, nx * 7, (1 - nx) * 7, ny * 7, (1 - ny) * 7);
      const opacity = Math.max(0, edgeFade * (0.08 + 0.24 * 0.68 * 0.92));
      dots.push(<Circle key={`${row}-${column}`} cx={px} cy={py} r={0.84} fill={palette.iconQuaternary} opacity={opacity} />);
    }
  }
  return (
    <Svg width={FRAME_WIDTH} height={FRAME_HEIGHT} style={{ position: 'absolute', top: 0, left: 0 }}>
      {dots}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
//  Split-flap countdown
// ---------------------------------------------------------------------------

/** Half of a flap card: the whole glyph in a 16px line box, clipped to its top or bottom 8px. */
function FlapHalf({ digit, half, palette }: { digit: string; half: 'top' | 'bottom'; palette: AiChatPalette }) {
  return (
    <View style={{ height: 8, overflow: 'hidden', backgroundColor: palette.tertiary }}>
      <Text
        variant="body-2-medium"
        style={{
          height: 16,
          lineHeight: 16,
          marginTop: half === 'bottom' ? -8 : 0,
          textAlign: 'center',
          color: palette.textSecondary,
          fontVariant: ['tabular-nums'],
        }}>
        {digit}
      </Text>
    </View>
  );
}

/** Native leaf: `flap-fall` (150ms ease-in to −90°) or `flap-rise` (230ms, from 90° with a slap past 0°, 150ms late). */
function NativeLeaf({ kind, children }: { kind: 'fall' | 'rise'; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const angle = useSharedValue(kind === 'fall' ? 0 : 90);
  useEffect(() => {
    if (reducedMotion) {
      angle.value = kind === 'fall' ? -90 : 0;
      return;
    }
    angle.value =
      kind === 'fall'
        ? withTiming(-90, { duration: 150, easing: Easing.bezier(0.55, 0, 0.9, 0.35) })
        : withDelay(150, withTiming(0, { duration: 230, easing: Easing.bezier(0.25, 0.7, 0.35, 1) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(
    () => ({
      transform: [{ perspective: 70 }, { rotateX: `${angle.value}deg` }],
    }),
    [angle],
  );
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          ...(kind === 'fall' ? { top: 0 } : { bottom: 0 }),
          transformOrigin: kind === 'fall' ? 'bottom' : 'top',
          backfaceVisibility: 'hidden',
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * One split-flap card (11 wide, radius 3, background-tertiary). Two static halves
 * hold the new digit's top and the old digit's bottom; on a change two leaves
 * swing over them — the old top falls, the new bottom rises — re-keyed so every
 * tick restarts both.
 */
function FlapDigit({ digit, palette }: { digit: string; palette: AiChatPalette }) {
  const [flip, setFlip] = useState({ settled: digit, from: digit, key: 0 });
  if (flip.settled !== digit) {
    setFlip({ settled: digit, from: flip.settled, key: flip.key + 1 });
  }
  const stale = flip.settled !== digit;
  const leaving = stale ? flip.settled : flip.from;
  const flipKey = stale ? flip.key + 1 : flip.key;

  return (
    <View
      {...dataHook('bloomAiChatFlapCard')}
      style={{ position: 'relative', width: 11, overflow: 'hidden', borderRadius: 3, backgroundColor: palette.tertiary }}>
      <FlapHalf digit={digit} half="top" palette={palette} />
      <FlapHalf digit={leaving} half="bottom" palette={palette} />
      {flipKey > 0 ? (
        <View key={flipKey} pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {IS_WEB ? (
            <>
              <View {...dataHook('bloomAiChatFlap', 'fall')} style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
                <FlapHalf digit={leaving} half="top" palette={palette} />
              </View>
              <View {...dataHook('bloomAiChatFlap', 'rise')} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
                <FlapHalf digit={digit} half="bottom" palette={palette} />
              </View>
            </>
          ) : (
            <>
              <NativeLeaf kind="fall">
                <FlapHalf digit={leaving} half="top" palette={palette} />
              </NativeLeaf>
              <NativeLeaf kind="rise">
                <FlapHalf digit={digit} half="bottom" palette={palette} />
              </NativeLeaf>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function FlapCountdown({ seconds, label, palette }: { seconds: number; label: string; palette: AiChatPalette }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {String(seconds)
        .split('')
        .map((digit, index) => (
          <FlapDigit key={index} digit={digit} palette={palette} />
        ))}
      <Text variant="body-2-medium" style={{ color: palette.textTertiary }}>
        s
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Frame
// ---------------------------------------------------------------------------

/** A transient toast over the image's bottom edge, rising 8px in and out (420ms). */
function FrameToast({ message, leaving, palette }: { message: string; leaving: boolean; palette: AiChatPalette }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    const target = leaving ? 0 : 1;
    progress.value = reducedMotion ? target : withTiming(target, { duration: 420, easing: EASE_QUINT });
  }, [leaving, reducedMotion, progress]);
  const animated = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: 8 * (1 - progress.value) }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${4 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  const surface: WebCssStyle = {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: withAlpha(palette.neutral[950], 0.8),
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };
  return (
    <Animated.View role="status" style={[surface, animated]}>
      <Text variant="body-2-medium" style={{ textAlign: 'center', color: '#ffffff' }}>
        {message}
      </Text>
    </Animated.View>
  );
}

/** Opacity (and on web the blur) of a layer that eases between two states. */
function useEased(target: number, duration: number, easing = EASE_STANDARD) {
  const reducedMotion = useReducedMotion();
  const value = useSharedValue(target);
  useEffect(() => {
    value.value = reducedMotion ? target : withTiming(target, { duration, easing });
  }, [target, duration, easing, reducedMotion, value]);
  return value;
}

/**
 * An image generation reply (`ImageGenerationResponse`): an image
 * generating in the thread.
 *
 *   header    "Image generated" (body-regular text-primary) once it lands
 *   frame     unfolds from 0 to 250 tall (550ms `cubic-bezier(0.22, 1, 0.36, 1)`)
 *             while it fades in and un-blurs 6px (350ms ease-out), pushing the
 *             thread up instead of popping in
 *   card      200×250, radius 16, background-primary, shadow-card, clipped:
 *             the dot-wave field; along the bottom (inset 12) "Generating image"
 *             shimmering in body-2-medium text-tertiary against a split-flap
 *             countdown of the whole seconds left (`4s`, `3s`…), both fading out
 *             (300ms) as the artwork lands
 *   reveal    web: a radial mask feathered 26% wide sweeps from the centre to
 *             132% while the image fades in and un-blurs 10px (1550ms
 *             `cubic-bezier(0.4, 0, 0.2, 1)`); native: the fade alone
 *   feedback  rises 4px in under the landed image (250ms); like / dislike raise
 *             a toast over the image's bottom edge for 2.2s
 */
export function AiChatImageGenerationBase({
  source,
  alt,
  duration = 4000,
  ready: readyProp,
  onGenerated,
  hideHeader = false,
  onLike,
  onDislike,
  onCopy,
  labels,
  feedbackLabels,
  style,
  testID,
}: AiChatImageGenerationProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const reducedMotion = useReducedMotion();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [timedReady, setTimedReady] = useState(false);
  const ready = readyProp ?? timedReady;
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(duration / 1000));
  const [toasts, setToasts] = useState<{ message: string; key: number; leaving: boolean }[]>([]);
  const toastKey = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGeneratedRef = useRef(onGenerated);
  onGeneratedRef.current = onGenerated;
  const firedRef = useRef(false);

  // The scripted clock: whole seconds left, then the landing.
  useEffect(() => {
    if (readyProp !== undefined) return;
    const startedAt = Date.now();
    let shown = Math.ceil(duration / 1000);
    const tick = setInterval(() => {
      const next = Math.ceil(Math.max(0, duration - (Date.now() - startedAt)) / 1000);
      if (next !== shown) {
        shown = next;
        setSecondsLeft(next);
      }
    }, 50);
    const done = setTimeout(() => {
      clearInterval(tick);
      setSecondsLeft(0);
      setTimedReady(true);
    }, duration);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [duration, readyProp]);

  useEffect(() => {
    if (!ready || firedRef.current) return;
    firedRef.current = true;
    onGeneratedRef.current?.();
  }, [ready]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // `AnimatePresence`: a replaced or expired toast plays its exit (420ms) before it unmounts.
  const retire = useCallback((key: number) => {
    setToasts((list) => list.map((t) => (t.key === key ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.key !== key)), 420);
  }, []);
  const showToast = useCallback(
    (message: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastKey.current += 1;
      const key = toastKey.current;
      setToasts((list) => {
        for (const t of list) if (!t.leaving) setTimeout(() => retire(t.key), 0);
        return [...list, { message, key, leaving: false }];
      });
      toastTimer.current = setTimeout(() => retire(key), 2200);
    },
    [retire],
  );

  // Unfold.
  const unfold = useSharedValue(reducedMotion ? 1 : 0);
  const unfoldFade = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    unfold.value = withTiming(1, { duration: 550, easing: EASE_QUINT });
    unfoldFade.value = withTiming(1, { duration: 350, easing: EASE_OUT });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const frameStyle = useAnimatedStyle(
    () => ({
      height: FRAME_HEIGHT * unfold.value,
      opacity: unfoldFade.value,
      ...(IS_WEB ? { filter: unfoldFade.value >= 1 ? 'none' : `blur(${6 * (1 - unfoldFade.value)}px)` } : null),
    }),
    [unfold, unfoldFade],
  );

  const status = useEased(ready ? 0 : 1, 300);
  const statusStyle = useAnimatedStyle(() => ({ opacity: status.value }), [status]);
  const nativeReveal = useEased(ready ? 1 : 0, 1550);
  const nativeRevealStyle = useAnimatedStyle(() => ({ opacity: nativeReveal.value }), [nativeReveal]);
  const feedback = useSharedValue(0);
  useEffect(() => {
    if (!ready) return;
    feedback.value = reducedMotion ? 1 : withTiming(1, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [ready, reducedMotion, feedback]);
  const feedbackStyle = useAnimatedStyle(
    () => ({ opacity: feedback.value, transform: [{ translateY: 4 * (1 - feedback.value) }] }),
    [feedback],
  );

  return (
    <RevealFade animate testID={testID} style={[{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }, style]}>
      {!hideHeader ? (
        <RevealSequence animate>
          <RevealLine>
            <View style={{ width: FRAME_WIDTH, flexDirection: 'row', alignItems: 'baseline' }}>
              {ready ? (
                <Text variant="body-regular" style={{ color: palette.text }}>
                  {l.generated}
                </Text>
              ) : null}
            </View>
          </RevealLine>
        </RevealSequence>
      ) : null}

      <Animated.View style={[{ width: FRAME_WIDTH, overflow: 'hidden' }, frameStyle]}>
        <View
          aria-live="polite"
          accessibilityLabel={ready ? `Generated image: ${alt}` : l.generating}
          style={{
            position: 'relative',
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            overflow: 'hidden',
            borderRadius: CARD_RADIUS,
            backgroundColor: palette.primary,
            boxShadow: palette.shadowCard,
          }}>
          {IS_WEB ? (
            <View
              {...dataHook('bloomAiChatFade')}
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: ready ? 0 : 1 }}>
              <DotWaveCanvas palette={palette} running={!ready} />
            </View>
          ) : ready ? null : (
            <DotField palette={palette} />
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              },
              statusStyle,
            ]}>
            <AgentProgressLoadingText variant="body-2-medium" style={{ color: palette.textTertiary }}>
              {l.generating}
            </AgentProgressLoadingText>
            <FlapCountdown seconds={secondsLeft} label={l.remaining(secondsLeft)} palette={palette} />
          </Animated.View>

          {IS_WEB ? (
            <View
              {...dataHook('bloomAiChatReveal', ready ? 'shown' : '')}
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image source={source} accessibilityLabel={alt} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          ) : (
            <Animated.View
              pointerEvents="none"
              style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, nativeRevealStyle]}>
              <Image source={source} accessibilityLabel={alt} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </Animated.View>
          )}

          {toasts.map((t) => (
            <FrameToast key={t.key} message={t.message} leaving={t.leaving} palette={palette} />
          ))}
        </View>
      </Animated.View>

      {ready ? (
        <Animated.View style={feedbackStyle}>
          <AiChatFeedbackRowBase
            labels={feedbackLabels}
            onLike={() => {
              onLike?.();
              showToast(l.likeToast);
            }}
            onDislike={() => {
              onDislike?.();
              showToast(l.dislikeToast);
            }}
            onCopy={onCopy}
            testID={testID ? `${testID}-feedback` : undefined}
          />
        </Animated.View>
      ) : null}
    </RevealFade>
  );
}
