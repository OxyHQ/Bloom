import { useCallback, useEffect } from 'react';
import { type View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { AvatarDrawingObserver } from '../agent-avatar/context';
import type { DrawingContext } from '../agent-avatar/drawing';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { useMessages } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { Agent } from './data';
import {
  previewAvatarGeometry,
  retainAvatarDrawing,
  type AvatarNodes,
} from './handoff';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
function PreviewAvatar({
  agent,
  index,
  count,
  hidden,
  nodes,
}: {
  agent: Agent;
  index: number;
  count: number;
  hidden: boolean;
  nodes: AvatarNodes;
}) {
  const observeDrawing = useCallback(
    (drawing: DrawingContext) => retainAvatarDrawing(nodes, agent.id, drawing),
    [nodes, agent.id],
  );
  const captureNode = useCallback(
    (node: View | null) => {
      if (node) nodes.set(agent.id, node);
      else {
        nodes.delete(agent.id);
        retainAvatarDrawing(nodes, agent.id, null);
      }
    },
    [nodes, agent.id],
  );
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
      ref={captureNode}
      collapsable={false}
      pointerEvents="none"
      aria-hidden
      style={[
        { position: 'absolute', left: 0, top: 0, width: size, height: size },
        animated,
      ]}
    >
      <AvatarDrawingObserver.Provider value={observeDrawing}>
        <AgentAvatar config={agent.avatar} size={size} />
      </AvatarDrawingObserver.Provider>
    </AnimatedView>
  );
}
export function SelectedAgentPreview({
  agents,
  nodes,
  hidden = [],
  caption = false,
}: {
  agents: Agent[];
  nodes: AvatarNodes;
  hidden?: string[];
  caption?: boolean;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { colors } = useTheme();
  return (
    <StyledView
      className="shrink-0 items-center gap-2"
      style={{ paddingBottom: caption ? 20 : 0 }}
    >
      <StyledView
        role="img"
        accessibilityLabel={
          agents.length
            ? formatChatMessage(
                messages.selectedAgents,
                agents.map((a) => a.name).join(', '),
              )
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
            hidden={hidden.includes(agent.id)}
            nodes={nodes}
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
