import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { AvatarSnapshotObserver } from '../agent-avatar/context';
import type { AvatarFlights } from '../avatar-flight';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { useMessages, formatMessage } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { Agent } from './data';
import { MULTI_AGENT_CHAT_MESSAGES } from './messages';
const AnimatedView = Animated.createAnimatedComponent(StyledView);

/** The selected-preview composition: one large avatar, a trio, or a ring from four up. */
export function previewAvatarGeometry(count: number, index: number) {
  const size = count === 1 ? 80 : count <= 3 ? 62 : 48;
  const angle = (index * Math.PI * 2) / count - Math.PI / 2;
  const x =
    count === 1
      ? 40
      : count <= 3
        ? index === 1
          ? 76
          : index === 2
            ? 49
            : 22
        : 56 + Math.cos(angle) * 38;
  const y =
    count === 1
      ? 16
      : count <= 3
        ? count === 3 && index === 2
          ? 46
          : 8
        : 32 + Math.sin(angle) * 30;
  return { size, x, y };
}
function PreviewAvatar({
  agent,
  index,
  count,
  flights,
  anchor,
}: {
  agent: Agent;
  index: number;
  count: number;
  flights: AvatarFlights;
  anchor: string;
}) {
  const key = `${anchor}:${agent.id}`;
  // Hidden while its flight is in the air: the layer draws it, either leaving or arriving.
  const hidden = flights.isLeaving(key) || flights.isLanding(key);
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const { size, x, y } = previewAvatarGeometry(count, index);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduced ? 0 : 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [progress, reduced]);
  const animated = useAnimatedStyle(
    () => ({
      opacity: hidden ? 0 : progress.value,
      transform: [
        { translateX: x },
        { translateY: y + (1 - progress.value) * 16 },
        { scale: 0.5 + 0.5 * progress.value },
      ],
    }),
    [progress, hidden, x, y],
  );
  return (
    <AnimatedView
      ref={flights.anchor(key)}
      collapsable={false}
      pointerEvents="none"
      aria-hidden
      style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, animated]}
    >
      <AvatarSnapshotObserver.Provider value={flights.snapshot(key)}>
        <AgentAvatar character={agent.avatar} size={size} />
      </AvatarSnapshotObserver.Provider>
    </AnimatedView>
  );
}
export function SelectedAgentPreview({
  agents,
  flights,
  anchor,
  caption = false,
}: {
  agents: Agent[];
  flights: AvatarFlights;
  /** Names this preview's avatars for `flights`: `${anchor}:${agent.id}`. */
  anchor: string;
  caption?: boolean;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { colors } = useTheme();
  return (
    <StyledView className="shrink-0 items-center gap-2" style={{ paddingBottom: caption ? 20 : 0 }}>
      <StyledView
        role="img"
        accessibilityLabel={
          agents.length
            ? formatMessage(messages.selectedAgents, agents.map((a) => a.name).join(', '))
            : messages.chooseYourTeammates
        }
        style={{ position: 'relative', width: 160, height: 112 }}
      >
        {!agents.length && (
          <StyledView className="h-full items-center justify-center">
            <RiGroupLine size="3xl" fill={colors.textTertiary} />
          </StyledView>
        )}
        {agents.map((agent, index) => (
          <PreviewAvatar
            key={agent.id}
            agent={agent}
            index={index}
            count={agents.length}
            flights={flights}
            anchor={anchor}
          />
        ))}
      </StyledView>
      {caption && (
        <Text variant="body-regular" style={{ color: colors.textSecondary }}>
          {messages.chooseWhoSJoiningTheConversation}
        </Text>
      )}
    </StyledView>
  );
}
