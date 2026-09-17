import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiUploadLine } from '../icons/remix/RiUploadLine';
import { IconAction } from './AgentChatControls';
import { useAgentChatPlatform } from './context';
import {
  ACTION_SIZE,
  CONFIRM_MS,
  DENSE_ROW_CLASS,
  IS_WEB,
  SMALL_MENU_STYLE,
  useAgentChatPalette,
  useAgentChatWebCss,
} from './shared';
import type { AgentChatActionsProps } from './types';

/**
 * `AgentChatActions`: the controls in the top right of the
 * chat surface — share the open chat, and a menu of what applies to it.
 *
 *   row      gap 2 (`gap-0.5`)
 *   button   28 circle, 18px glyph, icon-secondary → icon-primary on a
 *            background-primary-hover fill (also while its menu is open);
 *            disabled at the disabled opacity
 *   menu     `bottom end`, 190 wide, p 8; rows px 8 / py 6 (32 tall),
 *            body-medium; "Delete chat" in text-error-primary
 */

const DEFAULT_LABELS = {
  share: 'Share chat',
  shared: 'Transcript copied',
  more: 'More actions for this chat',
  exportChats: 'Export chats',
  markUnread: 'Mark as unread',
  deleteChat: 'Delete chat',
};

async function defaultShare(transcript: string): Promise<void | 'copied'> {
  if (!IS_WEB || typeof navigator === 'undefined') return;
  const nav = navigator as {
    share?: (data: { text: string }) => Promise<void>;
    clipboard?: { writeText?: (value: string) => Promise<void> };
  };
  if (nav.share) {
    await nav.share({ text: transcript });
    return;
  }
  if (!nav.clipboard?.writeText) return;
  await nav.clipboard.writeText(transcript);
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
  const palette = useAgentChatPalette();
  const { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } =
    useAgentChatPlatform();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
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

  const buttonProps = {
    size: ACTION_SIZE,
    color: palette.iconSecondary,
    hoverColor: palette.iconPrimary,
    hoverBackground: palette.chatHover,
    palette,
    disabled,
  };

  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 }, style]}>
      <IconAction
        {...buttonProps}
        testID={testID ? `${testID}-share` : undefined}
        label={shared ? l.shared : l.share}
        onPress={share}
        icon={(color) =>
          shared ? (
            <RiCheckLine width={18} height={18} fill={color} />
          ) : (
            <RiUploadLine width={18} height={18} fill={color} />
          )
        }
      />
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild disabled={disabled} label={l.more}>
          <IconAction
            {...buttonProps}
            testID={testID ? `${testID}-more` : undefined}
            label={l.more}
            active={menuOpen}
            icon={(color) => <RiMoreFill width={18} height={18} fill={color} />}
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
            <DropdownMenuItem className={DENSE_ROW_CLASS} variant="destructive" onPress={onDelete}>
              {l.deleteChat}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}
