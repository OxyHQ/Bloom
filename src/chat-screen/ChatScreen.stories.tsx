import React, { useContext, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiFileList2Line } from '../icons/remix/RiFileList2Line';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiImageLine } from '../icons/remix/RiImageLine';
import { RiKey2Line } from '../icons/remix/RiKey2Line';
import { RiLink } from '../icons/remix/RiLink';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiPaletteLine } from '../icons/remix/RiPaletteLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiSpamLine } from '../icons/remix/RiSpamLine';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { Switch } from '../switch';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ChatBackground } from './ChatBackground';
import { ChatDateHeader } from './ChatDateHeader';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatHeader } from './ChatHeader';
import { ChatInfoPanel } from './ChatInfoPanel';
import { ChatSplitLayout } from './ChatSplitLayout';
import { PinnedMessageBar } from './PinnedMessageBar';
import { JumpToMentionButton, ScrollToBottomButton } from './ScrollToBottomButton';
import { useChatScreenPaint } from './shared';
import type { ChatBackgroundVariant, ChatInfoAction, ChatMember, ChatPinnedMessage } from './types';

const meta: Meta = {
  title: 'Blocks/Chat/Chat Screen',
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented groups.
// ---------------------------------------------------------------------------

const AVATAR_ANA = 'https://i.pravatar.cc/160?img=47';
const AVATAR_GROUP = 'https://picsum.photos/seed/bloom-chat-cover/640/320';

const PINS: ChatPinnedMessage[] = [
  { id: 'p1', author: 'Ana', preview: 'Keys are under the blue pot by the door.' },
  {
    id: 'p2',
    author: 'Teodor',
    preview: 'Floorplan for the loft — the balcony is on the south side.',
    thumbnail: 'https://picsum.photos/seed/bloom-chat-pin/80/80',
  },
  { id: 'p3', author: 'Ana', preview: 'Dinner Thursday at eight, the place by the canal.' },
];

const MEMBERS: ChatMember[] = [
  { id: 'm1', name: 'Ana Restrepo', source: AVATAR_ANA, status: 'online', role: 'owner', subtitle: 'online' },
  { id: 'm2', name: 'Teodor Ilić', status: 'idle', role: 'admin', subtitle: 'last seen recently' },
  { id: 'm3', name: 'Mira Halvorsen', status: 'online', subtitle: 'online' },
  { id: 'm4', name: 'Kwabena Osei', status: 'offline', subtitle: 'last seen yesterday' },
  { id: 'm5', name: 'Juno Fábregas', status: 'busy', subtitle: 'in a call' },
  { id: 'm6', name: 'Petra Lindqvist', status: 'offline', subtitle: 'last seen last week' },
];

const PERSON_ACTIONS: ChatInfoAction[] = [
  { key: 'message', label: 'Message', icon: RiChat3Line },
  { key: 'call', label: 'Call', icon: RiPhoneLine },
  { key: 'video', label: 'Video', icon: RiVideoOnLine },
  { key: 'search', label: 'Search', icon: RiSearchLine },
  { key: 'mute', label: 'Mute', icon: RiVolumeMuteLine },
];

const GROUP_ACTIONS: ChatInfoAction[] = [
  ...PERSON_ACTIONS.slice(0, 4),
  { key: 'add', label: 'Add', icon: RiUserAddLine },
];

const PERSON_DESTRUCTIVE: ChatInfoAction[] = [
  { key: 'block', label: 'Block Ana', icon: RiSpamLine, tone: 'negative' },
  { key: 'report', label: 'Report', icon: RiSpamLine, tone: 'negative' },
];

const GROUP_DESTRUCTIVE: ChatInfoAction[] = [
  { key: 'leave', label: 'Leave group', icon: RiLogoutBoxRLine, tone: 'negative' },
  { key: 'report', label: 'Report group', icon: RiSpamLine, tone: 'negative' },
];

// ---------------------------------------------------------------------------
//  Story scaffolding
// ---------------------------------------------------------------------------

function Surface({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: padded ? 20 : 0,
        gap: 20,
        backgroundColor: theme.colors.background,
      }}
    >
      {children}
    </View>
  );
}

