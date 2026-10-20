import { useCallback, useEffect, useMemo, useState } from 'react';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiUploadLine } from '../icons/remix/RiUploadLine';
import { useMessages } from '../locale/messages';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { useAgentChatPlatform } from './context';
import { CONFIRM_MS, DENSE_ROW_CLASS, SMALL_MENU_STYLE, useAgentChatWebCss } from './shared';
import { AGENT_CHAT_MESSAGES } from './messages';
import type { AgentChatActionsProps } from './types';
import { clipboardAvailable, writeClipboardText } from '../hooks/clipboard';
import { IS_WEB } from '../styles/platform';

/**
 * `AgentChatActions`: the controls in the top right of the
 * chat surface — share the open chat, and a menu of what applies to it.
 *
 * Share and menu use ButtonGroup's shared surface and trigger contract.
 * Menu rows retain the conversation actions provided by the host.
 */

async function defaultShare(transcript: string): Promise<void | 'copied'> {
  if (!IS_WEB || typeof navigator === 'undefined') return;
  const nav = navigator as { share?: (data: { text: string }) => Promise<void> };
  if (nav.share) {
    await nav.share({ text: transcript });
    return;
  }
  if (!clipboardAvailable()) return;
  await writeClipboardText(transcript);
  return 'copied';
}

export function AgentChatActionsBase({
  transcript,
  onShare,
  onExport,
  onToggleUnread,
  onDelete,
  disabled = false,
  labels,
  style,
  testID,
}: AgentChatActionsProps) {
  useAgentChatWebCss();
  const { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } =
    useAgentChatPlatform();
  const { messages } = useMessages(AGENT_CHAT_MESSAGES);
  const l = useMemo(() => ({ ...messages.actions, ...labels }), [messages, labels]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!shared) return;
    const timer = setTimeout(() => setShared(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [shared]);

  const share = useCallback(async () => {
    if (!transcript) return;
    try {
      const result = await (onShare ?? defaultShare)(transcript);
      if (result === 'copied') setShared(true);
    } catch {
      // A dismissed share sheet and a refused clipboard both land here.
    }
  }, [onShare, transcript]);

  return (
    <ButtonGroup testID={testID} accessibilityLabel={l.more} style={style}>
      <ButtonGroupItem
        testID={testID ? `${testID}-share` : undefined}
        iconOnly
        leadingIcon={shared ? RiCheckLine : RiUploadLine}
        accessibilityLabel={shared ? l.shared : l.share}
        disabled={disabled}
        onPress={share}
      />
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild disabled={disabled} label={l.more}>
          <ButtonGroupItem
            testID={testID ? `${testID}-more` : undefined}
            iconOnly
            leadingIcon={RiMoreFill}
            accessibilityLabel={l.more}
            disabled={disabled}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent label={l.more} side="bottom" align="end" style={SMALL_MENU_STYLE}>
          {onExport ? (
            <DropdownMenuItem className={DENSE_ROW_CLASS} onPress={onExport}>
              {l.exportChats}
            </DropdownMenuItem>
          ) : null}
          {onToggleUnread ? (
            <DropdownMenuItem className={DENSE_ROW_CLASS} onPress={onToggleUnread}>
              {l.markUnread}
            </DropdownMenuItem>
          ) : null}
          {onDelete ? (
            <DropdownMenuItem className={DENSE_ROW_CLASS} tone="danger" onPress={onDelete}>
              {l.deleteChat}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
