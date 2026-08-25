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
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet } from '../portal';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle, GalleryImage } from '../zoomable-media-gallery';
import { hostNodes } from './support/rendered-style';

const IMAGES: GalleryImage[] = [
  { uri: 'https://cloud.oxy.so/a.jpg', alt: 'First' },
  { uri: 'https://cloud.oxy.so/b.jpg', alt: 'Second' },
];

function renderGallery() {
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const utils = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  return { ...utils, ref };
}

describe('ZoomableMediaGallery', () => {
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
