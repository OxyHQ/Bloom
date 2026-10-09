import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Carousel, CarouselItem } from '../carousel';
import { Text } from '../typography';
import { resolveCarouselPaint } from '../carousel/Carousel';
import type { Theme } from '../theme/types';

const scrollTo = jest.fn();
let mockRtl = false;
jest.mock('../hooks/use-is-rtl', () => ({
  useIsRtl: () => mockRtl,
  useDirectionProps: () => ({}),
}));

// The shared mock's ScrollView is a bare host element with no imperative
// handle; the carousel scrolls through `ref.scrollTo`.
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  const ScrollView = ReactActual.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    ReactActual.useImperativeHandle(ref, () => ({ scrollTo: (...args: unknown[]) => scrollTo(...args) }));
    return ReactActual.createElement('ScrollView', props, props.children);
  });
  return { ...actual, ScrollView };
});

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const layout = (x: number, width: number) => ({ nativeEvent: { layout: { x, y: 0, width, height: 100 } } });

function gallery(props: Partial<React.ComponentProps<typeof Carousel>> = {}, count = 4) {
  return (
    <Carousel accessibilityLabel="Gallery" testID="carousel" {...props}>
      {Array.from({ length: count }, (_, i) => (
        <CarouselItem key={i} testID={`slide-${i}`}>
          <></>
        </CarouselItem>
      ))}
    </Carousel>
  );
}

/** Lay the track out at 400 wide with 400-wide slides 16 apart, then scroll to `x`. */
function layOut(api: ReturnType<typeof render>, count = 4) {
  const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
  act(() => {
    fireEvent(track, 'layout', layout(0, 400));
    fireEvent(track, 'contentSizeChange', count * 400 + (count - 1) * 16, 100);
  });
  for (let i = 0; i < count; i++) {
    act(() => {
      fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(i * 416, 400));
    });
  }
  return (x: number) =>
    act(() => {
      fireEvent.scroll(track, {
        nativeEvent: {
          contentOffset: { x, y: 0 },
          contentSize: { width: count * 400 + (count - 1) * 16, height: 100 },
          layoutMeasurement: { width: 400, height: 100 },
        },
      });
    });
}

