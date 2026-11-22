import {
  ConnectBanner as BloomConnectBanner,
  type ConnectBannerProps,
  DevicePicker as BloomDevicePicker,
  type DevicePickerProps,
  FullScreenPlayer as BloomFullScreenPlayer,
  type FullScreenPlayerProps,
  type MediaPlayerTrack,
  MiniPlayer as BloomMiniPlayer,
  type MiniPlayerProps,
  NowPlayingBar as BloomNowPlayingBar,
  type NowPlayingBarProps,
  type PlaybackDevice,
  PlaybackSpeedMenu as BloomPlaybackSpeedMenu,
  type PlaybackSpeedMenuProps,
  SleepTimerMenu as BloomSleepTimerMenu,
  type SleepTimerMenuProps,
  type SleepTimerValue,
  TransportControls as BloomTransportControls,
  type TransportControlsProps,
} from '@oxy.so/bloom/media-player';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { TransportSize, TransportStyle } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product, slot } from './product';

/** The transport row, the players, the speed and sleep-timer menus, the device picker and its banner. */
export type MediaPlayerKind =
  | 'transportControls'
  | 'nowPlayingBar'
  | 'miniPlayer'
  | 'fullScreenPlayer'
  | 'playbackSpeedMenu'
  | 'sleepTimerMenu'
  | 'devicePicker'
  | 'connectBanner';

type Drawn = 'style' | 'testID';

/** Bloom `TransportControls`' data (its play/pause handler, the skips, shuffle and repeat); its `trailing` is a language child. */
export type TransportControlsOptions = Omit<
  TransportControlsProps,
  Drawn | 'playing' | 'size' | 'variant' | 'loading' | 'disabled' | 'trailing'
> & { readonly trailing?: Child };
/** Bloom `NowPlayingBar`'s data (its transport, position and duration); its `devicePicker` is a language child. */
export type NowPlayingBarOptions = Omit<NowPlayingBarProps, Drawn | 'track' | 'devicePicker'> & {
  readonly devicePicker?: Child;
};
/** Bloom `MiniPlayer`'s data; `.onPress()` opens the full player. */
export type MiniPlayerOptions = Omit<MiniPlayerProps, Drawn | 'track' | 'onPress'>;
/** Bloom `FullScreenPlayer`'s data; its `aboutArtist` is a language child. */
export type FullScreenPlayerOptions = Omit<
  FullScreenPlayerProps,
  Drawn | 'track' | 'aboutArtist'
> & { readonly aboutArtist?: Child };
/** A menu's data; its `trigger` (Bloom's children) is a language child. */
type MenuOptions<P> = Omit<
  P,
  'testID' | 'size' | 'disabled' | 'children' | 'rate' | 'onRateChange' | 'value' | 'onValueChange'
> & { readonly trigger?: Child };
export type PlaybackSpeedMenuOptions = MenuOptions<PlaybackSpeedMenuProps>;
export type SleepTimerMenuOptions = MenuOptions<SleepTimerMenuProps>;
export type DevicePickerOptions = Omit<DevicePickerProps, Drawn | 'current' | 'devices'>;
/** Bloom `ConnectBanner`'s data; `.onPress()` opens the device picker. */
export type ConnectBannerOptions = Omit<ConnectBannerProps, Drawn | 'deviceName' | 'onPress'>;

/** A control of the transport's size: `sm`, `md` (default) or `lg`. */
interface Sized<V> extends ViewModifiers<V> {
  size(value: TransportSize): V;
  disabled(value?: boolean): V;
}
export interface TransportControlsView extends Sized<TransportControlsView> {
  /** `music` (default) or `podcast`. */
  style(value: TransportStyle): TransportControlsView;
  /** The play button shows its spinner. */
  loading(value?: boolean): TransportControlsView;
}
export type NowPlayingBarView = ViewModifiers<NowPlayingBarView>;
export type MiniPlayerView = ViewModifiers<MiniPlayerView>;
export type FullScreenPlayerView = ViewModifiers<FullScreenPlayerView>;
export type PlaybackSpeedMenuView = Sized<PlaybackSpeedMenuView>;
export type SleepTimerMenuView = Sized<SleepTimerMenuView>;
export type DevicePickerView = ViewModifiers<DevicePickerView>;
export type ConnectBannerView = ViewModifiers<ConnectBannerView>;

export function TransportControls(
  playing: boolean,
  options: TransportControlsOptions,
): TransportControlsView {
  return new Node('transportControls', { playing, options }, []);
}
export function NowPlayingBar(
  track: MediaPlayerTrack,
  options: NowPlayingBarOptions,
): NowPlayingBarView {
  return new Node('nowPlayingBar', { track, options }, []);
}
export function MiniPlayer(track: MediaPlayerTrack, options: MiniPlayerOptions): MiniPlayerView {
  return new Node('miniPlayer', { track, options }, []);
}
export function FullScreenPlayer(
  track: MediaPlayerTrack,
  options: FullScreenPlayerOptions,
): FullScreenPlayerView {
  return new Node('fullScreenPlayer', { track, options }, []);
}
/** The playback speed its binding holds. */
export function PlaybackSpeedMenu(
  rate: Binding<number>,
  options: PlaybackSpeedMenuOptions = {},
): PlaybackSpeedMenuView {
  return new Node('playbackSpeedMenu', { binding: rate, options }, []);
}
/** The sleep timer its binding holds. */
export function SleepTimerMenu(
  value: Binding<SleepTimerValue>,
  options: SleepTimerMenuOptions = {},
): SleepTimerMenuView {
  return new Node('sleepTimerMenu', { binding: value, options }, []);
}
export function DevicePicker(
  current: PlaybackDevice,
  devices: PlaybackDevice[],
  options: DevicePickerOptions,
): DevicePickerView {
  return new Node('devicePicker', { current, devices, options }, []);
}
export function ConnectBanner(
  deviceName: string,
  options: ConnectBannerOptions = {},
): ConnectBannerView {
  return new Node('connectBanner', { deviceName, options }, []);
}

/** A sized control's size and whether it is disabled. */
function sized(d: ControlDraw): Record<string, unknown> {
  return { size: d.own('size')?.value, disabled: d.own('disabled')?.value };
}

/** A menu: its binding, its size, and its trigger as Bloom's children. */
function menu(host: unknown, binding: readonly [string, string]): ControlRenderer {
  return product(host, {
    binding,
    own: (d) => {
      const { trigger } = (d.node.props as { options: { trigger?: Child } }).options;
      return { ...sized(d), trigger: undefined, children: slot(d, trigger) };
    },
  });
}

export const MEDIA_PLAYERS: Record<MediaPlayerKind, ControlRenderer> = {
  transportControls: product(BloomTransportControls, {
    slots: ['trailing'],
    own: (d) => ({
      ...sized(d),
      variant: d.own('style')?.value,
      loading: d.own('loading')?.value,
    }),
  }),
  nowPlayingBar: product(BloomNowPlayingBar, { slots: ['devicePicker'] }),
  miniPlayer: product(BloomMiniPlayer, { press: true }),
  fullScreenPlayer: product(BloomFullScreenPlayer, { slots: ['aboutArtist'] }),
  playbackSpeedMenu: menu(BloomPlaybackSpeedMenu, ['rate', 'onRateChange']),
  sleepTimerMenu: menu(BloomSleepTimerMenu, ['value', 'onValueChange']),
  devicePicker: product(BloomDevicePicker),
  connectBanner: product(BloomConnectBanner, { press: true }),
};
