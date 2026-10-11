/**
 * @jest-environment jsdom
 *
 * `Sticker`, through the real react-native-web.
 *
 * What matters is which of the two layers a person sees in each situation —
 * the still or the animation — so every case asserts that, with a stand-in
 * Lottie player handed in through `provideLottiePlayer` (the same seam an app
 * with its own player build would use).
 */
import React, { useEffect } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

let reducedMotion = false;
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => reducedMotion,
}));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { StickerMessage } from '../message-media';
import {
  Sticker,
  provideLottiePlayer,
  resetLottiePlayer,
  type LottiePlayerProps,
} from '../sticker';

let container: HTMLDivElement;
let root: Root;

/** Captured by the stand-in player, so a test can drive load and failure. */
let lastPlayer: LottiePlayerProps | null = null;

function FakePlayer(props: LottiePlayerProps) {
  lastPlayer = props;
  useEffect(() => undefined, []);
  return <div data-testid="fake-player" data-uri={props.uri} data-paused={String(props.paused)} />;
}

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

function has(id: string): boolean {
  return container.querySelector(`[data-testid="${id}"]`) !== null;
}

function opacityOf(id: string): string {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return getComputedStyle(el).opacity;
}

beforeEach(() => {
  reducedMotion = false;
  lastPlayer = null;
  resetLottiePlayer();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const STILL = 'https://cloud.oxy.invalid/s.webp';
const ANIMATION = 'https://cloud.oxy.invalid/s.json';

describe('Sticker', () => {
  it('shows the still until the animation loads, then only the animation', () => {
    provideLottiePlayer(FakePlayer);
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);

    expect(has('s-still')).toBe(true);
    expect(opacityOf('s-animation')).toBe('0');
    expect(lastPlayer?.uri).toBe(ANIMATION);

    act(() => lastPlayer?.onLoad?.());
    expect(has('s-still')).toBe(false);
    expect(opacityOf('s-animation')).toBe('1');
  });

  it('falls back to the still for good when the animation fails', () => {
    provideLottiePlayer(FakePlayer);
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);
    act(() => lastPlayer?.onError?.('boom'));
    expect(has('s-still')).toBe(true);
    expect(has('s-animation')).toBe(false);
  });

  it('never animates for a person who asked for reduced motion', () => {
    reducedMotion = true;
    provideLottiePlayer(FakePlayer);
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);
    expect(has('s-still')).toBe(true);
    expect(has('s-animation')).toBe(false);
    expect(lastPlayer).toBeNull();
  });

  it('shows the still when no Lottie player is installed', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);
    expect(has('s-still')).toBe(true);
    expect(has('s-animation')).toBe(false);
    warn.mockRestore();
  });

  it('passes pause through to the player', () => {
    provideLottiePlayer(FakePlayer);
    mount(<Sticker animation={ANIMATION} fallback={STILL} paused testID="s" />);
    expect(lastPlayer?.paused).toBe(true);
  });

  it('is named as an image unless its container names it', () => {
    mount(<Sticker fallback={STILL} accessibilityLabel="Sticker: waving" testID="named" />);
    expect(container.querySelector('[data-testid="named"]')?.getAttribute('aria-label')).toBe(
      'Sticker: waving',
    );

    mount(<Sticker fallback={STILL} decorative testID="quiet" />);
    const quiet = container.querySelector('[data-testid="quiet"]');
    expect(quiet?.getAttribute('aria-label')).toBeNull();
    expect(quiet?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('StickerMessage with an animation', () => {
  it('animates inside the pressable, which keeps the only accessible name', () => {
    provideLottiePlayer(FakePlayer);
    mount(
      <StickerMessage
        source={STILL}
        animation={ANIMATION}
        accessibilityLabel="Sticker: waving"
        testID="msg"
      />,
    );
    expect(container.querySelector('[data-testid="msg-frame"]')?.getAttribute('aria-label')).toBe(
      'Sticker: waving',
    );
    expect(
      container.querySelector('[data-testid="msg-sticker"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(lastPlayer?.uri).toBe(ANIMATION);
  });

  it('is still just an image without one', () => {
    mount(<StickerMessage source={STILL} testID="msg" />);
    expect(has('msg-image')).toBe(true);
    expect(has('msg-sticker')).toBe(false);
  });
});
