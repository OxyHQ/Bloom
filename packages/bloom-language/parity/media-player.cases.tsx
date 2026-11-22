import {
  ConnectBanner,
  DevicePicker,
  FullScreenPlayer,
  MiniPlayer,
  NowPlayingBar,
  PlaybackSpeedMenu,
  SleepTimerMenu,
  TransportControls,
} from '@oxy.so/bloom/media-player';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const COVER = 'https://cdn.oxy.so/cover.jpg';
const TRACK = {
  title: 'Glass Harbour Lights',
  artists: [
    { id: 'marlow', name: 'Marlow Vance' },
    { id: 'tessel', name: 'The Tessel Choir' },
  ],
  artwork: COVER,
  explicit: true,
};
const EPISODE = { title: 'Maps of places that never were', artists: 'Quiet Cartography' };
const DEVICES = [
  { id: 'this', name: 'This computer', kind: 'computer' as const },
  { id: 'living', name: 'Living Room Speaker', kind: 'speaker' as const, description: 'Wi-Fi' },
  { id: 'car', name: 'Hatchback', kind: 'car' as const, disabled: true },
];
const TRANSPORT = {
  playing: true,
  onPlayPause: press,
  onPrevious: press,
  onNext: press,
  shuffle: true,
  onShuffleChange: set,
  repeat: 'one' as const,
  onRepeatChange: set,
};

const transport: ParityCase[] = ENUMS.transportStyle.flatMap((variant) =>
  ENUMS.transportSize.map((size) => ({
    name: `TransportControls ${variant} ${size}`,
    language: () =>
      toElement(
        L.TransportControls(true, {
          onPlayPause: press,
          onPrevious: press,
          onNext: press,
          onSkipBack: press,
          onSkipForward: press,
          playbackRate: 1.5,
          onPlaybackRateChange: set,
          shuffle: true,
          onShuffleChange: set,
          repeat: 'all',
          onRepeatChange: set,
          subject: 'Glass Harbour Lights',
        })
          .style(variant)
          .size(size),
      ),
    bloom: () => (
      <TransportControls
        playing
        onPlayPause={press}
        onPrevious={press}
        onNext={press}
        onSkipBack={press}
        onSkipForward={press}
        playbackRate={1.5}
        onPlaybackRateChange={set}
        shuffle
        onShuffleChange={set}
        repeat="all"
        onRepeatChange={set}
        subject="Glass Harbour Lights"
        variant={variant}
        size={size}
      />
    ),
  })),
);

