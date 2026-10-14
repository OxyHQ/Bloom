import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { ThinkingLabel } from '../agent-thinking/ThinkingLabel';
import { ThinkingReasoning } from '../agent-thinking/ThinkingReasoning';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { useIsRtl } from '../hooks/use-is-rtl';
import { formatMessage, useMessages } from '../locale/messages';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { AGENT_REPLY_MESSAGES } from './messages';
import type { AgentReplyIdentityProps } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

/**
 * Who answered, under their reply: the agent's 3D avatar and name. While the agent works the
 * avatar grows, plays its working animation, and the name gives way to "Thinking…" — and, given
 * its `reasoning`, to a disclosure of it. It is the one component of a thinking agent: the avatar,
 * the status and the reasoning, which settle into the avatar and name under the reply.
 */
export function AgentReplyIdentity({
  character,
  name,
  thinking = false,
  workingKey,
  reasoning,
  avatarHidden = false,
  avatarRef,
  onPress,
  pressLabel,
}: AgentReplyIdentityProps) {
  const { messages } = useMessages(AGENT_REPLY_MESSAGES);
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const rtl = useIsRtl();
  // Fixed on the first render: a reply that is already thinking starts its working animation
  // once, and a finished one never does.
  const [initialWorkingKey] = useState(() =>
    thinking
      ? (workingKey ?? name)
          .split('')
          .reduce((key, char) => (key * 31 + char.charCodeAt(0)) >>> 0, 0)
      : undefined,
  );
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
      opacity: avatarHidden ? 0 : 1,
    }),
    [progress, avatarHidden],
  );
  const art = useAnimatedStyle(
    () => ({ transform: [{ scale: 0.625 + 0.375 * progress.value }] }),
    [progress],
  );
  const nameStyle = useAnimatedStyle(
    () => ({
      opacity: 1 - progress.value,
      transform: [{ translateX: 4 * progress.value }],
    }),
    [progress],
  );
  const status = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);
  // While it thinks with a reasoning to show, pressing the row folds and unfolds it.
  const folds = thinking && reasoning != null;
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (thinking) setOpen(true);
  }, [thinking]);
  const actionable = folds || onPress !== undefined;
  // The reasoning stays while it folds shut after the reply starts, so the body shrinks with its
  // content instead of vanishing from under the animation.
  const [lastReasoning, setLastReasoning] = useState<ReactNode>(null);
  useEffect(() => {
    if (reasoning != null) setLastReasoning(reasoning);
  }, [reasoning]);
  const shownReasoning = reasoning ?? lastReasoning;
  const row = (
    <StyledPressable
      accessibilityRole={actionable ? 'button' : undefined}
      accessibilityLabel={
        thinking ? formatMessage(messages.agentThinking, name) : (pressLabel ?? name)
      }
      aria-expanded={folds ? open : undefined}
      disabled={!actionable}
      onPress={folds ? () => setOpen((current) => !current) : onPress}
      className="my-1 min-w-0 flex-row items-center gap-1 rounded-lg text-start text-body-2-medium text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      <AnimatedView
        ref={avatarRef}
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
            character={character}
            size={32}
            workingKey={avatarHidden ? undefined : initialWorkingKey}
            workingCycles={2}
            label={name}
          />
        </AnimatedView>
      </AnimatedView>
      <StyledView style={{ opacity: avatarHidden ? 0 : 1 }}>
        <AnimatedView aria-hidden={!thinking} role={thinking ? 'status' : undefined} style={status}>
          <ThinkingLabel variant="body-2-medium" color={colors.textSecondary}>
            {messages.thinking}
          </ThinkingLabel>
        </AnimatedView>
        <AnimatedView
          aria-hidden={thinking}
          style={[{ marginTop: -TYPE_SCALE['body-2-medium'].lineHeight }, nameStyle]}
        >
          <Text variant="body-2-medium" style={{ color: colors.textSecondary }}>
            {name}
          </Text>
        </AnimatedView>
      </StyledView>
      {folds ? (
        <AnimatedView aria-hidden style={status}>
          <RiArrowDownSLine
            width={16}
            height={16}
            fill={colors.textTertiary}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </AnimatedView>
      ) : null}
    </StyledPressable>
  );
  return shownReasoning == null ? (
    row
  ) : (
    <View style={{ minWidth: 0, flexShrink: 1 }}>
      {row}
      <ThinkingReasoning open={folds && open}>{shownReasoning}</ThinkingReasoning>
    </View>
  );
}
