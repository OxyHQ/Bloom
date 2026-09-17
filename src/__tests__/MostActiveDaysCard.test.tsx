import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { MostActiveDaysCard, currentMonthAt, type ActivityDay } from '../chart-cards/MostActiveDaysCard';
import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';

const TODAY = { month: 6, day: 10 };
const rings = ({ month, day }: ActivityDay) =>
  month > TODAY.month || (month === TODAY.month && day > TODAY.day) ? null : [0.25, 0.5, 0.75];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Node = { props: Record<string, unknown> };

describe('currentMonthAt', () => {
  it('picks the last month whose title is within 24px of the viewport top', () => {
    const tops = [10, 400, 800, 1200];
    expect(currentMonthAt(0, tops)).toBe(0);
    expect(currentMonthAt(375, tops)).toBe(0);
    expect(currentMonthAt(376, tops)).toBe(1);
    expect(currentMonthAt(1190, tops)).toBe(3);
  });
});

describe('MostActiveDaysCard', () => {
  it('keeps the medical card shell and the inner panel', () => {
    const { getByTestId, getByText } = renderCard(<MostActiveDaysCard testID="days" year={2026} headline={32459} rings={rings} />);
    expect(resolvedStyle(getByTestId('days').props.style)).toMatchObject({ height: 330, borderRadius: 20, paddingTop: 10 });
    expect(getByTestId('days-headline').props.children).toBe('32,459');
    expect(getByText('Most active days')).toBeTruthy();
    expect(getByText('total steps')).toBeTruthy();
    const panel = getByTestId('days-scroll').parent!;
    const palette = resolveChartCardPalette(buildTheme('teal', 'light'));
    let node: typeof panel | null = panel;
    while (node && resolvedStyle(node.props.style).backgroundColor !== palette.inner) node = node.parent;
    expect(resolvedStyle(node?.props.style)).toMatchObject({ borderRadius: 10, paddingLeft: 10, paddingRight: 10, overflow: 'hidden' });
    expect(resolvedStyle(getByTestId('days-month').props.style).width).toBe(128);
  });

  it('lays out every day of the year, February by the year', () => {
    const leap = renderCard(<MostActiveDaysCard testID="days" year={2028} headline={0} rings={rings} />);
    expect(leap.getByTestId('days-day-1-29')).toBeTruthy();
    leap.unmount();
    const { queryByTestId, getByTestId } = renderCard(<MostActiveDaysCard testID="days" year={2026} headline={0} rings={rings} />);
    expect(queryByTestId('days-day-1-29')).toBeNull();
    expect(getByTestId('days-day-11-31')).toBeTruthy();
  });

  it('names each day, marks the selected one both ways and reports presses', () => {
    const onSelectDay = jest.fn();
    const { getByTestId } = renderCard(
      <MostActiveDaysCard testID="days" year={2026} headline={0} rings={rings} selectedDay={{ month: 6, day: 8 }} onSelectDay={onSelectDay} />,
    );
    const selected = getByTestId('days-day-6-8');
    expect(selected.props).toMatchObject({ role: 'button', 'aria-pressed': true, accessibilityLabel: 'Activity for July 8' });
    expect(selected.props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('days-day-6-9').props['aria-pressed']).toBe(false);
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    expect(resolvedStyle(selected.props.style)).toMatchObject({
      height: 78,
      borderRadius: 10,
      borderWidth: 2,
      backgroundColor: palette.pill.background,
      paddingTop: 10,
      gap: 10,
    });
    expect(resolvedStyle(getByTestId('days-day-6-9').props.style).borderColor).toBe('transparent');
    fireEvent.press(getByTestId('days-day-2-14'));
    expect(onSelectDay).toHaveBeenCalledWith({ month: 2, day: 14 });
  });

  it('draws three rings from 12 o’clock, and tracks only for a day without data', () => {
    const { getByTestId } = renderCard(<MostActiveDaysCard testID="days" year={2026} headline={0} rings={rings} />);
    const theme = buildTheme('teal', 'light');
    const circlesOf = (id: string) => {
      const out: Node[] = [];
      const walk = (n: { type: unknown; props: Record<string, unknown>; children: unknown[] }) => {
        if (n.type === 'Circle') out.push(n);
        for (const c of n.children) if (c && typeof c === 'object') walk(c as never);
      };
      walk(getByTestId(id) as never);
      return out;
    };
    const past = circlesOf('days-day-6-10');
    expect(past.map((c) => [c.props.r, c.props.opacity ?? 1])).toEqual([
      [12, 0.16],
      [12, 1],
      [8.4, 0.16],
      [8.4, 1],
      [4.8, 0.16],
      [4.8, 1],
    ]);
    expect(past[1]!.props.stroke).toBe(chartHueTone(theme, 3).activeColor);
    expect(past[3]!.props.stroke).toBe(chartHueTone(theme, 2).color);
    expect(past[5]!.props.stroke).toBe(chartHueTone(theme, 4).color);
    const c = 2 * Math.PI * 12;
    expect(past[1]!.props.strokeDasharray).toBe(`${c * 0.25} ${c - c * 0.25}`);
    expect(past[1]!.props.strokeLinecap).toBe('round');
    expect(circlesOf('days-day-6-11').map((n) => n.props.opacity)).toEqual([0.16, 0.16, 0.16]);
  });

  it('names the month at the top of the scroll and names its chevrons', () => {
    const { getByTestId, getAllByText } = renderCard(
      <MostActiveDaysCard testID="days" year={2026} headline={0} rings={rings} />,
    );
    const scroll = getByTestId('days-scroll');
    // Give every month a laid-out top: 10px content padding, then 400px per month.
    const months = scroll.props.children as unknown[];
    expect(months).toHaveLength(12);
    const blocks = scroll.children.filter((n) => typeof n === 'object') as unknown as { props: { onLayout: (e: unknown) => void } }[];
    act(() => {
      blocks.forEach((b, i) => b.props.onLayout({ nativeEvent: { layout: { x: 0, y: 10 + i * 400, width: 320, height: 384 } } }));
    });
    expect(getAllByText('January', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    act(() => {
      fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { x: 0, y: 2800 } } });
    });
    expect(getAllByText('August', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    expect(getByTestId('days-month-prev').props.accessibilityLabel).toBe('Previous month');
  });
});
