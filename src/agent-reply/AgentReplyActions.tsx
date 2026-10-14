import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button';
import { useMessages } from '../locale/messages';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { AGENT_REPLY_MESSAGES } from './messages';
import type { AgentReplyActionProps, AgentReplyActionsProps, AgentReplyVote } from './types';

/**
 * One action of an `AgentReplyActions` row: a bare icon, no fill until it is hovered. It draws no
 * text, so `label` is its name; `selected` lights it and is announced as a toggle (`aria-pressed`).
 */
export function AgentReplyAction({
  icon,
  label,
  selected,
  disabled,
  onPress,
}: AgentReplyActionProps) {
  return (
    <Button
      iconOnly
      appearance="plain"
      size="sm"
      leadingIcon={icon}
      accessibilityLabel={label}
      pressed={selected}
      disabled={disabled}
      onPress={onPress}
    />
  );
}

/**
 * The row under a reply: helpful, unhelpful, copy, and any `AgentReplyAction`s after them, as bare
 * icons in a row: nothing around them, so the reply keeps the eye.
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
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
    </View>
  );
}
