/**
 * The long-press / right-click menu for one message: the quick reaction bar on
 * top, then the rows the app decided apply.
 *
 * Built on `DropdownMenu`, which is already an anchored panel on a pointer and
 * a bottom sheet on a phone — so the rows, their destructive colour, their
 * dismissal and their keyboard behaviour are the ones Bloom already gates,
 * and this part only decides what goes in them.
 *
 * `items` is a prop and not a fixed list: which actions exist depends on who
 * sent the message, how old it is and what the channel allows, and a menu that
 * hid its own rows would be deciding policy the app owns.
 */
import React from 'react';
import { View } from 'react-native';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useTheme } from '../theme/use-theme';
import { ReactionPicker } from './ReactionPicker';
import { REACTION_PICKER_EMOJIS, resolveChatComposerPalette } from './shared';
import type { MessageContextMenuProps } from './types';

export function MessageContextMenu({
  children,
  open,
  defaultOpen,
  onOpenChange,
  items,
  onSelect,
  reactions = REACTION_PICKER_EMOJIS,
  selectedReaction,
  onSelectReaction,
  onMoreReactions,
  label = 'Message actions',
  style,
  reactionBarStyle,
  testID,
}: MessageContextMenuProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  const showReactions = reactions !== false && reactions.length > 0;

  return (
    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent label={label} minWidth={224} style={style} testID={testID}>
        {showReactions ? (
          <View style={{ paddingBottom: 4 }}>
            <ReactionPicker
              emojis={reactions}
              selected={selectedReaction}
              onSelectEmoji={onSelectReaction}
              onMorePress={onMoreReactions}
              size="small"
              surface={false}
              style={[{ alignSelf: 'stretch', justifyContent: 'space-between' }, reactionBarStyle]}
              testID={testID ? `${testID}-reactions` : undefined}
            />
            <View style={{ height: 1, backgroundColor: palette.border, marginTop: 4 }} />
          </View>
        ) : null}
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {item.separated ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              disabled={item.disabled}
              variant={item.variant}
              leading={
                item.icon ? (
                  <item.icon
                    width={18}
                    height={18}
                    fill={item.variant === 'destructive' ? palette.destructive : palette.iconSecondary}
                  />
                ) : undefined
              }
              trailing={item.shortcut ? <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut> : undefined}
              onPress={() => onSelect?.(item.id, item)}
              testID={testID ? `${testID}-${item.id}` : undefined}>
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
