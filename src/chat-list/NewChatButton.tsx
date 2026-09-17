import React, { memo } from 'react';

import { Fab } from '../fab';
import { RiEditBoxLine } from '../icons/remix/RiEditBoxLine';
import type { NewChatButtonProps } from './types';

/**
 * The round "New chat" action.
 *
 * It IS Bloom's `Fab` — placement, sizing, the minimize behaviour that follows a
 * tab bar and the web/native fork all come from there; this only fixes the glyph
 * and the name, so every messaging screen spells the same action the same way
 * instead of each one picking an icon. Every `Fab` prop passes through, so a
 * screen that wants it bottom-LEFT, small, or `static` inside its own container
 * says so exactly as it would to a `Fab`.
 *
 * `extended` promotes it to the pill, with `accessibilityLabel` as the text — the
 * one place the name is also the label, which is why it is not a separate prop.
 */

function NewChatButtonComponent({
  icon,
  accessibilityLabel = 'New chat',
  extended = false,
  ...rest
}: NewChatButtonProps) {
  return (
    <Fab
      {...rest}
      icon={icon ?? <RiEditBoxLine />}
      label={extended ? accessibilityLabel : undefined}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export const NewChatButton = memo(NewChatButtonComponent);
NewChatButton.displayName = 'NewChatButton';
