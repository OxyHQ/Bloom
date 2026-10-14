import { useState } from 'react';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { useMessages } from '../locale/messages';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { AGENT_REPLY_MESSAGES } from './messages';
import type { AgentReplyActionProps, AgentReplyActionsProps, AgentReplyVote } from './types';

/**
 * One pill of an `AgentReplyActions` row. It draws no text, so `label` is its name; `selected`
 * lights it (a `ButtonGroupItem`'s `checked`, which sets `aria-pressed` for react-native-web).
 */
export function AgentReplyAction({
  icon,
  label,
  selected,
  disabled,
  onPress,
}: AgentReplyActionProps) {
  return (
    <ButtonGroupItem
      iconOnly
      leadingIcon={icon}
      accessibilityLabel={label}
      checked={selected}
      disabled={disabled}
      onPress={onPress}
    />
  );
}

/**
 * The row under a reply: helpful, unhelpful, copy, and any `AgentReplyAction`s after them — a
 * separated, extra-small `ButtonGroup`, so each action is its own rounded pill.
 */
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
    <ButtonGroup separated size="xs">
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
    </ButtonGroup>
  );
}