/** The same block in both modes, side by side — every colour here flips. */
function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
      <View style={{ minWidth: 0, maxWidth: '100%', flexShrink: 1, flexGrow: 1, flexBasis: 380 }}>
        <BloomThemeProvider mode="light" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
      <View style={{ minWidth: 0, maxWidth: '100%', flexShrink: 1, flexGrow: 1, flexBasis: 380 }}>
        <BloomThemeProvider mode="dark" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/**
 * Stand-in bubbles. The real ones live in `message-bubble`; these exist so the
 * wallpaper, the pinned bar and the jump buttons can be looked at over something
 * the right shape and the right colour.
 */
function Bubble({ text, time, outgoing = false }: { text: string; time: string; outgoing?: boolean }) {
  const theme = useTheme();
  const paint = useChatScreenPaint();
  const { accent } = resolveButtonRamps(theme);
  const background = outgoing ? accent[500] : paint.surface;
  const color = outgoing ? theme.colors.primaryForeground : paint.text;
  return (
    <View
      style={{
        maxWidth: 420,
        alignSelf: outgoing ? 'flex-end' : 'flex-start',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: outgoing ? accent[500] : paint.border,
        backgroundColor: background,
      }}
    >
      <Text variant="body-regular" style={{ flexShrink: 1, color }}>
        {text}
      </Text>
      <Text variant="caption-2-regular" style={{ color, opacity: 0.7 }}>
        {time}
      </Text>
    </View>
  );
}

function Transcript({ compact = false }: { compact?: boolean }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <View style={{ height: compact ? 8 : 24 }} />
      <Bubble text="Morning! The loft viewing is still on for Thursday?" time="09:12" />
      <Bubble text="It is — eight o'clock, the place by the canal." time="09:14" outgoing />
      <Bubble text="Perfect. I'll bring the floorplan Teodor sent over." time="09:15" />
      <Bubble
        text="Bring the measuring tape too, the balcony looked smaller than the photos."
        time="09:16"
        outgoing
      />
      <Bubble text="Already in the bag." time="09:17" />
      <Bubble text="See you Thursday then." time="09:21" outgoing />
    </ScrollView>
  );
}

