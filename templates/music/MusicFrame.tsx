import React, { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { Dialog, useDialogControl } from '../../src/dialog';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiHome5Fill,
  RiHome5Line,
  RiNotification3Line,
  RiSearchFill,
  RiSearchLine,
  RiStackLine,
} from '../../src/icons/remix';
import {
  ConnectBanner,
  DevicePicker,
  MiniPlayer,
  NowPlayingBar,
  SleepTimerMenu,
  type PlaybackDevice,
} from '../../src/media-player';
import { LibraryPanel, SearchField, type LibraryEntry } from '../../src/music-library';
import { QueuePanel } from '../../src/queue-panel';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { WEB_VIEWPORT_HEIGHT, type WebCssStyle } from '../../src/styles/web-view-style';
import { TabBar, TabBarButton, useTabBarFootprint } from '../../src/tab-bar';
import { useTheme } from '../../src/theme/use-theme';
import { DEVICES, LIBRARY, ME, PLAYLIST_BY_ID } from './data';
import { FullPlayer, ImmersivePlayer, LiveLyrics, NowPlayingSide, playerTrack } from './NowPlayingPage';
import { useMusicLayout } from './parts';
import { toQueueTrack, usePlayer, usePosition } from './PlayerContext';
import { useMusicRouter, type MusicRoute } from './router';

/**
 * The music app's frame. Desktop (768 and up): a top bar with the search
 * pill, then three panes that scroll on their own — the library, the page,
 * and a side pane that switches between the now-playing card, the queue and the
 * lyrics — over the fixed now-playing bar. Phone: the page, the mini player
 * floating above the tab bar, and the full player over everything.
 */

/**
 * One screen, edge to edge. On web it bleeds over the Storybook preview's 24px
 * padding and is exactly the viewport tall; nothing scrolls the document.
 */
const FRAME: WebCssStyle =
  Platform.OS === 'web'
    ? {
        alignSelf: 'stretch',
        height: WEB_VIEWPORT_HEIGHT,
        overflow: 'hidden',
        marginTop: -24,
        marginBottom: -24,
        marginLeft: -24,
        marginRight: -24,
      }
    : { flex: 1, width: '100%' };

export type SidePane = 'now-playing' | 'queue' | 'lyrics' | null;

export interface MusicFrameProps {
  children: React.ReactNode;
  /** The desktop side pane on mount. Default: the now-playing card when there is room. */
  initialSidePane?: SidePane;
  initialDevicePickerOpen?: boolean;
}

export function MusicFrame(props: MusicFrameProps) {
  const { mobile } = useMusicLayout();
  return mobile ? <MobileFrame {...props} /> : <DesktopFrame {...props} />;
}

function routeForEntry(entry: LibraryEntry): MusicRoute | null {
  switch (entry.kind) {
    case 'playlist':
      return entry.id === 'liked' || PLAYLIST_BY_ID[entry.id] ? { name: 'playlist', id: entry.id } : null;
    case 'album':
      return { name: 'album', id: entry.id };
    case 'artist':
      return { name: 'artist', id: entry.id };
    case 'podcast':
      return { name: 'podcast', id: entry.id };
    default:
      return null;
  }
}

function routeEntryId(route: MusicRoute): string | undefined {
  return 'id' in route ? route.id : undefined;
}

// ---------------------------------------------------------------------------
//  Desktop
// ---------------------------------------------------------------------------

