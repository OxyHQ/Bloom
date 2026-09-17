import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '../avatar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiDownloadLine } from '../icons/remix/RiDownloadLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiSpeedUpLine } from '../icons/remix/RiSpeedUpLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { TYPE_SCALE, Text } from '../typography';
import { IconAction, PrimaryDisc } from './AgentChatControls';
import { useAgentChatPlatform } from './context';
import {
  ACCOUNT_MENU_STYLE,
  CARD_RADIUS,
  dataHook,
  DENSE_ROW_CLASS,
  IS_WEB,
  RAIL_WIDTH,
  relativeTime,
  ROW_RADIUS,
  SMALL_MENU_STYLE,
  useAgentChatPalette,
  useAgentChatWebCss,
  type AgentChatPalette,
} from './shared';
import type { AgentChatHistoryProps, AgentChatThread } from './types';

/**
 * The chat-history rail, a card of its own
 * beside the chat.
 *
 *   rail       260 wide, radius 24, background-secondary, p 12, column gap 24
 *   new chat   row radius 10, px 8 / py 8, gap 8: 20px `+` icon-secondary,
 *              body-medium text-primary; hover background-secondary-hover
 *   list       column gap 4, hidden scrollbar; "Recent" px 8 / pb 4 body-2-medium
 *              text-tertiary; empty line body-2-regular text-tertiary
 *   thread     radius 10; background-secondary-hover when active, its menu is
 *              open, or hovered. Title button py 6 / pl 8, gap 6: 6px unread dot
 *              (`bg-button-primary`) + body-2-regular (text-primary when unread,
 *              else text-secondary). A 28px trailing slot (pr 4) holds the age
 *              (caption-1-regular text-tertiary) and, stacked on it 1px left, the
 *              24px `⋮` menu trigger — the age steps aside for the trigger on
 *              hover / keyboard focus, never both at once
 *   rename     radius 10, background-secondary-hover, px 8 / py 6, body-2-regular
 *   footer     margin-top auto, 1px separator-border top rule, pt 12 / pr 4,
 *              gap 4: account trigger (flex 1, radius 10, p 4, gap 8, 24px
 *              avatar + body-2-medium name) and the 24px export disc
 *              (`bg-button-primary`, 14px download, 90% on hover, the disabled opacity when disabled)
 *
 * The account menu opens `top start`, 248 wide, p 10, 7px between its parts:
 * "Usage left" expands in place (chevron rotates 180° over 150ms) to usage rows
 * indented 36 and an "Upgrade" row, then the account items, a divider and
 * "Log out".
 */

const DEFAULT_LABELS = {
  region: 'Chat history',
  newChat: 'New chat',
  recent: 'Recent',
  empty: 'Chats you start show up here.',
  rename: 'Rename',
  renameField: 'Rename chat',
  markUnread: 'Mark as unread',
  delete: 'Delete',
  unread: 'Unread',
  moreFor: (title: string) => `More actions for ${title}`,
  exportCount: (count: number) => (count === 0 ? 'No chats to export' : `Export ${count} chats`),
  accountMenu: (name: string) => `${name} account menu`,
  usageLeft: 'Usage left',
  upgrade: 'Upgrade to Max',
  logOut: 'Log out',
};
type Labels = typeof DEFAULT_LABELS;

// ---------------------------------------------------------------------------
//  Small pieces
// ---------------------------------------------------------------------------

