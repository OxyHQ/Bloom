import { fn } from 'storybook/test';
import type React from 'react';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { AppShell } from '../app-shell';
import { ChatComposer } from '../chat-composer';
import { MessageBubble } from '../message-bubble';
import { List } from '../list';
import { PageHeader } from '../page-header';
import { Search } from '../search';
import { RiChat3Line } from '../icons/remix/RiChat3Line';

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
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import { Switch } from '../switch';
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
  id: 'blocks-chat-chat-screen',
  title: 'Patterns/Chat/Chat Screen',
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
  {
    id: 'm1',
    name: 'Ana Restrepo',
    source: AVATAR_ANA,
    status: 'online',
    role: 'owner',
    subtitle: 'online',
  },
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
        width: '100%',
        padding: padded ? 20 : 0,
        gap: 20,
        backgroundColor: theme.colors.background,
      }}
    >
      {children}
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

/** Shared transcript components; the story owns only message data and actions. */
const MESSAGES = [
  { text: 'Morning! The loft viewing is still on for Thursday?', time: '09:12' },
  { text: "It is — eight o'clock, the place by the canal.", time: '09:14', outgoing: true },
  { text: "Perfect. I'll bring the floorplan Teodor sent over.", time: '09:15' },
  {
    text: 'Bring the measuring tape too, the balcony looked smaller than the photos.',
    time: '09:16',
    outgoing: true,
  },
  { text: 'Already in the bag.', time: '09:17' },
  { text: 'See you Thursday then.', time: '09:21', outgoing: true },
];
function Bubble({
  text,
  time,
  outgoing = false,
}: {
  text: string;
  time: string;
  outgoing?: boolean;
}) {
  return <MessageBubble text={text} time={time} direction={outgoing ? 'outgoing' : 'incoming'} />;
}
function Transcript({
  compact = false,
  messages = MESSAGES,
  scrollRef,
}: {
  compact?: boolean;
  messages?: typeof MESSAGES;
  scrollRef?: React.RefObject<React.ComponentRef<typeof ScrollView> | null>;
}) {
  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 8 }}>
      <ChatDateHeader label="Today" />
      {messages.map((message, index) => (
        <Bubble key={`${index}-${message.text}`} {...message} />
      ))}
      {messages.length === 0 ? <ChatEmptyState title="No matching messages" /> : null}
    </ScrollView>
  );
}
function ConversationList({
  activeId = 'm1',
  onSelect,
}: {
  activeId?: string;
  onSelect?: (member: ChatMember) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Chats" onBack={null} />
      <List
        items={MEMBERS.slice(0, 5).map((member) => ({
          id: member.id,
          active: member.id === activeId,
          conversation: {
            name: member.name,
            avatar: member.source as string | undefined,
            preview: { text: member.subtitle ?? '' },
          },
          onPress: onSelect ? () => onSelect(member) : undefined,
        }))}
      />
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
    <GroupedSection variant="filled">
      <GroupedSectionItem
        title="Notifications"
        icon={<RiNotification3Line width={20} height={20} fill={paint.textSecondary} />}
        rightElement={
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
            accessibilityLabel="Notifications for this conversation"
          />
        }
        showChevron={false}
      />
      <GroupedSectionItem
        title="Disappearing messages"
        value="Off"
        icon={<RiTimerLine width={20} height={20} fill={paint.textSecondary} />}
        onPress={fn().mockName('onPress')}
      />
      <GroupedSectionItem
        title="Encryption key"
        icon={<RiKey2Line width={20} height={20} fill={paint.textSecondary} />}
        onPress={fn().mockName('onPress')}
      />
      <GroupedSectionItem
        title="Conversation theme"
        value="Default"
        icon={<RiPaletteLine width={20} height={20} fill={paint.textSecondary} />}
        onPress={fn().mockName('onPress')}
      />
    </GroupedSection>
  );
}

const SHARED_TABS = [
  { value: 'media', label: 'Media', icon: RiImageLine, count: 128, content: <MediaGridStub /> },
  {
    value: 'files',
    label: 'Files',
    icon: RiFolderLine,
    count: 12,
    content: <MediaGridStub count={3} />,
  },
  { value: 'links', label: 'Links', icon: RiLink, count: 34, content: <MediaGridStub count={2} /> },
  {
    value: 'voice',
    label: 'Voice',
    icon: RiMicLine,
    count: 4,
    content: <MediaGridStub count={2} />,
  },
  {
    value: 'groups',
    label: 'Groups',
    icon: RiGroupLine,
    count: 3,
    content: <MediaGridStub count={3} />,
  },
];

function PersonPanel({ variant, onClose }: { variant: 'pane' | 'screen'; onClose?: () => void }) {
  return (
    <ChatInfoPanel
      variant={variant}
      style={{ maxWidth: '100%' }}
      title="Contact info"
      onClose={onClose}
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
      onClose={fn().mockName('onClose')}
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
      onPressMember={fn().mockName('onPressMember')}
      onAddMember={fn().mockName('onAddMember')}
      destructiveActions={GROUP_DESTRUCTIVE}
    />
  );
}

