import React, { memo, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { Search } from '../search';
import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { Tabs, TabsTrigger } from '../tabs';
import { Text } from '../typography';
import { ChatMemberRow } from './ChatMemberRow';
import {
  CHAT_INFO_PANE_WIDTH,
  CHAT_SCREEN_LABELS,
  useChatScreenPaint,
  useResolvedImageSource,
  type ChatScreenPaint,
} from './shared';
import type { ChatInfoAction, ChatInfoPanelProps, ChatMember } from './types';

/** Above this the roster gets a search field unless the caller says otherwise. */
const MEMBER_SEARCH_THRESHOLD = 8;

function SectionTitle({ children, paint }: { children: string; paint: ChatScreenPaint }) {
  return (
    <Text
      variant="caption-1-semibold"
      accessibilityRole="header"
      style={{
        color: paint.textSecondary,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * One tile in the action row. A tile is a button that draws its own label, so
 * ARIA names it from its contents; `accessibilityLabel` is for the case where
 * the visible word is not the whole action ("Mute" → "Mute this conversation").
 */
function ActionTile({ action, paint }: { action: ChatInfoAction; paint: ChatScreenPaint }) {
  const Icon = action.icon;
  const negative = action.tone === 'negative';
  const tint = negative ? paint.destructive : paint.accentColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel ?? action.label}
      disabled={action.disabled}
      onPress={action.onPress}
      testID={`chat-info-action-${action.key}`}
      style={{
        // 56, not 64: five tiles at 64 plus their gaps overflow a 380 pane by a
        // few pixels, and the fifth wraps onto a row of its own.
        minWidth: 56,
        flexGrow: 1,
        flexBasis: 0,
        alignItems: 'center',
        gap: 4,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 4,
        paddingRight: 4,
        borderRadius: 14,
        backgroundColor: negative ? paint.destructiveSubtle : paint.accentSubtle,
        opacity: action.disabled ? 0.5 : 1,
      }}
    >
      <Icon width={20} height={20} fill={tint} />
      <Text variant="caption-1-medium" numberOfLines={1} style={{ color: tint }}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * The profile / group panel: who this is, what you can do with them, what you
 * have shared, and the two or three things you will regret doing by accident.
 *
 * ONE COMPONENT, TWO SHAPES. `variant="pane"` is the desktop right-hand column
 * at a fixed `width` with a left hairline; `variant="screen"` is the mobile full
 * page with no frame of its own. Nothing else differs — the same props produce
 * the same sections in the same order, so a responsive app swaps the variant and
 * not the composition.
 *
 * THE SETTINGS BLOCK IS A SLOT, NOT A SCHEMA. A notifications switch owns state,
 * a disappearing-messages row owns a picker, an encryption key owns a
 * verification flow — every one of them needs semantics the panel cannot hold.
 * Compose it from `SettingsListGroup` / `SettingsListItem` (worked example in
 * `docs/chat-screen.mdx`) and hand it in.
 *
 * The SHARED-CONTENT tabs are the same bargain one level up: the panel owns the
 * strip and the selection, each pane's grid comes from the caller.
 *
 * MEMBER SEARCH HAS TWO MODES and they are not the same component. Pass
 * `memberQuery` and the panel filters NOTHING — the caller owns the result set,
 * which is the only correct behaviour once the roster lives on a server. Leave
 * it out and the panel keeps its own query and filters by name.
 */
function ChatInfoPanelComponent(props: ChatInfoPanelProps) {
  const paint = useChatScreenPaint();
  const {
    variant = 'pane',
    width = CHAT_INFO_PANE_WIDTH,
    title = CHAT_SCREEN_LABELS.info,
    onClose,
    closeLabel = CHAT_SCREEN_LABELS.close,
    headerActions,
    cover,
    coverSource,
    coverHeight = 160,
    avatar,
    avatarSource,
    presence,
    avatarSize,
    name,
    handle,
    bio,
    meta,
    actions,
    settings,
    settingsTitle,
    tabs,
    tab,
    onTabChange,
    defaultTab,
    members,
    membersTitle = CHAT_SCREEN_LABELS.members,
    onPressMember,
    roleLabels,
    memberSearch,
    memberQuery,
    onMemberQueryChange,
    memberSearchPlaceholder = CHAT_SCREEN_LABELS.memberSearch,
    onAddMember,
    addMemberLabel = CHAT_SCREEN_LABELS.addMember,
    membersEmptyLabel = CHAT_SCREEN_LABELS.noMembers,
    destructiveActions,
    children,
    scrollable = true,
    style,
    contentStyle,
    testID,
  } = props;

  const coverImage = useResolvedImageSource(coverSource, 'large');
  const hasCover = Boolean(cover ?? coverImage);
  const resolvedAvatarSize = avatarSize ?? (hasCover ? 72 : 96);

  const [selectedTab, setSelectedTab] = useControllableState<string>({
    value: tab,
    defaultValue: defaultTab ?? tabs?.[0]?.value ?? '',
    onChange: onTabChange,
  });
  const activeTab = tabs?.find((entry) => entry.value === selectedTab) ?? tabs?.[0];

  // Uncontrolled roster query. Controlled callers filter for themselves.
  const [ownQuery, setOwnQuery] = useState('');
  const controlledQuery = memberQuery !== undefined;
  const query = controlledQuery ? memberQuery : ownQuery;
  const showMemberSearch =
    memberSearch ?? ((members?.length ?? 0) >= MEMBER_SEARCH_THRESHOLD);

  const visibleMembers = useMemo<ChatMember[]>(() => {
    if (!members) return [];
    if (controlledQuery || query.trim() === '') return members;
    const needle = query.trim().toLowerCase();
    return members.filter((member) => member.name.toLowerCase().includes(needle));
  }, [controlledQuery, members, query]);

  const body = (
    <View style={[{ paddingBottom: 24, gap: 20 }, contentStyle]}>
      {/* Identity */}
      <View>
        {hasCover ? (
          <View style={{ height: coverHeight, overflow: 'hidden', backgroundColor: paint.surfaceSubtle }}>
            {cover ??
              (coverImage ? (
                <Image
                  source={coverImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  testID={testID ? `${testID}-cover` : undefined}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null)}
          </View>
        ) : null}
        <View
          style={{
            alignItems: 'center',
            gap: 6,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: hasCover ? 0 : 12,
            marginTop: hasCover ? -resolvedAvatarSize / 2 : 0,
          }}
        >
          {avatar ?? (
            <AvatarPresence
              source={avatarSource ?? undefined}
              name={name}
              size={resolvedAvatarSize}
              status={presence}
              presenceRingColor={paint.surface}
            />
          )}
          {name ? (
            <Text
              variant="title-2-semibold"
              accessibilityRole="header"
              style={{ color: paint.text, textAlign: 'center' }}
            >
              {name}
            </Text>
          ) : null}
          {handle ? (
            <Text variant="body-regular" style={{ color: paint.textSecondary, textAlign: 'center' }}>
              {handle}
            </Text>
          ) : null}
          {bio ? (
            <Text
              variant="body-regular"
              style={{ color: paint.text, textAlign: 'center', paddingTop: 4 }}
            >
              {bio}
            </Text>
          ) : null}
          {meta ? (
            <Text variant="caption-1-regular" style={{ color: paint.textTertiary }}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action row */}
      {actions && actions.length > 0 ? (
        <View
          testID={testID ? `${testID}-actions` : undefined}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {actions.map((action) => (
            <ActionTile key={action.key} action={action} paint={paint} />
          ))}
        </View>
      ) : null}

      {/* Settings */}
      {settings ? (
        <View testID={testID ? `${testID}-settings` : undefined}>
          {settingsTitle ? <SectionTitle paint={paint}>{settingsTitle}</SectionTitle> : null}
          <View style={{ paddingLeft: 12, paddingRight: 12 }}>{settings}</View>
        </View>
      ) : null}

      {/* Shared content */}
      {tabs && tabs.length > 0 ? (
        <View testID={testID ? `${testID}-tabs` : undefined}>
          <Tabs
            value={activeTab?.value ?? ''}
            onValueChange={setSelectedTab}
            variant="underline"
            style={{ paddingLeft: 12, paddingRight: 12 }}
          >
            {tabs.map((entry) => (
              <TabsTrigger
                key={entry.value}
                value={entry.value}
                label={entry.label}
                leadingIcon={entry.icon}
                count={entry.count}
              />
            ))}
          </Tabs>
          <View
            testID={testID ? `${testID}-tab-panel` : undefined}
            style={{ paddingTop: 12, paddingLeft: 12, paddingRight: 12 }}
          >
            {activeTab?.content}
          </View>
        </View>
      ) : null}

      {/* Members */}
      {members ? (
        <View testID={testID ? `${testID}-members` : undefined}>
          <SectionTitle paint={paint}>{membersTitle}</SectionTitle>
          {showMemberSearch ? (
            <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
              <Search
                value={query}
                label={memberSearchPlaceholder}
                onChangeText={controlledQuery ? onMemberQueryChange : setOwnQuery}
                onClearText={() => (controlledQuery ? onMemberQueryChange?.('') : setOwnQuery(''))}
                testID={testID ? `${testID}-member-search` : undefined}
              />
            </View>
          ) : null}
          {onAddMember ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={addMemberLabel}
              onPress={onAddMember}
              testID={testID ? `${testID}-add-member` : undefined}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: paint.accentSubtle,
                }}
              >
                <RiUserAddLine width={20} height={20} fill={paint.accentColor} />
              </View>
              <Text variant="body-medium" style={{ color: paint.accentColor }}>
                {addMemberLabel}
              </Text>
            </Pressable>
          ) : null}
          {visibleMembers.length === 0 ? (
            <Text
              variant="body-regular"
              testID={testID ? `${testID}-members-empty` : undefined}
              style={{ color: paint.textSecondary, paddingLeft: 16, paddingRight: 16 }}
            >
              {membersEmptyLabel}
            </Text>
          ) : (
            visibleMembers.map((member) => (
              <ChatMemberRow
                key={member.id}
                member={member}
                onPress={onPressMember}
                roleLabels={roleLabels}
                testID={`chat-info-member-${member.id}`}
              />
            ))
          )}
        </View>
      ) : null}

      {/* Destructive */}
      {destructiveActions && destructiveActions.length > 0 ? (
        <View
          testID={testID ? `${testID}-destructive` : undefined}
          style={{ paddingLeft: 12, paddingRight: 12 }}
        >
          <SettingsListGroup variant="filled">
            {destructiveActions.map((action) => (
              <SettingsListItem
                key={action.key}
                title={action.label}
                icon={<action.icon width={20} height={20} fill={paint.destructive} />}
                destructive
                showChevron={false}
                disabled={action.disabled}
                onPress={action.onPress}
                accessibilityLabel={action.accessibilityLabel ?? action.label}
              />
            ))}
          </SettingsListGroup>
        </View>
      ) : null}

      {children}
    </View>
  );

  const frame =
    variant === 'pane'
      ? {
          width,
          flexShrink: 0,
          borderLeftWidth: 1,
          borderLeftColor: paint.border,
        }
      : { flexGrow: 1, flexShrink: 1 };

  return (
    <View
      testID={testID}
      style={[{ minHeight: 0, backgroundColor: paint.surface }, frame, style]}
    >
      <View
        style={{
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 16,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: paint.border,
        }}
      >
        <Text
          variant="headline-semibold"
          numberOfLines={1}
          accessibilityRole="header"
          style={{ flexGrow: 1, flexShrink: 1, color: paint.text }}
        >
          {title}
        </Text>
        {headerActions}
        {onClose ? (
          <Button
            variant="text"
            size="small"
            iconOnly
            icon={<RiCloseLine width={18} height={18} fill={paint.textSecondary} />}
            accessibilityLabel={closeLabel}
            onPress={onClose}
            testID={testID ? `${testID}-close` : undefined}
          />
        ) : null}
      </View>
      {scrollable ? (
        <ScrollView
          style={{ flexGrow: 1, flexShrink: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          testID={testID ? `${testID}-scroll` : undefined}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

export const ChatInfoPanel = memo(ChatInfoPanelComponent);
ChatInfoPanel.displayName = 'ChatInfoPanel';
