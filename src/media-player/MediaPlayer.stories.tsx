import React, { useEffect, useState } from 'react';
import { Image, ScrollView, useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { resolveButtonRamps } from '../button/shared';
import { RiHome5Line } from '../icons/remix/RiHome5Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiBookOpenLine } from '../icons/remix/RiBookOpenLine';
import { resolveMenuPalette } from '../floating/menu-palette';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ConnectBanner } from './ConnectBanner';
import { DevicePicker } from './DevicePicker';
import { FullScreenPlayer } from './FullScreenPlayer';
import { MiniPlayer } from './MiniPlayer';
import { NowPlayingBar } from './NowPlayingBar';
import { PlaybackSpeedMenu } from './PlaybackSpeedMenu';
import { SleepTimerMenu } from './SleepTimerMenu';
import { TransportControls } from './TransportControls';
import type {
  MediaPlayerTrack,
  PlaybackDevice,
  RepeatMode,
  SleepTimerValue,
  TransportControlsSize,
} from './types';

const meta: Meta = {
  title: 'Blocks/Music/Player',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const TRACK: MediaPlayerTrack = {
  title: 'Glass Harbour Lights',
  artists: [
    { id: 'marlow', name: 'Marlow Vance' },
    { id: 'tessel', name: 'The Tessel Choir' },
  ],
  artwork: cover('glass-harbour'),
  explicit: true,
};

const EPISODE: MediaPlayerTrack = {
  title: 'Episode 42 — Maps of places that never were',
  artists: 'Quiet Cartography',
  artwork: cover('quiet-cartography'),
};

const DEVICES: PlaybackDevice[] = [
  { id: 'this', name: 'This computer', kind: 'computer' },
  { id: 'living', name: 'Living Room Speaker', kind: 'speaker', description: 'Wi-Fi' },
  { id: 'phone', name: "Ada's phone", kind: 'phone' },
  { id: 'tv', name: 'Den TV', kind: 'tv' },
  { id: 'car', name: 'Hatchback', kind: 'car', description: 'Bluetooth' },
  { id: 'group', name: 'Downstairs', kind: 'group', description: '3 speakers' },
];

const noop = () => {};

/** Advances a fake position once a second while playing, looping at the end. */
function useFakePlayback(duration: number, start = 42) {
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(start);
  const [preview, setPreview] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setPosition((p) => (p + rate >= duration ? 0 : p + rate)), 1000);
    return () => clearInterval(id);
  }, [playing, duration, rate]);
  return {
    playing,
    togglePlaying: () => setPlaying((p) => !p),
    position: preview ?? position,
    seek: (s: number) => {
      setPreview(null);
      setPosition(s);
    },
    setPreview,
    setPosition,
    rate,
    setRate,
  };
}

function PageBehind({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, paddingBottom: 24, gap: 8, backgroundColor: theme.colors.background }}>
      <Text variant="title-2-semibold">Night Drive</Text>
      <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
        A playlist of 38 tracks · 2 h 14 min
      </Text>
      {children}
    </View>
  );
}

function DesktopPlayer({ initialDevicePickerOpen = false }: { initialDevicePickerOpen?: boolean }) {
  const duration = 227;
  const p = useFakePlayback(duration);
  const [liked, setLiked] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [lyrics, setLyrics] = useState(false);
  const [queue, setQueue] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [device, setDevice] = useState<PlaybackDevice>(DEVICES[1] as PlaybackDevice);
  const [pickerOpen, setPickerOpen] = useState(initialDevicePickerOpen);
  const window = useWindowDimensions();
  const remote = device.id !== 'this';

  return (
    <View style={{ alignSelf: 'stretch', height: window.height - 48 }}>
      <PageBehind />
      <NowPlayingBar
        track={TRACK}
        onTitlePress={noop}
        onArtistPress={noop}
        liked={liked}
        onLikedChange={setLiked}
        transport={{
          playing: p.playing,
          onPlayPause: p.togglePlaying,
          onPrevious: () => p.setPosition(0),
          onNext: () => p.setPosition(0),
          shuffle,
          onShuffleChange: setShuffle,
          repeat,
          onRepeatChange: setRepeat,
        }}
        position={p.position}
        duration={duration}
        buffered={Math.min(duration, p.position + 60)}
        onSeek={p.seek}
        onSeekPreview={p.setPreview}
        lyricsActive={lyrics}
        onLyricsChange={setLyrics}
        queueActive={queue}
        onQueueChange={setQueue}
        deviceName={remote ? device.name : undefined}
        devicePickerOpen={pickerOpen}
        onDevicePickerOpenChange={setPickerOpen}
        devicePicker={
          <DevicePicker
            current={device}
            devices={DEVICES}
            onSelect={(d) => {
              setDevice(d);
              setPickerOpen(false);
            }}
            onHelpPress={noop}
            testID="device-picker"
          />
        }
        volume={volume}
        onVolumeChange={setVolume}
        muted={muted}
        onMutedChange={setMuted}
        onFullscreenPress={noop}
        testID="bar"
      />
      {remote ? <ConnectBanner deviceName={device.name} kind={device.kind} onPress={() => setPickerOpen(true)} /> : null}
    </View>
  );
}

