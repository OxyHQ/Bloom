/**
 * @jest-environment jsdom
 *
 * The web `ScrollArea` through the real react-native-web: the bar is a mirror of the scroller's
 * metrics, written straight to its element, and it shows and hides by the mode. jsdom has no
 * layout, so the scroller's metrics are defined by hand and a ResizeObserver stands in.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ScrollArea } from '../ScrollArea.web';
import type { ScrollAreaScrollbar } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

function mount(scrollbar?: ScrollAreaScrollbar, horizontal = false) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ScrollArea scrollbar={scrollbar} horizontal={horizontal} testID="area">
          <div style={{ height: 2000, width: 2000 }}>content</div>
        </ScrollArea>
      </BloomThemeProvider>,
    );
  });
  const area = container.querySelector('[data-testid="area"]') as HTMLElement;
  // The scroller is the area's first child (the bar, drawn after it, is the second).
  const scroller = area.firstElementChild as HTMLElement;
  // The metrics a laid-out 400px viewport over 2000px of content would report.
  for (const [key, value] of Object.entries({
    clientHeight: 400,
    scrollHeight: 2000,
    clientWidth: 400,
    scrollWidth: 2000,
  }))
    Object.defineProperty(scroller, key, { configurable: true, value });
  const track = () => area.querySelector('[aria-hidden="true"]') as HTMLElement;
  // …and the 400px track that bar would lie along (`never` draws none).
  for (const key of ['clientHeight', 'clientWidth'])
    if (track()) Object.defineProperty(track(), key, { configurable: true, value: 400 });
  const thumb = () => track().firstElementChild as HTMLElement;
  return { area, scroller, track, thumb };
}

function scrollTo(scroller: HTMLElement, y: number) {
  Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: y });
  act(() => {
    scroller.dispatchEvent(new Event('scroll'));
  });
}

describe('ScrollArea (web)', () => {
  it('hides the browser’s own bar on the scroller and draws its own over the content', () => {
    const { scroller, track } = mount();
    expect(scroller.hasAttribute('data-bloom-scroll-area')).toBe(true);
    expect(track().style.position).toBe('absolute');
  });

  it('mirrors the scroll position onto the thumb', () => {
    const { scroller, thumb } = mount('always');
    scrollTo(scroller, 0);
    // Viewport 400 of 2000 content: a fifth of the track, at its start.
    expect(thumb().style.transform).toBe('translateY(0px)');
    expect(parseFloat(thumb().style.height)).toBe(80);

    scrollTo(scroller, 1600);
    // 400 of 2000 content is an 80px thumb, and the bottom of the content is the end of the track.
    expect(thumb().style.height).toBe('80px');
    expect(thumb().style.transform).toBe('translateY(320px)');
  });

  it('shows while scrolling and lets go a moment after, in the default mode', () => {
    const { scroller, thumb } = mount();
    expect(thumb().style.opacity).toBe('0');
    scrollTo(scroller, 100);
    expect(thumb().style.opacity).not.toBe('0');
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(thumb().style.opacity).toBe('0');
  });

  it('shows over the area on hover, always on always, and never on never', () => {
    const hover = mount('hover');
    expect(hover.thumb().style.opacity).toBe('0');
    act(() => {
      hover.area.dispatchEvent(new Event('pointerenter'));
    });
    scrollTo(hover.scroller, 10);
    expect(hover.thumb().style.opacity).not.toBe('0');
    act(() => root.unmount());
    root = createRoot(container);

    const always = mount('always');
    scrollTo(always.scroller, 10);
    expect(always.thumb().style.opacity).not.toBe('0');
    act(() => root.unmount());
    root = createRoot(container);

    const never = mount('never');
    expect(never.area.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('takes no pointer events while hidden, so a click goes through to the content', () => {
    const { track } = mount();
    expect(track().style.pointerEvents).toBe('none');
  });

  it('puts a horizontal bar along the bottom edge', () => {
    const { track } = mount('always', true);
    expect(track().style.bottom).toBe('2px');
  });
});
