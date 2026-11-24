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
import type React from 'react';
import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet } from '../portal';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle, GalleryImage } from '../zoomable-media-gallery';
import { Backdrop } from '../overlay';
import { ScrollView, Dimensions, Platform, Pressable, Share, Text, View } from 'react-native';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import type { GalleryVideo, ZoomableMediaGalleryProps } from '../zoomable-media-gallery';
import { hostNodes } from './support/rendered-style';
import { holdAnimations } from './support/held-animations';
import { GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import type { MockGesture } from '../../__mocks__/react-native-gesture-handler';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: { share: jest.fn(), sharedAction: 'sharedAction' },
}));

const BackdropComponent = (
  Backdrop as unknown as { type: React.ComponentType<React.ComponentProps<typeof Backdrop>> }
).type;

const IMAGES: GalleryImage[] = [
  { uri: 'https://cloud.oxy.so/a.jpg', alt: 'First' },
  { uri: 'https://cloud.oxy.so/b.jpg', alt: 'Second' },
];

function renderGallery(props: ZoomableMediaGalleryProps = {}, mode: 'light' | 'dark' = 'light') {
  let theme!: Theme;
  function Probe() {
    theme = useTheme();
    return null;
  }
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
  return {
    ...utils,
    ref,
    theme,
    updateProps: (nextProps: ZoomableMediaGalleryProps) => utils.rerender(tree(nextProps)),
  };
}