/** The desktop bar with a fake timer: play/pause, seek, like, shuffle, repeat, lyrics, queue, devices, volume. */
export const DesktopBar: Story = {
  render: () => <DesktopPlayer />,
};

/** The device picker, open from the bar's device button. */
export const DevicePickerOpen: Story = {
  render: () => <DesktopPlayer initialDevicePickerOpen />,
};

/** The same bar measured at 1280, 900 and 700: the fullscreen button, then lyrics/volume/times collapse. */
export const Collapsing: Story = {
  render: function Collapsing() {
    const theme = useTheme();
    const p = useFakePlayback(227);
    return (
      <ScrollView horizontal contentContainerStyle={{ gap: 24, padding: 16, flexDirection: 'column' }}>
        {[1280, 900, 700].map((w) => (
          <View key={w} style={{ width: w, gap: 6 }}>
            <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
              {`${w}px`}
            </Text>
            <NowPlayingBar
              track={TRACK}
              liked={false}
              onLikedChange={noop}
              transport={{
                playing: p.playing,
                onPlayPause: p.togglePlaying,
                onPrevious: noop,
                onNext: noop,
                onShuffleChange: noop,
                repeat: 'all',
                onRepeatChange: noop,
              }}
              position={p.position}
              duration={227}
              onSeek={p.seek}
              lyricsActive
              onLyricsChange={noop}
              onQueueChange={noop}
              onDevicePress={noop}
              volume={0.5}
              onVolumeChange={noop}
              onFullscreenPress={noop}
              testID={`bar-${w}`}
            />
          </View>
        ))}
      </ScrollView>
    );
  },
};

/** Podcast mode: speed, back 15, forward 30 and a sleep timer. */
export const Podcast: Story = {
  render: function Podcast() {
    const duration = 3725;
    const p = useFakePlayback(duration, 1210);
    const [sleep, setSleep] = useState<SleepTimerValue>(30);
    const window = useWindowDimensions();
    return (
      <View style={{ alignSelf: 'stretch', height: window.height - 48 }}>
        <PageBehind />
        <NowPlayingBar
          track={EPISODE}
          transport={{
            variant: 'podcast',
            playing: p.playing,
            onPlayPause: p.togglePlaying,
            onSkipBack: () => p.setPosition(Math.max(0, p.position - 15)),
            onSkipForward: () => p.setPosition(Math.min(duration, p.position + 30)),
            playbackRate: p.rate,
            onPlaybackRateChange: p.setRate,
            trailing: (
              <SleepTimerMenu
                value={sleep}
                onValueChange={setSleep}
                remaining={sleep === 'off' ? undefined : '24:10'}
                size="compact"
                testID="sleep"
              />
            ),
          }}
          position={p.position}
          duration={duration}
          onSeek={p.seek}
          onSeekPreview={p.setPreview}
          onQueueChange={noop}
          onDevicePress={noop}
          volume={0.6}
          onVolumeChange={noop}
          testID="podcast-bar"
        />
      </View>
    );
  },
};

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** Every size, the repeat cycle and the podcast row. */
export const Transport: Story = {
  render: function Transport() {
    const theme = useTheme();
    const [playing, setPlaying] = useState(false);
    const [shuffle, setShuffle] = useState(true);
    const [repeat, setRepeat] = useState<RepeatMode>('all');
    const [rate, setRate] = useState(1.5);
    const [sleep, setSleep] = useState<SleepTimerValue>('off');
    return (
      <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
        {(['compact', 'regular', 'large'] as TransportControlsSize[]).map((size) => (
          <View key={size} style={{ gap: 8, alignItems: 'flex-start' }}>
            <Caption>{`music — ${size}`}</Caption>
            <TransportControls
              size={size}
              playing={playing}
              onPlayPause={() => setPlaying((v) => !v)}
              onPrevious={noop}
              onNext={noop}
              shuffle={shuffle}
              onShuffleChange={setShuffle}
              repeat={repeat}
              onRepeatChange={setRepeat}
              testID={`transport-${size}`}
            />
          </View>
        ))}
        <View style={{ gap: 8, alignItems: 'flex-start' }}>
          <Caption>repeat off / all / one; previous disabled; loading</Caption>
          <View style={{ gap: 12 }}>
            {(['off', 'all', 'one'] as RepeatMode[]).map((mode) => (
              <TransportControls
                key={mode}
                playing
                loading={mode === 'one'}
                onPlayPause={noop}
                onPrevious={noop}
                previousDisabled={mode === 'off'}
                onNext={noop}
                onShuffleChange={noop}
                repeat={mode}
                onRepeatChange={noop}
              />
            ))}
          </View>
        </View>
        <View style={{ gap: 8, alignItems: 'flex-start' }}>
          <Caption>podcast — regular, custom 10 / 45 seconds, large</Caption>
          <TransportControls
            variant="podcast"
            playing={playing}
            onPlayPause={() => setPlaying((v) => !v)}
            onSkipBack={noop}
            onSkipForward={noop}
            playbackRate={rate}
            onPlaybackRateChange={setRate}
            trailing={<SleepTimerMenu value={sleep} onValueChange={setSleep} remaining="12:04" />}
          />
          <TransportControls
            variant="podcast"
            playing={playing}
            onPlayPause={() => setPlaying((v) => !v)}
            skipBackSeconds={10}
            skipForwardSeconds={45}
            onSkipBack={noop}
            onSkipForward={noop}
          />
          <TransportControls
            variant="podcast"
            size="large"
            playing={playing}
            onPlayPause={() => setPlaying((v) => !v)}
            onSkipBack={noop}
            onSkipForward={noop}
            playbackRate={1}
            onPlaybackRateChange={noop}
          />
        </View>
      </View>
    );
  },
};

