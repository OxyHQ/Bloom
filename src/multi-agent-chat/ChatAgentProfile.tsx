import { useState, type Ref } from 'react';
import { Platform, StyleSheet, type View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { useMessages } from '../locale/messages';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { Agent } from './data';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';

/** One profile target: animated artwork above an intrinsically sized name pill. */
export function ChatAgentProfile({
  agents,
  avatarRef,
  expanded,
  onPress,
}: {
  agents: Agent[];
  avatarRef?: Ref<View>;
  expanded: boolean;
  onPress: () => void;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const name =
    agents.length === 1
      ? agents[0]!.name
      : agents
          .slice(0, 3)
          .map((agent) => agent.label || agent.name)
          .join(' + ');
  const label = name || messages.chooseYourTeammates;
  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityLabel={
        agents.length === 1
          ? formatChatMessage(messages.editAgent, agents[0]!.name)
          : messages.editConversationAgents
      }
      aria-expanded={expanded}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className={`group/chat-profile relative min-w-0 max-w-full select-none items-center outline-none ${Platform.OS === 'web' ? 'motion-safe:active:scale-95' : ''}`}
      style={
        Platform.OS === 'web'
          ? undefined
          : { transform: [{ scale: pressed && !reduced ? 0.95 : 1 }] }
      }
      testID="chat-agent-profile"
    >
      <StyledView
        ref={avatarRef}
        collapsable={false}
        pointerEvents="none"
        aria-hidden
        className="relative z-10 -mb-0.5 size-14"
        style={{ width: 56, height: 56, marginBottom: -2 }}
      >
        {agents.slice(0, 3).map((agent, index) => {
          const single = agents.length === 1;
          const size = single ? 56 : 36;
          return (
            <StyledView
              key={agent.id}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                insetInlineStart: single
                  ? 0
                  : index === 1
                    ? 20
                    : index === 2
                      ? 10
                      : 0,
                top: index === 2 ? 20 : 0,
              }}
            >
              <AgentAvatar config={agent.avatar} size={size} />
            </StyledView>
          );
        })}
      </StyledView>
      <StyledView
        pointerEvents="none"
        className="relative min-w-0 max-w-full items-center justify-center rounded-[14px] px-2.5 py-1"
      >
        <StyledView
          className="absolute inset-0 rounded-[14px] group-focus-visible/chat-profile:ring-2 group-focus-visible/chat-profile:ring-border-focus-ring"
          style={{
            backgroundColor: hovered
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        />
        <Text
          numberOfLines={1}
          className="max-w-full truncate text-[16px] leading-5 font-medium text-text-primary"
        >
          {label}
          {agents.length > 3 ? ` +${agents.length - 3}` : ''}
        </Text>
      </StyledView>
    </StyledPressable>
  );
}
