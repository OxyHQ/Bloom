import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { mixColor } from '../button/shared';
import { RiComputerLine } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { BarListCard, shareLabel, type BarListTab } from '../chart-cards/BarListCard';
import { resolveChartCardPalette, resolveChartTones, resolveMonoTone } from '../chart-cards/palette';

const TABS: BarListTab[] = [
  {
    id: 'devices',
    label: 'Devices',
    items: [
      { label: 'Desktop', value: 5980, icon: RiComputerLine },
      { label: 'Mobile', value: 3020 },
      { label: 'Tablet', value: 820 },
    ],
  },
  {
    id: 'browsers',
    label: 'Browsers',
    items: [
      { label: 'Chrome', value: 5210 },
      { label: 'Safari', value: 2640 },
      { label: 'Firefox', value: 860 },
      { label: 'Edge', value: 610 },
      { label: 'Samsung Internet', value: 240 },
      { label: 'Opera', value: 160 },
      { label: 'Brave', value: 100 },
    ],
  },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Node = { props: Record<string, unknown> };

describe('shareLabel', () => {
  it('prints whole percents, <0.5% for slivers and 0% for nothing', () => {
    expect(shareLabel(5980, 9820)).toBe('61%');
    expect(shareLabel(10, 9820)).toBe('<0.5%');
    expect(shareLabel(0, 9820)).toBe('0%');
    expect(shareLabel(5, 0)).toBe('0%');
  });
});

describe('BarListCard', () => {
  it('keeps the card: content-sized, radius 16, padding 4 / 16 / 12, 12px under the rule', () => {
    const { getByTestId } = renderCard(<BarListCard testID="barlist" tabs={TABS} />);
    const card = resolvedStyle(getByTestId('barlist').props.style);
    expect(card.height).toBeUndefined();
    expect(card).toMatchObject({ borderRadius: 16, gap: 12, paddingTop: 4, paddingLeft: 16, paddingRight: 16, paddingBottom: 12 });
    const palette = resolveChartCardPalette(buildTheme('teal', 'light'));
    expect(resolvedStyle(getByTestId('barlist-header').props.style)).toMatchObject({
      marginLeft: -16,
      marginRight: -16,
      paddingLeft: 16,
      paddingRight: 16,
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: palette.track,
    });
    expect(resolvedStyle(getByTestId('barlist-rows').props.style)).toMatchObject({ marginLeft: -8, marginRight: -8, marginBottom: -4 });
  });

  it('prints shares of the tab total by default, raw values with metric="value"', () => {
    const shares = renderCard(<BarListCard testID="barlist" tabs={TABS} />);
    for (const text of ['Desktop', '61%', '31%', '8%', 'Visitors']) expect(shares.getByText(text)).toBeTruthy();
    shares.unmount();
    const values = renderCard(<BarListCard testID="barlist" tabs={TABS} metric="value" metricLabel="People" />);
    for (const text of ['5,980', '3,020', '820', 'People']) expect(values.getByText(text)).toBeTruthy();
  });

  it('draws 36px rows with a 14% tint of chart-6, deepened to 26% on hover', () => {
    const { getByTestId } = renderCard(<BarListCard testID="barlist" tabs={TABS} />);
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const blue = resolveChartTones(theme)[1]!;
    expect(resolvedStyle(getByTestId('barlist-rows-row-0').props.style)).toMatchObject({
      height: 36,
      borderRadius: 8,
      paddingLeft: 10,
      paddingRight: 10,
    });
    expect(resolvedStyle(getByTestId('barlist-rows-row-1-bar').props.style)).toMatchObject({
      borderRadius: 8,
      backgroundColor: mixColor(palette.surface, blue.color, 0.14),
    });
    fireEvent(getByTestId('barlist-rows-row-1'), 'pointerEnter');
    expect(resolvedStyle(getByTestId('barlist-rows-row-1-bar').props.style).backgroundColor).toBe(
      mixColor(palette.surface, blue.activeColor, 0.26),
    );
    fireEvent(getByTestId('barlist-rows-row-1'), 'pointerLeave');
    expect(resolvedStyle(getByTestId('barlist-rows-row-1-bar').props.style).backgroundColor).toBe(
      mixColor(palette.surface, blue.color, 0.14),
    );
  });

  it('tints an icon component text-secondary at 16px', () => {
    const { UNSAFE_getAllByType } = renderCard(<BarListCard tabs={TABS} />);
    const palette = resolveChartCardPalette(buildTheme('teal', 'light'));
    const [icon] = UNSAFE_getAllByType(RiComputerLine as never) as unknown as Node[];
    expect(icon!.props).toMatchObject({ width: 16, height: 16, fill: palette.textSecondary });
  });

  it('hides rows past the limit behind a "more" pill that shows them all', () => {
    const { getByTestId, queryByText, getByText } = renderCard(<BarListCard testID="barlist" tabs={TABS} defaultTab="browsers" />);
    expect(getByText('Samsung Internet')).toBeTruthy();
    expect(queryByText('Opera')).toBeNull();
    const more = getByTestId('barlist-rows-more');
    expect(more.props.role).toBe('button');
    expect(more.props.accessibilityLabel).toBe('Show 2 more');
    expect(more.props['aria-expanded']).toBe(false);
    expect(resolvedStyle(more.props.style)).toMatchObject({ width: 40, height: 20, bottom: 4, marginLeft: -20 });

    fireEvent.press(more);
    expect(getByText('Opera')).toBeTruthy();
    expect(getByText('Brave')).toBeTruthy();
    const fewer = getByTestId('barlist-rows-more');
    expect(fewer.props.accessibilityLabel).toBe('Show fewer');
    expect(fewer.props['aria-expanded']).toBe(true);
    expect(resolvedStyle(fewer.props.style).bottom).toBe(-8);
    fireEvent.press(fewer);
    expect(queryByText('Opera')).toBeNull();
  });

  it('switches tabs and reports them', () => {
    const onTabChange = jest.fn();
    const { UNSAFE_getAllByProps, queryByText, getByText } = renderCard(<BarListCard tabs={TABS} onTabChange={onTabChange} />);
    expect(queryByText('Chrome')).toBeNull();
    const tabs = UNSAFE_getAllByProps({ variant: 'underline' }) as unknown as { props: { onValueChange: (v: string) => void; style: unknown } }[];
    expect(resolvedStyle(tabs[0]!.props.style).borderBottomWidth).toBe(0);
    fireEvent(tabs[0] as never, 'valueChange', 'browsers');
    expect(onTabChange).toHaveBeenCalledWith('browsers');
    expect(getByText('Chrome')).toBeTruthy();
  });

  it('titles a single list instead of tabs', () => {
    const { getByText, UNSAFE_queryAllByProps } = renderCard(
      <BarListCard title="Top pages" metricLabel="Views" items={[{ label: '/', value: 5210 }]} />,
    );
    expect(getByText('Top pages')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(UNSAFE_queryAllByProps({ variant: 'underline' })).toHaveLength(0);
  });

  it('uses the mono ink, and per-row colours otherwise', () => {
    const theme = buildTheme('teal', 'dark');
    const palette = resolveChartCardPalette(theme);
    const mono = renderCard(<BarListCard testID="barlist" tabs={TABS} mono />, 'dark');
    expect(resolvedStyle(mono.getByTestId('barlist-rows-row-0-bar').props.style).backgroundColor).toBe(
      mixColor(palette.surface, resolveMonoTone(theme).color, 0.14),
    );
    mono.unmount();
    const custom = renderCard(
      <BarListCard testID="barlist" title="Referrers" items={[{ label: 'a', value: 2, color: 'rgb(200 100 50)' }, { label: 'b', value: 1 }]} color="rgb(10 20 30)" />,
      'dark',
    );
    expect(resolvedStyle(custom.getByTestId('barlist-rows-row-0-bar').props.style).backgroundColor).toBe(
      mixColor(palette.surface, 'rgb(200 100 50)', 0.14),
    );
    expect(resolvedStyle(custom.getByTestId('barlist-rows-row-1-bar').props.style).backgroundColor).toBe(
      mixColor(palette.surface, 'rgb(10 20 30)', 0.14),
    );
  });
});
