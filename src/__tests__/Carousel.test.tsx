import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Carousel, CarouselItem } from '../carousel';
import { Text } from '../typography';
import { resolveCarouselPaint } from '../carousel/Carousel';
import type { Theme } from '../theme/types';

const scrollTo = jest.fn();

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
    expect(track.props.snapToOffsets).toEqual([0, 164, 164]);
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
