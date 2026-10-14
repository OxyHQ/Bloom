import { useState } from 'react';
import { useMessages } from '../locale/messages';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { AGENT_REPLY_MESSAGES } from './messages';
import type { AgentReplyActionProps, AgentReplyActionsProps, AgentReplyVote } from './types';

/**
 * One tile of an `AgentReplyActions` row: a 22px square holding a 12px icon. It draws no text,
 * so `label` is its name. `aria-pressed` and `accessibilityState` both carry `selected`, which
 * react-native-web needs to announce it.
 */
export function AgentReplyAction({
  icon: Icon,
  label,
  selected,
  disabled,
  onPress,
}: AgentReplyActionProps) {
  const { colors } = useTheme();
  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      aria-pressed={selected}
      disabled={disabled}
      onPress={onPress}
      className="h-[22px] w-[22px] items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      style={{ backgroundColor: colors.backgroundTertiary }}
    >
      <Icon width={12} height={12} fill={selected ? colors.primary : colors.textTertiary} />
    </StyledPressable>
  );
}

/** The row under a reply: helpful, unhelpful, copy, and any `AgentReplyAction`s after them. */
export function AgentReplyActions({
  vote,
  onVoteChange,
  onCopy,
  children,
}: AgentReplyActionsProps) {
  const { messages } = useMessages(AGENT_REPLY_MESSAGES);
  const [kept, setKept] = useState<AgentReplyVote | null>(null);
  const current = vote === undefined ? kept : vote;
  const cast = (value: AgentReplyVote) => {
    setKept(value);
    onVoteChange?.(value);
  };
  return (
    <StyledView className="mt-1 flex-row items-center gap-1">
      <AgentReplyAction
        icon={RiThumbUpLine}
        label={messages.helpfulResponse}
        selected={current === 'up'}
        onPress={() => cast('up')}
      />
      <AgentReplyAction
        icon={RiThumbDownLine}
        label={messages.unhelpfulResponse}
        selected={current === 'down'}
        onPress={() => cast('down')}
      />
      {onCopy ? (
        <AgentReplyAction icon={RiFileCopyLine} label={messages.copyResponse} onPress={onCopy} />
      ) : null}
      {children}
    </StyledView>
  );
}