describe('ZoomableMediaGallery', () => {
  it('shares the explicit canonical URL and keeps the legacy URI fallback', async () => {
    jest.useFakeTimers();
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    try {
      const api = renderGallery();
      act(() =>
        api.ref.current?.open(
          [
            {
              uri: 'https://private.invalid/image?token=synthetic',
              shareUrl: 'https://public.invalid/post',
            },
            { uri: 'https://public.invalid/legacy' },
          ],
          0,
        ),
      );
      act(() => jest.advanceTimersByTime(1000));
      await act(async () => fireEvent.press(api.getByLabelText('Share media')));
      expect(share).toHaveBeenLastCalledWith({ url: 'https://public.invalid/post' });
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled);
      if (!pager) throw new Error('Expected the gallery pager');
      fireEvent(pager, 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: Dimensions.get('window').width, y: 0 } },
      });
      await act(async () => fireEvent.press(api.getByLabelText('Share media')));
      expect(share).toHaveBeenLastCalledWith({ url: 'https://public.invalid/legacy' });
      expect(share).toHaveBeenCalledTimes(2);
    } finally {
      share.mockRestore();
      jest.useRealTimers();
    }
  });

  it.each([null, '', '   '])(
    'disables the share action for explicit non-shareable value %p',
    (shareUrl) => {
      jest.useFakeTimers();
      const share = jest.spyOn(Share, 'share');
      try {
        const api = renderGallery();
        act(() =>
          api.ref.current?.open([{ uri: 'https://private.invalid/?token=synthetic', shareUrl }], 0),
        );
        act(() => jest.advanceTimersByTime(1000));
        const button = api.getByLabelText('Share media');
        expect(button.props.accessibilityState).toMatchObject({ disabled: true });
        fireEvent.press(button);
        expect(share).not.toHaveBeenCalled();
      } finally {
        share.mockRestore();
        jest.useRealTimers();
      }
    },
  );

  it('preserves video sharing and never shares the poster as a fallback', async () => {
    jest.useFakeTimers();
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    const player = { playing: false, play: jest.fn(), pause: jest.fn() };
    try {
      const api = renderGallery();
      act(() =>
        api.ref.current?.open(
          [
            { kind: 'video', id: 'one', player, poster: 'https://private.invalid/poster' },
            { kind: 'video', id: 'two', player, shareUrl: 'https://public.invalid/video' },
          ],
          0,
        ),
      );
      act(() => jest.advanceTimersByTime(1000));
      await act(async () => fireEvent.press(api.getByLabelText('Share media')));
      expect(share).not.toHaveBeenCalled();
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled);
      if (!pager) throw new Error('Expected the gallery pager');
      fireEvent(pager, 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: Dimensions.get('window').width, y: 0 } },
      });
      await act(async () => fireEvent.press(api.getByLabelText('Share media')));
      expect(share).toHaveBeenCalledWith({ url: 'https://public.invalid/video' });
    } finally {
      share.mockRestore();
      jest.useRealTimers();
    }
  });

  it('never shares an earlier page or opening through a delayed callback', async () => {
    jest.useFakeTimers();
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    try {
      const api = renderGallery();
      act(() =>
        api.ref.current?.open(
          [
            {
              uri: 'https://private.invalid/?token=synthetic',
              shareUrl: 'https://public.invalid/first',
            },
            { uri: 'https://private.invalid/second?token=synthetic', shareUrl: null },
          ],
          0,
        ),
      );
      act(() => jest.advanceTimersByTime(1000));
      const button = api
        .UNSAFE_getAllByProps({ accessibilityLabel: 'Share media' })
        .find((node) => typeof node.props.onPress === 'function');
      if (!button) throw new Error('Expected the share action');
      const callback = button.props.onPress;
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled);
      if (!pager) throw new Error('Expected the gallery pager');
      fireEvent(pager, 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: Dimensions.get('window').width, y: 0 } },
      });
      await act(async () => callback());
      expect(share).not.toHaveBeenCalled();
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      await act(async () => callback());
      act(() => jest.advanceTimersByTime(1000));
      act(() => api.ref.current?.open([{ uri: 'https://public.invalid/later' }], 0));
      act(() => jest.advanceTimersByTime(1000));
      await act(async () => callback());
      expect(share).not.toHaveBeenCalled();
    } finally {
      share.mockRestore();
      jest.useRealTimers();
    }
  });

  it('uses the Web Share API with the canonical URL', async () => {
    jest.useFakeTimers();
    const priorPlatform = Platform.OS;
    const descriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'share');
    const frameDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
    const cancelDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
    const share = jest.fn().mockResolvedValue(undefined);
    Platform.OS = 'web';
    Object.defineProperty(globalThis.navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16),
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      value: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
    });
    try {
      const api = renderGallery();
      act(() =>
        api.ref.current?.open(
          [
            {
              uri: 'https://private.invalid/?token=synthetic',
              shareUrl: 'https://public.invalid/post',
            },
          ],
          0,
        ),
      );
      act(() => jest.advanceTimersByTime(1000));
      await act(async () => fireEvent.press(api.getByLabelText('Share media')));
      expect(share).toHaveBeenCalledWith({ url: 'https://public.invalid/post' });
    } finally {
      if (descriptor) Object.defineProperty(globalThis.navigator, 'share', descriptor);
      else Reflect.deleteProperty(globalThis.navigator, 'share');
      if (frameDescriptor)
        Object.defineProperty(globalThis, 'requestAnimationFrame', frameDescriptor);
      else Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
      if (cancelDescriptor)
        Object.defineProperty(globalThis, 'cancelAnimationFrame', cancelDescriptor);
      else Reflect.deleteProperty(globalThis, 'cancelAnimationFrame');
      Platform.OS = priorPlatform;
      jest.useRealTimers();
    }
  });

  it('renders current consumer status only over the active video without duplicating its player', () => {
    jest.useFakeTimers();
    try {
      const player = { playing: false, play: jest.fn(), pause: jest.fn() };
      const video: GalleryVideo = { kind: 'video', id: 'clip', player, aspectRatio: 1.5 };
      const retry = jest.fn();
      const first = jest.fn(() => <Text>Loading clip</Text>);
      const onOpenChange = jest.fn();
      const api = renderGallery({ renderVideoOverlay: first, onOpenChange });
      expect(first).not.toHaveBeenCalled();
      act(() => api.ref.current?.open([IMAGES[0]!, video], 0));
      act(() => jest.advanceTimersByTime(1000));
      expect(first).not.toHaveBeenCalled();
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled)!;
      const offset = (x: number) => ({ nativeEvent: { contentOffset: { x, y: 0 } } });
      fireEvent(pager, 'momentumScrollEnd', offset(Dimensions.get('window').width));
      expect(first).toHaveBeenLastCalledWith(video);
      expect(api.getByText('Loading clip')).toBeTruthy();
      const current = jest.fn(() => (
        <View>
          <Text>Clip unavailable</Text>
          <Pressable accessibilityRole="button" onPress={retry}>
            <Text>Retry clip</Text>
          </Pressable>
        </View>
      ));
      api.updateProps({ renderVideoOverlay: current, onOpenChange });
      expect(api.queryByText('Loading clip')).toBeNull();
      fireEvent.press(api.getByText('Retry clip'));
      act(() => jest.advanceTimersByTime(1000));
      expect(retry).toHaveBeenCalledTimes(1);
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      const views = hostNodes(api.toJSON()).filter((node) => node.type === 'ExpoVideoView');
      expect(views).toHaveLength(1);
      expect(views[0]!.props.player).toBe(player);
      expect(player.play).not.toHaveBeenCalled();
      expect(player.pause).not.toHaveBeenCalled();
      current.mockClear();
      fireEvent(pager, 'momentumScrollEnd', offset(0));
      expect(api.queryByText('Clip unavailable')).toBeNull();
      expect(current).not.toHaveBeenCalled();
      api.unmount();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps overlay actions outside the native dismiss gesture tree', () => {
    jest.useFakeTimers();
    try {
      const video: GalleryVideo = {
        kind: 'video',
        id: 'clip',
        player: { playing: false, play() {}, pause() {} },
        aspectRatio: 1,
      };
      const api = renderGallery({
        renderVideoOverlay: () => (
          <Pressable testID="video-action">
            <Text>Retry</Text>
          </Pressable>
        ),
      });
      act(() => api.ref.current?.open([video], 0));
      const action = api.getByTestId('video-action');
      for (let parent = action.parent; parent; parent = parent.parent) {
        expect(parent.type).not.toBe(GestureDetector);
      }
      api.updateProps({ renderVideoOverlay: () => null });
      expect(api.queryByTestId('video-action')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps ownership during a cancelled native drag and reports a completed drag dismissal', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
    try {
      const onOpenChange = jest.fn();
      const api = renderGallery({ onOpenChange });
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => flights.land());
      const gesture = api.UNSAFE_getAllByType(GestureDetector)[0]!.props.gesture as MockGesture;
      act(() => gesture.__handlers.onEnd?.({ translationX: 0, translationY: 1 } as never));
      act(() => flights.land());
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() =>
        gesture.__handlers.onEnd?.({
          translationX: 0,
          translationY: Dimensions.get('window').height,
        } as never),
      );
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => flights.land());
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  it('reports accepted opening and completed closing once, including repeated presses', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
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
      act(() => flights.land());
      const dismiss = api.UNSAFE_getByType(BackdropComponent).props.onPress;
      act(() => {
        dismiss();
        dismiss();
      });
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => flights.land());
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      expect(hostNodes(api.toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
      api.unmount();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  it('closes from outside as a backdrop press does, and only while open', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
    try {
      const onOpenChange = jest.fn();
      const api = renderGallery({ onOpenChange });
      act(() => api.ref.current?.close?.());
      expect(onOpenChange).not.toHaveBeenCalled();
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => flights.land());
      act(() => {
        api.ref.current?.close?.();
        api.ref.current?.close?.();
      });
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      act(() => flights.land());
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      expect(hostNodes(api.toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  it('uses the current callback when a deferred close completes, then permits reopening', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
    try {
      const first = jest.fn();
      const current = jest.fn();
      const api = renderGallery({ onOpenChange: first });
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => flights.land());
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      api.updateProps({ onOpenChange: current });
      expect(current).not.toHaveBeenCalled();
      act(() => flights.land());
      expect(first.mock.calls).toEqual([[true]]);
      expect(current.mock.calls).toEqual([[false]]);
      act(() => api.ref.current?.open(IMAGES, 1));
      expect(current.mock.calls).toEqual([[false], [true]]);
      api.unmount();
      expect(current.mock.calls).toEqual([[false], [true], [false]]);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  it.each(['opening', 'closing'] as const)(
    'reports false when unmounted while %s without a delayed duplicate',
    (phase) => {
      jest.useFakeTimers();
      const flights = holdAnimations();
      try {
        const first = jest.fn();
        const current = jest.fn();
        const api = renderGallery({ onOpenChange: first });
        act(() => api.ref.current?.open(IMAGES, 0));
        if (phase === 'closing') {
          act(() => flights.land());
          fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
        }
        api.updateProps({ onOpenChange: current });
        api.unmount();
        act(() => flights.land());
        expect(first.mock.calls).toEqual([[true]]);
        expect(current.mock.calls).toEqual([[false]]);
      } finally {
        flights.restore();
        jest.useRealTimers();
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'uses the %s page theme without changing the overlay default',
    (mode) => {
      const page = renderGallery({ appearance: 'page' }, mode);
      act(() => page.ref.current?.open(IMAGES, 0));
      const backdrop = page.UNSAFE_getByType(BackdropComponent);
      expect(backdrop.props.blurIntensity).toBe(0);
      expect(backdrop.props.dimOpacity).toBe(1);
      expect(backdrop.props.dimColor).toBe(page.theme.colors.background);
      const caption = page.getByText('First');
      expect(caption.props.style).toEqual(
        expect.arrayContaining([{ color: page.theme.colors.text }]),
      );
      page.unmount();
      const overlay = renderGallery();
      act(() => overlay.ref.current?.open(IMAGES, 0));
      expect(overlay.UNSAFE_getByType(BackdropComponent).props.dimColor).toBeUndefined();
    },
  );

  it('draws the overlay share button as scrim chrome in a light theme, never a blank disc', () => {
    // The dim under the overlay is dark in every theme. The button was the
    // light `surface` material with a hard-coded white glyph: invisible in a
    // light theme (Allo, Android).
    jest.useFakeTimers();
    try {
      const api = renderGallery({}, 'light');
      act(() => api.ref.current?.open(IMAGES, 0));
      act(() => jest.advanceTimersByTime(1000));
      const button = api
        .UNSAFE_getAllByProps({ accessibilityLabel: 'Share media' })
        .find((node) => node.props.colors !== undefined);
      expect(button?.props.material).toBe('flat');
      expect(button?.props.colors).toEqual({ background: 'rgba(0,0,0,0.55)', foreground: '#fff' });
      expect(button?.props.icon.props.fill).toBe('#fff');
    } finally {
      jest.useRealTimers();
    }
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
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled)!;
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
    } finally {
      jest.useRealTimers();
    }
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
   * The transition used to be a timer chain (`0 ms` to start the springs, then
   * ~300 ms to swap the open surface for the pager, and a fixed 280 ms to
   * unmount on close). Each step guessed when an animation would be done, and a
   * gallery unmounted mid-transition left its timers holding the subtree — one
   * once fired inside the NEXT jest file. The open now starts from the commit
   * that mounts the overlay and both legs end in their animation's callback, so
   * there is no timer to leak.
   */
  it('schedules no timer for its transition', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
    try {
      const { ref, unmount } = renderGallery();
      const baseline = jest.getTimerCount();
      act(() => ref.current?.open(IMAGES, 0));
      expect(flights.held()).toBeGreaterThan(0);
      expect(jest.getTimerCount()).toBe(baseline);
      unmount();
      expect(jest.getTimerCount()).toBeLessThanOrEqual(baseline);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  /**
   * The flash on close was a SWAP: dismissing replaced the pager's page with a
   * second "open surface", a new image view that showed its placeholder and
   * cross-faded to the full image while it flew. One view now paints the media
   * from the first frame of the open to the last frame of the close.
   */
  it('paints the media with one image view from open to landing', () => {
    jest.useFakeTimers();
    const flights = holdAnimations();
    try {
      const api = renderGallery();
      const image = () => {
        const nodes = api
          .UNSAFE_getAllByProps({ accessibilityLabel: 'First' })
          .filter((node) => String(node.type) === 'ExpoImage');
        expect(nodes).toHaveLength(1);
        return nodes[0];
      };
      act(() => api.ref.current?.open(IMAGES, 0));
      const opening = image();
      act(() => {
        flights.land();
        jest.advanceTimersByTime(1000);
      });
      expect(image()).toBe(opening);
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      expect(image()).toBe(opening);
      act(() => flights.land());
      expect(api.queryAllByText('First')).toHaveLength(0);
    } finally {
      flights.restore();
      jest.useRealTimers();
    }
  });

  it('hides the thumbnail it stands in for until the fly-back lands', () => {
    const flights = holdAnimations();
    try {
      const hidden = { value: -1 } as SharedValue<number>;
      const api = renderGallery({ hiddenThumbIndex: hidden });
      act(() => api.ref.current?.open(IMAGES, 0));
      expect(hidden.value).toBe(0);
      act(() => flights.land());
      const pager = api.UNSAFE_getAllByType(ScrollView).find((node) => node.props.pagingEnabled);
      if (!pager) throw new Error('Expected the gallery pager');
      const width = Dimensions.get('window').width;
      fireEvent(pager, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width, y: 0 } } });
      expect(hidden.value).toBe(1);
      fireEvent.press(api.UNSAFE_getByType(BackdropComponent));
      expect(hidden.value).toBe(1);
      act(() => flights.land());
      expect(hidden.value).toBe(-1);
    } finally {
      flights.restore();
    }
  });

  /**
   * With a preview (the thumbnail's own, already decoded URL) the open waits
   * for it to paint before it hides the thumbnail and moves. Started at the
   * commit instead, the avatar left a hole for a frame or two and the photo
   * first appeared already on its way (Pixel 8a recording).
   */
  it('hides the thumbnail and starts the flight once the preview has painted', () => {
    const flights = holdAnimations();
    try {
      const hidden = { value: -1 } as SharedValue<number>;
      const api = renderGallery({ hiddenThumbIndex: hidden });
      act(() =>
        api.ref.current?.open(
          [{ uri: 'https://cloud.oxy.so/full.jpg', previewUri: 'https://cloud.oxy.so/thumb.jpg' }],
          0,
        ),
      );
      expect(hidden.value).toBe(-1);
      expect(flights.held()).toBe(0);
      const preview = hostNodes(api.toJSON()).find(
        (node) =>
          node.type === 'ExpoImage' &&
          (node.props.source as { uri?: string } | undefined)?.uri ===
            'https://cloud.oxy.so/thumb.jpg',
      );
      expect(preview).toBeDefined();
      act(() => (preview?.props.onDisplay as () => void)());
      expect(hidden.value).toBe(0);
      expect(flights.held()).toBeGreaterThan(0);
    } finally {
      flights.restore();
    }
  });

  it('gives the thumbnail back when it unmounts mid-flight', () => {
    const flights = holdAnimations();
    try {
      const hidden = { value: -1 } as SharedValue<number>;
      const api = renderGallery({ hiddenThumbIndex: hidden });
      act(() => api.ref.current?.open(IMAGES, 1));
      expect(hidden.value).toBe(1);
      api.unmount();
      expect(hidden.value).toBe(-1);
    } finally {
      flights.restore();
    }
  });
});

/**
 * The pager mounts with the overlay, so it must be seated on the opened page
 * once it exists. `contentOffset` alone left the web pager on page 0 while the
 * counter read "2 / 2", and the arrows then paged from the wrong place.
 */
it('seats the pager on the opened page once the overlay is committed', () => {
  const scrollTo = jest.fn();
  const ref = createRef<ZoomableMediaGalleryHandle>();
  render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
    {
      createNodeMock: (element) =>
        (element.props as { testID?: string }).testID === 'bloom-media-gallery-pager'
          ? { scrollTo }
          : null,
    },
  );
  act(() => ref.current?.open(IMAGES, 1));
  expect(scrollTo).toHaveBeenCalledWith({
    x: Dimensions.get('window').width,
    y: 0,
    animated: false,
  });
});
