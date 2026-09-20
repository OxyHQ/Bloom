import React, { useContext, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiCheckDoubleLine } from '../icons/remix/RiCheckDoubleLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiNotificationOffLine } from '../icons/remix/RiNotificationOffLine';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ChatFolderTabs } from './ChatFolderTabs';
import { ChatList } from './ChatList';
import { ChatListItem } from './ChatListItem';
import { ChatSearchField } from './ChatSearchField';
import { ChatSearchResults } from './ChatSearchResults';
import { GroupAvatar } from './GroupAvatar';
import { NewChatButton } from './NewChatButton';
import { StoriesRow } from './StoriesRow';
import type {
  ChatFolder,
  ChatListSection,
  ChatSearchResult,
  ChatSummary,
  ChatSwipeActions,
  StoryEntry,
} from './types';

const meta: Meta = {
  title: 'Blocks/Chat/Chat List',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, groups and channels
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const SWIPE: ChatSwipeActions = {
  left: [{ key: 'read', label: 'Read', icon: RiCheckDoubleLine, tone: 'accent' }],
  right: [
    { key: 'mute', label: 'Mute', icon: RiNotificationOffLine },
    { key: 'archive', label: 'Archive', icon: RiArchiveLine, tone: 'accent' },
    { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
  ],
};

const PINNED: ChatSummary[] = [
  {
    id: 'mirela',
    name: 'Mirela Antunes',
    avatar: face('mirela'),
    status: 'online',
    verified: true,
    time: '12:41',
    pinned: true,
    preview: { sender: 'You', text: 'Sent the floor plan over, have a look' },
    outgoingStatus: 'read',
    swipeActions: SWIPE,
  },
  {
    id: 'tramuntana',
    name: 'Tramuntana Hikers',
    kind: 'group',
    faces: [
      { source: face('hiker-1'), name: 'Nuria' },
      { source: face('hiker-2'), name: 'Pau' },
      { source: face('hiker-3'), name: 'Ivet' },
      { source: face('hiker-4'), name: 'Roc' },
    ],
    time: '12:04',
    pinned: true,
    unreadCount: 12,
    preview: { sender: 'Pau', text: 'Meeting at the car park at seven, bring water' },
    swipeActions: SWIPE,
  },
];

const ALL: ChatSummary[] = [
  {
    id: 'ines',
    name: 'Inés Bordoy',
    avatar: face('ines'),
    status: 'online',
    typingLabel: 'typing…',
    time: '11:58',
    unreadCount: 3,
    swipeActions: SWIPE,
  },
  {
    id: 'dario',
    name: 'Darío Quintana',
    avatar: face('dario'),
    status: 'idle',
    time: '11:20',
    preview: { draft: true, text: 'about the deposit — can we' },
    swipeActions: SWIPE,
  },
  {
    id: 'saltwater',
    name: 'Saltwater Studio',
    kind: 'channel',
    avatar: face('saltwater'),
    time: '10:32',
    muted: true,
    unreadCount: 148,
    preview: { attachment: { kind: 'photo', label: 'Photo' }, text: 'Three new rooms, same light' },
    swipeActions: SWIPE,
  },
  {
    id: 'oriol',
    name: 'Oriol Nadal',
    avatar: face('oriol'),
    status: 'offline',
    time: '09:47',
    preview: { attachment: { kind: 'voice', label: 'Voice message 0:12' } },
    unreadDot: true,
    swipeActions: SWIPE,
  },
  {
    id: 'flat-4b',
    name: 'Flat 4B',
    kind: 'group',
    faces: [
      { source: face('flat-1'), name: 'Lia' },
      { source: face('flat-2'), name: 'Teo' },
      { name: 'Rut' },
    ],
    time: 'Yesterday',
    muted: true,
    preview: { sender: 'Lia', attachment: { kind: 'poll', label: 'Poll' }, text: 'Who is cooking?' },
    swipeActions: SWIPE,
  },
  {
    id: 'ledger',
    name: 'Ledger Assistant',
    kind: 'bot',
    avatar: face('ledger'),
    time: 'Yesterday',
    preview: { text: 'Your weekly summary is ready' },
    outgoingStatus: 'delivered',
    swipeActions: SWIPE,
  },
  {
    id: 'bru',
    name: 'Bru Ferragut',
    avatar: face('bru'),
    status: 'busy',
    time: 'Mon',
    preview: { sender: 'You', attachment: { kind: 'location', label: 'Location' } },
    outgoingStatus: 'sent',
    swipeActions: SWIPE,
  },
  {
    id: 'nit',
    name: 'Nit de Sant Joan',
    kind: 'group',
    faces: [
      { source: face('nit-1'), name: 'Ada' },
      { source: face('nit-2'), name: 'Vidal' },
    ],
    time: 'Sun',
    preview: { sender: 'Ada', text: 'Bring the speaker, the small one' },
    outgoingStatus: 'sending',
    swipeActions: SWIPE,
  },
];

const SECTIONS: ChatListSection[] = [
  { key: 'pinned', title: 'Pinned', chats: PINNED },
  { key: 'all', title: 'All', chats: ALL },
];

const FOLDERS: ChatFolder[] = [
  { key: 'all', label: 'All', unreadCount: 15 },
  { key: 'unread', label: 'Unread', unreadCount: 4 },
  { key: 'groups', label: 'Groups', unreadCount: 12 },
  { key: 'channels', label: 'Channels', unreadCount: 148, muted: true },
  { key: 'bots', label: 'Bots' },
];

const STORIES: StoryEntry[] = [
  { id: 'ines', name: 'Inés', avatar: face('ines'), state: 'seen' },
  { id: 'mirela', name: 'Mirela', avatar: face('mirela'), state: 'unseen' },
  { id: 'dario', name: 'Darío', avatar: face('dario'), state: 'seen' },
  { id: 'bru', name: 'Bru Ferragut', avatar: face('bru'), state: 'unseen' },
  { id: 'oriol', name: 'Oriol', avatar: face('oriol'), state: 'unseen' },
  { id: 'lia', name: 'Lia', avatar: face('flat-1'), state: 'seen' },
];

const RESULTS: ChatSearchResult[] = [
  {
    id: 'r-mirela',
    kind: 'chat',
    name: 'Mirela Antunes',
    avatar: face('mirela'),
    status: 'online',
    verified: true,
    detail: 'Sent the floor plan over',
    time: '12:41',
  },
  {
    id: 'r-flat',
    kind: 'chat',
    name: 'Flat 4B',
    chatKind: 'group',
    faces: [
      { source: face('flat-1'), name: 'Lia' },
      { source: face('flat-2'), name: 'Teo' },
      { name: 'Rut' },
    ],
    detail: 'Who is cooking?',
    time: 'Yesterday',
  },
  {
    id: 'r-msg-1',
    kind: 'message',
    name: 'Tramuntana Hikers',
    chatKind: 'group',
    faces: [
      { source: face('hiker-1'), name: 'Nuria' },
      { source: face('hiker-2'), name: 'Pau' },
    ],
    detail: 'the flat above the bakery is free from March',
    time: '12:04',
  },
  {
    id: 'r-msg-2',
    kind: 'message',
    name: 'Darío Quintana',
    avatar: face('dario'),
    detail: 'the flat viewing is at six, not five',
    time: 'Mon',
  },
  {
    id: 'r-contact',
    kind: 'contact',
    name: 'Flavia Roselló',
    avatar: face('flavia'),
    status: 'idle',
    detail: 'last seen recently',
  },
];

// ---------------------------------------------------------------------------
//  Story chrome
// ---------------------------------------------------------------------------

function Surface({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: '100%',
        maxWidth: width,
        minWidth: 0,
        backgroundColor: theme.colors.background,
        borderRadius: width === undefined ? 0 : 20,
        overflow: 'hidden',
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, padding: 20 }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <Surface width={390}>{children}</Surface>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <Surface width={390}>{children}</Surface>
      </BloomThemeProvider>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      variant="caption-1-medium"
      style={{ color: theme.colors.textSecondary, paddingLeft: 16, paddingTop: 12 }}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

function ConversationsScreen({ width = 390 }: { width?: number }) {
  const theme = useTheme();
  const [folder, setFolder] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const density = width < 380 ? 'compact' : 'comfortable';

  return (
    <View style={{ width: '100%', maxWidth: width, height: 760, backgroundColor: theme.colors.background }}>
      <ScrollView>
        <ChatList
          sections={SECTIONS}
          density={density}
          selectedId={selected}
          onChatPress={setSelected}
          archived={{ count: 6, onPress: () => undefined }}
          header={
            <View>
              <View style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12 }}>
                <ChatSearchField value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
              </View>
              <StoriesRow
                stories={STORIES}
                own={{ avatar: face('you') }}
                onStoryPress={() => undefined}
                onOwnPress={() => undefined}
              />
              <ChatFolderTabs
                folders={FOLDERS}
                value={folder}
                onValueChange={setFolder}
                accessibilityLabel="Chat folders"
              />
            </View>
          }
          footer={<View style={{ height: 88 }} />}
        />
      </ScrollView>
      <NewChatButton onPress={() => undefined} />
    </View>
  );
}

/** The whole conversations screen at phone width, light and dark. */
export const ConversationsPhone: Story = {
  render: () => (
    <BothModes>
      <ConversationsScreen />
    </BothModes>
  ),
};

/** The same list as a 360px desktop pane beside the open conversation. */
export const DesktopPane: Story = {
  render: function DesktopPaneStory() {
    const preset = useContext(BloomThemeContext)?.colorPreset;
    const [selected, setSelected] = useState<string | undefined>('ines');
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, padding: 20 }}>
        {(['light', 'dark'] as const).map((mode) => (
          <BloomThemeProvider key={mode} mode={mode} colorPreset={preset}>
            <PaneAndDetail selected={selected} onSelect={setSelected} />
          </BloomThemeProvider>
        ))}
      </View>
    );
  },
};