/** 16×16, 2px round stroke. */
function ChevronDownSmall({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 7L7.29289 10.2929C7.68342 10.6834 8.31658 10.6834 8.70711 10.2929L12 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RotatingChevron({ open, color }: { open: boolean; color: string }) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    const target = open ? 180 : 0;
    rotation.value = reducedMotion
      ? target
      : withTiming(target, { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [open, reducedMotion, rotation]);
  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );
  return (
    <Animated.View style={[{ width: 16, height: 16, flexShrink: 0 }, animatedStyle]}>
      <ChevronDownSmall color={color} />
    </Animated.View>
  );
}

/** A row that fills on hover: the rail's "New chat", the account menu's usage toggle and upgrade. */
function HoverRow({
  onPress,
  disabled = false,
  hoverBackground,
  active = false,
  style,
  palette,
  children,
  accessibilityLabel,
  expanded,
  testID,
}: {
  onPress?: () => void;
  disabled?: boolean;
  hoverBackground: string;
  active?: boolean;
  style: WebCssStyle;
  palette: AgentChatPalette;
  children: React.ReactNode;
  accessibilityLabel?: string;
  expanded?: boolean;
  testID?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const lit = !disabled && (hovered || active);
  const merged: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: ROW_RADIUS,
    ...style,
    backgroundColor: lit ? hoverBackground : 'transparent',
    opacity: disabled ? 0.5 : 1,
    '--bloom-agent-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-expanded={expanded}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={merged}>
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Thread row
// ---------------------------------------------------------------------------

function RowMenu({
  title,
  open,
  onOpenChange,
  onRename,
  onToggleUnread,
  onDelete,
  labels,
  palette,
  testID,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename?: () => void;
  onToggleUnread?: () => void;
  onDelete?: () => void;
  labels: Labels;
  palette: AgentChatPalette;
  testID?: string;
}) {
  const { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } =
    useAgentChatPlatform();
  const name = labels.moreFor(title);
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild label={name}>
        <IconAction
          testID={testID}
          label={name}
          size={24}
          color={palette.iconSecondary}
          hoverColor={palette.iconPrimary}
          hoverBackground={palette.tertiary}
          active={open}
          palette={palette}
          icon={(color) => <RiMore2Fill width={16} height={16} fill={color} />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent label={name} side="bottom" align="end" style={SMALL_MENU_STYLE}>
        {onRename ? (
          <DropdownMenuItem className={DENSE_ROW_CLASS} onPress={onRename}>
            {labels.rename}
          </DropdownMenuItem>
        ) : null}
        {onToggleUnread ? (
          <DropdownMenuItem className={DENSE_ROW_CLASS} onPress={onToggleUnread}>
            {labels.markUnread}
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem className={DENSE_ROW_CLASS} variant="destructive" onPress={onDelete}>
            {labels.delete}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThreadRow({
  thread,
  active,
  disabled,
  onSelect,
  onRename,
  onToggleUnread,
  onDelete,
  formatAge,
  labels,
  palette,
  testID,
}: {
  thread: AgentChatThread;
  active: boolean;
  disabled: boolean;
  onSelect?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onToggleUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  formatAge: (at: number) => string;
  labels: Labels;
  palette: AgentChatPalette;
  testID?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(thread.title);
  const inputRef = useRef<TextInput | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (!renaming) return;
    settled.current = false;
    const node = inputRef.current;
    node?.focus();
    // Select the whole title, via `input.select()`.
    const dom = node as unknown as { select?: () => void } | null;
    if (IS_WEB) dom?.select?.();
    else node?.setSelection?.(0, thread.title.length);
  }, [renaming, thread.title.length]);

  const commit = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    const next = draft.trim();
    if (next && next !== thread.title) onRename?.(thread.id, next);
    setRenaming(false);
  }, [draft, onRename, thread.id, thread.title]);

  const cancel = useCallback(() => {
    settled.current = true;
    setDraft(thread.title);
    setRenaming(false);
  }, [thread.title]);

  if (renaming) {
    const field: TextStyle & WebCssStyle = {
      ...TYPE_SCALE['body-2-regular'],
      fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
      color: palette.text,
      width: '100%',
      padding: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
    };
    return (
      <View
        style={{
          borderRadius: ROW_RADIUS,
          backgroundColor: palette.rowHover,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 6,
          paddingBottom: 6,
        }}>
        <TextInput
          {...dataHook('bloomAgentChatField')}
          ref={inputRef}
          testID={testID ? `${testID}-rename` : undefined}
          accessibilityLabel={labels.renameField}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          submitBehavior="blurAndSubmit"
          onBlur={commit}
          onKeyPress={(event) => {
            if (event.nativeEvent.key === 'Escape') {
              (event as unknown as { preventDefault?: () => void }).preventDefault?.();
              cancel();
            }
          }}
          selectionColor={palette.text}
          style={field}
        />
      </View>
    );
  }

  const rowStyle: WebCssStyle = {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ROW_RADIUS,
    ...(active || menuOpen ? { backgroundColor: palette.rowHover } : null),
    '--bloom-agent-chat-row-hover': palette.rowHover,
  };

  // Web: the family sheet swaps age and trigger on hover / focus-visible, and
  // inline opacity is only written while the menu is open (it must win). Native
  // has no hover: the age shows and the (transparent) trigger over it still
  // takes the press on touch.
  const ageOpacity = menuOpen ? 0 : IS_WEB ? undefined : 1;
  const menuOpacity = menuOpen ? 1 : IS_WEB ? undefined : 0;

  const selectStyle: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    borderRadius: ROW_RADIUS,
    opacity: disabled ? 0.5 : 1,
    '--bloom-agent-chat-ring': palette.ring,
  };

  return (
    <View {...dataHook('bloomAgentChatThread')} testID={testID} style={rowStyle}>
      <Pressable
        {...dataHook('bloomAgentChatControl')}
        testID={testID ? `${testID}-select` : undefined}
        accessibilityRole="button"
        accessibilityLabel={thread.unread ? `${labels.unread}, ${thread.title}` : thread.title}
        aria-current={active ? 'true' : undefined}
        aria-disabled={disabled || undefined}
        accessibilityState={{ disabled, selected: active }}
        disabled={disabled}
        onPress={() => onSelect?.(thread.id)}
        style={selectStyle}>
        {thread.unread ? (
          <View
            accessibilityLabel={labels.unread}
            style={{
              width: 6,
              height: 6,
              flexShrink: 0,
              borderRadius: 3,
              backgroundColor: palette.primary.rest.gradient?.[0] ?? palette.accent500,
            }}
          />
        ) : null}
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          style={{
            flex: 1,
            minWidth: 0,
            color: thread.unread ? palette.text : palette.textSecondary,
          }}>
          {thread.title}
        </Text>
      </Pressable>

      <View
        {...dataHook('bloomAgentChatSlot')}
        style={{
          position: 'relative',
          width: 28,
          height: 28,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 4,
        }}>
        <View
          {...dataHook('bloomAgentChatAge')}
          aria-hidden={menuOpen}
          style={ageOpacity === undefined ? undefined : { opacity: ageOpacity }}>
          <Text variant="caption-1-regular" style={{ color: palette.textTertiary }}>
            {formatAge(thread.updatedAt)}
          </Text>
        </View>
        <View
          {...dataHook('bloomAgentChatRowMenu')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            // Nudged 1px left: the glyph reads as sitting right in its own box.
            transform: [{ translateX: -1 }],
            ...(menuOpacity === undefined ? null : { opacity: menuOpacity }),
          }}>
          <RowMenu
            testID={testID ? `${testID}-menu` : undefined}
            title={thread.title}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onRename={
              onRename
                ? () => {
                    setDraft(thread.title);
                    setRenaming(true);
                  }
                : undefined
            }
            onToggleUnread={onToggleUnread ? () => onToggleUnread(thread.id) : undefined}
            onDelete={onDelete ? () => onDelete(thread.id) : undefined}
            labels={labels}
            palette={palette}
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Footer
// ---------------------------------------------------------------------------

function AccountMenu({
  account,
  usage,
  onUpgrade,
  accountItems,
  onLogOut,
  labels,
  palette,
  testID,
}: Pick<AgentChatHistoryProps, 'usage' | 'onUpgrade' | 'accountItems' | 'onLogOut'> & {
  account: NonNullable<AgentChatHistoryProps['account']>;
  labels: Labels;
  palette: AgentChatPalette;
  testID?: string;
}) {
  const {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  } = useAgentChatPlatform();
  const [open, setOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const name = labels.accountMenu(account.name);
  const hasUsage = Boolean(usage && usage.length > 0);
  const hasItems = Boolean(accountItems && accountItems.length > 0);

  const iconColor = palette.iconSecondary;
  const triggerStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    borderRadius: ROW_RADIUS,
    padding: 4,
    backgroundColor: hovered || open ? palette.rowHover : 'transparent',
    '--bloom-agent-chat-ring': palette.ring,
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setUsageOpen(false);
      }}>
      <DropdownMenuTrigger asChild label={name} style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
        <Pressable
          {...dataHook('bloomAgentChatControl')}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={name}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={triggerStyle}>
          <Avatar
            size="sm"
            name={account.name}
            initials={account.initials ?? account.name.charAt(0).toUpperCase()}
            color="neutral"
            source={account.avatar ?? undefined}
          />
          <Text
            variant="body-2-medium"
            numberOfLines={1}
            style={{ flex: 1, minWidth: 0, color: palette.text }}>
            {account.name}
          </Text>
        </Pressable>
      </DropdownMenuTrigger>

      <DropdownMenuContent label={name} side="top" align="start" style={ACCOUNT_MENU_STYLE}>
        <View style={{ flexDirection: 'column', gap: 4, width: '100%' }}>
          {hasUsage ? (
            <HoverRow
              testID={testID ? `${testID}-usage` : undefined}
              accessibilityLabel={labels.usageLeft}
              expanded={usageOpen}
              onPress={() => setUsageOpen((value) => !value)}
              hoverBackground={palette.chatSurface}
              palette={palette}
              style={{ gap: 8, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}>
              <RiSpeedUpLine width={18} height={18} fill={iconColor} />
              <Text variant="body-medium" numberOfLines={1} style={{ flex: 1, color: palette.text }}>
                {labels.usageLeft}
              </Text>
              <RotatingChevron open={usageOpen} color={iconColor} />
            </HoverRow>
          ) : null}

          {hasUsage && usageOpen ? (
            <View style={{ flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
              {usage!.map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingTop: 2,
                    paddingBottom: 2,
                    paddingRight: 8,
                    paddingLeft: 36,
                  }}>
                  <Text
                    variant="body-2-medium"
                    numberOfLines={1}
                    style={{ flex: 1, color: palette.text }}>
                    {row.label}
                  </Text>
                  <Text variant="body-2-regular" style={{ flexShrink: 0, color: palette.textSecondary }}>
                    {row.value}
                  </Text>
                  <Text
                    variant="body-2-regular"
                    style={{ width: 36, flexShrink: 0, textAlign: 'right', color: palette.textTertiary }}>
                    {`${Math.round(Math.min(100, Math.max(0, row.percent)))}%`}
                  </Text>
                </View>
              ))}
              {onUpgrade ? (
                <HoverRow
                  accessibilityLabel={labels.upgrade}
                  onPress={() => {
                    close();
                    onUpgrade();
                  }}
                  hoverBackground={palette.chatSurface}
                  palette={palette}
                  style={{ gap: 8, paddingTop: 4, paddingBottom: 4, paddingRight: 8, paddingLeft: 36 }}>
                  <Text
                    variant="body-2-medium"
                    numberOfLines={1}
                    style={{ flex: 1, color: palette.text }}>
                    {labels.upgrade}
                  </Text>
                  <RiGlobalLine width={16} height={16} fill={palette.iconTertiary} />
                </HoverRow>
              ) : null}
            </View>
          ) : null}

          {hasItems
            ? accountItems!.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.key}
                    className={DENSE_ROW_CLASS}
                    accessibilityLabel={item.label}
                    leading={Icon ? <Icon width={18} height={18} fill={iconColor} /> : undefined}
                    onPress={item.onPress}>
                    {item.label}
                  </DropdownMenuItem>
                );
              })
            : null}
        </View>

        {onLogOut ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={DENSE_ROW_CLASS}
              accessibilityLabel={labels.logOut}
              leading={<RiLogoutBoxRLine width={18} height={18} fill={iconColor} />}
              onPress={onLogOut}>
              {labels.logOut}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
//  Rail
// ---------------------------------------------------------------------------

export function AgentChatHistoryBase({
  threads,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onToggleUnread,
  onDelete,
  onExport,
  disabled = false,
  account,
  usage,
  onUpgrade,
  accountItems,
  onLogOut,
  formatAge = relativeTime,
  labels,
  style,
  testID,
}: AgentChatHistoryProps) {
  useAgentChatWebCss();
  const palette = useAgentChatPalette();
  const l = useMemo<Labels>(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const count = threads.length;
  const exportLabel = l.exportCount(count);

  const rail: WebCssStyle = {
    width: RAIL_WIDTH,
    height: '100%',
    flexShrink: 0,
    flexDirection: 'column',
    gap: 24,
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    backgroundColor: palette.chatSurface,
    padding: 12,
  };

  return (
    <View
      testID={testID}
      role="complementary"
      aria-label={l.region}
      accessibilityLabel={l.region}
      style={[rail, style]}>
      <HoverRow
        testID={testID ? `${testID}-new` : undefined}
        accessibilityLabel={l.newChat}
        onPress={onNewChat}
        disabled={disabled}
        hoverBackground={palette.rowHover}
        palette={palette}
        style={{ gap: 8, padding: 8 }}>
        <RiAddLine width={20} height={20} fill={palette.iconSecondary} />
        <Text variant="body-medium" style={{ color: palette.text }}>
          {l.newChat}
        </Text>
      </HoverRow>

      <ScrollView
        {...dataHook('bloomAgentChatScrollHidden')}
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexDirection: 'column', gap: 4 }}
        showsVerticalScrollIndicator={false}>
        <Text
          variant="body-2-medium"
          style={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 4, color: palette.textTertiary }}>
          {l.recent}
        </Text>
        {count === 0 ? (
          <Text
            variant="body-2-regular"
            style={{ paddingLeft: 8, paddingRight: 8, color: palette.textTertiary }}>
            {l.empty}
          </Text>
        ) : (
          threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              testID={testID ? `${testID}-thread-${thread.id}` : undefined}
              thread={thread}
              active={thread.id === activeId}
              disabled={disabled}
              onSelect={onSelect}
              onRename={onRename}
              onToggleUnread={onToggleUnread}
              onDelete={onDelete}
              formatAge={formatAge}
              labels={l}
              palette={palette}
            />
          ))
        )}
      </ScrollView>

      {account || onExport ? (
        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderTopWidth: 1,
            borderTopColor: palette.separator,
            paddingTop: 12,
            paddingRight: 4,
          }}>
          {account ? (
            <AccountMenu
              testID={testID ? `${testID}-account` : undefined}
              account={account}
              usage={usage}
              onUpgrade={onUpgrade}
              accountItems={accountItems}
              onLogOut={onLogOut}
              labels={l}
              palette={palette}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {onExport ? (
            <PrimaryDisc
              testID={testID ? `${testID}-export` : undefined}
              label={exportLabel}
              size={24}
              hoverOpacity={0.9}
              disabled={count === 0}
              onPress={onExport}
              palette={palette}>
              <RiDownloadLine width={14} height={14} fill="#ffffff" />
            </PrimaryDisc>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
