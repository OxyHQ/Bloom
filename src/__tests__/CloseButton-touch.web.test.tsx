/** @jest-environment jsdom */
import { RiCloseLine as DismissActionIcon } from '../icons/remix/RiCloseLine';

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Button } from '../button/Button.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
let coarse: boolean;
let media: MediaQueryList;
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  coarse = false;
  media = new (class extends EventTarget {
    get matches() {
      return coarse;
    }
    media = '(pointer: coarse)';
    onchange: MediaQueryList['onchange'] = null;
    addListener() {}
    removeListener() {}
  })();
  window.matchMedia = () => media;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.matchMedia = originalMatchMedia;
});
function render(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Button
          appearance="outline"
          tone="neutral"
          iconOnly
          icon={DismissActionIcon}
          size={20}
          accessibilityLabel="Close"
          {...props}
        />
      </BloomThemeProvider>,
    ),
  );
}
function button() {
  const node = host.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
  if (!node) throw new Error('Close control missing');
  return node;
}
function pointer(value: boolean) {
  act(() => {
    coarse = value;
    media.dispatchEvent(new Event('change'));
  });
}

it.each([
  ['2xs', 18, 9],
  ['xs', 20, 10.8],
  ['sm', 24, 12.6],
  ['md', 32, 16.2],
  ['lg', 44, 20],
] as const)(
  'reserves a real 44px coarse target while preserving %s disc/glyph geometry',
  (size, disc, glyph) => {
    render({ size: disc, iconSize: glyph });
    const node = button();
    expect(getComputedStyle(node).width).toBe(`${disc}px`);
    pointer(true);
    expect(button()).toBe(node);
    // jsdom reports specified dimensions, not the used size after min-width/height.
    // The browser gate measures the real 44px box.
    expect(getComputedStyle(node).width).toBe(`${disc}px`);
    expect(getComputedStyle(node).height).toBe(`${disc}px`);
    expect(getComputedStyle(node).minWidth).toBe('44px');
    expect(getComputedStyle(node).minHeight).toBe('44px');
    expect(node.querySelector('svg')?.getAttribute('width')).toBe(String(glyph));
    pointer(false);
    expect(button()).toBe(node);
    expect(getComputedStyle(node).width).toBe(`${disc}px`);
    expect(getComputedStyle(node).height).toBe(`${disc}px`);
  },
);

it('preserves activation/disabled behavior and enforces the target floor against smaller style overrides', () => {
  const onPress = jest.fn();
  pointer(true);
  render({ onPress, style: { width: 12, height: 12, minWidth: 0, minHeight: 0 } });
  expect(getComputedStyle(button()).minWidth).toBe('44px');
  expect(getComputedStyle(button()).minHeight).toBe('44px');
  act(() => button().click());
  expect(onPress).toHaveBeenCalledTimes(1);
  render({ onPress, disabled: true });
  act(() => button().click());
  expect(onPress).toHaveBeenCalledTimes(1);
  render({ style: { width: 56, height: 56 } });
  expect(getComputedStyle(button()).width).toBe('56px');
  expect(getComputedStyle(button()).height).toBe('56px');
});
