import React, { memo } from 'react';

import { Fab } from '../fab';
import { RiChatNewLine } from '../icons/remix/RiChatNewLine';
import type { NewChatButtonProps } from './types';
import { useMessages } from '../locale/messages';
import { CHAT_LIST_MESSAGES } from './messages';

/**
 * The round "New chat" action.
 *
 * Bloom Fab owns the action. Screen/BottomBar own its position and scroll behavior.
 * This wrapper supplies the chat glyph and localized accessible name.
 *
 * `extended` promotes it to the pill, with `accessibilityLabel` as the text — the
 * one place the name is also the label, which is why it is not a separate prop.
 */

function NewChatButtonComponent({
  icon,
  accessibilityLabel: accessibilityLabelProp,
  extended = false,
  ...rest
}: NewChatButtonProps) {
  const { messages } = useMessages(CHAT_LIST_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.newChat;
  return (
    <Fab
      {...rest}
      icon={icon ?? RiChatNewLine}
      label={extended ? accessibilityLabel : undefined}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export const NewChatButton = memo(NewChatButtonComponent);
NewChatButton.displayName = 'NewChatButton';
