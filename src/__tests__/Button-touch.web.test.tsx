/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Button } from '../button/Button.web';
import { BloomScope } from '../appearance';
import { RiAddLine } from '../icons/remix/RiAddLine';
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
        <BloomScope size="sm">
          <Button accessibilityLabel="Action" {...props} />
        </BloomScope>
      </BloomThemeProvider>,
    ),
  );
}
function button() {
  const node = host.querySelector<HTMLButtonElement>('button[aria-label="Action"]');
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
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const)(
  'reserves a real target for %s and retains the node/focus on input changes',
  (size, height) => {
    render({ size, icon: RiAddLine });
    const original = button();
    expect(original.style.height).toBe(`${height}px`);
    original.focus();
    pointer(true);
    expect(button()).toBe(original);
    expect(document.activeElement).toBe(original);
    expect(original.style.minWidth).toBe('44px');
    expect(original.style.minHeight).toBe('44px');
    pointer(false);
    expect(original.style.minWidth).toBe('');
    expect(original.style.minHeight).toBe('');
    expect(original.style.height).toBe(`${height}px`);
  },
);

it('inherits scope, accepts larger minima and prevents small overrides from removing the floor', () => {
  render({ children: 'Save' });
  expect(button().style.height).toBe('32px');
  pointer(true);
  render({
    children: 'Save',
    style: { height: 12, width: 12, minWidth: 0, minHeight: 0, maxHeight: 12 },
  });
  expect(button().style.minWidth).toBe('44px');
  expect(button().style.minHeight).toBe('44px');
  render({ children: 'Save', style: { minWidth: 70, minHeight: 60 } });
  expect(button().style.minWidth).toBe('70px');
  expect(button().style.minHeight).toBe('60px');
});

it('constrains the actual asChild anchor after merging its own styles', () => {
  pointer(true);
  render({
    asChild: true,
    children: (
      <a href="#save" style={{ minWidth: '0', minHeight: '0' }}>
        Save
      </a>
    ),
  });
  const anchor = host.querySelector('a')!;
  expect(anchor.style.minWidth).toBe('44px');
  expect(anchor.style.minHeight).toBe('44px');
  expect(host.querySelector('button')).toBeNull();
});

it('keeps href, disabled and loading semantics on the enlarged host', () => {
  pointer(true);
  const onPress = jest.fn();
  render({ href: '#save', children: 'Save', onPress });
  const anchor = host.querySelector('a')!;
  expect(anchor.style.minHeight).toBe('44px');
  act(() => anchor.click());
  expect(onPress).toHaveBeenCalledTimes(1);
  render({ href: '#save', children: 'Save', onPress, loading: true });
  expect(anchor.getAttribute('aria-busy')).toBe('true');
  expect(anchor.getAttribute('aria-disabled')).toBe('true');
  act(() => anchor.click());
  expect(onPress).toHaveBeenCalledTimes(1);
});

it.each(['min-content', 'max-content'] as const)(
  'uses the touch floor for an asChild intrinsic %s minimum and restores it on fine pointers',
  (minimum) => {
    render({
      asChild: true,
      children: (
        <a href="#save" style={{ minWidth: minimum, minHeight: minimum }}>
          Save
        </a>
      ),
    });
    const anchor = host.querySelector('a')!;
    expect(anchor.style.minWidth).toBe(minimum);
    pointer(true);
    expect(anchor.style.minWidth).toBe('44px');
    expect(anchor.style.minHeight).toBe('44px');
    pointer(false);
    expect(host.querySelector('a')).toBe(anchor);
    expect(anchor.style.minWidth).toBe(minimum);
    expect(anchor.style.minHeight).toBe(minimum);
  },
);