function DesktopFrame({ children, initialSidePane, initialDevicePickerOpen = false }: MusicFrameProps) {
  const theme = useTheme();
  const router = useMusicRouter();
  const player = usePlayer();
  const { width } = useMusicLayout();
  const roomy = width >= BREAKPOINTS.xl;
  const [pane, setPane] = useState<SidePane>(
    initialSidePane !== undefined ? initialSidePane : roomy ? 'now-playing' : null,
  );
  const [libraryCollapsed, setLibraryCollapsed] = useState(width < 1100);
  const [pickerOpen, setPickerOpen] = useState(initialDevicePickerOpen);
  // The side pane narrows below 1536 so the page column still earns its wider columns.
  const paneWidth = width >= 1536 ? 360 : 320;

  useEffect(() => {
    if (width < 1100) setLibraryCollapsed(true);
  }, [width]);

  // Below `lg` the side pane only opens on request, and replaces nothing but width.
  const showPane = pane !== null && !!player.current && width >= BREAKPOINTS.lg;
  const closePane = (active: boolean, which: Exclude<SidePane, null>) =>
    setPane(active ? which : roomy ? 'now-playing' : null);

  if (router.fullPlayerOpen) {
    return (
      <View style={[FRAME, { backgroundColor: theme.colors.background }]}>
        <ImmersivePlayer
          onCollapse={() => router.setFullPlayerOpen(false)}
          onQueuePress={() => {
            router.setFullPlayerOpen(false);
            setPane('queue');
          }}
          onDevicePress={() => {
            router.setFullPlayerOpen(false);
            setPickerOpen(true);
          }}
        />
      </View>
    );
  }

  const query = router.route.name === 'search' ? (router.route.query ?? '') : '';

  return (
    <View testID="music-desktop" style={[FRAME, { backgroundColor: theme.colors.background }]}>
      {/* Top bar */}
      <View
        style={{ height: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 16 }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Button
            variant="ghost"
            size="small"
            iconOnly
            icon={RiArrowLeftSLine}
            accessibilityLabel="Go back"
            disabled={!router.canGoBack}
            onPress={router.back}
          />
          <Button
            variant="ghost"
            size="small"
            iconOnly
            icon={RiArrowRightSLine}
            accessibilityLabel="Go forward"
            disabled={!router.canGoForward}
            onPress={router.forward}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: Math.min(560, width - 360) }}>
          <Button
            variant="secondary"
            size="large"
            iconOnly
            icon={router.route.name === 'home' ? RiHome5Fill : RiHome5Line}
            accessibilityLabel="Home"
            onPress={() => router.navigate({ name: 'home' })}
          />
          <SearchField
            testID="music-search-field"
            value={query}
            onChangeText={(text) =>
              router.route.name === 'search'
                ? router.replace({ name: 'search', query: text })
                : router.navigate({ name: 'search', query: text })
            }
            onClear={() => router.replace({ name: 'search', query: '' })}
            onBrowsePress={() => router.navigate({ name: 'search' })}
            browseActive={router.route.name === 'search' && !query}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="small" iconOnly icon={RiNotification3Line} accessibilityLabel="What’s new" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${ME.name}, profile`}
            onPress={() => router.navigate({ name: 'profile' })}
            style={{ borderRadius: 999 }}
          >
            <Avatar source={ME.avatar} name={ME.name} size={36} />
          </Pressable>
        </View>
      </View>

      {/* Panes */}
      <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: 8, paddingLeft: 8, paddingRight: 8 }}>
        <LibraryPanel
          testID="music-library"
          items={LIBRARY}
          collapsed={libraryCollapsed}
          onCollapsedChange={setLibraryCollapsed}
          onCreatePress={() => {}}
          selectedId={routeEntryId(router.route)}
          nowPlayingId={player.context?.id}
          paused={!player.playing}
          onItemPress={(entry) => {
            const route = routeForEntry(entry);
            if (route) router.navigate(route);
          }}
          style={{ width: libraryCollapsed ? 72 : width >= 1536 ? 340 : 260, height: '100%' }}
        />
        <View testID="music-page" style={{ flex: 1, minWidth: 0, minHeight: 0, borderRadius: 8, overflow: 'hidden' }}>
          {children}
        </View>
        {showPane ? (
          <View testID="music-side-pane" style={{ width: paneWidth, minHeight: 0 }}>
            {pane === 'queue' ? (
              <QueueSide width={paneWidth} onClose={() => closePane(false, 'queue')} />
            ) : pane === 'lyrics' ? (
              <View style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                <LiveLyrics size="small" />
                <View style={{ position: 'absolute', top: 8, right: 8 }}>
                  <Button
                    variant="secondary"
                    size="small"
                    iconOnly
                    icon={RiCloseLine}
                    accessibilityLabel="Hide lyrics"
                    onPress={() => closePane(false, 'lyrics')}
                  />
                </View>
              </View>
            ) : (
              <NowPlayingSide onClose={() => setPane(null)} onShowLyrics={() => setPane('lyrics')} />
            )}
          </View>
        ) : null}
      </View>

      <PlayerBar
        pane={showPane ? pane : null}
        onPaneChange={(which, active) => closePane(active, which)}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        onNowPlayingPress={() => setPane(pane === 'now-playing' ? null : 'now-playing')}
      />
    </View>
  );
}

function QueueSide({
  onClose,
  variant,
  style,
  width = 360,
}: {
  onClose?: () => void;
  variant?: 'panel' | 'sheet';
  style?: WebCssStyle;
  width?: number;
}) {
  const player = usePlayer();
  return (
    <QueuePanel
      testID="music-queue"
      variant={variant}
      width={variant === 'sheet' ? undefined : width}
      nowPlaying={player.current ? toQueueTrack(player.current) : null}
      playing={player.playing}
      queue={player.queue.map(toQueueTrack)}
      context={player.upNext.map(toQueueTrack)}
      contextName={player.context?.name}
      recentlyPlayed={player.recentlyPlayed.map(toQueueTrack)}
      onReorder={player.reorder}
      onRemove={(section, index) => player.remove(section, index)}
      onPlay={(section, index) => player.playFromQueue(section, index)}
      onClearQueue={player.queue.length > 0 ? player.clearQueue : undefined}
      onClose={onClose}
      style={style ?? { height: '100%' }}
    />
  );
}

/** The desktop bar. Its own component: it reads the clock, so only it re-renders on every tick. */
function PlayerBar({
  pane,
  onPaneChange,
  pickerOpen,
  onPickerOpenChange,
}: {
  pane: SidePane;
  onPaneChange: (pane: 'queue' | 'lyrics', active: boolean) => void;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onNowPlayingPress: () => void;
}) {
  const player = usePlayer();
  const position = usePosition();
  const router = useMusicRouter();
  const item = player.current;
  const remote = player.device.id !== 'this';

  if (!item) return <View style={{ height: 80 }} />;
  const episode = item.kind === 'episode';

  return (
    <View>
      <NowPlayingBar
        testID="music-now-playing-bar"
        track={playerTrack(item)}
        onTitlePress={() =>
          router.navigate(episode ? { name: 'episode', id: item.id } : { name: 'album', id: item.parentId })
        }
        onArtistPress={(artist) => artist.id && router.navigate({ name: 'artist', id: artist.id })}
        liked={player.liked.has(item.id)}
        onLikedChange={(on) => player.setLiked(item.id, on)}
        transport={
          episode
            ? {
                variant: 'podcast',
                playing: player.playing,
                onPlayPause: player.toggle,
                subject: item.title,
                onSkipBack: () => player.seekBy(-15),
                onSkipForward: () => player.seekBy(30),
                playbackRate: player.rate,
                onPlaybackRateChange: player.setRate,
                trailing: (
                  <SleepTimerMenu
                    value={player.sleep}
                    onValueChange={player.setSleep}
                    remaining={player.sleep === 'off' ? undefined : '14:52'}
                    size="compact"
                  />
                ),
              }
            : {
                playing: player.playing,
                onPlayPause: player.toggle,
                subject: item.title,
                onPrevious: player.previous,
                onNext: player.next,
                shuffle: player.shuffle,
                onShuffleChange: player.setShuffle,
                repeat: player.repeat,
                onRepeatChange: player.setRepeat,
              }
        }
        position={position}
        duration={item.duration}
        onSeek={player.seek}
        lyricsActive={pane === 'lyrics'}
        onLyricsChange={episode ? undefined : (active) => onPaneChange('lyrics', active)}
        queueActive={pane === 'queue'}
        onQueueChange={(active) => onPaneChange('queue', active)}
        deviceName={remote ? player.device.name : undefined}
        devicePicker={
          <DevicePicker
            current={player.device}
            devices={DEVICES}
            onSelect={(device: PlaybackDevice) => {
              player.setDevice(device);
              onPickerOpenChange(false);
            }}
            onHelpPress={() => {}}
          />
        }
        devicePickerOpen={pickerOpen}
        onDevicePickerOpenChange={onPickerOpenChange}
        volume={player.volume}
        onVolumeChange={player.setVolume}
        muted={player.muted}
        onMutedChange={player.setMuted}
        onFullscreenPress={() => router.setFullPlayerOpen(true)}
      />
      {remote ? (
        <ConnectBanner
          deviceName={player.device.name}
          kind={player.device.kind}
          onPress={() => onPickerOpenChange(true)}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Phone
// ---------------------------------------------------------------------------

const TABS = [
  { name: 'home', label: 'Home', icon: <RiHome5Line />, activeIcon: <RiHome5Fill /> },
  { name: 'search', label: 'Search', icon: <RiSearchLine />, activeIcon: <RiSearchFill /> },
  { name: 'library', label: 'Your Library', icon: <RiStackLine /> },
];

function tabIndexOf(route: MusicRoute): number {
  return route.name === 'home' ? 0 : route.name === 'search' ? 1 : route.name === 'library' ? 2 : -1;
}

function MobileFrame({ children }: MusicFrameProps) {
  const theme = useTheme();
  const router = useMusicRouter();
  const player = usePlayer();
  const footprint = useTabBarFootprint();
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const devices = useDialogControl();
  const queue = useDialogControl();

  return (
    <GestureHandlerRootView testID="music-mobile" style={[FRAME, { backgroundColor: theme.colors.background }]}>
      <View style={{ flex: 1, minHeight: 0 }}>{children}</View>

      {player.current ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: footprint + 8 }}>
          <MobileMiniPlayer onOpen={() => router.setFullPlayerOpen(true)} />
        </View>
      ) : null}

      <TabBar
        activeIndex={tabIndexOf(router.route)}
        onIndexChange={(index) => router.navigate({ name: (['home', 'search', 'library'] as const)[index] ?? 'home' })}
      >
        {TABS.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} />
        ))}
      </TabBar>

      {router.fullPlayerOpen && player.current ? (
        <View testID="music-full-player-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <FullPlayer
            onCollapse={() => router.setFullPlayerOpen(false)}
            onQueuePress={() => queue.open()}
            onDevicePress={() => devices.open()}
            onLyricsPress={() => setLyricsOpen(true)}
          />
        </View>
      ) : null}

      {lyricsOpen && player.current ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <LiveLyrics size="medium" />
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <Button
              variant="secondary"
              size="small"
              iconOnly
              icon={RiCloseLine}
              accessibilityLabel="Close lyrics"
              onPress={() => setLyricsOpen(false)}
            />
          </View>
        </View>
      ) : null}

      <Dialog control={devices} placement="bottom" title="Connect to a device">
        <DevicePicker
          current={player.device}
          devices={DEVICES}
          onSelect={(device) => {
            player.setDevice(device);
            devices.close();
          }}
        />
      </Dialog>
      <Dialog control={queue} placement="bottom" contentPadding={0}>
        <QueueSide variant="sheet" style={{ height: 520 }} />
      </Dialog>
    </GestureHandlerRootView>
  );
}

function MobileMiniPlayer({ onOpen }: { onOpen: () => void }) {
  const player = usePlayer();
  const position = usePosition();
  const item = player.current!;
  return (
    <MiniPlayer
      testID="music-mini-player"
      track={playerTrack(item)}
      artworkColor={item.artworkColor}
      playing={player.playing}
      onPlayPause={player.toggle}
      onPress={onOpen}
      position={position}
      duration={item.duration}
      liked={player.liked.has(item.id)}
      onLikedChange={(on) => player.setLiked(item.id, on)}
      deviceName={player.device.id === 'this' ? undefined : player.device.name}
      onNext={player.next}
      onPrevious={player.previous}
    />
  );
}