const players: ParityCase[] = [
  {
    name: 'TransportControls paused, loading, disabled, a trailing slot',
    language: () =>
      toElement(
        L.TransportControls(false, {
          onPlayPause: press,
          nextDisabled: true,
          trailing: L.Text('1×'),
        })
          .loading()
          .disabled(),
      ),
    bloom: () => (
      <TransportControls
        playing={false}
        onPlayPause={press}
        nextDisabled
        trailing={<Text>1×</Text>}
        loading
        disabled
      />
    ),
  },
  {
    name: 'NowPlayingBar',
    language: () =>
      toElement(
        L.NowPlayingBar(TRACK, {
          transport: TRANSPORT,
          position: 42,
          duration: 214,
          buffered: 120,
          onSeek: set,
          liked: true,
          onLikedChange: set,
          lyricsActive: true,
          onLyricsChange: set,
          onQueueChange: set,
          deviceName: 'Living Room Speaker',
          onDevicePress: press,
          volume: 0.6,
          onVolumeChange: set,
          onMutedChange: set,
          onFullscreenPress: press,
        }),
      ),
    bloom: () => (
      <NowPlayingBar
        track={TRACK}
        transport={TRANSPORT}
        position={42}
        duration={214}
        buffered={120}
        onSeek={set}
        liked
        onLikedChange={set}
        lyricsActive
        onLyricsChange={set}
        onQueueChange={set}
        deviceName="Living Room Speaker"
        onDevicePress={press}
        volume={0.6}
        onVolumeChange={set}
        onMutedChange={set}
        onFullscreenPress={press}
      />
    ),
  },
  {
    name: 'NowPlayingBar with a device picker',
    language: () =>
      toElement(
        L.NowPlayingBar(EPISODE, {
          transport: { playing: false, onPlayPause: press },
          position: 0,
          duration: 3600,
          devicePicker: L.Text('Devices'),
          devicePickerOpen: false,
          onDevicePickerOpenChange: set,
        }),
      ),
    bloom: () => (
      <NowPlayingBar
        track={EPISODE}
        transport={{ playing: false, onPlayPause: press }}
        position={0}
        duration={3600}
        devicePicker={<Text>Devices</Text>}
        devicePickerOpen={false}
        onDevicePickerOpenChange={set}
      />
    ),
  },
  {
    name: 'MiniPlayer',
    language: () =>
      toElement(
        L.MiniPlayer(TRACK, {
          playing: true,
          onPlayPause: press,
          position: 42,
          duration: 214,
          artworkColor: '#3A6EA5',
          liked: false,
          onLikedChange: set,
          deviceName: 'Living Room Speaker',
          onNext: press,
        }).onPress(press),
      ),
    bloom: () => (
      <MiniPlayer
        track={TRACK}
        playing
        onPlayPause={press}
        position={42}
        duration={214}
        artworkColor="#3A6EA5"
        liked={false}
        onLikedChange={set}
        deviceName="Living Room Speaker"
        onNext={press}
        onPress={press}
      />
    ),
  },
  {
    name: 'FullScreenPlayer',
    language: () =>
      toElement(
        L.FullScreenPlayer(TRACK, {
          artworkColor: '#8B3A62',
          contextLabel: 'Playing from playlist',
          contextName: 'Night drive',
          onCollapse: press,
          onMore: press,
          liked: true,
          onLikedChange: set,
          transport: TRANSPORT,
          position: 42,
          duration: 214,
          onSeek: set,
          deviceName: 'Living Room Speaker',
          onDevicePress: press,
          onShare: press,
          onQueuePress: press,
          lyrics: { lines: ['The road hums low', 'and the lights go by'], activeIndex: 0 },
          aboutArtist: L.Text('Marlow Vance writes at night.'),
        }),
      ),
    bloom: () => (
      <FullScreenPlayer
        track={TRACK}
        artworkColor="#8B3A62"
        contextLabel="Playing from playlist"
        contextName="Night drive"
        onCollapse={press}
        onMore={press}
        liked
        onLikedChange={set}
        transport={TRANSPORT}
        position={42}
        duration={214}
        onSeek={set}
        deviceName="Living Room Speaker"
        onDevicePress={press}
        onShare={press}
        onQueuePress={press}
        lyrics={{ lines: ['The road hums low', 'and the lights go by'], activeIndex: 0 }}
        aboutArtist={<Text>Marlow Vance writes at night.</Text>}
      />
    ),
  },
  ...ENUMS.transportSize.map((size) => ({
    name: `PlaybackSpeedMenu ${size}`,
    language: () => toElement(L.PlaybackSpeedMenu([1.5, set], { label: 'Speed' }).size(size)),
    bloom: () => <PlaybackSpeedMenu rate={1.5} onRateChange={set} label="Speed" size={size} />,
  })),
  {
    name: 'PlaybackSpeedMenu disabled, a trigger of its own',
    language: () =>
      toElement(L.PlaybackSpeedMenu([1, set], { trigger: L.Text('Speed') }).disabled()),
    bloom: () => (
      <PlaybackSpeedMenu rate={1} onRateChange={set} disabled>
        <Text>Speed</Text>
      </PlaybackSpeedMenu>
    ),
  },
  ...ENUMS.transportSize.map((size) => ({
    name: `SleepTimerMenu ${size}`,
    language: () => toElement(L.SleepTimerMenu([15, set], { remaining: '14:32' }).size(size)),
    bloom: () => <SleepTimerMenu value={15} onValueChange={set} remaining="14:32" size={size} />,
  })),
  {
    name: 'SleepTimerMenu off, disabled',
    language: () => toElement(L.SleepTimerMenu(['off', set]).disabled()),
    bloom: () => <SleepTimerMenu value="off" onValueChange={set} disabled />,
  },
  {
    name: 'DevicePicker',
    language: () =>
      toElement(
        L.DevicePicker(DEVICES[0]!, DEVICES, {
          onSelect: set,
          onHelpPress: press,
          helpLabel: 'Don’t see your device?',
        }),
      ),
    bloom: () => (
      <DevicePicker
        current={DEVICES[0]!}
        devices={DEVICES}
        onSelect={set}
        onHelpPress={press}
        helpLabel="Don’t see your device?"
      />
    ),
  },
  {
    name: 'ConnectBanner',
    language: () =>
      toElement(L.ConnectBanner('Living Room Speaker', { kind: 'speaker' }).onPress(press)),
    bloom: () => <ConnectBanner deviceName="Living Room Speaker" kind="speaker" onPress={press} />,
  },
];

export const MEDIA_PLAYER_CASES: ParityCase[] = [...transport, ...players];
