import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { StepsCard, stepsBars, type StepsPoint } from '../chart-cards/StepsCard';
import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';

// The base week ("29 Jun - 5 Jul"). Every expected pixel below was read
// off recharts' SVG for the card at 360 wide: a 351 × 232 chart.
const WEEK: StepsPoint[] = [
  { label: 'Mon', value: 5600 },
  { label: 'Tue', value: 2200 },
  { label: 'Wed', value: 1900 },
  { label: 'Thu', value: 6300 },
  { label: 'Fri', value: 7100 },
  { label: 'Sat', value: 5300 },
  { label: 'Sun', value: 3200 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown, width = 351, height = 232) {
  act(() => {
    fireEvent(getByTestId('steps-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('steps bar geometry matches recharts', () => {
  it('puts 4.5px either side of a 41px bar in each band', () => {
    const bars = stepsBars(351, 7);
    expect(bars[0]).toEqual({ x: 4.5, width: 41 });
    expect(bars[1]!.x).toBeCloseTo(54.642857, 5);
    expect(bars[6]!.x).toBeCloseTo(305.357143, 5);
  });

  it('caps a wide bar at 50 and centres it in the band', () => {
    const [bar] = stepsBars(700, 7);
    // band 100: 91 → 50, the 41 left over split around it.
    expect(bar).toEqual({ x: 25, width: 50 });
  });
});

describe('StepsCard', () => {
  it("keeps the medical card shell: 330 tall, radius 20, 10px inset, header 16px in", () => {
    const { getByTestId } = renderCard(<StepsCard testID="steps" data={WEEK} range="29 Jun - 5 Jul" />);
    expect(resolvedStyle(getByTestId('steps').props.style)).toMatchObject({
      height: 330,
      borderRadius: 20,
      gap: 16,
      paddingTop: 10,
      paddingLeft: 10,
      paddingRight: 10,
      paddingBottom: 10,
    });
    expect(resolvedStyle(getByTestId('steps-plot').props.style)).toMatchObject({ marginLeft: -5.5, marginRight: -5.5 });
    expect(resolvedStyle(getByTestId('steps-range').props.style)).toMatchObject({
      width: 151,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      paddingLeft: 4,
    });
  });

  it('headlines the week total with its suffix', () => {
    const { getByTestId, getByText } = renderCard(<StepsCard testID="steps" data={WEEK} />);
    expect(getByTestId('steps-headline').props.children).toBe('31,600');
    expect(getByText('Steps')).toBeTruthy();
    expect(getByText('total steps')).toBeTruthy();
  });

  it('draws tracks, bars and labels on recharts pixels', () => {
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(<StepsCard testID="steps" data={WEEK} />);
    layoutPlot(getByTestId);
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const rects = UNSAFE_getAllByType('Rect' as never) as unknown as Node[];
    const tracks = rects.filter((r) => r.props.fill === palette.track);
    expect(tracks.map((r) => [r.props.y, r.props.height, r.props.rx])).toEqual(Array(7).fill([4, 202, 10]));
    const bars = WEEK.map((_, i) => getByTestId(`steps-bar-${i}`));
    // recharts: Mon y 64.6 h 141.4 … Sun y 125.2 h 80.8 on a [0, 8000] domain.
    const heights = [141.4, 55.55, 47.975, 159.075, 179.275, 133.825, 80.8];
    bars.forEach((bar, i) => {
      expect(bar.props.height).toBeCloseTo(heights[i]!, 6);
      expect(bar.props.y).toBeCloseTo(206 - heights[i]!, 6);
      expect(bar.props.width).toBe(41);
      expect(bar.props.rx).toBe(10);
      expect(bar.props.fill).toBe(chartHueTone(theme, 1).color);
    });
    for (const day of ['Mon', 'Sun']) expect(getByText(day)).toBeTruthy();
  });

  it('hovers the band under the pointer: full day name, day count, outline, darker bar', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <StepsCard testID="steps" data={WEEK} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('steps-plot-surface');
    expect(surface.props.role).toBe('img');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 170, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(3);
    expect(getByText('Thursday')).toBeTruthy();
    expect(getByText('steps')).toBeTruthy();
    expect(getByTestId('steps-headline').props.children).toBe('6,300');
    const outline = getByTestId('steps-outline-3');
    expect(outline.props).toMatchObject({ opacity: 1, strokeWidth: 2, rx: 13, y: 1, height: 208 });
    expect(outline.props.x).toBeCloseTo(151.928571, 5);
    expect(getByTestId('steps-outline-2').props.opacity).toBe(0);
    expect(getByTestId('steps-bar-3').props.fill).toBe(chartHueTone(buildTheme('teal', 'light'), 1).activeColor);

    // Over the label row the day clears, as recharts' inactive tooltip does.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 170, offsetY: 220 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 350, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('turns the pill chevrons into named buttons when handlers are given', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const { getByTestId, getAllByText } = renderCard(
      <StepsCard testID="steps" data={WEEK} range="29 Jun - 5 Jul" onPrevRange={onPrev} onNextRange={onNext} />,
    );
    const prev = getByTestId('steps-range-prev');
    expect(prev.props.role).toBe('button');
    expect(prev.props.accessibilityLabel).toBe('Previous');
    fireEvent.press(prev);
    fireEvent.press(getByTestId('steps-range-next'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    // The rolling label keeps an invisible spacer copy for its line box.
    expect(getAllByText('29 Jun - 5 Jul', { includeHiddenElements: true }).length).toBeGreaterThanOrEqual(2);
  });

  it('renders a static pill without buttons', () => {
    const { queryByTestId, getByText } = renderCard(<StepsCard testID="steps" data={WEEK} range="This week" />);
    expect(queryByTestId('steps-range-prev')).toBeNull();
    expect(getByText('This week')).toBeTruthy();
  });

  it('paints the dark track and cursor from the neutral ramp', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<StepsCard testID="steps" data={WEEK} activeIndex={0} />, 'dark');
    layoutPlot(getByTestId);
    const palette = resolveChartCardPalette(buildTheme('teal', 'dark'));
    const rects = UNSAFE_getAllByType('Rect' as never) as unknown as Node[];
    expect(rects.filter((r) => r.props.fill === palette.track)).toHaveLength(7);
    expect(getByTestId('steps-outline-0').props.stroke).toBe(palette.cursor);
  });
});