function MenusDemo({ openMenu }: { openMenu?: 'speed' | 'sleep' }) {
  const theme = useTheme();
  const [rate, setRate] = useState(1.25);
  const [sleep, setSleep] = useState<SleepTimerValue>(15);
  return (
    <View style={{ padding: 24, minHeight: 520, backgroundColor: theme.colors.background, gap: 12 }}>
      <Caption>{`speed ${rate}× · sleep ${String(sleep)}`}</Caption>
      <View style={{ flexDirection: 'row', gap: 160, alignItems: 'center' }}>
        <PlaybackSpeedMenu
          rate={rate}
          onRateChange={setRate}
          open={openMenu === 'speed' ? true : undefined}
          testID="speed"
        />
        <SleepTimerMenu
          value={sleep}
          onValueChange={setSleep}
          remaining={sleep === 'off' ? undefined : '12:04'}
          open={openMenu === 'sleep' ? true : undefined}
          testID="sleep"
        />
      </View>
    </View>
  );
}

/** The speed and sleep-timer menus, closed. */
export const Menus: Story = { render: () => <MenusDemo /> };
/** The speed menu, open. */
export const SpeedMenuOpen: Story = { render: () => <MenusDemo openMenu="speed" /> };
/** The sleep-timer menu, open. */
export const SleepMenuOpen: Story = { render: () => <MenusDemo openMenu="sleep" /> };

