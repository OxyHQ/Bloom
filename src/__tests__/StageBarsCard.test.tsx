import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { resolveButtonRamps } from '../button/shared';
import { RiEyeLine } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { StageBarsCard, type StageBar, type StageBarsRange } from '../chart-cards/StageBarsCard';
import { resolveChartCardPalette, resolveChartTones, resolveMonoTone } from '../chart-cards/palette';

const STAGES: StageBar[] = [
  { label: 'Visits', value: 4820, icon: RiEyeLine },
  { label: 'Sign-up', value: 3260 },
  { label: 'Active', value: 2010 },
  { label: 'Pro', value: 1160 },
  { label: 'Team', value: 540 },
  { label: 'Enterprise', value: 180 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Node = { props: Record<string, unknown>; type: unknown };

describe('StageBarsCard', () => {
  it('is content-sized with a 329px floor', () => {
    const { getByTestId } = renderCard(<StageBarsCard testID="stage" stages={STAGES} />);
    const card = resolvedStyle(getByTestId('stage').props.style);
    expect(card.height).toBeUndefined();
    expect(card).toMatchObject({ minHeight: 329, borderRadius: 16, paddingTop: 16, paddingBottom: 12 });
    expect(resolvedStyle(getByTestId('stage-rows').props.style)).toMatchObject({ flexGrow: 1, justifyContent: 'center', paddingTop: 8, paddingBottom: 8 });
  });

  it('prints each stage with its value and share of the first, headlining the first', () => {
    const { getByTestId, getAllByText, getByText } = renderCard(<StageBarsCard testID="stage" stages={STAGES} delta={0.061} range="Last 30 days" />);
    expect(getByTestId('stage-headline').props.children).toBe('4,820');
    expect(getByText('Pipeline')).toBeTruthy();
    expect(getByText('+6.1%')).toBeTruthy();
    for (const share of ['100%', '68%', '42%', '24%', '11%', '4%']) expect(getByText(share)).toBeTruthy();
    // Once in the row, once in its tile.
    expect(getAllByText('3,260')).toHaveLength(2);
    expect(getByTestId('stage-rows').props.accessibilityLabel).toBe(
      'Pipeline: Visits 4,820 (100%), Sign-up 3,260 (68%), Active 2,010 (42%), Pro 1,160 (24%), Team 540 (11%), Enterprise 180 (4%)',
    );
  });

  it('draws 20px round tracks with palette fills and a neutral-950 icon pinned 4px in', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<StageBarsCard testID="stage" stages={STAGES} />);
    const theme = buildTheme('teal', 'light');
    const tones = resolveChartTones(theme);
    const palette = resolveChartCardPalette(theme);
    expect(resolvedStyle(getByTestId('stage-bar-0').props.style)).toMatchObject({
      height: 20,
      overflow: 'hidden',
      backgroundColor: palette.track,
    });
    expect(resolvedStyle(getByTestId('stage-bar-0-fill').props.style)).toMatchObject({ backgroundColor: tones[0]!.color, left: 0 });
    expect(resolvedStyle(getByTestId('stage-bar-2-fill').props.style).backgroundColor).toBe(tones[2]!.color);
    const icons = UNSAFE_getAllByType(RiEyeLine as never) as unknown as Node[];
    expect(icons).toHaveLength(1);
    expect(icons[0]!.props).toMatchObject({ width: 14, height: 14, fill: resolveButtonRamps(theme).neutral[950] });
  });

  it('hides icons with showIcons={false}', () => {
    const { UNSAFE_queryAllByType } = renderCard(<StageBarsCard stages={STAGES} showIcons={false} />);
    expect(UNSAFE_queryAllByType(RiEyeLine as never)).toHaveLength(0);
  });

  it('hovering a row cell focuses the stage: header, darker fill, rows at 35%, tiles at 50%', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getAllByText } = renderCard(
      <StageBarsCard testID="stage" stages={STAGES} delta={0.061} onActiveIndexChange={onActiveIndexChange} />,
    );
    fireEvent(getByTestId('stage-bar-2'), 'pointerEnter');
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(2);
    expect(getByTestId('stage-headline').props.children).toBe('2,010');
    expect(getAllByText('Active').length).toBeGreaterThanOrEqual(3);
    const tones = resolveChartTones(buildTheme('teal', 'light'));
    expect(resolvedStyle(getByTestId('stage-bar-2-fill').props.style).backgroundColor).toBe(tones[2]!.activeColor);
    expect(resolvedStyle(getByTestId('stage-bar-0').props.style).opacity).toBe(0.35);
    expect(resolvedStyle(getByTestId('stage-bar-2').props.style).opacity).toBe(1);
    expect(resolvedStyle(getByTestId('stage-tiles-tile-0').props.style).opacity).toBe(0.5);
    fireEvent(getByTestId('stage-bar-2'), 'pointerLeave');
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    fireEvent(getByTestId('stage-tiles-tile-4'), 'pointerEnter');
    expect(getByTestId('stage-headline').props.children).toBe('540');
  });

  it('lays three tiles per row and keeps a short row on the grid', () => {
    const { getByTestId } = renderCard(<StageBarsCard testID="stage" stages={STAGES.slice(0, 4)} />);
    const rows = getByTestId('stage-tiles').props.children as React.ReactElement<{ children: unknown[] }>[];
    expect(rows).toHaveLength(2);
    const [tiles, empties] = rows[1]!.props.children as unknown[][];
    expect(tiles).toHaveLength(1);
    expect(empties).toHaveLength(2);
  });

  it('paints every pill in the mono ink and drops tile swatches', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<StageBarsCard testID="stage" mono stages={STAGES} />, 'dark');
    const mono = resolveMonoTone(buildTheme('teal', 'dark'));
    expect(resolvedStyle(getByTestId('stage-bar-3-fill').props.style).backgroundColor).toBe(mono.color);
    const views = UNSAFE_getAllByType('View' as never) as unknown as Node[];
    expect(views.filter((v) => resolvedStyle(v.props.style).borderRadius === 4)).toHaveLength(0);
  });

  it('reads a range: its stages and delta override the props', () => {
    const ranges: StageBarsRange[] = [
      { id: '7d', label: 'Last 7 days', stages: STAGES.map((s, i) => ({ ...s, value: [1180, 790, 460, 250, 120, 40][i]! })), delta: 0.024 },
      { id: '30d', label: 'Last 30 days', stages: STAGES, delta: 0.061 },
    ];
    const { getByTestId, getByText } = renderCard(<StageBarsCard testID="stage" ranges={ranges} />);
    expect(getByTestId('stage-headline').props.children).toBe('1,180');
    expect(getByText('+2.4%')).toBeTruthy();
    expect(getByText('67%')).toBeTruthy();
  });
});