function ConversationListStub() {
  const paint = useChatScreenPaint();
  return (
    <View style={{ flex: 1, backgroundColor: paint.surface }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: paint.border }}>
        <Text variant="title-3-semibold" style={{ color: paint.text }}>
          Chats
        </Text>
      </View>
      {MEMBERS.slice(0, 5).map((member, index) => (
        <View
          key={member.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            backgroundColor: index === 0 ? paint.accentSubtle : 'transparent',
          }}
        >
          <Avatar name={member.name} source={member.source ?? undefined} size={40} />
          <View style={{ minWidth: 0, flexShrink: 1 }}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
              {member.name}
            </Text>
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
              {member.subtitle}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MediaGridStub({ count = 9 }: { count?: number }) {
  const paint = useChatScreenPaint();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {Array.from({ length: count }, (_unused, i) => (
        <View
          key={i}
          style={{
            width: 96,
            height: 96,
            borderRadius: 8,
            backgroundColor: i % 2 === 0 ? paint.surfaceSubtle : paint.accentSubtle,
          }}
        />
      ))}
    </View>
  );
}

function SettingsBlock() {
  const paint = useChatScreenPaint();
  const [notifications, setNotifications] = useState(true);
  return (
    <SettingsListGroup variant="filled">
      <SettingsListItem
        title="Notifications"
        icon={<RiNotification3Line width={20} height={20} fill={paint.textSecondary} />}
        rightElement={
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            accessibilityLabel="Notifications for this conversation"
          />
        }
        showChevron={false}
      />
      <SettingsListItem
        title="Disappearing messages"
        value="Off"
        icon={<RiTimerLine width={20} height={20} fill={paint.textSecondary} />}
        onPress={() => {}}
      />
      <SettingsListItem
        title="Encryption key"
        icon={<RiKey2Line width={20} height={20} fill={paint.textSecondary} />}
        onPress={() => {}}
      />
      <SettingsListItem
        title="Conversation theme"
        value="Default"
        icon={<RiPaletteLine width={20} height={20} fill={paint.textSecondary} />}
        onPress={() => {}}
      />
    </SettingsListGroup>
  );
}

const SHARED_TABS = [
  { value: 'media', label: 'Media', icon: RiImageLine, count: 128, content: <MediaGridStub /> },
  { value: 'files', label: 'Files', icon: RiFolderLine, count: 12, content: <MediaGridStub count={3} /> },
  { value: 'links', label: 'Links', icon: RiLink, count: 34, content: <MediaGridStub count={2} /> },
  { value: 'voice', label: 'Voice', icon: RiMicLine, count: 4, content: <MediaGridStub count={2} /> },
  { value: 'groups', label: 'Groups', icon: RiGroupLine, count: 3, content: <MediaGridStub count={3} /> },
];

function PersonPanel({ variant }: { variant: 'pane' | 'screen' }) {
  return (
    <ChatInfoPanel
      variant={variant}
      style={{ maxWidth: '100%' }}
      title="Contact info"
      onClose={() => {}}
      avatarSource={AVATAR_ANA}
      presence="online"
      name="Ana Restrepo"
      handle="@anarestrepo"
      bio="Restoring a 1920s loft, one wall at a time. Coffee first."
      meta="online"
      actions={PERSON_ACTIONS}
      settings={<SettingsBlock />}
      settingsTitle="Settings"
      tabs={SHARED_TABS.slice(0, 4)}
      destructiveActions={PERSON_DESTRUCTIVE}
    />
  );
}

function GroupPanel({ variant }: { variant: 'pane' | 'screen' }) {
  return (
    <ChatInfoPanel
      variant={variant}
      style={{ maxWidth: '100%' }}
      title="Group info"
      onClose={() => {}}
      coverSource={AVATAR_GROUP}
      name="Canal Loft Crew"
      handle="6 members, 3 online"
      bio="Everything about the viewing, the paperwork and the paint."
      actions={GROUP_ACTIONS}
      settings={<SettingsBlock />}
      settingsTitle="Settings"
      tabs={SHARED_TABS}
      members={MEMBERS}
      memberSearch
      onPressMember={() => {}}
      onAddMember={() => {}}
      destructiveActions={GROUP_DESTRUCTIVE}
    />
  );
}

function Conversation({
  variant = 'pattern',
  compact = false,
  onOpenInfo,
}: {
  variant?: ChatBackgroundVariant;
  compact?: boolean;
  onOpenInfo?: () => void;
}) {
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <ChatHeader
        title="Ana Restrepo"
        marker="verified"
        status="online"
        statusTone="accent"
        avatarSource={AVATAR_ANA}
        presence="online"
        compact={compact}
        onPressBack={() => {}}
        onPressHeader={onOpenInfo}
        onPressCall={() => {}}
        onPressVideoCall={() => {}}
        onPressSearch={() => {}}
        onPressMore={() => {}}
      />
      <PinnedMessageBar pins={PINS} index={1} onPressPin={() => {}} onPressList={() => {}} onDismiss={() => {}} />
      <ChatBackground variant={variant} source="https://picsum.photos/seed/bloom-chat-wall/1200/900">
        <Transcript compact={compact} />
        <ChatDateHeader label="Today" />
        <View style={{ position: 'absolute', right: 16, bottom: 16, gap: 10 }}>
          <JumpToMentionButton count={2} onPress={() => {}} />
          <ScrollToBottomButton unreadCount={7} onPress={() => {}} />
        </View>
      </ChatBackground>
      <ComposerStub />
    </View>
  );
}

/** A stand-in for `chat-composer`, so the screen has a floor. */
function ComposerStub() {
  const paint = useChatScreenPaint();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: paint.surface,
        borderTopWidth: 1,
        borderTopColor: paint.border,
      }}
    >
      <View
        style={{
          flexGrow: 1,
          height: 40,
          justifyContent: 'center',
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 20,
          backgroundColor: paint.surfaceSubtle,
        }}
      >
        <Text variant="body-regular" style={{ color: paint.textTertiary }}>
          Message
        </Text>
      </View>
      <Button variant="primary" size="medium" iconOnly icon={RiChat3Line} accessibilityLabel="Send" />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** The whole screen at 1280: list pane, conversation, info pane. */