describe('Carousel', () => {
  beforeEach(() => scrollTo.mockClear());

  it('wraps controls between distinct stops without hiding either boundary control', () => {
    const api = renderWithTheme(gallery({ loop: true, hideUnavailableArrows: true, arrowsPlacement: 'footer', footer: <Text>Thumbnails</Text> }));
    const scroll = layOut(api);
    expect(api.getByText('Thumbnails')).toBeTruthy();
    expect(api.getByLabelText('Previous slide').props.disabled).toBe(false);
    fireEvent.press(api.getByLabelText('Previous slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 1248, animated: true });
    scroll(1248);
    expect(api.getByLabelText('Next slide').props.disabled).toBe(false);
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: true });
    const single = renderWithTheme(gallery({ loop: true }, 1));
    layOut(single, 1);
    expect(single.getByLabelText('Previous slide').props.disabled).toBe(true);
    expect(single.getByLabelText('Next slide').props.disabled).toBe(true);
  });

  it('does not report the last slide from unmeasured or hidden web geometry', () => {
    const onIndexChange = jest.fn();
    const api = renderWithTheme(gallery({ onIndexChange }));
    for (let i = 0; i < 4; i++) fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(0, 0));
    expect(onIndexChange).not.toHaveBeenCalled();
    const scroll = layOut(api);
    expect(onIndexChange).not.toHaveBeenCalled();
    scroll(416);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('keeps hover-requested arrows operable on native and honors explicit hiding', () => {
    const api = renderWithTheme(gallery({ arrowsVisibility: 'hover', arrowsPlacement: 'overlay' }));
    layOut(api);
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ x: 416 }));
    const hidden = renderWithTheme(gallery({ arrowsVisibility: 'hover', showArrows: false }));
    expect(hidden.queryByLabelText('Next slide')).toBeNull();
  });

  it('retains arrow slots while excluding unavailable controls from accessibility', () => {
    const api = renderWithTheme(gallery({ hideUnavailableArrows: true, arrowsPlacement: 'overlay' }));
    const scroll = layOut(api);
    expect(api.queryByLabelText('Previous slide')).toBeNull();
    expect(api.getByLabelText('Next slide')).toBeTruthy();
    const hidden = api.getByLabelText('Previous slide', { includeHiddenElements: true });
    expect(hidden.props.disabled).toBe(true);
    scroll(1248);
    expect(api.queryByLabelText('Next slide')).toBeNull();
    expect(api.getByLabelText('Previous slide')).toBeTruthy();
    scroll(416);
    expect(api.getByLabelText('Next slide')).toBeTruthy();
    expect(api.getByLabelText('Previous slide')).toBeTruthy();
  });

  it('forwards the arrow visual recipe while retaining navigation ownership', () => {
    const api = renderWithTheme(gallery({ arrowButtonProps: { material: 'flat', size: 'sm', iconSize: 20, className: 'rounded-full' } }));
    layOut(api);
    const button = api.UNSAFE_getAllByType(require('../button').Button).find(node => node.props.accessibilityLabel === 'Next slide');
    expect(button?.props).toMatchObject({ material: 'flat', size: 'sm', iconSize: 20, className: 'rounded-full', disabled: false });
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ x: 416 }));
  });

  it('names the region and numbers every slide', () => {
    const api = renderWithTheme(gallery());
    expect(api.getByTestId('carousel').props.accessibilityLabel).toBe('Gallery');
    expect(api.getByTestId('carousel').props.role).toBe('group');
    expect(api.getByTestId('slide-0').props.accessibilityLabel).toBe('1 of 4');
    expect(api.getByTestId('slide-3').props.accessibilityLabel).toBe('4 of 4');
  });

  it('renders arrows and one dot per slide, and hides them on request', () => {
    const api = renderWithTheme(gallery());
    expect(api.getByLabelText('Previous slide')).toBeTruthy();
    expect(api.getByLabelText('Next slide')).toBeTruthy();
    expect(api.getAllByLabelText(/^Go to slide \d$/)).toHaveLength(4);

    const bare = renderWithTheme(gallery({ showArrows: false, showDots: false }));
    expect(bare.queryByLabelText('Previous slide')).toBeNull();
    expect(bare.queryAllByLabelText(/^Go to slide/)).toHaveLength(0);

    const single = renderWithTheme(gallery({}, 1));
    expect(single.queryAllByLabelText(/^Go to slide/)).toHaveLength(0);
  });

  it('disables previous at the start and next at the end, and pins the last dot', () => {
    const onIndexChange = jest.fn();
    const api = renderWithTheme(gallery({ onIndexChange }));
    const scroll = layOut(api);

    expect(api.getByLabelText('Previous slide').props.disabled).toBe(true);
    expect(api.getByLabelText('Next slide').props.disabled).toBe(false);
    expect(api.getByLabelText('Go to slide 1').props['aria-current']).toBe(true);

    scroll(416);
    expect(api.getByLabelText('Go to slide 2').props['aria-current']).toBe(true);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    // Fully scrolled: the end is pinned, not measured.
    scroll(4 * 400 + 3 * 16 - 400);
    expect(api.getByLabelText('Next slide').props.disabled).toBe(true);
    expect(api.getByLabelText('Go to slide 4').props['aria-current']).toBe(true);
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
  });

  it('scrolls to a slide from the arrows and the dots, with native snap offsets', () => {
    const api = renderWithTheme(gallery());
    layOut(api);

    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 416, animated: true });

    fireEvent.press(api.getByLabelText('Go to slide 3'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 832, animated: true });

    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    expect(track.props.snapToOffsets).toEqual([0, 416, 832, 1248]);
  });

  it('centres slides when align="center"', () => {
    const api = renderWithTheme(
      <Carousel accessibilityLabel="Peek" align="center">
        {[0, 1, 2].map((i) => (
          <CarouselItem key={i} testID={`slide-${i}`} width={300}>
            <></>
          </CarouselItem>
        ))}
      </Carousel>,
    );
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    act(() => {
      fireEvent(track, 'layout', layout(0, 400));
      fireEvent(track, 'contentSizeChange', 3 * 300 + 2 * 16, 100);
    });
    [0, 1, 2].forEach((i) =>
      act(() => {
        fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(i * 316, 300));
      }),
    );
    // Centre offset = x − (400 − 300) / 2, clamped to [0, content − viewport].
    expect(track.props.snapToOffsets).toEqual([0, 266, 532]);
    expect(api.getByTestId('slide-1').props.style).toEqual(
      expect.arrayContaining([{ width: 300 }]),
    );
  });
  it('shares the arrows row with a header, and renders the header without arrows', () => {
    const withArrows = renderWithTheme(gallery({ header: <Text>Who to follow</Text> }));
    expect(withArrows.getByText('Who to follow')).toBeTruthy();
    expect(withArrows.getByLabelText('Next slide')).toBeTruthy();

    const alone = renderWithTheme(gallery({ header: <Text>Who to follow</Text>, showArrows: false }));
    expect(alone.getByText('Who to follow')).toBeTruthy();
    expect(alone.queryByLabelText('Next slide')).toBeNull();
  });

  it('pads the track by `inset` and snaps a slide to the inset, not flush', () => {
    const api = renderWithTheme(
      <Carousel accessibilityLabel="Inset" inset={12} gap={12}>
        {[0, 1, 2].map((i) => (
          <CarouselItem key={i} testID={`slide-${i}`} width={172}>
            <></>
          </CarouselItem>
        ))}
      </Carousel>,
    );
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    expect(track.props.contentContainerStyle).toEqual({ gap: 12, paddingHorizontal: 12 });
    act(() => {
      fireEvent(track, 'layout', layout(0, 400));
      fireEvent(track, 'contentSizeChange', 12 + 3 * 172 + 2 * 12 + 12, 100);
    });
    [0, 1, 2].forEach((i) =>
      act(() => {
        fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(12 + i * 184, 172));
      }),
    );
    // Start offset = x − inset, clamped to [0, content − viewport] (564 − 400).
    // Slides 1 and 2 both clamp to 164: ONE stop, so one snap offset.
    expect(track.props.snapToOffsets).toEqual([0, 164]);
  });
  it('steps back from the far end when several slides share the end offset', () => {
    // Narrow slides: the last three all clamp to the same end offset (532), so
    // "the slide before the active one" is where the track already is. The
    // arrow must step to the previous DISTINCT resting place instead.
    const api = renderWithTheme(
      <Carousel accessibilityLabel="Narrow" inset={12} gap={12}>
        {[0, 1, 2, 3, 4].map((i) => (
          <CarouselItem key={i} testID={`slide-${i}`} width={172}>
            <></>
          </CarouselItem>
        ))}
      </Carousel>,
    );
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    const content = 12 + 5 * 172 + 4 * 12 + 12;
    act(() => {
      fireEvent(track, 'layout', layout(0, 400));
      fireEvent(track, 'contentSizeChange', content, 100);
    });
    [0, 1, 2, 3, 4].forEach((i) =>
      act(() => {
        fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(12 + i * 184, 172));
      }),
    );
    const scroll = (x: number) =>
      act(() => {
        fireEvent.scroll(track, {
          nativeEvent: {
            contentOffset: { x, y: 0 },
            contentSize: { width: content, height: 100 },
            layoutMeasurement: { width: 400, height: 100 },
          },
        });
      });

    scroll(content - 400);
    fireEvent.press(api.getByLabelText('Previous slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 368, animated: true });

    // And forward from mid-track, the next arrow skips offsets it already sits on.
    scroll(368);
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 532, animated: true });
  });
  describe('narrow slides share their stops', () => {
    // Five 172px slides in a 400px track, inset 12, gap 12: slides 3 and 4
    // cannot reach the start edge, so they rest where slide 2's end clamp does.
    const content = 12 + 5 * 172 + 4 * 12 + 12; // 932 → max offset 532

    function narrow(props: Partial<React.ComponentProps<typeof Carousel>> = {}) {
      const api = renderWithTheme(
        <Carousel accessibilityLabel="Narrow" inset={12} gap={12} {...props}>
          {[0, 1, 2, 3, 4].map((i) => (
            <CarouselItem key={i} testID={`slide-${i}`} width={172}>
              <></>
            </CarouselItem>
          ))}
        </Carousel>,
      );
      const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
      act(() => {
        fireEvent(track, 'layout', layout(0, 400));
        fireEvent(track, 'contentSizeChange', content, 100);
      });
      [0, 1, 2, 3, 4].forEach((i) =>
        act(() => {
          fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(12 + i * 184, 172));
        }),
      );
      const scroll = (x: number) =>
        act(() => {
          fireEvent.scroll(track, {
            nativeEvent: {
              contentOffset: { x, y: 0 },
              contentSize: { width: content, height: 100 },
              layoutMeasurement: { width: 400, height: 100 },
            },
          });
        });
      return { api, track, scroll };
    }

    it('draws one dot per stop, so no dot scrolls nowhere', () => {
      const { api, track } = narrow();

      // Stops: 0 (slide 1), 184 (slide 2), 368 (slide 3), 532 (the end, slide 5).
      expect(track.props.snapToOffsets).toEqual([0, 184, 368, 532]);
      expect(api.queryByLabelText('Go to slide 4')).toBeNull();
      fireEvent.press(api.getByLabelText('Go to slide 5'));
      expect(scrollTo).toHaveBeenLastCalledWith({ x: 532, animated: true });
    });

    it('names the active slide by where its stop RESTS, inset included', () => {
      const onIndexChange = jest.fn();
      const { api, scroll } = narrow({ onIndexChange });

      // 184 is slide 2's resting offset (its x is 196 = 184 + inset).
      scroll(184);
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
      expect(api.getByLabelText('Go to slide 2').props['aria-current']).toBe(true);

      // At 282 the nearest RESTING offset is slide 3's (368, 86 away; slide 2's
      // 184 is 98 away). Compared against where the slides SIT (196 and 380),
      // it would be slide 2 — off by the inset.
      scroll(282);
      expect(onIndexChange).toHaveBeenLastCalledWith(2);

      scroll(532);
      expect(onIndexChange).toHaveBeenLastCalledWith(4);
      expect(api.getByLabelText('Go to slide 5').props['aria-current']).toBe(true);
    });
  });
});