function Conversation({
  variant = 'pattern',
  compact,
  onOpenInfo,
  onBack,
  member = MEMBERS[0]!,
}: {
  variant?: ChatBackgroundVariant;
  compact?: boolean;
  onOpenInfo?: () => void;
  onBack?: () => void;
  member?: ChatMember;
}) {
  const [messages, setMessages] = useState(MESSAGES);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [pinIndex, setPinIndex] = useState(1);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <ChatHeader
        title={member.name}
        status={member.subtitle}
        avatarSource={member.source}
        presence={member.status}
        compact={compact}
        onPressBack={onBack}
        onPressHeader={onOpenInfo}
        onPressSearch={() => setSearchOpen(!searchOpen)}
        accessory={
          searchOpen ? (
            <Search label="Search this conversation" value={query} onValueChange={setQuery} />
          ) : undefined
        }
      />
      {pinned ? (
        <PinnedMessageBar
          pins={PINS}
          index={pinIndex}
          onPressPin={() => {
            setPinIndex((pinIndex + 1) % PINS.length);
            scrollRef.current?.scrollTo({ y: 0 });
          }}
          onDismiss={() => setPinned(false)}
        />
      ) : null}
      <ChatBackground
        variant={variant}
        source="https://picsum.photos/seed/bloom-chat-wall/1200/900"
      >
        <Transcript
          scrollRef={scrollRef}
          compact={compact}
          messages={messages.filter((message) =>
            message.text.toLowerCase().includes(query.toLowerCase()),
          )}
        />
        <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
          <ScrollToBottomButton
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          />
        </View>
      </ChatBackground>
      <ChatComposer
        value={draft}
        onValueChange={setDraft}
        onSend={(text) => {
          setMessages((current) => [...current, { text, time: 'Now', outgoing: true }]);
          setDraft('');
        }}
      />
    </View>
  );
}
function ConversationWorkspace() {
  const [pane, setPane] = useState<'list' | 'conversation' | 'info'>('conversation');
  const [member, setMember] = useState(MEMBERS[0]!);
  const [listWidth, setListWidth] = useState(340);
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <ChatSplitLayout
        testID="split"
        pane={pane}
        listWidth={listWidth}
        onListWidthChange={setListWidth}
        list={
          <ConversationList
            activeId={member.id}
            onSelect={(next) => {
              setMember(next);
              setPane('conversation');
            }}
          />
        }
        info={
          pane === 'info' ? (
            <PersonPanel variant="pane" onClose={() => setPane('conversation')} />
          ) : undefined
        }
      >
        <Conversation
          key={member.id}
          member={member}
          onBack={() => setPane('list')}
          onOpenInfo={() => setPane('info')}
        />
      </ChatSplitLayout>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** One responsive workspace: select a chat, search, send and open its info panel. */
export const FullScreen: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <ConversationWorkspace />,
};

/** Every header state, in both modes. */
export const HeaderStates: Story = {
  render: () => (
    <Surface>
      <Caption>online · verified</Caption>
      <ChatHeader
        title="Ana Restrepo"
        marker="verified"
        status="online"
        statusTone="accent"
        avatarSource={AVATAR_ANA}
        presence="online"
        onPressCall={fn().mockName('onPressCall')}
        onPressVideoCall={fn().mockName('onPressVideoCall')}
        onPressSearch={fn().mockName('onPressSearch')}
        onPressMore={fn().mockName('onPressMore')}
      />
      <Caption>last seen · bot marker · back button</Caption>
      <ChatHeader
        title="Wayfinder"
        marker="bot"
        status="last seen recently"
        avatarName="Wayfinder"
        presence="offline"
        compact
        onPressBack={fn().mockName('onPressBack')}
        onPressMore={fn().mockName('onPressMore')}
      />
      <Caption>group roster · channel marker</Caption>
      <ChatHeader
        title="Canal Loft Crew"
        marker="channel"
        status="5 members, 2 online"
        avatarName="Canal Loft Crew"
        onPressCall={fn().mockName('onPressCall')}
        onPressSearch={fn().mockName('onPressSearch')}
        onPressMore={fn().mockName('onPressMore')}
      />
      <Caption>typing — wins over the status line</Caption>
      <ChatHeader
        title="Canal Loft Crew"
        status="5 members, 2 online"
        typingLabel="Ana is typing…"
        avatarName="Canal Loft Crew"
        onPressCall={fn().mockName('onPressCall')}
        onPressMore={fn().mockName('onPressMore')}
      />
      <Caption>connecting — wins over everything</Caption>
      <ChatHeader
        title="Ana Restrepo"
        status="online"
        typingLabel="Ana is typing…"
        connecting
        avatarSource={AVATAR_ANA}
        onPressCall={fn().mockName('onPressCall')}
        onPressMore={fn().mockName('onPressMore')}
      />
    </Surface>
  ),
};

