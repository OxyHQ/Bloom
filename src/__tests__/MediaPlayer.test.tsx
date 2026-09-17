/**
 * @jest-environment jsdom
 *
 * The player family, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: toggle state attributes, names, the repeat
 * cycle, the speed / sleep selections, the collapse steps, and the artwork
 * tint's contrast guarantee and fallback.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { MenuSurfaceProvider } from '../floating/context';
import { resolveMenuPalette } from '../floating/menu-palette';
import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiArrowGoForwardLine } from '../icons/remix/RiArrowGoForwardLine';
import { RiForward30Line } from '../icons/remix/RiForward30Line';
import { RiReplay15Line } from '../icons/remix/RiReplay15Line';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import { contrastRatio } from '../styles/color-contrast';
import {
  ConnectBanner,
  DevicePicker,
  FullScreenPlayer,
  MiniPlayer,
  nextRepeatMode,
  NowPlayingBar,
  resolveArtworkTint,
  TransportControls,
} from '../media-player';
import { immersiveDarkTheme } from '../media-player/ImmersiveTheme';
import { resolveMiniPlayerSurface } from '../media-player/MiniPlayer';
import { nowPlayingBarLayout, NOW_PLAYING_BAR_HEIGHT } from '../media-player/NowPlayingBar';
import { PlaybackSpeedRows } from '../media-player/PlaybackSpeedMenu';
import {
  formatPlaybackRate,
  parseSleepTimerKey,
  sleepTimerKey,
} from '../media-player/shared';
import { AA_TEXT_CONTRAST, darken } from '../styles/color-contrast';
import { SleepTimerRows } from '../media-player/SleepTimerMenu';
import { skipGlyphFor } from '../media-player/TransportControls';
import type { PlaybackDevice, RepeatMode } from '../media-player/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom lays nothing out, so the bar's width comes from the window seed:
// react-native-web reads it from `documentElement.clientWidth` (0 in jsdom).
Object.defineProperty(document.documentElement, 'clientWidth', { value: 1280, configurable: true });
Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function queryTestId(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

const noop = () => {};

describe('repeat cycle', () => {
  it('goes off → all → one → off', () => {
    expect(nextRepeatMode('off')).toBe('all');
    expect(nextRepeatMode('all')).toBe('one');
    expect(nextRepeatMode('one')).toBe('off');
  });

  it('the repeat button reports the NEXT mode and carries aria-pressed + the right name', () => {
    const onRepeatChange = jest.fn();
    const cases: [RepeatMode, string, string, RepeatMode][] = [
      ['off', 'false', 'Repeat', 'all'],
      ['all', 'true', 'Repeat', 'one'],
      ['one', 'true', 'Repeat one', 'off'],
    ];
    for (const [mode, pressed, name, next] of cases) {
      mount(
        <TransportControls
          playing={false}
          onPlayPause={noop}
          repeat={mode}
          onRepeatChange={onRepeatChange}
          testID="t"
        />,
      );
      const el = byTestId('t-repeat');
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('aria-pressed')).toBe(pressed);
      expect(el.getAttribute('aria-label')).toBe(name);
      // Accent + dot exactly when on.
      expect(queryTestId('t-repeat-dot') !== null).toBe(pressed === 'true');
      act(() => el.click());
      expect(onRepeatChange).toHaveBeenLastCalledWith(next);
    }
  });
});

describe('TransportControls', () => {
  it('shuffle is a toggle painted accent when on', () => {
    const onShuffleChange = jest.fn();
    mount(<TransportControls playing={false} onPlayPause={noop} shuffle onShuffleChange={onShuffleChange} testID="t" />);
    const el = byTestId('t-shuffle');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    const accent = resolveMediaControlsPaint(theme).accent;
    expect(el.querySelector('path')?.getAttribute('fill')).toBe(accent);
    act(() => el.click());
    expect(onShuffleChange).toHaveBeenCalledWith(false);

    mount(<TransportControls playing={false} onPlayPause={noop} shuffle={false} onShuffleChange={noop} testID="t" />);
    expect(byTestId('t-shuffle').getAttribute('aria-pressed')).toBe('false');
    expect(queryTestId('t-shuffle-dot')).toBeNull();
  });

  it('previous / next / play are plain buttons: no aria-pressed, names from labels', () => {
    const onPlayPause = jest.fn();
    const onNext = jest.fn();
    mount(
      <TransportControls
        playing
        onPlayPause={onPlayPause}
        onPrevious={noop}
        onNext={onNext}
        subject="Glass Harbour Lights"
        labels={{ next: 'Siguiente' }}
        testID="t"
      />,
    );
    expect(byTestId('t-previous').getAttribute('aria-label')).toBe('Previous');
    expect(byTestId('t-previous').hasAttribute('aria-pressed')).toBe(false);
    expect(byTestId('t-next').getAttribute('aria-label')).toBe('Siguiente');
    expect(byTestId('t-play').getAttribute('aria-label')).toBe('Pause Glass Harbour Lights');
    act(() => byTestId('t-next').click());
    act(() => byTestId('t-play').click());
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('disables previous without a handler or with previousDisabled', () => {
    mount(<TransportControls playing={false} onPlayPause={noop} onNext={noop} testID="t" />);
    expect(byTestId('t-previous').getAttribute('aria-disabled')).toBe('true');
    mount(<TransportControls playing={false} onPlayPause={noop} onPrevious={noop} previousDisabled testID="t" />);
    expect(byTestId('t-previous').getAttribute('aria-disabled')).toBe('true');
  });

  it('draws the play button at 32 / 48 / 56 for compact / regular / large', () => {
    for (const [size, px] of [['compact', 32], ['regular', 48], ['large', 56]] as const) {
      mount(<TransportControls size={size} playing={false} onPlayPause={noop} testID="t" />);
      expect(byTestId('t-play').style.width).toBe(`${px}px`);
    }
  });

  it('podcast: skip buttons name their seconds, speed trigger shows the rate', () => {
    const onSkipBack = jest.fn();
    mount(
      <TransportControls
        variant="podcast"
        playing={false}
        onPlayPause={noop}
        onSkipBack={onSkipBack}
        onSkipForward={noop}
        skipForwardSeconds={45}
        playbackRate={1.5}
        onPlaybackRateChange={noop}
        testID="t"
      />,
    );
    expect(byTestId('t-skip-back').getAttribute('aria-label')).toBe('Back 15 seconds');
    expect(byTestId('t-skip-forward').getAttribute('aria-label')).toBe('Forward 45 seconds');
    expect(byTestId('t-speed-trigger').textContent).toBe('1.5×');
    // Not 1×: lit.
    expect(queryTestId('t-speed-trigger-dot')).not.toBeNull();
    act(() => byTestId('t-skip-back').click());
    expect(onSkipBack).toHaveBeenCalledTimes(1);
    expect(queryTestId('t-shuffle')).toBeNull();
  });

  it('uses the numbered skip glyphs for 5/10/15/30 and a plain arrow otherwise', () => {
    expect(skipGlyphFor('back', 15)).toBe(RiReplay15Line);
    expect(skipGlyphFor('forward', 30)).toBe(RiForward30Line);
    expect(skipGlyphFor('back', 20)).toBe(RiArrowGoBackLine);
    expect(skipGlyphFor('forward', 45)).toBe(RiArrowGoForwardLine);
  });
});

describe('PlaybackSpeedMenu rows', () => {
  function renderRows(ui: React.ReactElement) {
    mount(<MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'dropdown' }}>{ui}</MenuSurfaceProvider>);
  }

  it('marks the current rate checked and reports a pressed rate as a number', () => {
    const onRateChange = jest.fn();
    renderRows(<PlaybackSpeedRows rate={1.25} onRateChange={onRateChange} testID="s" />);
    expect(byTestId('s-rate-1.25').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('s-rate-1').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('s-rate-0.5').textContent).toBe('0.5×');
    expect(byTestId('s-rate-3')).toBeTruthy();
    act(() => byTestId('s-rate-2').click());
    expect(onRateChange).toHaveBeenCalledWith(2);
  });

  it('formats rates without trailing zeros', () => {
    expect(formatPlaybackRate(1)).toBe('1×');
    expect(formatPlaybackRate(0.75)).toBe('0.75×');
    expect(formatPlaybackRate(2.5)).toBe('2.5×');
  });
});

describe('SleepTimerMenu rows', () => {
  function renderRows(ui: React.ReactElement) {
    mount(<MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'dropdown' }}>{ui}</MenuSurfaceProvider>);
  }

  it('offers Off, the minutes and the end, checks the current value and reports the choice', () => {
    const onValueChange = jest.fn();
    renderRows(
      <SleepTimerRows value={15} onValueChange={onValueChange} remaining="12:04" testID="z" />,
    );
    expect(byTestId('z-min-15').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('z-off').getAttribute('aria-checked')).toBe('false');
    for (const m of [5, 10, 30, 45, 60]) expect(byTestId(`z-min-${m}`)).toBeTruthy();
    expect(byTestId('z-end').textContent).toBe('End of episode');
    expect(container.textContent).toContain('Stops in 12:04');

    act(() => byTestId('z-end').click());
    expect(onValueChange).toHaveBeenLastCalledWith('end');
    act(() => byTestId('z-min-45').click());
    expect(onValueChange).toHaveBeenLastCalledWith(45);
    act(() => byTestId('z-off').click());
    expect(onValueChange).toHaveBeenLastCalledWith('off');
  });

  it('round-trips values through menu keys', () => {
    for (const v of ['off', 'end', 5, 60] as const) expect(parseSleepTimerKey(sleepTimerKey(v))).toBe(v);
    expect(parseSleepTimerKey('garbage')).toBe('off');
  });
});

const TRACK = {
  title: 'Glass Harbour Lights',
  artists: [{ id: 'a', name: 'Marlow Vance' }, { id: 'b', name: 'The Tessel Choir' }],
};

describe('NowPlayingBar', () => {
  it('collapses at 1024 and 768', () => {
    expect(nowPlayingBarLayout(1280)).toBe('wide');
    expect(nowPlayingBarLayout(1024)).toBe('wide');
    expect(nowPlayingBarLayout(1023)).toBe('medium');
    expect(nowPlayingBarLayout(768)).toBe('medium');
    expect(nowPlayingBarLayout(767)).toBe('narrow');
  });

  it('is 80 tall; lyrics and queue are aria-pressed toggles reporting the next state', () => {
    const onLyricsChange = jest.fn();
    const onQueueChange = jest.fn();
    const onArtistPress = jest.fn();
    mount(
      <NowPlayingBar
        track={TRACK}
        onArtistPress={onArtistPress}
        transport={{ playing: false, onPlayPause: noop }}
        position={10}
        duration={200}
        lyricsActive
        onLyricsChange={onLyricsChange}
        queueActive={false}
        onQueueChange={onQueueChange}
        onDevicePress={noop}
        deviceName="Living Room Speaker"
        onFullscreenPress={noop}
        volume={0.5}
        onVolumeChange={noop}
        testID="bar"
      />,
    );
    expect(byTestId('bar').style.height).toBe(`${NOW_PLAYING_BAR_HEIGHT}px`);
    const lyrics = byTestId('bar-lyrics');
    expect(lyrics.getAttribute('aria-pressed')).toBe('true');
    expect(lyrics.getAttribute('aria-label')).toBe('Lyrics');
    act(() => lyrics.click());
    expect(onLyricsChange).toHaveBeenCalledWith(false);
    const queue = byTestId('bar-queue');
    expect(queue.getAttribute('aria-pressed')).toBe('false');
    act(() => queue.click());
    expect(onQueueChange).toHaveBeenCalledWith(true);

    // The device button is lit while casting and says where.
    expect(byTestId('bar-devices').getAttribute('aria-label')).toBe('Connect to a device, Living Room Speaker');
    expect(queryTestId('bar-devices-dot')).not.toBeNull();

    // The compact transport and the play button's subject.
    expect(byTestId('bar-transport-play').getAttribute('aria-label')).toBe('Play Glass Harbour Lights');
    expect(byTestId('bar-progress')).toBeTruthy();

    // Artist credits are links reporting the credit and its index.
    const artist = byTestId('bar-track-artist-1');
    expect(artist.getAttribute('role')).toBe('link');
    act(() => artist.click());
    expect(onArtistPress).toHaveBeenCalledWith(TRACK.artists[1], 1);
  });
});

describe('artwork tint contrast', () => {
  it('measures WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(contrastRatio('nope', '#fff')).toBe(1);
  });

  it('falls back (null) for an absent or unparseable colour', () => {
    expect(resolveArtworkTint(undefined, '#fafafa', '#a3a3a3').background).toBeNull();
    expect(resolveArtworkTint('not-a-colour', '#fafafa', '#a3a3a3').background).toBeNull();
  });

  it('keeps a dark colour as given and darkens a pale one until both foregrounds hold 4.5:1', () => {
    const dark = resolveArtworkTint('#1B2A4A', '#fafafa', '#a3a3a3');
    expect(dark.background).toBe('#1b2a4a');
    expect(dark.darkened).toBe(0);

    for (const pale of ['#FFFFFF', '#F4E3A1', '#9FE3C5', '#FF7A59']) {
      const tint = resolveArtworkTint(pale, '#fafafa', '#a3a3a3');
      expect(tint.darkened).toBeGreaterThan(0);
      expect(contrastRatio(tint.background as string, '#fafafa')).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
      expect(contrastRatio(tint.background as string, '#a3a3a3')).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
      // …and stops at the FIRST step that holds, rather than going to black.
      const lighter = darken(pale, tint.darkened - 0.05) as string;
      expect(
        Math.min(contrastRatio(lighter, '#fafafa'), contrastRatio(lighter, '#a3a3a3')),
      ).toBeLessThan(AA_TEXT_CONTRAST);
    }
  });
});

describe('MiniPlayer', () => {
  it('paints the contrast-safe tint and draws its content with the dark theme', () => {
    mount(
      <MiniPlayer
        track={TRACK}
        playing={false}
        onPlayPause={noop}
        position={50}
        duration={200}
        artworkColor="#F4E3A1"
        testID="m"
      />,
    );
    const surface = resolveMiniPlayerSurface(theme, 'teal', '#F4E3A1');
    expect(surface.tinted).toBe(true);
    expect(byTestId('m').style.backgroundColor).toBe(normalise(surface.background));
    const dark = immersiveDarkTheme(theme, 'teal');
    const darkText = resolveMediaControlsPaint(dark).text;
    expect(contrastRatio(surface.background, darkText)).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
    // The 2px line: 50 of 200 = 25%, in the dark theme's text colour.
    const fill = byTestId('m-progress-fill');
    expect(fill.style.width).toBe('25%');
    expect(fill.style.backgroundColor).toBe(normalise(darkText));
    expect(byTestId('m-progress').style.height).toBe('2px');
  });

  it('falls back to the floating surface under the app theme without a colour', () => {
    mount(<MiniPlayer track={TRACK} playing onPlayPause={noop} position={0} duration={0} testID="m" />);
    const menu = resolveMenuPalette(theme);
    expect(byTestId('m').style.backgroundColor).toBe(normalise(menu.surface));
    expect(byTestId('m-progress-fill').style.width).toBe('0%');
  });

  it('is one open button plus sibling like and play; the device replaces the artist line', () => {
    const onPress = jest.fn();
    const onLikedChange = jest.fn();
    mount(
      <MiniPlayer
        track={TRACK}
        playing
        onPlayPause={noop}
        onPress={onPress}
        position={0}
        duration={100}
        liked={false}
        onLikedChange={onLikedChange}
        deviceName="Den TV"
        testID="m"
      />,
    );
    const open = byTestId('m-open');
    expect(open.getAttribute('aria-label')).toBe('Open player: Glass Harbour Lights, Marlow Vance, The Tessel Choir');
    expect(open.contains(byTestId('m-like'))).toBe(false);
    expect(open.textContent).toContain('Den TV');
    expect(byTestId('m-device')).toBeTruthy();
    expect(byTestId('m-progress').getAttribute('aria-hidden')).toBe('true');
    act(() => open.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(byTestId('m-like').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('m-play').getAttribute('aria-label')).toBe('Pause Glass Harbour Lights');
  });
});

describe('FullScreenPlayer', () => {
  it('is dark in a light app, keeps the chrome named, and draws the below-the-fold cards', () => {
    const onCollapse = jest.fn();
    const onLyrics = jest.fn();
    mount(
      <FullScreenPlayer
        track={TRACK}
        artworkColor="#3A6EA5"
        contextLabel="Playing from playlist"
        contextName="Night Drive"
        onCollapse={onCollapse}
        onMore={noop}
        transport={{ playing: true, onPlayPause: noop, onShuffleChange: noop, shuffle: true }}
        position={30}
        duration={200}
        onQueuePress={noop}
        queueActive
        onShare={noop}
        lyrics={{ lines: ['One', 'Two'], activeIndex: 1, onPress: onLyrics }}
        testID="f"
      />,
    );
    expect(theme.isDark).toBe(false);
    const dark = immersiveDarkTheme(theme, 'teal');
    expect(dark.isDark).toBe(true);
    // The title is drawn in the DARK theme's text colour.
    expect(byTestId('f-track-title').style.color).toBe(normalise(dark.colors.text));

    expect(byTestId('f-collapse').getAttribute('aria-label')).toBe('Close player');
    act(() => byTestId('f-collapse').click());
    expect(onCollapse).toHaveBeenCalled();
    expect(byTestId('f-top-bar').textContent).toContain('Night Drive');
    expect(byTestId('f-queue').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('f-transport-play').style.width).toBe('56px');
    act(() => byTestId('f-lyrics').click());
    expect(onLyrics).toHaveBeenCalled();
  });

  it('keeps the app accent when the outer theme is not the plain preset', () => {
    const light = buildTheme('teal', 'light');
    const branded = { ...light, colors: { ...light.colors, primary: '#E0457B' } };
    expect(immersiveDarkTheme(branded, 'teal').colors.primary).toBe('#E0457B');
    expect(immersiveDarkTheme(light, 'teal').colors.primary).toBe(buildTheme('teal', 'dark').colors.primary);
  });
});

describe('DevicePicker', () => {
  const current: PlaybackDevice = { id: 'this', name: 'This computer', kind: 'computer' };
  const devices: PlaybackDevice[] = [
    current,
    { id: 'living', name: 'Living Room Speaker', kind: 'speaker', description: 'Wi-Fi' },
    { id: 'car', name: 'Hatchback', kind: 'car', disabled: true },
  ];

  it('shows the current device as a non-button and every other device as a named button', () => {
    const onSelect = jest.fn();
    const onHelpPress = jest.fn();
    mount(<DevicePicker current={current} devices={devices} onSelect={onSelect} onHelpPress={onHelpPress} testID="d" />);
    const cur = byTestId('d-current');
    expect(cur.getAttribute('role')).toBeNull();
    expect(cur.textContent).toContain('Listening on');
    expect(queryTestId('d-device-this')).toBeNull();

    const living = byTestId('d-device-living');
    expect(living.getAttribute('role')).toBe('button');
    expect(living.getAttribute('aria-label')).toBe('Living Room Speaker, Wi-Fi');
    act(() => living.click());
    expect(onSelect).toHaveBeenCalledWith(devices[1]);

    expect(byTestId('d-device-car').getAttribute('aria-disabled')).toBe('true');
    act(() => byTestId('d-device-car').click());
    expect(onSelect).toHaveBeenCalledTimes(1);

    act(() => byTestId('d-help').click());
    expect(onHelpPress).toHaveBeenCalled();
  });

  it('says so when there is nothing else', () => {
    mount(<DevicePicker current={current} devices={[current]} onSelect={noop} testID="d" />);
    expect(container.textContent).toContain('No other devices found');
  });
});

describe('ConnectBanner', () => {
  it('is a 28-tall accent strip; a button named by its sentence when pressable', () => {
    const onPress = jest.fn();
    mount(<ConnectBanner deviceName="Living Room Speaker" onPress={onPress} testID="c" />);
    const el = byTestId('c');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('Listening on Living Room Speaker');
    act(() => el.click());
    expect(onPress).toHaveBeenCalled();
    const strip = el.firstElementChild as HTMLElement;
    expect(strip.style.height).toBe('28px');
    expect(strip.style.backgroundColor).toBe(normalise(resolveMediaControlsPaint(theme).accent));

    mount(<ConnectBanner deviceName="Den TV" testID="c" />);
    expect(byTestId('c').getAttribute('role')).toBeNull();
    expect(byTestId('c').textContent).toBe('Listening on Den TV');
  });
});
