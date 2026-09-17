/**
 * @jest-environment jsdom
 *
 * The media controls, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: names, state attributes, slider values,
 * colours and the seek callbacks.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  ExplicitBadge,
  formatDuration,
  LikeButton,
  NowPlayingIndicator,
  PlayButton,
  PlaybackProgress,
  VolumeControl,
} from '../media-controls';
import { valueAtPosition } from '../media-controls/MediaTrack';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import { volumeIconFor } from '../media-controls/VolumeControl';
import { RiVolumeDownLine } from '../icons/remix/RiVolumeDownLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

function key(el: HTMLElement, k: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  });
}

describe('formatDuration', () => {
  it('draws m:ss under an hour and h:mm:ss from an hour', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(83)).toBe('1:23');
    expect(formatDuration(225)).toBe('3:45');
    expect(formatDuration(599.9)).toBe('9:59');
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(36000)).toBe('10:00:00');
  });

  it('draws 0:00 for negative, NaN and infinite input', () => {
    expect(formatDuration(-4)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('PlayButton', () => {
  it('is a button named by its action, with the subject, and no pressed state', () => {
    mount(<PlayButton playing={false} subject="Night Drive" testID="p" />);
    const el = byTestId('p');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('Play Night Drive');
    expect(el.hasAttribute('aria-pressed')).toBe(false);

    mount(<PlayButton playing subject="Night Drive" testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Pause Night Drive');
    expect(byTestId('p').hasAttribute('aria-pressed')).toBe(false);
  });

  it('takes translated labels and a full override', () => {
    mount(<PlayButton playing={false} playLabel="Reproducir" testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Reproducir');
    mount(<PlayButton playing accessibilityLabel="Pause the album" subject="x" testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Pause the album');
  });

  it('draws the sizes 32 / 48 / 56 as circles', () => {
    for (const [size, px] of [['small', 32], ['medium', 48], ['large', 56]] as const) {
      mount(<PlayButton playing={false} size={size} testID="p" />);
      const style = byTestId('p').style;
      expect(style.width).toBe(`${px}px`);
      expect(style.height).toBe(`${px}px`);
    }
  });

  it('paints accent, inverse and plain from the theme', () => {
    mount(<PlayButton playing={false} testID="p" />);
    const paint = resolveMediaControlsPaint(theme);
    expect(byTestId('p').style.backgroundColor).toBe(normalise(paint.accent));
    mount(<PlayButton playing={false} variant="inverse" testID="p" />, 'dark');
    expect(byTestId('p').style.backgroundColor).toBe(normalise(resolveMediaControlsPaint(theme).inverse));
    mount(<PlayButton playing={false} variant="plain" testID="p" />);
    expect(byTestId('p').style.backgroundColor).toBe('');
  });

  it('marks loading busy, and presses', () => {
    const onPress = jest.fn();
    mount(<PlayButton playing={false} loading onPress={onPress} testID="p" />);
    expect(byTestId('p').getAttribute('aria-busy')).toBe('true');
    act(() => byTestId('p').click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks disabled and does not press', () => {
    const onPress = jest.fn();
    mount(<PlayButton playing={false} disabled onPress={onPress} testID="p" />);
    expect(byTestId('p').getAttribute('aria-disabled')).toBe('true');
    act(() => byTestId('p').click());
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('LikeButton', () => {
  it('is a toggle: aria-pressed plus a name that says what pressing does', () => {
    const onLikedChange = jest.fn();
    mount(<LikeButton liked={false} onLikedChange={onLikedChange} testID="l" />);
    const el = byTestId('l');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.getAttribute('aria-label')).toBe('Save to Your Library');
    act(() => el.click());
    expect(onLikedChange).toHaveBeenCalledWith(true);

    mount(<LikeButton liked onLikedChange={onLikedChange} testID="l" />);
    expect(byTestId('l').getAttribute('aria-pressed')).toBe('true');
    // The name is fixed; the state is aria-pressed.
    expect(byTestId('l').getAttribute('aria-label')).toBe('Save to Your Library');
    act(() => byTestId('l').click());
    expect(onLikedChange).toHaveBeenLastCalledWith(false);
  });

  it('keeps a hit area of at least 32 and paints the liked heart in the accent or activeColor', () => {
    mount(<LikeButton size="small" liked onLikedChange={() => {}} testID="l" />);
    expect(byTestId('l').style.width).toBe('32px');
    const accent = resolveMediaControlsPaint(theme).accent;
    const path = () => byTestId('l').querySelector('path');
    expect(path()?.getAttribute('fill')).toBe(accent);

    mount(<LikeButton size="large" liked onLikedChange={() => {}} activeColor="#E0457B" testID="l" />);
    expect(byTestId('l').style.width).toBe('40px');
    expect(path()?.getAttribute('fill')).toBe('#E0457B');
  });

  it('takes translated labels', () => {
    mount(<LikeButton liked={false} accessibilityLabel="Guardar" onLikedChange={() => {}} testID="l" />);
    expect(byTestId('l').getAttribute('aria-label')).toBe('Guardar');
  });
});

describe('ExplicitBadge', () => {
  it('is one named image, a 16 square with a small radius', () => {
    mount(<ExplicitBadge testID="e" />);
    const el = byTestId('e');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Explicit');
    expect(el.textContent).toBe('E');
    expect(el.style.width).toBe('16px');
    expect(el.style.borderTopLeftRadius || el.style.borderRadius).toBe('3px');
    mount(<ExplicitBadge size="small" label="Explícito" testID="e" />);
    expect(byTestId('e').style.width).toBe('14px');
    expect(byTestId('e').getAttribute('aria-label')).toBe('Explícito');
  });
});

describe('NowPlayingIndicator', () => {
  it('is a named image of 4 (or 3) bars', () => {
    mount(<NowPlayingIndicator testID="n" />);
    const el = byTestId('n');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Now playing');
    expect(el.children).toHaveLength(4);
    // The bars are reanimated views, a bare host in the jest mock — their paint is
    // verified in the browser (Base/Media Controls), not here.

    mount(<NowPlayingIndicator bars={3} playing={false} size={24} testID="n" />);
    expect(byTestId('n').children).toHaveLength(3);
    expect(byTestId('n').style.width).toBe('24px');
  });
});

describe('PlaybackProgress', () => {
  it('is a slider with seconds as its value and "1:23 of 3:45" as its text', () => {
    mount(<PlaybackProgress value={83} duration={225} testID="s" />);
    const el = byTestId('s-track');
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('aria-label')).toBe('Seek');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('225');
    expect(el.getAttribute('aria-valuenow')).toBe('83');
    expect(el.getAttribute('aria-valuetext')).toBe('1:23 of 3:45');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('draws the fill and buffered segment as fractions of the duration', () => {
    mount(<PlaybackProgress value={50} duration={200} buffered={100} testID="s" />);
    expect(byTestId('s-track-fill').style.width).toBe('25%');
    expect(byTestId('s-track-buffered').style.width).toBe('50%');
  });

  it('draws elapsed and total, or remaining, hidden from assistive tech', () => {
    mount(<PlaybackProgress value={83} duration={225} showTimes testID="s" />);
    expect(byTestId('s').textContent).toBe('1:233:45');
    mount(<PlaybackProgress value={3725} duration={5400} showTimes showRemaining testID="s" />);
    expect(byTestId('s').textContent).toBe('1:02:05−27:55');
    const hidden = byTestId('s').querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
  });

  it('seeks ±5s on arrow keys and to the ends on Home/End, clamped', () => {
    const onSeek = jest.fn();
    mount(<PlaybackProgress value={83} duration={225} onSeek={onSeek} testID="s" />);
    const el = byTestId('s-track');
    key(el, 'ArrowRight');
    expect(onSeek).toHaveBeenLastCalledWith(88);
    key(el, 'ArrowLeft');
    expect(onSeek).toHaveBeenLastCalledWith(78);
    key(el, 'Home');
    expect(onSeek).toHaveBeenLastCalledWith(0);
    key(el, 'End');
    expect(onSeek).toHaveBeenLastCalledWith(225);

    onSeek.mockClear();
    mount(<PlaybackProgress value={223} duration={225} onSeek={onSeek} keyboardStep={10} testID="s" />);
    key(byTestId('s-track'), 'ArrowUp');
    expect(onSeek).toHaveBeenLastCalledWith(225);
  });

  it('does not seek when disabled', () => {
    const onSeek = jest.fn();
    mount(<PlaybackProgress value={83} duration={225} onSeek={onSeek} disabled testID="s" />);
    const el = byTestId('s-track');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    key(el, 'ArrowRight');
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('maps a pointer position to seconds, clamped', () => {
    expect(valueAtPosition(50, 200, 240)).toBe(60);
    expect(valueAtPosition(-10, 200, 240)).toBe(0);
    expect(valueAtPosition(250, 200, 240)).toBe(240);
    expect(valueAtPosition(50, 0, 240)).toBe(0);
  });

  it('takes a translated value text', () => {
    mount(
      <PlaybackProgress
        value={83}
        duration={225}
        formatValueText={(s, d) => `${formatDuration(s)} de ${formatDuration(d)}`}
        testID="s"
      />,
    );
    expect(byTestId('s-track').getAttribute('aria-valuetext')).toBe('1:23 de 3:45');
  });
});

describe('VolumeControl', () => {
  it('names the mute button by its action and toggles mute', () => {
    const onMutedChange = jest.fn();
    mount(
      <VolumeControl volume={0.4} onVolumeChange={() => {}} onMutedChange={onMutedChange} testID="v" />,
    );
    const button = byTestId('v-mute');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Mute');
    act(() => button.click());
    expect(onMutedChange).toHaveBeenCalledWith(true);

    mount(<VolumeControl volume={0.4} muted onVolumeChange={() => {}} testID="v" />);
    expect(byTestId('v-mute').getAttribute('aria-label')).toBe('Unmute');
  });

  it('is a slider in percent, drawing 0 while muted', () => {
    mount(<VolumeControl volume={0.4} onVolumeChange={() => {}} testID="v" />);
    const slider = byTestId('v-slider');
    expect(slider.getAttribute('role')).toBe('slider');
    expect(slider.getAttribute('aria-label')).toBe('Volume');
    expect(slider.getAttribute('aria-valuemax')).toBe('1');
    expect(slider.getAttribute('aria-valuenow')).toBe('0.4');
    expect(slider.getAttribute('aria-valuetext')).toBe('40%');

    mount(<VolumeControl volume={0.4} muted onVolumeChange={() => {}} testID="v" />);
    expect(byTestId('v-slider').getAttribute('aria-valuetext')).toBe('0%');
  });

  it('steps 5% on arrows, and unmutes when moved while muted', () => {
    const onVolumeChange = jest.fn();
    const onMutedChange = jest.fn();
    mount(
      <VolumeControl volume={0.4} onVolumeChange={onVolumeChange} onMutedChange={onMutedChange} testID="v" />,
    );
    key(byTestId('v-slider'), 'ArrowRight');
    expect(onVolumeChange).toHaveBeenLastCalledWith(0.45);
    expect(onMutedChange).not.toHaveBeenCalled();

    mount(
      <VolumeControl volume={0.4} muted onVolumeChange={onVolumeChange} onMutedChange={onMutedChange} testID="v" />,
    );
    key(byTestId('v-slider'), 'ArrowRight');
    expect(onVolumeChange).toHaveBeenLastCalledWith(0.05);
    expect(onMutedChange).toHaveBeenCalledWith(false);
  });

  it('picks the speaker glyph from the level', () => {
    expect(volumeIconFor(0.8, false)).toBe(RiVolumeUpLine);
    expect(volumeIconFor(0.3, false)).toBe(RiVolumeDownLine);
    expect(volumeIconFor(0, false)).toBe(RiVolumeMuteLine);
    expect(volumeIconFor(0.8, true)).toBe(RiVolumeMuteLine);
  });

  it('marks the hover reveal only when asked', () => {
    mount(<VolumeControl volume={0.4} onVolumeChange={() => {}} sliderVisibility="hover" testID="v" />);
    expect(byTestId('v').getAttribute('data-bloom-volume-reveal')).toBe('hover');
  });
});
