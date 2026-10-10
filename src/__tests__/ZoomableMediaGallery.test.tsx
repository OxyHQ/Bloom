/**
 * `ZoomableMediaGallery` is mounted ONCE near the app root and driven through
 * an imperative handle, which is the part a jest run can hold: it must render
 * nothing at all until `open()` is called, and `open()` must place its content
 * in the portal rather than in the tree position where the gallery was written.
 *
 * A gallery that rendered even an empty overlay while closed would sit over the
 * whole app collecting presses — invisible, and total.
 *
 * The gestures (pinch, pan-to-dismiss, the shared-element transition from the
 * measured thumb rect) are not testable here and belong to a device build.
 */
import React, { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet } from '../portal';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle, GalleryImage } from '../zoomable-media-gallery';
import { Backdrop } from '../overlay';
import { ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import type { ZoomableMediaGalleryProps } from '../zoomable-media-gallery';
import { hostNodes } from './support/rendered-style';
import { GestureDetector } from 'react-native-gesture-handler';
import type { MockGesture } from '../../__mocks__/react-native-gesture-handler';

const BackdropComponent = (Backdrop as unknown as { type: React.ComponentType<React.ComponentProps<typeof Backdrop>> }).type;

const IMAGES: GalleryImage[] = [
  { uri: 'https://cloud.oxy.so/a.jpg', alt: 'First' },
  { uri: 'https://cloud.oxy.so/b.jpg', alt: 'Second' },
];

function renderGallery(props: ZoomableMediaGalleryProps = {}, mode: 'light' | 'dark' = 'light') {
  let theme!: Theme;
  function Probe() { theme = useTheme(); return null; }
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const tree = (nextProps: ZoomableMediaGalleryProps) => (
    <BloomThemeProvider mode={mode} colorPreset="oxy">
      <Probe />
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} {...nextProps} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
  const utils = render(tree(props));
  return { ...utils, ref, theme, updateProps: (nextProps: ZoomableMediaGalleryProps) => utils.rerender(tree(nextProps)) };
}

describe('ZoomableMediaGallery', () => {
  it('keeps ownership during a cancelled native drag and reports a completed drag dismissal', () => {
    jest.useFakeTimers();
    try {
      const onOpenChange = jest.fn();
      const api = renderGallery({ onOpenChange });
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => jest.advanceTimersByTime(1000));
      const gesture = api.UNSAFE_getAllByType(GestureDetector)[0]!.props.gesture as MockGesture;
      act(() => gesture.__handlers.onEnd?.({ translationX: 0, translationY: 1 } as never));
      act(() => jest.advanceTimersByTime(1000));
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => gesture.__handlers.onEnd?.({ translationX: 0, translationY: Dimensions.get('window').height } as never));
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => jest.advanceTimersByTime(1000));
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    } finally { jest.useRealTimers(); }
  });

  it('reports accepted opening and completed closing once, including repeated presses', () => {
    jest.useFakeTimers();
    try {
      const onOpenChange = jest.fn();
      const api = renderGallery({ onOpenChange });
      expect(onOpenChange).not.toHaveBeenCalled();
      act(() => api.ref.current?.open([], 0));
      expect(onOpenChange).not.toHaveBeenCalled();
      act(() => {
        api.ref.current?.open(IMAGES, 0);
        api.ref.current?.open(IMAGES, 1);
      });
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      expect(api.getByText('First')).toBeTruthy();
      act(() => jest.advanceTimersByTime(1000));
      const dismiss = api.UNSAFE_getByType(BackdropComponent).props.onPress;
      act(() => { dismiss(); dismiss(); });
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => jest.advanceTimersByTime(1000));
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      expect(hostNodes(api.toJSON()).filter(node => node.type === 'ExpoImage')).toHaveLength(0);
      api.unmount();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    } finally { jest.useRealTimers(); }
  });

  it('uses the current callback when a deferred close completes, then permits reopening', () => {
    jest.useFakeTimers();
    try {
      const first = jest.fn();
      const current = jest.fn();
      const api = renderGallery({ onOpenChange: first });
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => jest.advanceTimersByTime(1000));
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      api.updateProps({ onOpenChange: current });
      expect(current).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(1000));
      expect(first.mock.calls).toEqual([[true]]);
      expect(current.mock.calls).toEqual([[false]]);
      act(() => api.ref.current?.open(IMAGES, 1));
      expect(current.mock.calls).toEqual([[false], [true]]);
      api.unmount();
      expect(current.mock.calls).toEqual([[false], [true], [false]]);
    } finally { jest.useRealTimers(); }
  });

  it.each(['opening', 'closing'] as const)('reports false when unmounted while %s without a delayed duplicate', phase => {
    jest.useFakeTimers();
    try {
      const first = jest.fn();
      const current = jest.fn();
      const api = renderGallery({ onOpenChange: first });
      act(() => api.ref.current?.open(IMAGES, 0));
      if (phase === 'closing') {
        act(() => jest.advanceTimersByTime(1000));
        fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      }
      api.updateProps({ onOpenChange: current });
      api.unmount();
      act(() => jest.advanceTimersByTime(2000));
      expect(first.mock.calls).toEqual([[true]]);
      expect(current.mock.calls).toEqual([[false]]);
    } finally { jest.useRealTimers(); }
  });

  it.each(['light', 'dark'] as const)('uses the %s page theme without changing the overlay default', mode => {
    const page = renderGallery({ appearance: 'page' }, mode);
    act(() => page.ref.current?.open(IMAGES, 0));
    const backdrop = page.UNSAFE_getByType(BackdropComponent);
    expect(backdrop.props.blurIntensity).toBe(0);
    expect(backdrop.props.dimOpacity).toBe(1);
    expect(backdrop.props.dimColor).toBe(page.theme.colors.background);
    const caption = page.getByText('First');
    expect(caption.props.style).toEqual(expect.arrayContaining([{ color: page.theme.colors.text }]));
    page.unmount();
    const overlay = renderGallery();
    act(() => overlay.ref.current?.open(IMAGES, 0));
    expect(overlay.UNSAFE_getByType(BackdropComponent).props.dimColor).toBeUndefined();
  });

  it('reports opening and changed pages once, preserving the current index on close', () => {
    jest.useFakeTimers();
    try {
      const onIndexChange = jest.fn();
      const api = renderGallery({ onIndexChange });
      act(() => api.ref.current?.open([], 0));
      expect(onIndexChange).not.toHaveBeenCalled();
      act(() => api.ref.current?.open(IMAGES, 0));
      expect(onIndexChange.mock.calls).toEqual([[0]]);
      act(() => jest.advanceTimersByTime(1));
      act(() => jest.advanceTimersByTime(1000));
      const pager = api.UNSAFE_getAllByType(ScrollView).find(node => node.props.pagingEnabled)!;
      const width = Dimensions.get('window').width;
      fireEvent(pager, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width, y: 0 } } });
      fireEvent(pager, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width, y: 0 } } });
      expect(onIndexChange.mock.calls).toEqual([[0], [1]]);
      const queuedScroll = pager.props.onMomentumScrollEnd;
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      act(() => queuedScroll({ nativeEvent: { contentOffset: { x: 0, y: 0 } } }));
      act(() => jest.advanceTimersByTime(1000));
      act(() => queuedScroll({ nativeEvent: { contentOffset: { x: 0, y: 0 } } }));
      expect(onIndexChange.mock.calls).toEqual([[0], [1]]);
    } finally { jest.useRealTimers(); }
  });

  it('renders nothing while closed', () => {
    const { toJSON } = renderGallery();
    const images = hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage');
    expect(images).toHaveLength(0);
  });

  it('exposes an imperative open() rather than an open prop', () => {
    const { ref } = renderGallery();
    expect(typeof ref.current?.open).toBe('function');
  });

  it('renders the media once opened', () => {
    const { ref, toJSON } = renderGallery();
    act(() => {
      ref.current?.open(IMAGES, 0);
    });
    const images = hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage');
    expect(images.length).toBeGreaterThan(0);
  });

  it('opens at the index it was given, not always the first image', () => {
    // The ACTIVE image's alt is shown as the caption, so the caption is the
    // observable "which page is open" — and opening at 0 whatever the caller
    // asked for is the classic version of this bug.
    const second = renderGallery();
    act(() => {
      second.ref.current?.open(IMAGES, 1);
    });
    expect(second.getByText('Second')).toBeTruthy();
    expect(second.queryByText('First')).toBeNull();

    const first = renderGallery();
    act(() => {
      first.ref.current?.open(IMAGES, 0);
    });
    expect(first.getByText('First')).toBeTruthy();
  });

  /**
   * The open transition is a two-step timer chain (`0 ms` to start the springs,
   * then ~300 ms to reveal the pager), and both steps end in a `setState`. A
   * gallery unmounted mid-transition — a screen left, a route popped — must take
   * its pending steps with it.
   *
   * React makes the write itself a silent no-op, so the only observable is the
   * timer. That is also how this escaped: measured before the fix, the reveal
   * timer OUTLIVED the jest file that mounted it and fired inside the next test
   * file running in the same worker process, where it re-scheduled itself once
   * more. Nothing failed, because the callback happens not to throw — but a
   * stray timer that ever does takes the whole run down as an uncaught
   * exception, attributed to whichever file was unlucky enough to be running.
   *
   * The pre-unmount assertion is the control: without it the test would pass
   * against a gallery that scheduled nothing at all.
   */
  it('cancels its pending transition timers on unmount', () => {
    jest.useFakeTimers();
    try {
      const { ref, unmount } = renderGallery();
      const baseline = jest.getTimerCount();

      act(() => {
        ref.current?.open(IMAGES, 0);
      });
      // Run the first step, which is what schedules the reveal.
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(jest.getTimerCount()).toBeGreaterThan(baseline);

      unmount();
      expect(jest.getTimerCount()).toBeLessThanOrEqual(baseline);
    } finally {
      jest.useRealTimers();
    }
  });
});