export const FullScreenWide: Story = {
  name: 'Full screen — 1280 with info pane',
  render: () => (
    <View style={{ width: '100%', maxWidth: 1280, height: 820 }}>
      <ChatSplitLayout list={<ConversationListStub />} info={<GroupPanel variant="pane" />}>
        <Conversation />
      </ChatSplitLayout>
    </View>
  ),
};

/** The same screen at 390 — one pane, the conversation. */
export const FullScreenNarrow: Story = {
  name: 'Full screen — 390, one pane',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, padding: 20, flexWrap: 'wrap' }}>
      {(['conversation', 'list', 'info'] as const).map((pane) => (
        <View key={pane} style={{ width: '100%', maxWidth: 390, height: 780, overflow: 'hidden', borderRadius: 16 }}>
          <ChatSplitLayout
            pane={pane}
            compact
            list={<ConversationListStub />}
            info={<PersonPanel variant="screen" />}
          >
            <Conversation compact />
          </ChatSplitLayout>
        </View>
      ))}
    </View>
  ),
};

/** Every header state, in both modes. */
export const HeaderStates: Story = {
  render: () => (
    <BothModes>
      <Caption>online · verified</Caption>
      <ChatHeader
        title="Ana Restrepo"
        marker="verified"
        status="online"
        statusTone="accent"
        avatarSource={AVATAR_ANA}
        presence="online"
        onPressCall={() => {}}
        onPressVideoCall={() => {}}
        onPressSearch={() => {}}
        onPressMore={() => {}}
      />
      <Caption>last seen · bot marker · back button</Caption>
      <ChatHeader
        title="Wayfinder"
        marker="bot"
        status="last seen recently"
        avatarName="Wayfinder"
        presence="offline"
        compact
        onPressBack={() => {}}
        onPressMore={() => {}}
      />
      <Caption>group roster · channel marker</Caption>
      <ChatHeader
        title="Canal Loft Crew"
        marker="channel"
        status="5 members, 2 online"
        avatarName="Canal Loft Crew"
        onPressCall={() => {}}
        onPressSearch={() => {}}
        onPressMore={() => {}}
      />
      <Caption>typing — wins over the status line</Caption>
      <ChatHeader
        title="Canal Loft Crew"
        status="5 members, 2 online"
        typingLabel="Ana is typing…"
        avatarName="Canal Loft Crew"
        onPressCall={() => {}}
        onPressMore={() => {}}
      />
      <Caption>connecting — wins over everything</Caption>
      <ChatHeader
        title="Ana Restrepo"
        status="online"
        typingLabel="Ana is typing…"
        connecting
        avatarSource={AVATAR_ANA}
        onPressCall={() => {}}
        onPressMore={() => {}}
      />
    </BothModes>
  ),
};

/** Selection mode replaces the header outright. */
export const SelectionMode: Story = {
  render: () => (
    <BothModes>
      <Caption>3 selected</Caption>
      <ChatHeader
        title="Ana Restrepo"
        status="online"
        avatarSource={AVATAR_ANA}
        onPressCall={() => {}}
        onPressVideoCall={() => {}}
        onPressSearch={() => {}}
        selectionCount={3}
        onClearSelection={() => {}}
        onForward={() => {}}
        onCopy={() => {}}
        onPin={() => {}}
        onDelete={() => {}}
      />
      <Caption>1 selected — a count is a count, not a plural rule</Caption>
      <ChatHeader
        title="Ana Restrepo"
        selectionCount={1}
        onClearSelection={() => {}}
        onForward={() => {}}
        onDelete={() => {}}
      />
    </BothModes>
  ),
};

/** The pinned bar, with one pin and with several. */
export const PinnedBar: Story = {
  render: () => (
    <BothModes>
      <Caption>three pins, the second one showing</Caption>
      <PinnedMessageBar pins={PINS} index={1} onPressPin={() => {}} onPressList={() => {}} onDismiss={() => {}} />
      <Caption>one pin, unpin instead of close</Caption>
      <PinnedMessageBar pins={PINS.slice(0, 1)} onPressPin={() => {}} onDismiss={() => {}} dismissIcon="unpin" />
      <Caption>a media pin, with a thumbnail</Caption>
      <PinnedMessageBar pins={PINS.slice(1)} onPressPin={() => {}} onPressList={() => {}} />
      <Caption>eleven pins — past eight the rule stops being segmented</Caption>
      <PinnedMessageBar
        pins={Array.from({ length: 11 }, (_unused, i) => ({
          id: `many-${i}`,
          preview: `Pinned note number ${i + 1}`,
        }))}
        index={6}
        onPressPin={() => {}}
        onPressList={() => {}}
      />
    </BothModes>
  ),
};

