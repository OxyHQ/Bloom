/** @jest-environment jsdom */
/**
 * The platform's reduce transparency on the web: the provider marks the
 * document, which is the one switch the surface material's CSS follows
 * (`surface/web-material.ts`, pinned by `Surface.web.test.tsx`), so every host
 * of the material turns opaque with it, the window controls' bubbles included.
 * The hand-made web blurs read `useReducedTransparency()` instead.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const native = jest.requireActual('react-native-web');
  return {
    ...base,
    __esModule: true,
    default: {
      ...base.default,
      View: native.View,
      Text: native.Text,
      ScrollView: native.ScrollView,
      createAnimatedComponent: (component: unknown) => component,
    },
  };
});

import { SpoilerCover } from '../message-media/parts';
import { resolveMessageMediaPaint } from '../message-media/shared';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { BloomProvider } from '../provider';
import { useTheme } from '../theme/use-theme';
import { WindowControls } from '../window/WindowControls';
import { fakeAppearance } from './support/fake-appearance';
import { fakeWindow } from './support/fake-window';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ATTRIBUTE = 'data-bloom-transparency';
let root: Root;
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.removeAttribute(ATTRIBUTE);
});

function show(adapter: PlatformSurfaceAdapter | undefined, ui: React.ReactNode = null) {
  act(() =>
    root.render(
      <BloomProvider platform={adapter} mode="light" fonts={false}>
        {ui}
      </BloomProvider>,
    ),
  );
}

it('marks the document while the platform reduces transparency, and clears it when it stops', () => {
  const { appearance, adapter } = fakeAppearance({ reduceTransparency: true });
  show(adapter);
  expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('reduced');
  act(() => appearance.set({ reduceTransparency: false }));
  expect(document.documentElement.hasAttribute(ATTRIBUTE)).toBe(false);
  act(() => appearance.set({ reduceTransparency: true }));
  expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('reduced');
});

it('leaves the document alone without the capability', () => {
  show(undefined);
  expect(document.documentElement.hasAttribute(ATTRIBUTE)).toBe(false);
  show({ platform: 'test', capabilities: new Set(['popup-surface']) });
  expect(document.documentElement.hasAttribute(ATTRIBUTE)).toBe(false);
});

it('turns the window controls opaque with the rest of the material', () => {
  const { appearance } = fakeAppearance({ reduceTransparency: true });
  const { window } = fakeWindow();
  show(
    {
      platform: 'test',
      capabilities: new Set(['window', 'appearance']),
      window,
      appearance,
    },
    <WindowControls testID="controls" />,
  );
  expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('reduced');
  for (const key of ['close', 'minimize', 'zoom']) {
    const paint = container.querySelector(`[data-testid="controls-${key}-paint"]`) as HTMLElement;
    // A host of the one material, with the opaque body the attribute's rule paints.
    expect(paint.classList.contains('bloom-surface-paint')).toBe(true);
    expect(paint.style.getPropertyValue('--bloom-surface-solid')).toMatch(/^rgb\(/);
  }
});

function Spoiler() {
  return (
    <SpoilerCover label="Spoiler" paint={resolveMessageMediaPaint(useTheme())} testID="cover" />
  );
}

it('draws the spoiler cover opaque, as native does, while transparency is reduced', () => {
  const { appearance, adapter } = fakeAppearance();
  show(adapter, <Spoiler />);
  const cover = () => container.querySelector('[data-testid="cover"]') as HTMLElement;
  expect(cover().style.backgroundColor).toBe('rgba(0, 0, 0, 0.35)');
  act(() => appearance.set({ reduceTransparency: true }));
  expect(cover().style.backgroundColor).toMatch(/^rgb\(/);
});