describe('Carousel RTL scrolling', () => {
  const originalOS = Platform.OS;
  afterEach(() => { mockRtl = false; Platform.OS = originalOS; });

  it.each(['ios', 'android'] as const)('normalizes %s offsets for arrows, shared end stops and snapping', os => {
    mockRtl = true;
    Platform.OS = os;
    const onIndexChange = jest.fn();
    const api = renderWithTheme(<Carousel accessibilityLabel="RTL gallery" arrowsPlacement="overlay" gap={12} onIndexChange={onIndexChange}>
      {[0, 1, 2, 3, 4].map(i => <CarouselItem key={i} testID={`slide-${i}`} width={172}><></></CarouselItem>)}
    </Carousel>);
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    const contentWidth = 5 * 172 + 4 * 12;
    const max = contentWidth - 400;
    act(() => {
      fireEvent(track, 'layout', layout(0, 400));
      fireEvent(track, 'contentSizeChange', contentWidth, 100);
    });
    for (let i = 0; i < 5; i++) {
      act(() => { fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(contentWidth - i * 184 - 172, 172)); });
    }
    const scroll = (logical: number) => act(() => fireEvent.scroll(track, { nativeEvent: {
      contentOffset: { x: os === 'android' ? max - logical : logical, y: 0 },
      contentSize: { width: contentWidth, height: 100 },
    } }));
    scroll(0);
    expect(api.getByLabelText('Previous slide').props.disabled).toBe(true);
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: os === 'android' ? max - 184 : 184, animated: true });
    scroll(max);
    expect(api.getByLabelText('Next slide').props.disabled).toBe(true);
    expect(onIndexChange).toHaveBeenLastCalledWith(4);
    fireEvent.press(api.getByLabelText('Previous slide'));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: os === 'android' ? max - 368 : 368, animated: true });
    expect(track.props.snapToOffsets).toEqual(os === 'ios' ? [0, 140, 324, 508] : [0, 184, 368, 508]);
  });
});

