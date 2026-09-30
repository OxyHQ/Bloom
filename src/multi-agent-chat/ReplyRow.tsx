import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, type View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { useTrackEvents } from '../agent-creator/use-track-events';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { Agent } from './data';
import type { AvatarNodes } from './handoff';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
export function ReplyHeader({
  agent,
  thinking,
  workingKey,
  arriving = false,
  nodes,
  onEdit,
}: {
  agent: Agent;
  thinking: boolean;
  workingKey?: string;
  arriving?: boolean;
  nodes?: AvatarNodes;
  onEdit: () => void;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { colors } = useTheme(),
    reduced = useReducedMotion();
  const [initialWorkingKey] = useState(() =>
    thinking
      ? (workingKey ?? agent.id)
          .split('')
          .reduce((key, char) => (key * 31 + char.charCodeAt(0)) >>> 0, 0)
      : undefined,
  );
  const rtl = useIsRtl();
  const progress = useSharedValue(thinking ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(thinking ? 1 : 0, {
      duration: reduced ? 0 : 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [thinking, reduced, progress]);
  const avatar = useAnimatedStyle(
    () => ({
      width: 20 + 12 * progress.value,
      height: 20 + 12 * progress.value,
      opacity: arriving ? 0 : 1,
    }),
    [progress, arriving],
  );
  const art = useAnimatedStyle(
    () => ({ transform: [{ scale: 0.625 + 0.375 * progress.value }] }),
    [progress],
  );
  const name = useAnimatedStyle(
    () => ({
      opacity: 1 - progress.value,
      transform: [{ translateX: 4 * progress.value }],
    }),
    [progress],
  );
  const status = useAnimatedStyle(
    () => ({ opacity: progress.value }),
    [progress],
  );
  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityLabel={
        thinking
          ? formatChatMessage(messages.agentThinking, agent.name)
          : formatChatMessage(messages.editAgent, agent.name)
      }
      onPress={onEdit}
      className="my-1 min-w-0 flex-row items-center gap-1 rounded-lg"
    >
      <AnimatedView
        ref={(node: View | null) => {
          if (nodes) {
            if (node) nodes.set(agent.id, node);
            else nodes.delete(agent.id);
          }
        }}
        collapsable={false}
        style={[{ position: 'relative', flexShrink: 0 }, avatar]}
      >
        <AnimatedView
          style={[
            {
              position: 'absolute',
              insetInlineStart: 0,
              top: 0,
              width: 32,
              height: 32,
              transformOrigin: rtl ? 'top right' : 'top left',
            },
            art,
          ]}
        >
          <AgentAvatar
            config={agent.avatar}
            size={32}
            workingKey={arriving ? undefined : initialWorkingKey}
            workingCycles={2}
            label={agent.name}
          />
        </AnimatedView>
      </AnimatedView>
      <StyledView style={{ opacity: arriving ? 0 : 1 }}>
        <AnimatedView
          aria-hidden={!thinking}
          role={thinking ? 'status' : undefined}
          style={[
            { position: 'absolute', insetInlineStart: 0, top: 0 },
            status,
          ]}
        >
          <Text variant="body-2-medium" style={{ color: colors.textSecondary }}>
            {messages.thinking}
          </Text>
        </AnimatedView>
        <AnimatedView aria-hidden={thinking} style={name}>
          <Text variant="body-2-medium" style={{ color: colors.textSecondary }}>
            {agent.name}
          </Text>
        </AnimatedView>
      </StyledView>
    </StyledPressable>
  );
}
/** Mouse hover and keyboard focus reveal actions; touch platforms keep them available. */
export function ReplyRow({
  children,
  header,
  actions,
}: {
  children: ReactNode;
  header?: ReactNode;
  actions: ReactNode;
}) {
  const ref = useRef<View>(null),
    reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  useTrackEvents(ref, undefined, undefined, setFocused);
  const show = Platform.OS !== 'web' || hovered || focused,
    opacity = useSharedValue(show ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(show ? 1 : 0, { duration: reduced ? 0 : 150 });
  }, [show, reduced, opacity]);
  const animated = useAnimatedStyle(
    () => ({ opacity: opacity.value }),
    [opacity],
  );
  return (
    <StyledView
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="group/reply mx-3 mt-3 w-fit max-w-[min(520px,calc(100%-24px))] text-body-regular"
      style={{
        maxWidth: Platform.OS === 'web' ? undefined : '94%',
        alignSelf: 'flex-start',
      }}
    >
      {children}
      <StyledView className="flex items-center justify-between gap-2 px-3 flex-row">
        {header}
        {actions && (
          <AnimatedView style={[{ flexShrink: 0 }, animated]}>
            {actions}
          </AnimatedView>
        )}
      </StyledView>
    </StyledView>
  );
}