function MockTabBar() {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  const tabs = [
    { label: 'Home', Icon: RiHome5Line },
    { label: 'Search', Icon: RiSearchLine },
    { label: 'Library', Icon: RiBookOpenLine },
  ];
  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.isDark ? neutral[800] : neutral[200],
        backgroundColor: theme.colors.background,
      }}
    >
      {tabs.map(({ label, Icon }, i) => (
        <View key={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Icon width={22} height={22} fill={i === 0 ? theme.colors.text : neutral[500]} />
          <Text variant="caption-2-medium" style={{ color: i === 0 ? theme.colors.text : neutral[500] }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Phone({ children, height = 844 }: { children: React.ReactNode; height?: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: 390, height, overflow: 'hidden', backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/** Rendered inside the player, so `useTheme()` here is the player's dark theme. */
function AboutArtistDemo() {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: neutral[800] }}>
      <Image source={{ uri: cover('marlow-vance-portrait') }} style={{ height: 180 }} />
      <View style={{ padding: 20, gap: 4 }}>
        <Text variant="headline-semibold">About the artist</Text>
        <Text variant="body-regular" style={{ color: neutral[400] }}>
          Marlow Vance · 1.2M monthly listeners
        </Text>
      </View>
    </View>
  );
}

function FullPlayer({ width, height, onCollapse = noop }: { width: number; height: number; onCollapse?: () => void }) {
  const duration = 227;
  const p = useFakePlayback(duration);
  const [liked, setLiked] = useState(true);
  const [shuffle, setShuffle] = useState(true);
  const [repeat, setRepeat] = useState<RepeatMode>('one');
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <FullScreenPlayer
        track={TRACK}
        artworkColor="#3A6EA5"
        contextLabel="Playing from playlist"
        contextName="Night Drive"
        onCollapse={onCollapse}
        onMore={noop}
        onArtistPress={noop}
        liked={liked}
        onLikedChange={setLiked}
        transport={{
          playing: p.playing,
          onPlayPause: p.togglePlaying,
          onPrevious: () => p.setPosition(0),
          onNext: () => p.setPosition(0),
          shuffle,
          onShuffleChange: setShuffle,
          repeat,
          onRepeatChange: setRepeat,
        }}
        position={p.position}
        duration={duration}
        buffered={Math.min(duration, p.position + 50)}
        onSeek={p.seek}
        onSeekPreview={p.setPreview}
        deviceName="Living Room Speaker"
        onDevicePress={noop}
        onShare={noop}
        queueActive={false}
        onQueuePress={noop}
        lyrics={{
          lines: [
            'The harbour hums in borrowed light',
            'We count the cranes like sleeping birds',
            'And every window holds a tide',
            'Of all the things we never heard',
          ],
          activeIndex: 1,
          onPress: noop,
        }}
        aboutArtist={<AboutArtistDemo />}
        testID="full"
      />
    </View>
  );
}

/** The full-screen player at 390 × 844. */
export const FullScreenMobile: Story = {
  render: () => <FullPlayer width={390} height={844} />,
};

/** The immersive player at 1280 × 800. */
export const FullScreenDesktop: Story = {
  render: () => <FullPlayer width={1280} height={800} />,
};

/**
 * The phone's mini player over a mock tab bar at 390: tinted, a pale colour darkened, no colour,
 * casting. Pressing one opens the full-screen player over the screen (as a route would).
 */
export const MobileMiniPlayer: Story = {
  render: function MobileMiniPlayer() {
    const p = useFakePlayback(227);
    const [liked, setLiked] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const variants: { key: string; artworkColor?: string; deviceName?: string; track: MediaPlayerTrack }[] = [
      { key: 'tinted', artworkColor: '#3A6EA5', track: TRACK },
      { key: 'pale', artworkColor: '#F4E3A1', track: { ...TRACK, title: 'Lemon Static', artists: 'Juniper Holt', artwork: cover('lemon-static') } },
      { key: 'neutral', track: EPISODE },
      { key: 'casting', artworkColor: '#8B3A62', deviceName: 'Living Room Speaker', track: TRACK },
    ];
    return (
      <Phone>
        <View style={{ flex: 1 }}>
          <PageBehind />
        </View>
        <View style={{ gap: 8, paddingBottom: 8 }}>
          {variants.map((v) => (
            <MiniPlayer
              key={v.key}
              track={v.track}
              artworkColor={v.artworkColor}
              deviceName={v.deviceName}
              playing={p.playing}
              onPlayPause={p.togglePlaying}
              position={p.position}
              duration={227}
              liked={liked}
              onLikedChange={setLiked}
              onPress={() => setExpanded(true)}
              testID={`mini-${v.key}`}
            />
          ))}
        </View>
        <MockTabBar />
        {expanded ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <FullPlayer width={390} height={844} onCollapse={() => setExpanded(false)} />
          </View>
        ) : null}
      </Phone>
    );
  },
};

/** The device list on its own, as a sheet or popover body, and the connect banner. */
export const Devices: Story = {
  render: function Devices() {
    const theme = useTheme();
    const palette = resolveMenuPalette(theme);
    const [device, setDevice] = useState<PlaybackDevice>(DEVICES[0] as PlaybackDevice);
    return (
      <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 320,
            padding: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.surface,
          }}
        >
          <DevicePicker current={device} devices={DEVICES} onSelect={setDevice} onHelpPress={noop} />
        </View>
        <View style={{ width: 390, gap: 8 }}>
          <ConnectBanner deviceName="Living Room Speaker" onPress={noop} />
          <ConnectBanner deviceName="Den TV" kind="tv" />
        </View>
      </View>
    );
  },
};
