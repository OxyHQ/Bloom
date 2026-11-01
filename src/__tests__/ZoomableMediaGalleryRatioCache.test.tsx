import type React from 'react';
import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { Backdrop } from '../overlay';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';
import { getAspectRatio, getIntrinsicSize, setAspectRatio } from '../image-aspect-ratio-cache';

const mockPending = new Map<string, Array<(size: { width: number; height: number }) => void>>();
jest.mock('../image', () => ({
  ...jest.requireActual('../image'),
  getImageSize: (uri: string) =>
    new Promise<{ width: number; height: number }>((resolve) => {
      const pending = mockPending.get(uri) ?? [];
      pending.push(resolve);
      mockPending.set(uri, pending);
    }),
}));

const BackdropComponent = (
  Backdrop as unknown as { type: React.ComponentType<React.ComponentProps<typeof Backdrop>> }
).type;

function fixture(uri: string) {
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const api = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  const open = () => {
    act(() => ref.current?.open([{ uri, alt: 'image' }], 0));
    act(() => jest.advanceTimersByTime(1000));
  };
  const close = () => {
    fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
    act(() => jest.advanceTimersByTime(1000));
  };
  const box = () => {
    let node = api
      .UNSAFE_getAllByProps({ accessibilityLabel: 'image' })
      .find((entry) => typeof entry.type === 'string' && String(entry.type) === 'ExpoImage');
    while (node) {
      const style = StyleSheet.flatten(node.props.style);
      if (style && typeof style.width === 'number' && typeof style.height === 'number') {
        return { width: style.width, height: style.height };
      }
      node = node.parent ?? undefined;
    }
    throw new Error('Expected fitted media box');
  };
  return { api, open, close, box };
}

it('keeps an obsolete opening from poisoning the shared cache for the next opening', async () => {
  jest.useFakeTimers();
  const uri = 'https://example.test/gallery-cache-aba';
  const { api, open, close, box } = fixture(uri);
  try {
    open();
    close();
    open();
    const pending = mockPending.get(uri);
    if (pending?.length !== 2) throw new Error('Expected both opening probes');
    await act(async () => pending[1]?.({ width: 300, height: 300 }));
    const currentBox = box();
    await act(async () => pending[0]?.({ width: 400, height: 100 }));
    expect(box()).toEqual(currentBox);
    expect(getAspectRatio(uri)).toBe(1);
    expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
    close();
    open();
    expect(box()).toEqual(currentBox);
    expect(mockPending.get(uri)).toHaveLength(2);
  } finally {
    api.unmount();
    jest.useRealTimers();
  }
});

it('uses an explicit ratio recorded while its opening probe was pending', async () => {
  jest.useFakeTimers();
  const uri = 'https://example.test/gallery-explicit-ratio';
  const { api, open, box } = fixture(uri);
  try {
    open();
    const pending = mockPending.get(uri);
    if (pending?.length !== 1) throw new Error('Expected the opening probe');
    setAspectRatio(uri, 1);
    await act(async () => pending[0]?.({ width: 400, height: 100 }));
    const result = box();
    expect(getAspectRatio(uri)).toBe(1);
    expect(result.height).toBeCloseTo(result.width);
  } finally {
    api.unmount();
    jest.useRealTimers();
  }
});
