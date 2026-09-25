/**
 * Android hardware back on portaled surfaces (OxyHQ/Mention#1126).
 *
 * A Bloom surface that renders through `Portal` is not an RN `Modal`, so no
 * `onRequestClose` consumes the back press for it. The media viewer registered
 * nothing, so back fell through to the app, which — at the root of its stack —
 * finished the activity: the user pressed back to close an image and the whole
 * app closed. `OverlayRoot` now owns this for every surface, and these suites
 * pin the registration, the LIFO order, the release on close, the gallery's
 * use of it, and the gallery's safe-area chrome.
 */
import React, { createRef } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { OverlayRoot } from '../overlay';
import { resetOverlayStack } from '../overlay/stack';
import { PortalProvider, PortalOutlet } from '../portal';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle, GalleryImage } from '../zoomable-media-gallery';
import { findHost, hostNodes, resolvedStyle } from './support/rendered-style';

const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('../../__mocks__/react-native-safe-area-context'),
  useSafeAreaInsets: () => mockInsets,
}));

type Listener = () => boolean | null | undefined;
let listeners: Listener[] = [];
const removed = jest.fn();

beforeEach(() => {
  listeners = [];
  removed.mockClear();
  Platform.OS = 'android';
  (BackHandler as unknown as { addEventListener: unknown }).addEventListener = jest.fn(
    (_event: string, listener: Listener) => {
      listeners.push(listener);
      return {
        remove: () => {
          removed();
          listeners = listeners.filter((l) => l !== listener);
        },
      };
    },
  );
});

afterEach(() => {
  Platform.OS = 'ios';
  Object.assign(mockInsets, { top: 0, right: 0, bottom: 0, left: 0 });
  resetOverlayStack();
});

/** What Android does: newest listener first, stop at the first that consumes. */
function pressBack(): boolean {
  for (const listener of [...listeners].reverse()) {
    if (listener()) return true;
  }
  return false;
}

describe('OverlayRoot onRequestClose', () => {
  it('consumes back while mounted and releases it on close', () => {
    const close = jest.fn();
    const screen = render(<OverlayRoot onRequestClose={close} />);
    expect(pressBack()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);

    screen.unmount();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(pressBack()).toBe(false);
  });

  it('closes the surface opened LAST first', () => {
    const lower = jest.fn();
    const upper = jest.fn();
    render(
      <>
        <OverlayRoot onRequestClose={lower} />
        <OverlayRoot onRequestClose={upper} />
      </>,
    );
    pressBack();
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
  });

  it('calls the CURRENT handler without re-registering', () => {
    const first = jest.fn();
    const second = jest.fn();
    const screen = render(<OverlayRoot onRequestClose={first} />);
    screen.rerender(<OverlayRoot onRequestClose={second} />);
    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1);
    pressBack();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('leaves back alone for a surface with no handler, and off Android', () => {
    render(<OverlayRoot />);
    expect(BackHandler.addEventListener).not.toHaveBeenCalled();

    Platform.OS = 'ios';
    render(<OverlayRoot onRequestClose={jest.fn()} />);
    expect(BackHandler.addEventListener).not.toHaveBeenCalled();
  });

  it('marks a modal root, and only a modal root, as the accessibility modal', () => {
    const { toJSON } = render(
      <>
        <OverlayRoot modal testID="modal" />
        <OverlayRoot testID="plain" />
      </>,
    );
    expect(findHost(toJSON(), 'modal')?.props.accessibilityViewIsModal).toBe(true);
    expect(findHost(toJSON(), 'plain')?.props.accessibilityViewIsModal).toBeUndefined();
  });
});

const IMAGES: GalleryImage[] = [
  { uri: 'https://cloud.oxy.so/a.jpg', alt: 'First' },
  { uri: 'https://cloud.oxy.so/b.jpg', alt: 'Second' },
];

function renderGallery() {
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const utils = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <View testID="app" />
        <ZoomableMediaGallery ref={ref} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  return { ...utils, ref };
}

describe('ZoomableMediaGallery on Android', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('takes back only while open, and back closes the viewer, not the app', () => {
    const { ref, toJSON } = renderGallery();
    // Closed: the app's own back handling must be untouched.
    expect(pressBack()).toBe(false);

    act(() => {
      ref.current?.open(IMAGES, 0);
    });
    let consumed = false;
    act(() => {
      consumed = pressBack();
    });
    expect(consumed).toBe(true);

    // The dismiss flies the media home, then unmounts.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
    expect(findHost(toJSON(), 'app')).toBeTruthy();
    expect(pressBack()).toBe(false);
  });

  it('keeps the Share button and the caption inside the safe area', () => {
    Object.assign(mockInsets, { top: 44, right: 8, bottom: 34, left: 0 });
    const { ref, getByLabelText, getByText } = renderGallery();
    act(() => {
      ref.current?.open(IMAGES, 0);
    });
    // The share button arrives with the pager, once the open transition settles.
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const share = resolvedStyle(getByLabelText('Share media').props.style);
    expect(share.top).toBe(16 + 44);
    expect(share.right).toBe(16 + 8);

    // Two items, so the caption rides above the page indicator — both lifted
    // by the bottom inset.
    let captionWrap = getByText('First').parent;
    while (captionWrap && resolvedStyle(captionWrap.props.style).position !== 'absolute') {
      captionWrap = captionWrap.parent;
    }
    expect(resolvedStyle(captionWrap?.props.style).bottom).toBe(110 + 34);
  });
});