/** Selection mode replaces the header outright. */
export const SelectionMode: Story = {
  render: () => (
    <Surface>
      <Caption>3 selected</Caption>
      <ChatHeader
        title="Ana Restrepo"
        status="online"
        avatarSource={AVATAR_ANA}
        onPressCall={fn().mockName('onPressCall')}
        onPressVideoCall={fn().mockName('onPressVideoCall')}
        onPressSearch={fn().mockName('onPressSearch')}
        selectionCount={3}
        onClearSelection={fn().mockName('onClearSelection')}
        onForward={fn().mockName('onForward')}
        onCopy={fn().mockName('onCopy')}
        onPin={fn().mockName('onPin')}
        onDelete={fn().mockName('onDelete')}
      />
      <Caption>1 selected — a count is a count, not a plural rule</Caption>
      <ChatHeader
        title="Ana Restrepo"
        selectionCount={1}
        onClearSelection={fn().mockName('onClearSelection')}
        onForward={fn().mockName('onForward')}
        onDelete={fn().mockName('onDelete')}
      />
    </Surface>
  ),
};

/** The pinned bar, with one pin and with several. */
export const PinnedBar: Story = {
  render: () => (
    <Surface>
      <Caption>three pins, the second one showing</Caption>
      <PinnedMessageBar
        pins={PINS}
        index={1}
        onPressPin={fn().mockName('onPressPin')}
        onPressList={fn().mockName('onPressList')}
        onDismiss={fn().mockName('onDismiss')}
      />
      <Caption>one pin, unpin instead of close</Caption>
      <PinnedMessageBar
        pins={PINS.slice(0, 1)}
        onPressPin={fn().mockName('onPressPin')}
        onDismiss={fn().mockName('onDismiss')}
        dismissIcon="unpin"
      />
      <Caption>a media pin, with a thumbnail</Caption>
      <PinnedMessageBar
        pins={PINS.slice(1)}
        onPressPin={fn().mockName('onPressPin')}
        onPressList={fn().mockName('onPressList')}
      />
      <Caption>eleven pins — past eight the rule stops being segmented</Caption>
      <PinnedMessageBar
        pins={Array.from({ length: 11 }, (_unused, i) => ({
          id: `many-${i}`,
          preview: `Pinned note number ${i + 1}`,
        }))}
        index={6}
        onPressPin={fn().mockName('onPressPin')}
        onPressList={fn().mockName('onPressList')}
      />
    </Surface>
  ),
};

/** The four wallpapers, with bubbles over each. */
export const Wallpapers: Story = {
  render: () => {
    const variants: ChatBackgroundVariant[] = ['plain', 'pattern', 'gradient', 'image'];
    return (
      <Surface>
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
      </Surface>
    );
  },
};

/**
 * An app's own tile in place of the glyphs. Drawn in one colour on transparent;
 * only the alpha is used, so it takes the same ink and opacity as the glyphs.
 */
const STAR_TILE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="none" stroke="#fff" stroke-width="2">' +
    '<path d="M24 12l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/>' +
    '<circle cx="70" cy="64" r="10"/><path d="M60 26h20M70 16v20"/></svg>',
)}`;

export const WallpaperTile: Story = {
  render: () => (
    <Surface>
      <View style={{ height: 260, maxWidth: 320, borderRadius: 16, overflow: 'hidden' }}>
        <ChatBackground
          variant="pattern"
          patternImage={{ source: STAR_TILE, width: 96, height: 96 }}
        >
          <View style={{ padding: 12, gap: 8 }}>
            <Bubble text="Incoming, over the app's tile." time="09:12" />
            <Bubble text="Outgoing, in the accent." time="09:13" outgoing />
          </View>
        </ChatBackground>
      </View>
    </Surface>
  ),
};

/** The two jump buttons and the floating date pill. */
export const FloatingControls: Story = {
  render: () => (
    <Surface>
      <Caption>unread · mentions · no badge · hidden</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ScrollToBottomButton unreadCount={7} onPress={fn().mockName('onPress')} />
        <ScrollToBottomButton unreadCount={128} onPress={fn().mockName('onPress')} />
        <JumpToMentionButton count={2} onPress={fn().mockName('onPress')} />
        <ScrollToBottomButton onPress={fn().mockName('onPress')} />
        <ScrollToBottomButton visible={false} onPress={fn().mockName('onPress')} />
        <Caption>← nothing is rendered there</Caption>
      </View>
      <Caption>the date pill, visible and hidden</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ChatDateHeader label="Yesterday" placement="inline" />
        <ChatDateHeader label="14 March" placement="inline" visible={false} />
      </View>
    </Surface>
  ),
};

/** Nothing has been said yet. */
export const EmptyState: Story = {
  render: () => (
    <Surface>
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
    </Surface>
  ),
};

/** The info panel for a person; the Storybook toolbar owns its theme. */
export const InfoPanelPerson: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <View style={{ flex: 1, minHeight: 0, width: 380, maxWidth: '100%' }}>
      <PersonPanel variant="screen" />
    </View>
  ),
};

/** The info panel for a group: cover, roster, shared media. */
export const InfoPanelGroup: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <View style={{ flex: 1, minHeight: 0, width: 380, maxWidth: '100%' }}>
      <GroupPanel variant="screen" />
    </View>
  ),
};