describe('controlled Carousel', () => {
  const originalOS = Platform.OS;
  beforeEach(() => { jest.useFakeTimers(); scrollTo.mockClear(); });
  afterEach(() => { jest.useRealTimers(); mockRtl = false; Platform.OS = originalOS; });
  const wrapped = (props: Partial<React.ComponentProps<typeof Carousel>>, count = 4) =>
    <BloomThemeProvider mode="light" colorPreset="teal">{gallery(props, count)}</BloomThemeProvider>;

  it.each(['ios', 'android'] as const)('wraps controlled RTL navigation on %s without changing native offsets', os => {
    mockRtl = true; Platform.OS = os;
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 0, loop: true, onIndexChange }));
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    act(() => { fireEvent(track, 'layout', layout(0, 400)); fireEvent(track, 'contentSizeChange', 1648, 100); });
    for (let i = 0; i < 4; i++) act(() => fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(1248 - i * 416, 400)));
    fireEvent.press(api.getByLabelText('Previous slide'));
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
    api.rerender(wrapped({ index: 3, loop: true, onIndexChange }));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: os === 'android' ? 0 : 1248, animated: true });
    fireEvent.scroll(track, { nativeEvent: { contentOffset: { x: os === 'android' ? 0 : 1248, y: 0 }, contentSize: { width: 1648, height: 100 } } });
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    api.rerender(wrapped({ index: 0, loop: true, onIndexChange }));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: os === 'android' ? 1248 : 0, animated: true });
  });

  it('positions a nonzero initial index, animates external selection and never echoes intermediate events', () => {
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 2, onIndexChange }));
    const scroll = layOut(api);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 832, animated: false });
    scroll(416); scroll(832); scroll(832);
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).not.toHaveBeenCalled();
    api.rerender(wrapped({ index: 3, onIndexChange }));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 1248, animated: true });
    scroll(1000); scroll(1248);
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('requests arrow navigation but only moves when the owner accepts it', () => {
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 1, onIndexChange }));
    const scroll = layOut(api);
    scroll(416);
    scrollTo.mockClear();
    fireEvent.press(api.getByLabelText('Next slide'));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(scrollTo).not.toHaveBeenCalled();
    api.rerender(wrapped({ index: 2, onIndexChange }));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 832, animated: true });
    scroll(832);
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it('waits for a drag to finish, reports once, and restores a rejected swipe without a feedback loop', () => {
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 1, onIndexChange }));
    const scroll = layOut(api);
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    scroll(416);
    fireEvent(track, 'scrollBeginDrag');
    scroll(832);
    act(() => jest.advanceTimersByTime(300));
    expect(onIndexChange).not.toHaveBeenCalled();
    fireEvent(track, 'scrollEndDrag');
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 416, animated: false });
    scroll(416);
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it('retains its selected child across resize and clamps after list removal without notifying', () => {
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 3, onIndexChange }));
    const scroll = layOut(api);
    scroll(1248);
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    act(() => {
      fireEvent(track, 'layout', layout(0, 300));
      fireEvent(track, 'contentSizeChange', 4 * 300 + 3 * 16, 100);
    });
    for (let i = 0; i < 4; i++) act(() => fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(i * 316, 300)));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 948, animated: false });
    api.rerender(wrapped({ index: 3, onIndexChange }, 2));
    act(() => fireEvent(track, 'contentSizeChange', 616, 100));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 316, animated: false });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('cancels pending swipe notifications when the list empties and can select after repopulation', () => {
    const onIndexChange = jest.fn();
    const api = render(wrapped({ index: 0, onIndexChange }));
    const scroll = layOut(api);
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    fireEvent(track, 'scrollBeginDrag'); scroll(416); fireEvent(track, 'scrollEndDrag');
    api.rerender(wrapped({ index: 0, onIndexChange }, 0));
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(api.queryByLabelText('Next slide')).toBeNull();
    api.rerender(wrapped({ index: 2, onIndexChange }, 3));
    layOut(api, 3);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 832, animated: false });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it.each(['ios', 'android'] as const)('selects a narrow child by its own index in RTL on %s, including shared end stops', os => {
    mockRtl = true; Platform.OS = os;
    const onIndexChange = jest.fn();
    const api = renderWithTheme(<Carousel accessibilityLabel="Controlled RTL" index={3} gap={12} onIndexChange={onIndexChange}>
      {[0, 1, 2, 3, 4].map(i => <CarouselItem key={i} testID={`slide-${i}`} width={172}><></></CarouselItem>)}
    </Carousel>);
    const track = api.UNSAFE_getByType('ScrollView' as unknown as React.ComponentType);
    const contentWidth = 908, max = 508;
    act(() => { fireEvent(track, 'layout', layout(0, 400)); fireEvent(track, 'contentSizeChange', contentWidth, 100); });
    for (let i = 0; i < 5; i++) act(() => fireEvent(api.getByTestId(`slide-${i}`), 'layout', layout(contentWidth - i * 184 - 172, 172)));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: os === 'android' ? 0 : max, animated: false });
    const scroll = (logical: number) => fireEvent.scroll(track, { nativeEvent: {
      contentOffset: { x: os === 'android' ? max - logical : logical, y: 0 }, contentSize: { width: contentWidth, height: 100 },
    } });
    act(() => { scroll(max); scroll(max); jest.advanceTimersByTime(200); });
    expect(onIndexChange).not.toHaveBeenCalled(); // child3 shares the end stop with child4
    fireEvent(track, 'scrollBeginDrag');
    act(() => scroll(0));
    fireEvent(track, 'scrollEndDrag');
    act(() => jest.advanceTimersByTime(200));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });
});

describe('resolveCarouselPaint', () => {
  it('paints the active dot in the text colour and separates rest from hover in both modes', () => {
    const themes: Theme[] = [];
    const { useTheme } = jest.requireActual('../theme/use-theme') as typeof import('../theme/use-theme');
    function Grab() {
      themes.push(useTheme());
      return null;
    }
    renderWithTheme(<Grab />, 'light');
    renderWithTheme(<Grab />, 'dark');
    for (const theme of themes) {
      const paint = resolveCarouselPaint(theme);
      expect(paint.dotActive).toBe(theme.colors.text);
      expect(paint.dot).not.toBe(paint.dotHover);
    }
  });
});
