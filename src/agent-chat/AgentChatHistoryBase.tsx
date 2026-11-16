import { UnreadBadge } from '../chat-indicators';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { Button } from '../button';
import { ScrollArea } from '../layout/ScrollArea';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '../avatar';
import { ChatSearchField } from '../chat-list/ChatSearchField';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiDownloadLine } from '../icons/remix/RiDownloadLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiSpeedUpLine } from '../icons/remix/RiSpeedUpLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { TYPE_SCALE, Text } from '../typography';
import { useAgentChatPlatform } from './context';
import {
  ACCOUNT_MENU_STYLE,
  CARD_RADIUS,
  DENSE_ROW_CLASS,
  RAIL_WIDTH,
  relativeTime,
  ROW_RADIUS,
  useAgentChatPalette,
  useAgentChatWebCss,
  type AgentChatPalette,
} from './shared';
import { AGENT_CHAT_MESSAGES, type AgentChatMessages } from './messages';
import type { AgentChatHistoryProps, AgentChatThread } from './types';
import { DISABLED_OPACITY } from '../styles/tokens';
import { IS_WEB } from '../styles/platform';
import { dataHook } from '../styles/data-hook';
import { useInteractionState } from '../hooks/use-interaction-state';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

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

type Labels = AgentChatMessages['history'] & {
  newChat: string;
  delete: string;
  moreFor: (title: string) => string;
};

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
  const reducedMotion = usePrefersReducedMotion();
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
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const lit = !disabled && (hovered || active);
  const merged: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: ROW_RADIUS,
    ...style,
    backgroundColor: lit ? hoverBackground : 'transparent',
    opacity: disabled ? DISABLED_OPACITY : 1,
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
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={merged}
    >
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Thread row
// ---------------------------------------------------------------------------

