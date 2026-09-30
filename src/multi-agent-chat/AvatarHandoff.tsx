import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
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
import { Drawing } from '../agent-avatar/SvgDrawing';
import { useIsRtl } from '../hooks/use-is-rtl';
import { OverlayRoot } from '../overlay';
import { StyledView } from '../styles/styled-primitives';
import { useChatComponents } from './context';
import {
  avatarFlightPoint,
  badgeFlightTarget,
  measureAvatar,
  type AvatarHandoffState,
  type AvatarRect,
  type TravelingAvatar,
} from './handoff';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
function FlyingAvatar({
  avatar,
  target,
  index,
  kind,
  answering,
  onArrive,
}: {
  avatar: TravelingAvatar;
  target: AvatarRect;
  index: number;
  kind: 'group' | 'first';
  answering: boolean;
  onArrive: (id: string) => void;
}) {
  const reduced = useReducedMotion(),
    progress = useSharedValue(0);
  const duration = kind === 'group' ? 700 : answering ? 800 : 950,
    delay = kind === 'group' ? index * 80 : answering ? 0 : index * 120;
  useEffect(() => {
    progress.value = withDelay(
      reduced ? 0 : delay,
      withTiming(
        1,
        {
          duration: reduced ? 0 : duration,
          easing:
            kind === 'group' ? Easing.bezier(0.22, 1, 0.36, 1) : Easing.linear,
        },
        (finished) => {
          if (finished) runOnJS(onArrive)(avatar.agent.id);
        },
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, reduced, delay, duration, kind, onArrive, avatar.agent.id]);
  const animated = useAnimatedStyle(() => {
    const point = avatarFlightPoint(
      avatar.from,
      target,
      progress.value,
      kind === 'first',
    );
    const t = progress.value * progress.value * (3 - 2 * progress.value);
    return {
      transform: [
        { translateX: point.x },
        { translateY: point.y },
        { scaleX: point.width / avatar.from.width },
        { scaleY: point.height / avatar.from.height },
      ],
      opacity:
        kind === 'first' && !answering && t >= 0.78
          ? Math.max(0, (1 - t) / 0.22)
          : 1,
    };
  }, [avatar.from, target, progress, kind, answering]);
  return (
    <AnimatedView
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      testID={`flying-agent-${avatar.agent.id}`}
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: avatar.from.width,
          height: avatar.from.height,
          transformOrigin: 'top left',
        },
        animated,
      ]}
    >
      {avatar.drawing ? (
        <Drawing context={avatar.drawing} size={avatar.from.width} />
      ) : (
        <AgentAvatar
          config={avatar.agent.avatar}
          paused
          size={avatar.from.width}
        />
      )}
    </AnimatedView>
  );
}

/** Window coordinates keep the journey outside both the disappearing panel and chat scroller. */
export function AvatarHandoff({
  handoff,
  resolveTarget,
  origin,
  onArrive,
  onFinish,
}: {
  handoff: AvatarHandoffState;
  resolveTarget: (id: string) => import('react-native').View | undefined;
  origin: AvatarRect | null;
  onArrive: (id: string) => void;
  onFinish: () => void;
}) {
  const { FlightHost } = useChatComponents();
  const rtl = useIsRtl();
  const [destinations, setDestinations] = useState<Record<string, AvatarRect>>(
    {},
  );
  const { width, height } = useWindowDimensions();
  useEffect(() => {
    let disposed = false,
      frame = 0,
      attempts = 0;
    const measure = async () => {
      const values = await Promise.all(
        handoff.avatars.map(async (avatar) => {
          const rect = await measureAvatar(resolveTarget(avatar.agent.id));
          return [
            avatar.agent.id,
            rect &&
            handoff.kind === 'first' &&
            avatar.agent.id !== handoff.responderId
              ? badgeFlightTarget(rect, rtl)
              : rect,
          ] as const;
        }),
      );
      if (disposed) return;
      const next = Object.fromEntries(
        values.filter(
          (pair): pair is readonly [string, AvatarRect] => pair[1] !== null,
        ),
      );
      setDestinations((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      attempts++;
      if (
        Object.keys(next).length !== handoff.avatars.length &&
        attempts >= 60
      ) {
        onFinish();
        return;
      }
      if (attempts < 90) frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, [
    handoff.chatId,
    handoff.kind,
    resolveTarget,
    onFinish,
    width,
    height,
    rtl,
  ]);
  const relative = (rect: AvatarRect): AvatarRect =>
    Platform.OS === 'web' || !origin
      ? rect
      : { ...rect, x: rect.x - origin.x, y: rect.y - origin.y };
  const waiting = handoff.avatars.filter(
    (a) => a.agent.id !== handoff.responderId,
  );
  return (
    <FlightHost>
      <OverlayRoot testID="avatar-handoff-overlay">
        <StyledView
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          {handoff.avatars
            .filter((a) => !handoff.arrived.includes(a.agent.id))
            .map((avatar, index) => {
              const destination = destinations[avatar.agent.id];
              const target = destination ? relative(destination) : undefined;
              const traveling = { ...avatar, from: relative(avatar.from) };
              return target ? (
                <FlyingAvatar
                  key={avatar.agent.id}
                  avatar={traveling}
                  target={target}
                  index={
                    handoff.kind === 'first'
                      ? Math.max(
                          0,
                          waiting.findIndex(
                            (a) => a.agent.id === avatar.agent.id,
                          ),
                        )
                      : index
                  }
                  kind={handoff.kind}
                  answering={avatar.agent.id === handoff.responderId}
                  onArrive={onArrive}
                />
              ) : (
                <StyledView
                  key={avatar.agent.id}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: traveling.from.x,
                    top: traveling.from.y,
                    width: avatar.from.width,
                    height: avatar.from.height,
                  }}
                >
                  {avatar.drawing ? (
                    <Drawing
                      context={avatar.drawing}
                      size={avatar.from.width}
                    />
                  ) : (
                    <AgentAvatar
                      config={avatar.agent.avatar}
                      size={avatar.from.width}
                      paused
                    />
                  )}
                </StyledView>
              );
            })}
        </StyledView>
      </OverlayRoot>
    </FlightHost>
  );
}