function PaneAndDetail({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const theme = useTheme();
  const open = useMemo(
    () => [...PINNED, ...ALL].find((chat) => chat.id === selected),
    [selected],
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        width: '100%', maxWidth: 760,
        height: 620,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          width: '100%', maxWidth: 360,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
        }}
      >
        <ScrollView>
          <ChatList
            sections={SECTIONS}
            density="compact"
            selectedId={selected}
            onChatPress={onSelect}
            archived={{ count: 6, onPress: () => undefined, density: 'compact' }}
            header={
              <View style={{ padding: 12 }}>
                <ChatSearchField value="" onChangeText={() => undefined} />
              </View>
            }
          />
        </ScrollView>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text variant="title-3-semibold" style={{ color: theme.colors.text }}>
          {open?.name ?? 'Pick a conversation'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Every preview shape and every right-column state, one per row — the reference
 * for what a row can say.
 */
export const RowVariants: Story = {
  render: () => (
    <BothModes>
      <View style={{ paddingBottom: 16 }}>
        <Caption>Preview shapes</Caption>
        <ChatListItem
          name="Mirela Antunes"
          avatar={face('mirela')}
          status="online"
          verified
          time="12:41"
          preview={{ sender: 'You', text: 'Sent the floor plan over, have a look' }}
          outgoingStatus="read"
        />
        <ChatListItem
          name="Darío Quintana"
          avatar={face('dario')}
          time="11:20"
          preview={{ draft: true, text: 'about the deposit — can we' }}
        />
        <ChatListItem
          name="Oriol Nadal"
          avatar={face('oriol')}
          time="09:47"
          preview={{ attachment: { kind: 'voice', label: 'Voice message 0:12' } }}
        />
        <ChatListItem
          name="Inés Bordoy"
          avatar={face('ines')}
          status="online"
          typingLabel="typing…"
          time="11:58"
          unreadCount={3}
        />
        <Caption>States</Caption>
        <ChatListItem
          name="Saltwater Studio"
          kind="channel"
          avatar={face('saltwater')}
          time="10:32"
          muted
          unreadCount={148}
          preview={{ text: 'Three new rooms, same light' }}
        />
        <ChatListItem
          name="Tramuntana Hikers"
          kind="group"
          faces={PINNED[1]?.faces}
          time="12:04"
          pinned
          unreadCount={12}
          preview={{ sender: 'Pau', text: 'Meeting at the car park at seven' }}
        />
        <ChatListItem
          name="Bru Ferragut"
          avatar={face('bru')}
          status="busy"
          time="Mon"
          selected
          preview={{ sender: 'You', text: 'On my way' }}
          outgoingStatus="sending"
        />
        <Caption>Compact</Caption>
        <ChatListItem
          density="compact"
          name="Ledger Assistant"
          kind="bot"
          avatar={face('ledger')}
          time="Yesterday"
          preview={{ text: 'Your weekly summary is ready' }}
          outgoingStatus="delivered"
        />
        <ChatListItem
          density="compact"
          name="Flat 4B"
          kind="group"
          faces={ALL[4]?.faces}
          time="Yesterday"
          muted
          unreadDot
          preview={{ sender: 'Lia', attachment: { kind: 'poll', label: 'Poll' }, text: 'Who is cooking?' }}
        />
      </View>
    </BothModes>
  ),
};

/**
 * Row actions. On web they are the hover buttons over the right column; on touch
 * the same actions are behind a swipe.
 */
export const Actions: Story = {
  render: () => (
    <BothModes>
      <View style={{ paddingTop: 8, paddingBottom: 16 }}>
        <Caption>Hover a row (web) — swipe it on touch</Caption>
        {ALL.slice(0, 4).map((chat) => (
          <ChatListItem key={chat.id} {...chat} onAction={() => undefined} />
        ))}
      </View>
    </BothModes>
  ),
};

/** Two to four faces in one avatar-sized cluster. */
export const GroupAvatars: Story = {
  render: () => (
    <BothModes>
      <View style={{ flexDirection: 'row', gap: 20, padding: 20, alignItems: 'center' }}>
        {[1, 2, 3, 4].map((count) => (
          <GroupAvatar
            key={count}
            size={56}
            faces={[
              { source: face('hiker-1'), name: 'Nuria' },
              { source: face('hiker-2'), name: 'Pau' },
              { source: face('hiker-3'), name: 'Ivet' },
              { name: 'Roc' },
            ].slice(0, count)}
          />
        ))}
      </View>
    </BothModes>
  ),
};

/** The search field with grouped results and the matched run highlighted. */
export const Search: Story = {
  render: function SearchStory() {
    const preset = useContext(BloomThemeContext)?.colorPreset;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, padding: 20 }}>
        {(['light', 'dark'] as const).map((mode) => (
          <BloomThemeProvider key={mode} mode={mode} colorPreset={preset}>
            <Surface width={390}>
              <SearchPane />
            </Surface>
          </BloomThemeProvider>
        ))}
      </View>
    );
  },
};

function SearchPane() {
  const theme = useTheme();
  const [query, setQuery] = useState('fla');
  const results = useMemo(
    () =>
      query.trim().length === 0
        ? []
        : RESULTS.filter((result) =>
            `${result.name} ${result.detail ?? ''}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase()),
          ),
    [query],
  );
  return (
    <View style={{ backgroundColor: theme.colors.background, paddingBottom: 16 }}>
      <View style={{ padding: 16 }}>
        <ChatSearchField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Search chats and messages"
        />
      </View>
      <ChatSearchResults query={query} results={results} onResultPress={() => undefined} />
    </View>
  );
}

/** Nothing yet, and waiting for the conversations to arrive. */
export const EmptyAndLoading: Story = {
  render: () => (
    <BothModes>
      <View style={{ paddingBottom: 16 }}>
        <Caption>Empty</Caption>
        <ChatList chats={[]} />
        <Caption>Loading</Caption>
        <ChatList loading loadingCount={5} />
      </View>
    </BothModes>
  ),
};
