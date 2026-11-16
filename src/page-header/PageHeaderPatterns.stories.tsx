import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppShell } from '../app-shell';
import { ChatComposer } from '../chat-composer';
import { PageFooter } from '../page-footer';
import { View } from 'react-native';
import { ScrollArea as ScrollView } from '../layout';
import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group/index.web';
import { Button } from '../button';
import { ChatBackground, PinnedMessageBar } from '../chat-screen';
import { Chip } from '../chip';
import { CoverHeader } from '../cover-header';
import { Dialog } from '../dialog/index.web';
import { BloomImage } from '../image';
import {
  RiBookmarkLine,
  RiChat3Line,
  RiNotificationLine,
  RiPhoneLine,
  RiUserAddLine,
  RiUserFollowLine,
  RiVideoOnLine,
  RiCloseLine,
} from '../icons/remix';
import { HeaderDockProvider, StickySection } from '../layout';
import { List } from '../list';
import { MessageBubble } from '../message-bubble';
import { Screen, ScreenScrollView } from '../screen';
import { Search } from '../search';
import { Tabs, TabsTrigger } from '../tabs';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PageHeader } from './PageHeader';
import { EdgeScrim } from './EdgeScrim';

const meta = {
  id: 'blocks-page-header-patterns',
  title: 'Composition/Layout/Page Header/Patterns',
  component: PageHeader,
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
  decorators: [
    (Story) => (
      <AppShell
        header={null}
        scroll="page"
        contentMaxWidth="none"
        panelLayout={{
          flow: 'document',
          panels: [{ id: 'header-pattern', span: 1, content: <Story /> }],
        }}
      />
    ),
  ],
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

const COVER = 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1400';
const PORTRAIT = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700';
const FRIEND = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160';
const people = [
  { id: 'alex', name: 'Alex Morgan', uri: PORTRAIT },
  { id: 'sam', name: 'Sam Rivera', uri: FRIEND },
];
const messages = [
  {
    id: 'meet',
    text: 'Saturday, 9:30 at the north entrance. I saved the route for us.',
    incoming: true,
  },
  { id: 'coffee', text: 'Perfect. Coffee first?', incoming: false },
  { id: 'yes', text: 'Absolutely. There is a little place beside the trail.', incoming: true },
  {
    id: 'camera',
    text: 'I will bring my camera. The forest looks beautiful this week.',
    incoming: false,
  },
] as const;

/** One identity slot works for a person or the same grouped avatars used in lists. */
function ConversationDemo({
  group = false,
  inline = false,
  onProfile,
}: {
  group?: boolean;
  inline?: boolean;
  onProfile?: () => void;
}) {
  const [route, setRoute] = useState<'conversation' | 'profile' | 'list'>('conversation');
  const [pinned, setPinned] = useState(true);
  const [dialog, setDialog] = useState<'pin' | 'call' | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<{ id: string; text: string; incoming: boolean }[]>([]);
  const conversation = [...messages, ...sent];
  const title = group ? 'Weekend plans' : 'Alex Morgan';
  const theme = useTheme();
  if (route === 'profile') return <ProfileDemo onBack={() => setRoute('conversation')} photo />;
  if (route === 'list') {
    return (
      <Screen documentScroll header={<PageHeader title="Conversations" />}>
        <List
          items={[
            {
              id: 'weekend',
              title,
              supporting: messages[0].text,
              leading: <Avatar name="Alex Morgan" source={PORTRAIT} />,
              onPress: () => setRoute('conversation'),
            },
          ]}
        />
      </Screen>
    );
  }
  return (
    <>
      <Screen
        documentScroll
        underlay={<ChatBackground variant="gradient" />}
        header={
          <PageHeader
            testID="conversation-header"
            title={title}
            subtitle={inline ? 'online' : undefined}
            titleAlign="center"
            titleLayout={inline ? 'inline' : 'stacked'}
            titleAppearance="capsule"
            titleVisual={
              inline ? undefined : group ? (
                <AvatarGroup
                  items={people}
                  layout="conversation"
                  size={48}
                  testID="conversation-visual"
                />
              ) : (
                <Avatar source={PORTRAIT} name={title} size={48} testID="conversation-visual" />
              )
            }
            onPressTitle={inline ? undefined : (onProfile ?? (() => setRoute('profile')))}
            titleAccessibilityLabel={`View ${title} profile`}
            onBack={() => setRoute('list')}
            backCount={inline ? 23 : undefined}
            backLabel={inline ? 'Back to conversations, 23 unread' : 'Back to conversations'}
            actions={
              inline ? (
                <Avatar
                  source={PORTRAIT}
                  name={title}
                  size={44}
                  onPress={onProfile ?? (() => setRoute('profile'))}
                />
              ) : (
                <Button
                  iconOnly
                  appearance="outline"
                  tone="neutral"
                  leadingIcon={RiVideoOnLine}
                  accessibilityLabel="Start video call"
                  onPress={() => setDialog('call')}
                />
              )
            }
            search={
              <Search
                presentation="collapsible"
                label="Search messages"
                value={query}
                onValueChange={setQuery}
                onClearText={() => setQuery('')}
                clearOnClose
              />
            }
            accessory={
              !inline ? undefined : pinned ? (
                <PinnedMessageBar
                  pins={[{ id: 'meet', author: 'Alex', preview: messages[0].text }]}
                  onPressPin={() => setDialog('pin')}
                  onDismiss={() => setPinned(false)}
                  style={{ borderRadius: 24, overflow: 'hidden' }}
                />
              ) : (
                <Button appearance="plain" onPress={() => setPinned(true)}>
                  Show pinned message
                </Button>
              )
            }
          />
        }
        bottomBarPlacement="overlay"
        bottomBarKeyboardBehavior="follow"
        bottomBar={
          <PageFooter position="document">
            <ChatComposer
              value={draft}
              onValueChange={setDraft}
              accessibilityLabel="Message"
              placeholder="Message…"
              onSend={(text) => {
                setSent((previous) => [
                  ...previous,
                  { id: `sent-${previous.length}`, text, incoming: false },
                ]);
                setDraft('');
              }}
            />
          </PageFooter>
        }
      >
        <ScreenScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
          <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>Today</Text>
          {conversation
            .filter((message) => message.text.toLowerCase().includes(query.toLowerCase()))
            .map((message) => (
              <MessageBubble
                key={message.id}
                direction={message.incoming ? 'incoming' : 'outgoing'}
                text={message.text}
                time="9:41"
              />
            ))}
          {query &&
            !conversation.some((message) =>
              message.text.toLowerCase().includes(query.toLowerCase()),
            ) && <Text>No matching messages</Text>}
        </ScreenScrollView>
      </Screen>
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog === 'call' ? 'Video call' : 'Pinned message'}
        description={
          dialog === 'call'
            ? `Ready to call ${title}. This preview does not connect a call.`
            : undefined
        }
      >
        {dialog === 'pin' && (
          <MessageBubble direction="incoming" text={messages[0].text} time="9:30" />
        )}
        <Button onPress={() => setDialog(null)}>
          {dialog === 'call' ? 'Close preview' : 'Back to conversation'}
        </Button>
      </Dialog>
    </>
  );
}

