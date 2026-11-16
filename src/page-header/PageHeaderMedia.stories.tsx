import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { BottomBar } from '../bottom-bar/BottomBar.web';
import { Button } from '../button';
import { Card } from '../card';
import { Badge } from '../badge';
import { Chip } from '../chip';
import { Dialog } from '../dialog/index.web';
import { ResponsiveGrid } from '../grid';
import { BloomImage } from '../image';
import {
  RiBookmarkLine,
  RiCheckLine,
  RiEqualizerLine,
  RiFolderLine,
  RiHeartLine,
  RiImageLine,
  RiInformationLine,
  RiMusic2Line,
  RiPauseLine,
  RiPlayLine,
  RiShare2Line,
  RiShuffleLine,
} from '../icons/remix';
import { HeaderDockProvider, StickySection } from '../layout';
import { List } from '../list';
import { CollectionHeader } from '../media-header';
import { FullScreenPlayer, MiniPlayer } from '../media-player';
import { Screen, ScreenScrollView } from '../screen';
import { Search } from '../search';
import { AppShell } from '../app-shell';
import { Text } from '../typography';
import { HeaderActions } from './HeaderActions.web';
import { PageHeader } from './PageHeader';

const meta: Meta = {
  id: 'blocks-page-header-media',
  title: 'Composition/Layout/Page Header/Media',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

const PHOTOS = [
  {
    id: 'forest',
    title: 'Forest light',
    category: 'Nature',
    photo: 'photo-1448375240586-882707db888b',
  },
  {
    id: 'coast',
    title: 'Along the coast',
    category: 'Travel',
    photo: 'photo-1473116763249-2faaef81ccda',
  },
  {
    id: 'mountains',
    title: 'Mountain morning',
    category: 'Nature',
    photo: 'photo-1464822759023-fed622ff2c3b',
  },
  {
    id: 'lake',
    title: 'Still water',
    category: 'Nature',
    photo: 'photo-1501785888041-af3ef285b470',
  },
  {
    id: 'city',
    title: 'City after dark',
    category: 'Travel',
    photo: 'photo-1519501025264-65ba15a82390',
  },
  {
    id: 'desert',
    title: 'Desert road',
    category: 'Travel',
    photo: 'photo-1500534623283-312aade485b7',
  },
  {
    id: 'flowers',
    title: 'Spring garden',
    category: 'Nature',
    photo: 'photo-1490750967868-88aa4486c946',
  },
  {
    id: 'hills',
    title: 'Green hills',
    category: 'Nature',
    photo: 'photo-1472396961693-142e6e269027',
  },
  {
    id: 'woodland',
    title: 'Woodland trail',
    category: 'Nature',
    photo: 'photo-1441974231531-c6227db76b6e',
  },
  {
    id: 'valley',
    title: 'Valley reflections',
    category: 'Travel',
    photo: 'photo-1506744038136-46273834b3fb',
  },
  {
    id: 'meadow',
    title: 'Afternoon meadow',
    category: 'Nature',
    photo: 'photo-1500530855697-b586d89ba3ee',
  },
  {
    id: 'cabin',
    title: 'Cabin by the lake',
    category: 'Travel',
    photo: 'photo-1470770841072-f978cf4d019e',
  },
  {
    id: 'rolling-hills',
    title: 'Rolling hills',
    category: 'Nature',
    photo: 'photo-1501854140801-50d01698950b',
  },
  {
    id: 'pine',
    title: 'Pine canopy',
    category: 'Nature',
    photo: 'photo-1473448912268-2022ce9509d8',
  },
  {
    id: 'mist',
    title: 'Morning mist',
    category: 'Nature',
    photo: 'photo-1470071459604-3b5ec3a7fe05',
  },
  {
    id: 'summit',
    title: 'Over the summit',
    category: 'Nature',
    photo: 'photo-1469474968028-56623f02e42e',
  },
  {
    id: 'waterfall',
    title: 'Hidden waterfall',
    category: 'Nature',
    photo: 'photo-1433086966358-54859d0ed716',
  },
  {
    id: 'stars',
    title: 'Under the stars',
    category: 'Travel',
    photo: 'photo-1519681393784-d120267933ba',
  },
] as const;
type Photo = (typeof PHOTOS)[number];
const imageFor = (photo: Photo, width = 800) =>
  `https://images.unsplash.com/${photo.photo}?auto=format&fit=crop&w=${width}&q=85`;
const TRACKS = [
  'First light',
  'Coastline',
  'Between the trees',
  'Slow morning',
  'The long way home',
  'Night garden',
  'After the rain',
  'Back to the coast',
];

const ALBUMS = [
  { id: 'open-spaces', title: 'Open spaces', artist: 'Studio North', artwork: PHOTOS[0] },
  { id: 'coastline', title: 'Coastline', artist: 'Mila Shore', artwork: PHOTOS[1] },
  { id: 'slow-morning', title: 'Slow morning', artist: 'The Quiet Hours', artwork: PHOTOS[2] },
  { id: 'still-water', title: 'Still water', artist: 'Arlo Field', artwork: PHOTOS[3] },
  { id: 'after-dark', title: 'After dark', artist: 'City Signals', artwork: PHOTOS[4] },
  { id: 'long-way-home', title: 'The long way home', artist: 'Studio North', artwork: PHOTOS[5] },
  { id: 'spring', title: 'Spring', artist: 'Mila Shore', artwork: PHOTOS[6] },
  { id: 'green-hills', title: 'Green hills', artist: 'The Quiet Hours', artwork: PHOTOS[7] },
] as const;
type Album = (typeof ALBUMS)[number];
const NAVIGATION_CONTENT_WIDTH = 560;

/** The shell owns viewport sizing and panel material; routes keep their Screen. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <AppShell
      testID="media-shell"
      scroll="fixed"
      contentMaxWidth="none"
      header={null}
      panelLayout={{
        flow: 'bounded',
        panels: [{ id: 'media', span: 1, content: children }],
      }}
    />
  );
}

/** BottomBar retains the same editable Search as its action changes placement. */
function MediaNavigation({
  value,
  onValueChange,
  query,
  onQueryChange,
  kind,
}: {
  value: string;
  onValueChange: (value: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  kind: 'photos' | 'music';
}) {
  return (
    <BottomBar
      testID="media-navigation"
      value={value}
      onValueChange={onValueChange}
      items={
        kind === 'photos'
          ? [
              { name: 'library', label: 'Library', icon: <RiImageLine /> },
              { name: 'favourites', label: 'Favourites', icon: <RiHeartLine /> },
            ]
          : [
              { name: 'album', label: 'Albums', icon: <RiMusic2Line /> },
              { name: 'saved', label: 'Saved', icon: <RiBookmarkLine /> },
            ]
      }
      maxWidth={NAVIGATION_CONTENT_WIDTH}
      actionBehavior="visible"
      actionSizing="adaptive"
      action={
        <Search
          presentation="collapsible"
          label={kind === 'photos' ? 'Search photos' : 'Search music'}
          value={query}
          onValueChange={onQueryChange}
          onClearText={() => onQueryChange('')}
        />
      }
    />
  );
}

function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [album, setAlbum] = useState('Library');
  const [sharedWith, setSharedWith] = useState('');
  const [panel, setPanel] = useState<'share' | 'info' | 'album' | null>(null);
  return (
    <Screen
      scroll="none"
      headerPlacement="overlay"
      header={
        <PageHeader
          testID="photo-toolbar"
          tone="onImage"
          onBack={onClose}
          backLabel="Back to library"
          actions={
            <HeaderActions
              persistentActionsPlacement="end"
              persistentActions={
                <Button
                  iconOnly
                  leadingIcon={RiCheckLine}
                  accessibilityLabel="Done"
                  appearance="solid"
                  tone="accent"
                  onPress={onClose}
                />
              }
              actions={[
                {
                  id: 'share',
                  label: 'Share photo',
                  icon: RiShare2Line,
                  onPress: () => setPanel('share'),
                  group: 'photo',
                  labelVisibility: 'hidden',
                },
                {
                  id: 'info',
                  label: 'Photo information',
                  icon: RiInformationLine,
                  onPress: () => setPanel('info'),
                  group: 'photo',
                  labelVisibility: 'hidden',
                },
                {
                  id: 'album',
                  label: 'Move to album',
                  icon: RiFolderLine,
                  onPress: () => setPanel('album'),
                  group: 'photo',
                  labelVisibility: 'hidden',
                },
                {
                  id: 'save',
                  label: saved ? 'Remove from favourites' : 'Add to favourites',
                  icon: RiHeartLine,
                  selected: saved,
                  onPress: () => setSaved(!saved),
                  group: 'photo',
                  labelVisibility: 'hidden',
                },
              ]}
            />
          }
        />
      }
    >
      <BloomImage
        source={imageFor(photo, 1800)}
        accessibilityLabel={photo.title}
        style={{ width: '100%', height: '100%' }}
      />
      <Dialog
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={panel === 'share' ? 'Share photo' : panel === 'info' ? photo.title : 'Move to album'}
        description={
          panel === 'info'
            ? `${photo.category} · 4032 × 3024 · ${album}${saved ? ' · Favourite' : ''}${sharedWith ? ` · Shared with ${sharedWith}` : ''}`
            : panel === 'share'
              ? 'Choose an album to share this photo with.'
              : undefined
        }
      >
        {panel !== 'info' && (
          <List
            items={['Family', 'Travel journal', 'Weekend walks'].map((name) => ({
              id: name,
              title: name,
              leading: <RiFolderLine />,
              onPress: () => {
                if (panel === 'share') setSharedWith(name);
                else setAlbum(name);
                setPanel('info');
              },
            }))}
          />
        )}
      </Dialog>
    </Screen>
  );
}

function PhotoLibraryDemo() {
  const [destination, setDestination] = useState('library');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(false);
  const [category, setCategory] = useState('All');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [favourites, setFavourites] = useState<string[]>(['forest', 'lake']);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const matches = PHOTOS.filter(
    (item) =>
      (destination !== 'favourites' || favourites.includes(item.id)) &&
      (category === 'All' || item.category === category) &&
      `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const title = destination === 'favourites' ? 'Favourites' : 'Library';
  if (photo)
    return (
      <Frame>
        <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />
      </Frame>
    );
  return (
    <Frame>
      <Screen
        headerPlacement={matches.length ? 'overlay' : 'inset'}
        header={
          <PageHeader
            title={title}
            titleVariant="title-1-bold"
            subtitle={`${matches.length} ${matches.length === 1 ? 'photo' : 'photos'}${selecting ? ` · ${selected.length} selected` : ''}`}
            tone={matches.length ? 'onImage' : 'default'}
            scrim={matches.length ? 'always' : 'auto'}
            testID="library-header"
            actions={
              <Button.Group dividers={false} accessibilityLabel="Library actions">
                <Button
                  iconOnly
                  leadingIcon={RiEqualizerLine}
                  pressed={filters}
                  onPressedChange={setFilters}
                  accessibilityLabel="Filter photos"
                />
                <Button
                  onPress={() => {
                    setSelecting(!selecting);
                    setSelected([]);
                  }}
                >
                  {selecting ? 'Done' : 'Select'}
                </Button>
              </Button.Group>
            }
            accessory={
              filters || selecting ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {filters &&
                    ['All', 'Nature', 'Travel'].map((name) => (
                      <Chip
                        key={name}
                        checked={category === name}
                        onCheckedChange={() => setCategory(name)}
                      >
                        {name}
                      </Chip>
                    ))}
                  {selecting && (
                    <Button
                      disabled={selected.length === 0}
                      leadingIcon={RiHeartLine}
                      onPress={() => {
                        setFavourites(Array.from(new Set([...favourites, ...selected])));
                        setSelected([]);
                        setSelecting(false);
                        setDestination('favourites');
                      }}
                    >
                      Add to favourites
                    </Button>
                  )}
                </View>
              ) : undefined
            }
          />
        }
        bottomBarPlacement="overlay"
        bottomBarKeyboardBehavior="follow"
        bottomBar={
          <MediaNavigation
            value={destination}
            onValueChange={setDestination}
            query={query}
            onQueryChange={setQuery}
            kind="photos"
          />
        }
      >
        <ScreenScrollView>
          <ResponsiveGrid testID="photo-mosaic" minItemWidth={108} maxColumns={6} gap={2}>
            {matches.map((item) => (
              <Card
                key={item.id}
                testID={`photo-${item.id}`}
                radius="radius-0"
                clipContent
                elevation="none"
                border="none"
                style={{ maxWidth: 320 }}
                accessibilityLabel={`${selecting ? (selected.includes(item.id) ? 'Deselect' : 'Select') : 'Open'} ${item.title}`}
                onPress={() => {
                  if (!selecting) setPhoto(item);
                  else
                    setSelected(
                      selected.includes(item.id)
                        ? selected.filter((id) => id !== item.id)
                        : [...selected, item.id],
                    );
                }}
              >
                <BloomImage
                  source={imageFor(item, 600)}
                  accessibilityLabel={item.title}
                  style={{ width: '100%', aspectRatio: 0.8 }}
                />
                {selected.includes(item.id) && (
                  <View pointerEvents="none" style={{ position: 'absolute', bottom: 8, right: 8 }}>
                    <Badge variant="onMedia" icon={RiCheckLine} content="" />
                  </View>
                )}
                {!selecting && favourites.includes(item.id) && (
                  <View pointerEvents="none" style={{ position: 'absolute', bottom: 8, left: 8 }}>
                    <Badge variant="onMedia" icon={RiHeartLine} content="" />
                  </View>
                )}
              </Card>
            ))}
          </ResponsiveGrid>
          {matches.length === 0 && (
            <Text testID="photo-empty" style={{ padding: 24 }}>
              No photos found
            </Text>
          )}
        </ScreenScrollView>
      </Screen>
    </Frame>
  );
}

export const PhotoLibrary: Story = { render: () => <PhotoLibraryDemo /> };

function MusicCollectionDemo() {
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('album');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [playingAlbum, setPlayingAlbum] = useState<Album>(ALBUMS[0]);
  const [reversed, setReversed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [active, setActive] = useState(0);
  const [saved, setSaved] = useState<string[]>(['First light']);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [position, setPosition] = useState(0);
  const current = TRACKS[active] ?? 'First light';
  const albums = ALBUMS.filter((album) =>
    `${album.title} ${album.artist}`.toLowerCase().includes(query.toLowerCase()),
  );
  const matches = TRACKS.filter(
    (title) =>
      (destination !== 'saved' || saved.includes(title)) &&
      title.toLowerCase().includes(query.toLowerCase()),
  );
  const toggleSaved = () =>
    setSaved(
      saved.includes(current) ? saved.filter((title) => title !== current) : [...saved, current],
    );
  const next = () => {
    setActive((active + (shuffle ? 3 : 1)) % TRACKS.length);
    setPosition(0);
  };
  const browsingAlbums = destination === 'album' && selectedAlbum === null;
  const playback = (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button
        appearance="subtle"
        tone="neutral"
        style={{ flex: 1 }}
        leadingIcon={playing ? RiPauseLine : RiPlayLine}
        onPress={() => setPlaying(!playing)}
      >
        {playing ? 'Pause' : 'Play'}
      </Button>
      <Button
        appearance="subtle"
        tone="neutral"
        style={{ flex: 1 }}
        leadingIcon={RiShuffleLine}
        pressed={shuffle}
        onPressedChange={(value) => {
          setShuffle(value);
          if (value) setPlaying(true);
        }}
      >
        Shuffle
      </Button>
    </View>
  );
  return (
    <Frame>
      <Screen
        bottomBarPlacement="overlay"
        bottomBarKeyboardBehavior="follow"
        bottomBar={
          <View
            style={{
              width: '100%',
              maxWidth: NAVIGATION_CONTENT_WIDTH,
              alignSelf: 'center',
              gap: 8,
            }}
          >
            <MiniPlayer
              track={{
                title: current,
                artists: playingAlbum.artist,
                artwork: imageFor(playingAlbum.artwork),
              }}
              playing={playing}
              onPlayPause={() => setPlaying(!playing)}
              onPress={() => setPlayerOpen(true)}
              onNext={next}
              position={position}
              duration={220}
              liked={saved.includes(current)}
              onLikedChange={toggleSaved}
              style={{ marginHorizontal: 12 }}
            />
            <MediaNavigation
              value={destination}
              onValueChange={(value) => {
                setDestination(value);
                setSelectedAlbum(null);
              }}
              query={query}
              onQueryChange={setQuery}
              kind="music"
            />
          </View>
        }
      >
        <ScreenScrollView>
          <HeaderDockProvider>
            <PageHeader
              title={selectedAlbum?.title ?? (destination === 'saved' ? 'Saved tracks' : 'Albums')}
              titleVariant={selectedAlbum ? undefined : 'title-1-bold'}
              titleReveal={selectedAlbum ? 'onDock' : 'always'}
              accessory={browsingAlbums ? playback : undefined}
              onBack={selectedAlbum ? () => setSelectedAlbum(null) : null}
              actions={
                browsingAlbums ? (
                  <Button
                    iconOnly
                    leadingIcon={RiEqualizerLine}
                    pressed={reversed}
                    onPressedChange={setReversed}
                    appearance="outline"
                    tone="neutral"
                    accessibilityLabel="Reverse album order"
                  />
                ) : (
                  <Button
                    iconOnly
                    leadingIcon={RiBookmarkLine}
                    pressed={saved.includes(current)}
                    onPress={toggleSaved}
                    accessibilityLabel={
                      saved.includes(current) ? 'Unsave current track' : 'Save current track'
                    }
                  />
                )
              }
            />
            {selectedAlbum && (
              <CollectionHeader
                title={selectedAlbum.title}
                typeLabel="Album"
                cover={imageFor(selectedAlbum.artwork)}
                owners={[{ name: selectedAlbum.artist }]}
                year="2026"
                summary={`${matches.length} tracks`}
                description="Warm textures, quiet paths and early light."
              />
            )}
            {!browsingAlbums && <View style={{ padding: 16 }}>{playback}</View>}
            {browsingAlbums ? (
              <ResponsiveGrid
                testID="album-grid"
                minItemWidth={148}
                maxColumns={5}
                gap={16}
                style={{ padding: 16, paddingTop: 0 }}
              >
                {(reversed ? [...albums].reverse() : albums).map((album) => (
                  <Card
                    key={album.id}
                    appearance="plain"
                    border="none"
                    elevation="none"
                    radius="radius-12"
                    style={{ maxWidth: 320 }}
                    accessibilityLabel={`Open ${album.title}`}
                    onPress={() => {
                      setSelectedAlbum(album);
                      setPlayingAlbum(album);
                      setQuery('');
                    }}
                  >
                    <BloomImage
                      source={imageFor(album.artwork, 600)}
                      accessibilityLabel={`${album.title} album artwork`}
                      style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
                    />
                    <View style={{ paddingTop: 8, gap: 2 }}>
                      <Text variant="body-2-semibold" numberOfLines={1}>
                        {album.title}
                      </Text>
                      <Text
                        variant="caption-1-regular"
                        className="text-text-secondary"
                        numberOfLines={1}
                      >
                        {album.artist}
                      </Text>
                    </View>
                  </Card>
                ))}
              </ResponsiveGrid>
            ) : (
              <>
                <StickySection>
                  <View style={{ padding: 16 }}>
                    <Text variant="body-medium">
                      {query
                        ? `Results for “${query}”`
                        : destination === 'saved'
                          ? 'Saved tracks'
                          : 'Tracks'}
                    </Text>
                  </View>
                </StickySection>
                <List
                  accessibilityLabel="Album tracks"
                  empty={<Text style={{ padding: 24 }}>No tracks found</Text>}
                  items={matches.map((title) => ({
                    id: title,
                    title,
                    supporting: selectedAlbum?.artist ?? playingAlbum.artist,
                    active: title === current,
                    leading: <Text>{String(TRACKS.indexOf(title) + 1).padStart(2, '0')}</Text>,
                    trailing: <Text>3:40</Text>,
                    onPress: () => {
                      setActive(TRACKS.indexOf(title));
                      setPosition(0);
                      setPlaying(true);
                    },
                  }))}
                />
              </>
            )}
            {browsingAlbums && albums.length === 0 && (
              <Text style={{ padding: 24 }}>No albums found</Text>
            )}
          </HeaderDockProvider>
        </ScreenScrollView>
      </Screen>
      <Dialog
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        presentation="fullscreen"
        scrollable={false}
        contentPadding={0}
      >
        <FullScreenPlayer
          track={{
            title: current,
            artists: playingAlbum.artist,
            artwork: imageFor(playingAlbum.artwork),
          }}
          contextLabel="Playing from album"
          contextName={playingAlbum.title}
          onCollapse={() => setPlayerOpen(false)}
          liked={saved.includes(current)}
          onLikedChange={toggleSaved}
          position={position}
          duration={220}
          onSeek={setPosition}
          transport={{
            playing,
            onPlayPause: () => setPlaying(!playing),
            onNext: next,
            onPrevious: () => {
              setActive((active + TRACKS.length - 1) % TRACKS.length);
              setPosition(0);
            },
            shuffle,
            onShuffleChange: setShuffle,
          }}
        />
      </Dialog>
    </Frame>
  );
}

export const MusicCollection: Story = { render: () => <MusicCollectionDemo /> };

export const ImageToolbar: Story = {
  render: function ImageToolbar() {
    const [open, setOpen] = useState(true);
    return open ? (
      <Frame>
        <PhotoViewer photo={PHOTOS[2]} onClose={() => setOpen(false)} />
      </Frame>
    ) : (
      <PhotoLibraryDemo />
    );
  },
};