/** The four wallpapers, with bubbles over each. */
export const Wallpapers: Story = {
  render: () => {
    const variants: ChatBackgroundVariant[] = ['plain', 'pattern', 'gradient', 'image'];
    return (
      <BothModes>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {variants.map((variant) => (
            <View key={variant} style={{ width: '100%', maxWidth: 320, gap: 6 }}>
              <Caption>{variant}</Caption>
              <View style={{ height: 260, borderRadius: 16, overflow: 'hidden' }}>
                <ChatBackground
                  variant={variant}
                  source="https://picsum.photos/seed/bloom-chat-wall/900/700"
                >
                  <View style={{ padding: 12, gap: 8 }}>
                    <Bubble text="Incoming, over the wallpaper." time="09:12" />
                    <Bubble text="Outgoing, in the accent." time="09:13" outgoing />
                    <Bubble text="Still legible." time="09:14" />
                  </View>
                  <ChatDateHeader label="Today" offset={196} />
                </ChatBackground>
              </View>
            </View>
          ))}
        </View>
      </BothModes>
    );
  },
};

/** The two jump buttons and the floating date pill. */
export const FloatingControls: Story = {
  render: () => (
    <BothModes>
      <Caption>unread · mentions · no badge · hidden</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ScrollToBottomButton unreadCount={7} onPress={() => {}} />
        <ScrollToBottomButton unreadCount={128} onPress={() => {}} />
        <JumpToMentionButton count={2} onPress={() => {}} />
        <ScrollToBottomButton onPress={() => {}} />
        <ScrollToBottomButton visible={false} onPress={() => {}} />
        <Caption>← nothing is rendered there</Caption>
      </View>
      <Caption>the date pill, visible and hidden</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ChatDateHeader label="Yesterday" placement="inline" />
        <ChatDateHeader label="14 March" placement="inline" visible={false} />
      </View>
    </BothModes>
  ),
};

/** Nothing has been said yet. */
export const EmptyState: Story = {
  render: () => (
    <BothModes>
      <View style={{ height: 320 }}>
        <ChatBackground variant="pattern">
          <ChatEmptyState
            illustration={<Avatar name="Ana Restrepo" source={AVATAR_ANA} size={80} />}
            title="No messages yet"
            description="Say hello to Ana — this conversation is brand new."
            notice="Messages in this conversation are end-to-end encrypted."
          />
        </ChatBackground>
      </View>
      <Caption>without a notice — nothing is claimed on the app's behalf</Caption>
      <View style={{ height: 220 }}>
        <ChatBackground variant="plain">
          <ChatEmptyState description="Pick a conversation on the left to get started." />
        </ChatBackground>
      </View>
    </BothModes>
  ),
};

/** The info panel for a person, as a desktop pane. */
export const InfoPanelPerson: Story = {
  render: () => (
    <BothModes>
      <View style={{ height: 820, flexDirection: 'row' }}>
        <PersonPanel variant="pane" />
      </View>
    </BothModes>
  ),
};

/** The info panel for a group: cover, roster, shared media. */
export const InfoPanelGroup: Story = {
  render: () => (
    <BothModes>
      <View style={{ height: 900, flexDirection: 'row' }}>
        <GroupPanel variant="pane" />
      </View>
    </BothModes>
  ),
};

/** The split frame's three narrow panes and its wide form, side by side. */
export const SplitLayoutPanes: Story = {
  render: () => {
    const [width, setWidth] = useState(340);
    return (
      <Surface padded={false}>
        <View style={{ height: 620 }}>
          <ChatSplitLayout
            listWidth={width}
            onListWidthChange={setWidth}
            list={<ConversationListStub />}
            info={<PersonPanel variant="pane" />}
          >
            <Conversation variant="gradient" />
          </ChatSplitLayout>
        </View>
      </Surface>
    );
  },
};