export const Conversation: Story = {
  render: () => <ConversationDemo />,
};
export const GroupConversation: Story = {
  render: () => <ConversationDemo group />,
};

export const PinnedConversation: Story = {
  render: () => <ConversationDemo inline />,
};

const profilePosts = Array.from({ length: 18 }, (_, index) => ({
  id: `post-${index}`,
  title: ['A quiet morning in the forest', 'Notes from the coast', 'A favourite walking route'][
    index % 3
  ],
  supporting: [
    'Small discoveries, fresh air and a camera.',
    'A few photographs from the weekend.',
    'Saved for our next adventure.',
  ][index % 3],
}));

function ProfileDemo({ photo = false, onBack }: { photo?: boolean; onBack?: () => void }) {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const [overview, setOverview] = useState(false);
  const theme = useTheme();
  const photoIdentityHeight = 176;
  const photoActions = [
    {
      key: 'call',
      label: 'Call',
      icon: RiPhoneLine,
      onPress: () => setDetail('Call preview · Alex Morgan'),
    },
    {
      key: 'video',
      label: 'Video',
      icon: RiVideoOnLine,
      onPress: () => setDetail('Video call preview · Alex Morgan'),
    },
    {
      key: 'mute',
      label: muted ? 'Unmute' : 'Mute',
      icon: RiNotificationLine,
      pressed: muted,
      onPress: () => setMuted(!muted),
    },
    {
      key: 'message',
      label: 'Message',
      icon: RiChat3Line,
      onPress: onBack ?? (() => setOverview(true)),
    },
    {
      key: 'follow',
      label: following ? 'Following' : 'Follow',
      icon: following ? RiUserFollowLine : RiUserAddLine,
      pressed: following,
      onPress: () => setFollowing(!following),
    },
  ];
  if (overview) return <ConversationDemo onProfile={() => setOverview(false)} />;
  const items = profilePosts.filter((item) =>
    `${item.title} ${item.supporting}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Screen documentScroll>
        <HeaderDockProvider>
          <PageHeader
            testID="cover-profile-header"
            placement="overlap"
            title="Alex Morgan"
            titleVisual={<Avatar source={PORTRAIT} name="Alex Morgan" size={28} />}
            titleReveal="onDock"
            titleAlign="center"
            onBack={onBack ?? (() => setOverview(true))}
            search={
              <Search
                presentation="auto"
                label="Search profile"
                value={query}
                onValueChange={setQuery}
                onClearText={() => setQuery('')}
              />
            }
            actions={
              <Button
                appearance="outline"
                tone="neutral"
                leadingIcon={following ? RiUserFollowLine : RiUserAddLine}
                iconOnly
                accessibilityLabel={following ? 'Unfollow Alex' : 'Follow Alex'}
                pressed={following}
                onPressedChange={setFollowing}
              />
            }
          />
          <CoverHeader
            testID="profile-cover"
            coverSource={photo ? PORTRAIT : COVER}
            coverHeight={photo ? 480 : 260}
            overlap={photo ? photoIdentityHeight : 48}
            contentStyle={photo ? undefined : { paddingHorizontal: 24 }}
          >
            {photo ? (
              <View
                testID="photo-profile-identity"
                style={{ height: photoIdentityHeight, justifyContent: 'flex-end' }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    start: 0,
                    end: 0,
                    opacity: 0.65,
                    pointerEvents: 'none',
                  }}
                >
                  <EdgeScrim color="#000000" edge="bottom" />
                </View>
                <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
                  <View style={{ gap: 4 }}>
                    <Text variant="title-1-bold" numberOfLines={1} style={{ color: '#fff' }}>
                      Alex Morgan
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#fff' }}>
                      Photographer · online
                    </Text>
                  </View>
                  <View testID="photo-profile-actions" style={{ flexDirection: 'row', gap: 8 }}>
                    {photoActions.map((action) => (
                      <View
                        key={action.key}
                        style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }}
                      >
                        <Button
                          appearance="outline"
                          tone="neutral"
                          iconOnly
                          leadingIcon={action.icon}
                          accessibilityLabel={`${action.label} Alex`}
                          pressed={action.pressed}
                          onPress={action.onPress}
                          color="#ffffff"
                          fill="rgba(0,0,0,0.3)"
                        />
                        <Text
                          variant="caption-1-medium"
                          numberOfLines={1}
                          aria-hidden
                          style={{ color: '#fff' }}
                        >
                          {action.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <Avatar source={PORTRAIT} name="Alex Morgan" size={96} />
            )}
            <View style={{ paddingVertical: 20, paddingHorizontal: photo ? 24 : 0, gap: 14 }}>
              {!photo && <Text variant="title-1-bold">Alex Morgan</Text>}
              <Text style={{ color: theme.colors.textSecondary }}>
                Finding stories outdoors. Photography, little adventures and the places in between.
              </Text>
              {!photo && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button leadingIcon={RiChat3Line} onPress={onBack ?? (() => setOverview(true))}>
                    Message
                  </Button>
                  <Button
                    appearance="outline"
                    tone="neutral"
                    leadingIcon={RiPhoneLine}
                    accessibilityLabel="Call Alex"
                    iconOnly
                    onPress={() => setDetail('Call preview · Alex Morgan')}
                  />
                  <Button
                    appearance="outline"
                    tone="neutral"
                    leadingIcon={RiNotificationLine}
                    accessibilityLabel={muted ? 'Unmute Alex' : 'Mute Alex'}
                    iconOnly
                    pressed={muted}
                    onPressedChange={setMuted}
                  />
                  <Button
                    appearance="outline"
                    tone="neutral"
                    pressed={following}
                    onPressedChange={setFollowing}
                  >
                    {following ? 'Following' : 'Follow'}
                  </Button>
                </View>
              )}
            </View>
          </CoverHeader>
          <StickySection testID="profile-content-tabs">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsTrigger value="posts" label="Posts" />
              <TabsTrigger value="media" label="Media" />
              <TabsTrigger value="about" label="About" />
            </Tabs>
          </StickySection>
          {tab === 'about' ? (
            <List
              items={[
                {
                  id: 'bio',
                  title: 'About Alex',
                  supporting: 'Photographer and weekend explorer. Based in Copenhagen.',
                },
                { id: 'joined', title: 'Joined', supporting: 'March 2022' },
                {
                  id: 'notifications',
                  title: 'Notifications',
                  supporting: muted ? 'Muted' : 'On',
                },
              ]}
            />
          ) : (
            <List
              accessibilityLabel={tab === 'media' ? 'Profile media' : 'Profile posts'}
              items={items.map((item) => ({
                ...item,
                leading:
                  tab === 'media' ? (
                    <BloomImage
                      source={COVER}
                      accessibilityLabel="Forest"
                      style={{ width: 72, height: 64, borderRadius: 12 }}
                    />
                  ) : undefined,
                onPress: () => setDetail(item.title ?? 'Photo'),
              }))}
              empty={<Text style={{ padding: 24 }}>No matching posts</Text>}
            />
          )}
        </HeaderDockProvider>
      </Screen>
      <Dialog open={detail !== null} onClose={() => setDetail(null)} title={detail ?? ''}>
        {detail?.includes('call preview') || detail?.startsWith('Call preview') ? (
          <View style={{ alignItems: 'center', gap: 16, paddingVertical: 20 }}>
            <Avatar source={PORTRAIT} name="Alex Morgan" size={96} />
            <Text>Ready to call Alex. This preview does not connect a call.</Text>
          </View>
        ) : (
          <>
            <BloomImage
              source={COVER}
              accessibilityLabel="A sunlit forest"
              style={{ height: 220, borderRadius: 20 }}
            />
            <Text style={{ paddingVertical: 16 }}>
              A little time outdoors changes the whole day.
            </Text>
          </>
        )}
        <Button onPress={() => setDetail(null)}>Close</Button>
      </Dialog>
    </>
  );
}

/** Cover, overlapping avatar, actions and tabs hand off to the same compact header. */
export const CoverProfile: Story = { render: () => <ProfileDemo /> };
/** A full photo uses the same cover owner and header, with identity over the photo. */
export const PhotoProfile: Story = { render: () => <ProfileDemo photo /> };

const discoveries = [
  {
    id: 'forest',
    title: 'Forest walks',
    type: 'Places',
    supporting: 'Quiet trails and places to pause.',
    image: COVER,
  },
  {
    id: 'coast',
    title: 'Coastal paths',
    type: 'Places',
    supporting: 'Sea air, open skies and a weekend away.',
    image: COVER,
  },
  {
    id: 'alex',
    title: 'Alex Morgan',
    type: 'People',
    supporting: 'Photography and everyday adventures.',
    image: PORTRAIT,
  },
  {
    id: 'sam',
    title: 'Sam Rivera',
    type: 'People',
    supporting: 'Discovering a new route every week.',
    image: FRIEND,
  },
  {
    id: 'notes',
    title: 'Field notes',
    type: 'Collections',
    supporting: 'A collection of small discoveries.',
    image: COVER,
  },
  {
    id: 'weekend',
    title: 'Weekend favourites',
    type: 'Collections',
    supporting: 'Saved for the next little adventure.',
    image: COVER,
  },
];

function SearchResultsDemo() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [searching, setSearching] = useState(true);
  const [selected, setSelected] = useState<(typeof discoveries)[number] | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const theme = useTheme();
  const results = discoveries.filter(
    (entry) =>
      (filter === 'All' || entry.type === filter) &&
      `${entry.title} ${entry.supporting}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (selected)
    return (
      <Screen
        documentScroll
        headerPlacement="overlay"
        header={
          <PageHeader
            title={selected.title}
            titleReveal="onScroll"
            titleRevealOffset={220}
            onBack={() => setSelected(null)}
            actions={
              <Button
                appearance="outline"
                tone="neutral"
                leadingIcon={RiBookmarkLine}
                iconOnly
                accessibilityLabel={saved.includes(selected.id) ? 'Remove bookmark' : 'Bookmark'}
                pressed={saved.includes(selected.id)}
                onPressedChange={(checked) =>
                  setSaved((value) =>
                    checked ? [...value, selected.id] : value.filter((id) => id !== selected.id),
                  )
                }
              />
            }
          />
        }
      >
        <CoverHeader
          coverSource={selected.image}
          coverHeight={300}
          overlap={0}
          contentStyle={{ paddingHorizontal: 24 }}
        >
          <View style={{ paddingVertical: 24, gap: 12 }}>
            <Text variant="title-1-bold">{selected.title}</Text>
            <Text>{selected.supporting}</Text>
            <Button onPress={() => setSelected(null)}>Back to results</Button>
          </View>
        </CoverHeader>
      </Screen>
    );
  return (
    <Screen
      documentScroll
      header={
        <PageHeader
          title={searching ? undefined : 'Discover'}
          search={
            searching ? (
              <Search
                presentation="field"
                label="Search discoveries"
                placeholder="People, places, collections"
                value={query}
                onValueChange={setQuery}
                onClearText={() => setQuery('')}
              />
            ) : undefined
          }
          actions={
            !searching ? <Button onPress={() => setSearching(true)}>Search</Button> : undefined
          }
          searchActions={
            searching ? (
              <Button
                appearance="outline"
                tone="neutral"
                iconOnly
                leadingIcon={RiCloseLine}
                accessibilityLabel="Close search"
                onPress={() => {
                  setSearching(false);
                  setQuery('');
                  setFilter('All');
                }}
              />
            ) : undefined
          }
          accessory={
            searching ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
              >
                {['All', 'Places', 'People', 'Collections'].map((category) => (
                  <Chip
                    key={category}
                    checked={filter === category}
                    onCheckedChange={() => setFilter(category)}
                  >
                    {category}
                  </Chip>
                ))}
              </ScrollView>
            ) : undefined
          }
        />
      }
    >
      <View style={{ padding: 20, gap: 12 }}>
        <Text variant="title-2-bold">
          {query ? `Results for “${query}”` : 'Find your next favourite'}
        </Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          {results.length} results{filter === 'All' ? '' : ` · ${filter}`}
        </Text>
      </View>
      <List
        accessibilityLabel="Discoveries"
        items={results.map((entry) => ({
          id: entry.id,
          title: entry.title,
          supporting: entry.supporting,
          leading:
            entry.type === 'People' ? (
              <Avatar source={entry.image} name={entry.title} size={56} />
            ) : (
              <BloomImage
                source={entry.image}
                accessibilityLabel={entry.title}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
            ),
          trailing: <Text style={{ color: theme.colors.textSecondary }}>{entry.type}</Text>,
          onPress: () => setSelected(entry),
        }))}
        empty={<Text style={{ padding: 24 }}>No discoveries match your search.</Text>}
      />
    </Screen>
  );
}

export const SearchWithSuggestions: Story = { render: () => <SearchResultsDemo /> };