/** The inline editor only owns rename state; List owns the surrounding row. */
function ThreadTitleEditor({
  thread,
  onRename,
  onDone,
  labels,
  palette,
  testID,
}: {
  thread: AgentChatThread;
  onRename: (id: string, title: string) => void;
  onDone: () => void;
  labels: Labels;
  palette: AgentChatPalette;
  testID?: string;
}) {
  const [draft, setDraft] = useState(thread.title);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const settled = useRef(false);
  useEffect(() => {
    const node = inputRef.current;
    node?.focus();
    const dom = node as unknown as { select?: () => void } | null;
    if (IS_WEB) dom?.select?.();
    else node?.setSelection?.(0, thread.title.length);
  }, [thread.title.length]);
  const commit = () => {
    if (settled.current) return;
    settled.current = true;
    const next = draft.trim();
    if (next && next !== thread.title) onRename(thread.id, next);
    onDone();
  };
  return (
    <TextInput
      {...dataHook('bloomAgentChatField')}
      ref={inputRef}
      testID={testID}
      accessibilityLabel={labels.renameField}
      value={draft}
      onChangeText={setDraft}
      onSubmitEditing={commit}
      submitBehavior="blurAndSubmit"
      onBlur={commit}
      onKeyPress={(event) => {
        if (event.nativeEvent.key === 'Escape') {
          settled.current = true;
          onDone();
        }
      }}
      selectionColor={palette.text}
      style={{
        ...TYPE_SCALE['body-regular'],
        color: palette.text,
        width: '100%',
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
      }}
    />
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
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
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
      }}
    >
      <DropdownMenuTrigger
        asChild
        label={name}
        style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}
      >
        <Pressable
          {...dataHook('bloomAgentChatControl')}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={name}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          style={triggerStyle}
        >
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
            style={{ flex: 1, minWidth: 0, color: palette.text }}
          >
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
              style={{ gap: 8, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}
            >
              <RiSpeedUpLine width={18} height={18} fill={iconColor} />
              <Text
                variant="body-medium"
                numberOfLines={1}
                style={{ flex: 1, color: palette.text }}
              >
                {labels.usageLeft}
              </Text>
              <RotatingChevron open={usageOpen} color={iconColor} />
            </HoverRow>
          ) : null}

          {hasUsage && usageOpen ? (
            <View style={{ flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
              {usage?.map((row) => (
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
                  }}
                >
                  <Text
                    variant="body-2-medium"
                    numberOfLines={1}
                    style={{ flex: 1, color: palette.text }}
                  >
                    {row.label}
                  </Text>
                  <Text
                    variant="body-2-regular"
                    style={{ flexShrink: 0, color: palette.textSecondary }}
                  >
                    {row.value}
                  </Text>
                  <Text
                    variant="body-2-regular"
                    style={{
                      width: 36,
                      flexShrink: 0,
                      textAlign: 'right',
                      color: palette.textTertiary,
                    }}
                  >
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
                  style={{
                    gap: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingRight: 8,
                    paddingLeft: 36,
                  }}
                >
                  <Text
                    variant="body-2-medium"
                    numberOfLines={1}
                    style={{ flex: 1, color: palette.text }}
                  >
                    {labels.upgrade}
                  </Text>
                  <RiGlobalLine width={16} height={16} fill={palette.iconTertiary} />
                </HoverRow>
              ) : null}
            </View>
          ) : null}

          {hasItems
            ? accountItems?.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.key}
                    className={DENSE_ROW_CLASS}
                    accessibilityLabel={item.label}
                    leading={Icon ? <Icon width={18} height={18} fill={iconColor} /> : undefined}
                    onPress={item.onPress}
                  >
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
              onPress={onLogOut}
            >
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
  formatAge: formatAgeProp,
  query,
  onQueryChange,
  onEndReached,
  onEndReachedThreshold = 200,
  after,
  labels,
  style,
  testID,
  framed = true,
}: AgentChatHistoryProps) {
  useAgentChatWebCss();
  const { List } = useAgentChatPlatform();
  const [renamingId, setRenamingId] = useState<string>();
  const palette = useAgentChatPalette();
  const { messages } = useMessages(AGENT_CHAT_MESSAGES);
  const common = useCommonMessages();
  const l = useMemo<Labels>(
    () => ({
      ...messages.history,
      newChat: messages.chat.newChat,
      delete: common.delete,
      moreFor: (title: string) => common.labelFor(common.moreActions, title),
      ...labels,
    }),
    [messages, common, labels],
  );
  const formatAge = useMemo(
    () => formatAgeProp ?? ((at: number) => relativeTime(at, Date.now(), messages.age)),
    [formatAgeProp, messages],
  );
  const count = threads.length;
  const exportLabel = l.exportCount(count);
  const grouped = threads.some((thread) => thread.group != null);
  const nearEnd = useRef(false);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!onEndReached) return;
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const near =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - onEndReachedThreshold;
      if (near && !nearEnd.current) onEndReached();
      nearEnd.current = near;
    },
    [onEndReached, onEndReachedThreshold],
  );

  const rail: WebCssStyle = {
    width: framed ? RAIL_WIDTH : '100%',
    height: '100%',
    flexShrink: 0,
    flexDirection: 'column',
    gap: 24,
    overflow: 'hidden',
    borderRadius: framed ? CARD_RADIUS : undefined,
    backgroundColor: framed ? palette.chatSurface : undefined,
    padding: 12,
  };

  return (
    <View
      collapsable={false}
      testID={testID}
      role="complementary"
      aria-label={l.region}
      accessibilityLabel={l.region}
      style={[rail, style]}
    >
      <Button
        leadingIcon={RiAddLine}
        tone="neutral"
        appearance="plain"
        onPress={onNewChat}
        disabled={disabled}
        testID={testID ? `${testID}-new` : undefined}
      >
        {l.newChat}
      </Button>

      {onQueryChange ? (
        <ChatSearchField
          testID={testID ? `${testID}-search` : undefined}
          value={query ?? ''}
          onChangeText={onQueryChange}
          onClear={() => onQueryChange('')}
          placeholder={labels?.search}
          style={{ marginTop: -12 }}
        />
      ) : null}

      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexDirection: 'column', gap: 4 }}
        onScroll={onEndReached ? onScroll : undefined}
        scrollEventThrottle={onEndReached ? 64 : undefined}
      >
        <List
          sections={threads.reduce<import('../list/types').ListSection[]>(
            (sections, thread, index) => {
              const groupTitle = grouped ? thread.group : l.recent;
              let section = sections[sections.length - 1];
              if (!section || groupTitle !== (grouped ? threads[index - 1]?.group : l.recent)) {
                section = { id: `group-${index}`, title: groupTitle, items: [] };
                sections.push(section);
              }
              const editing = renamingId === thread.id;
              const rowID = testID ? `${testID}-thread-${thread.id}` : undefined;
              const actions: import('../list/types').ListAction[] = [];
              if (onRename)
                actions.push({
                  key: 'rename',
                  icon: RiPencilLine,
                  label: l.rename,
                  onPress: () => setRenamingId(thread.id),
                });
              if (onToggleUnread)
                actions.push({
                  key: 'unread',
                  icon: RiMailLine,
                  label: l.markUnread,
                  onPress: () => onToggleUnread(thread.id),
                });
              if (onDelete)
                actions.push({
                  key: 'delete',
                  icon: RiDeleteBinLine,
                  label: l.delete,
                  tone: 'negative',
                  onPress: () => onDelete(thread.id),
                });
              section.items = [
                ...section.items,
                {
                  id: thread.id,
                  testID: rowID,
                  disabled,
                  active: thread.id === activeId,
                  label: thread.unread ? `${l.unread}, ${thread.title}` : thread.title,
                  title: (
                    <Text
                      variant={thread.unread ? 'body-semibold' : 'body-medium'}
                      numberOfLines={1}
                      style={{ color: thread.unread ? palette.text : palette.textSecondary }}
                    >
                      {thread.title}
                    </Text>
                  ),
                  trailing: (
                    <View
                      pointerEvents="none"
                      aria-hidden
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      {thread.unread ? <UnreadBadge dot /> : null}
                      <Text variant="caption-1-regular" style={{ color: palette.textTertiary }}>
                        {formatAge(thread.updatedAt)}
                      </Text>
                    </View>
                  ),
                  onPress: editing ? undefined : () => onSelect?.(thread.id),
                  actions: editing ? undefined : actions,
                  swipeActions: editing ? undefined : { right: actions },
                  content:
                    editing && onRename ? (
                      <ThreadTitleEditor
                        key={thread.id}
                        thread={thread}
                        onRename={onRename}
                        onDone={() => setRenamingId(undefined)}
                        labels={l}
                        palette={palette}
                        testID={rowID ? `${rowID}-rename` : undefined}
                      />
                    ) : undefined,
                },
              ];
              return sections;
            },
            [],
          )}
          empty={
            !after ? (
              <Text
                variant="body-2-regular"
                style={{ paddingHorizontal: 8, color: palette.textTertiary }}
              >
                {l.empty}
              </Text>
            ) : undefined
          }
          footer={after}
        />
      </ScrollArea>

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
          }}
        >
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
            <Button
              iconOnly
              icon={RiDownloadLine}
              accessibilityLabel={exportLabel}
              tone="accent"
              disabled={count === 0}
              onPress={onExport}
              testID={testID ? `${testID}-export` : undefined}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
