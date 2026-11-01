import type React from 'react';
import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { Backdrop } from '../overlay';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { GalleryMedia, ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';

const mockProbes = new Map<string, Array<(ratio: number) => void>>();
jest.mock('../image-aspect-ratio-cache/aspect-ratio-cache', () => ({
  ...jest.requireActual('../image-aspect-ratio-cache/aspect-ratio-cache'),
  getAspectRatio: () => undefined,
  getIntrinsicSize: () => undefined,
  fetchAspectRatioForOwner: (uri: string) =>
    new Promise<number>((resolve) => {
      const pending = mockProbes.get(uri) ?? [];
      pending.push(resolve);
      mockProbes.set(uri, pending);
    }),
}));

const BackdropComponent = (
  Backdrop as unknown as { type: React.ComponentType<React.ComponentProps<typeof Backdrop>> }
).type;

function fixture() {
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const api = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  return {
    ...api,
    open(items: GalleryMedia[], index = 0) {
      act(() => ref.current?.open(items, index));
      act(() => jest.advanceTimersByTime(1000));
    },
    close() {
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      act(() => jest.advanceTimersByTime(1000));
    },
    startClose() {
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
    },
    page(index: number) {
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled);
      if (!pager) throw new Error('Expected the gallery pager');
      fireEvent(pager, 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: index * Dimensions.get('window').width, y: 0 } },
      });
    },
    box(label: string) {
      let node = api
        .UNSAFE_getAllByProps({ accessibilityLabel: label })
        .find((entry) => typeof entry.type === 'string' && String(entry.type) === 'ExpoImage');
      while (node) {
        const style = StyleSheet.flatten(node.props.style);
        if (style && typeof style.width === 'number' && typeof style.height === 'number') {
          return { width: style.width, height: style.height };
        }
        node = node.parent ?? undefined;
      }
      throw new Error('Expected fitted media box');
    },
  };
}

async function resolveProbe(uri: string, ratio: number, attempt = 0) {
  const resolve = mockProbes.get(uri)?.[attempt];
  if (!resolve) throw new Error(`Expected image probe ${uri}, attempt ${attempt}`);
  await act(async () => resolve(ratio));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockProbes.clear();
});
afterEach(() => jest.useRealTimers());

it('does not let an earlier opening change the current image fit', async () => {
  const api = fixture();
  api.open([{ uri: 'https://example.test/old', alt: 'old' }]);
  api.close();
  api.open([{ uri: 'https://example.test/current', alt: 'current' }]);
  await resolveProbe('https://example.test/current', 1);
  const currentBox = api.box('current');
  await resolveProbe('https://example.test/old', 4);
  expect(api.box('current')).toEqual(currentBox);
});

it('does not resize the closing image when its probe finishes during dismissal', async () => {
  const api = fixture();
  api.open([{ uri: 'https://example.test/old', alt: 'old' }]);
  api.startClose();
  const closingBox = api.box('old');
  await resolveProbe('https://example.test/old', 4);
  expect(api.box('old')).toEqual(closingBox);
  act(() => jest.advanceTimersByTime(1000));
});

it('does not accept an old probe when the same URI is reopened', async () => {
  const api = fixture();
  api.open([{ uri: 'https://example.test/same', alt: 'first' }]);
  api.close();
  api.open([{ uri: 'https://example.test/same', alt: 'second' }]);
  await resolveProbe('https://example.test/same', 1, 1);
  const currentBox = api.box('second');
  await resolveProbe('https://example.test/same', 4, 0);
  expect(api.box('second')).toEqual(currentBox);
});

it('does not apply a previous opening’s offscreen page probe to the new page', async () => {
  const api = fixture();
  api.open([
    { uri: 'https://example.test/old-0', aspectRatio: 1 },
    { uri: 'https://example.test/old-1', alt: 'old page' },
  ]);
  api.page(1);
  api.close();
  api.open(
    [
      { uri: 'https://example.test/new-0', aspectRatio: 1 },
      { uri: 'https://example.test/new-1', alt: 'current page', aspectRatio: 1 },
    ],
    1,
  );
  const currentBox = api.box('current page');
  await resolveProbe('https://example.test/old-1', 4);
  expect(api.box('current page')).toEqual(currentBox);
});

it('still applies the current page’s own probe', async () => {
  const api = fixture();
  api.open([
    { uri: 'https://example.test/current-0', aspectRatio: 1 },
    { uri: 'https://example.test/current-1', alt: 'current page' },
  ]);
  api.page(1);
  const before = api.box('current page');
  await resolveProbe('https://example.test/current-1', 4);
  const after = api.box('current page');
  expect(after.width).toBe(before.width);
  expect(after.height).toBeLessThan(before.height);
  expect(after.height).toBeCloseTo(after.width / 4);
});

it('keeps the active pending page fitted consistently when the opening probe resolves', async () => {
  const api = fixture();
  api.open([
    { uri: 'https://example.test/first', alt: 'first page' },
    { uri: 'https://example.test/second', alt: 'second page' },
  ]);
  api.page(1);
  await resolveProbe('https://example.test/first', 4);
  const pagerBox = api.box('second page');
  api.startClose();
  expect(api.box('second page')).toEqual(pagerBox);
  await resolveProbe('https://example.test/second', 1);
  expect(api.box('second page')).toEqual(pagerBox);
  act(() => jest.advanceTimersByTime(1000));
});

it('keeps each pending page independent until its own probe resolves', async () => {
  const api = fixture();
  api.open([
    { uri: 'https://example.test/first', alt: 'first page' },
    { uri: 'https://example.test/second', alt: 'second page' },
  ]);
  api.page(1);
  const before = api.box('second page');
  await resolveProbe('https://example.test/first', 4);
  expect(api.box('second page')).toEqual(before);
  await resolveProbe('https://example.test/second', 1);
  const after = api.box('second page');
  expect(after.height).toBeCloseTo(after.width);
});
