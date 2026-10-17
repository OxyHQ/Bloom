import {
  type ComponentRef,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from 'react';
import { Platform, useWindowDimensions, type View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AgentAvatar } from '../agent-avatar';
import { OverlayRoot } from '../overlay';
import { StyledImage, StyledView } from '../styles/styled-primitives';
import { avatarFlightPoint, measureAvatar } from './geometry';
import type { ActiveAvatarFlight, AvatarFlightLayerState, AvatarRect } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const DEFAULT_DURATION = 800;
/** The last stretch of a merging flight, over which the avatar fades out. */
const MERGE_FADE_FROM = 0.78;
/** Frames the target may take to mount before its flight is given up. */
const SETTLE_FRAMES = 60;
/** Frames the target is followed for after that, while its layout moves. */
const TRACK_FRAMES = 90;

/** What an avatar looks like in the air: the picture it left as, or a still render of its character. */
function Figure({ flight, paused = true }: { flight: ActiveAvatarFlight; paused?: boolean }) {
  const { width, height } = flight.from;
  return flight.snapshot ? (
    <StyledImage
      source={flight.snapshot}
      accessible={false}
      contentFit="contain"
      style={{ width, height }}
    />
  ) : (
    <AgentAvatar character={flight.spec.character} paused={paused} size={width} />
  );
}

function FlyingAvatar({
  flight,
  target,
  onArrive,
}: {
  flight: ActiveAvatarFlight;
  target: AvatarRect;
  onArrive: (key: string) => void;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const { from, spec } = flight;
  const { key, merge = false, path = 'arc', ease = 'linear' } = spec;
  const duration = spec.duration ?? DEFAULT_DURATION;
  const delay = spec.delay ?? 0;
  const arc = path === 'arc';

  useEffect(() => {
    progress.value = withDelay(
      reduced ? 0 : delay,
      withTiming(
        1,
        { duration: reduced ? 0 : duration, easing: ease === 'out' ? EASE_OUT : Easing.linear },
        (finished) => {
          if (finished) runOnJS(onArrive)(key);
        },
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, reduced, delay, duration, ease, onArrive, key]);

  const animated = useAnimatedStyle(() => {
    const point = avatarFlightPoint(from, target, progress.value, arc);
    const t = progress.value * progress.value * (3 - 2 * progress.value);
    return {
      transform: [
        { translateX: point.x },
        { translateY: point.y },
        { scaleX: point.width / from.width },
        { scaleY: point.height / from.height },
      ],
      opacity: merge && t >= MERGE_FADE_FROM ? Math.max(0, (1 - t) / (1 - MERGE_FADE_FROM)) : 1,
    };
  }, [from, target, progress, arc, merge]);

  return (
    <AnimatedView
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`flying-avatar-${key}`}
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: from.width,
          height: from.height,
          transformOrigin: 'top left',
        },
        animated,
      ]}
    >
      <Figure flight={flight} />
    </AnimatedView>
  );
}

/**
 * The layer the flights are drawn in, above the screen and never intercepting a touch. It measures
 * every target each frame until it settles, so a target that mounts after `launch` is found, and
 * until then the avatar waits where it left.
 */
function Flights({ layer }: { layer: AvatarFlightLayerState }) {
  const { flights, arrived, node, arrive, finish } = layer;
  const [targets, setTargets] = useState<Record<string, AvatarRect>>({});
  const [origin, setOrigin] = useState<AvatarRect | null>(null);
  const surface = useRef<ComponentRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let attempts = 0;
    const measure = async () => {
      const [rects, box] = await Promise.all([
        Promise.all(
          flights.map(async ({ spec }) => {
            const rect = await measureAvatar(node(spec.to));
            return [spec.key, rect && spec.landing ? spec.landing(rect) : rect] as const;
          }),
        ),
        Platform.OS === 'web' ? null : measureAvatar(surface.current ?? undefined),
      ]);
      if (disposed) return;
      const next = Object.fromEntries(
        rects.filter((pair): pair is readonly [string, AvatarRect] => pair[1] !== null),
      );
      setTargets((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      setOrigin((previous) => (JSON.stringify(previous) === JSON.stringify(box) ? previous : box));
      attempts++;
      if (Object.keys(next).length !== flights.length && attempts >= SETTLE_FRAMES) {
        finish();
        return;
      }
      if (attempts < TRACK_FRAMES) frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, [flights, node, finish, width, height]);

  // The native overlay sits in the tree: its coordinates are the layer's, not the window's.
  const local = (rect: AvatarRect): AvatarRect =>
    origin ? { ...rect, x: rect.x - origin.x, y: rect.y - origin.y } : rect;

  return (
    <OverlayRoot testID="avatar-flight-layer">
      <StyledView
        ref={surface}
        collapsable={false}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        {flights
          .filter(({ spec }) => !arrived.includes(spec.key))
          .map((flight) => {
            const target = targets[flight.spec.key];
            const placed = { ...flight, from: local(flight.from) };
            return target ? (
              <FlyingAvatar
                key={flight.spec.key}
                flight={placed}
                target={local(target)}
                onArrive={arrive}
              />
            ) : (
              // Waiting for its target to mount: parked where it left.
              <StyledView
                key={flight.spec.key}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: placed.from.x,
                  top: placed.from.y,
                  width: placed.from.width,
                  height: placed.from.height,
                }}
              >
                <Figure flight={placed} />
              </StyledView>
            );
          })}
      </StyledView>
    </OverlayRoot>
  );
}

/**
 * `AvatarFlightLayer` for a platform: `Host` is where the layer is drawn (a portal on web, in the
 * tree on native).
 */
export function createAvatarFlightLayer(Host: ComponentType<PropsWithChildren>) {
  return function AvatarFlightLayer({ flights }: { flights: { layer: AvatarFlightLayerState } }) {
    const { layer } = flights;
    return layer.flights.length ? (
      <Host>
        <Flights layer={layer} />
      </Host>
    ) : null;
  };
}
