import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { AiProfileCard } from '../ai-profile-card';
import type { AiProfileCardStat } from '../ai-profile-card';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

const STATS: AiProfileCardStat[] = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];
const CELLS = Array.from({ length: 38 * 7 }, (_, i) => ({ count: i % 30, date: `Day ${i}` }));

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function viewport(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 2, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('AiProfileCard', () => {
  it('keeps the geometry: radius 24 + 1px border, a 165px cover with 23px top corners, content 124 / 16 / 16, 15 apart', () => {
    viewport(1440);
    const { getByTestId } = renderCard(
      <AiProfileCard testID="card" name="Maya Collins" contributions={7462} countUpDuration={0} cells={CELLS} coverSource="https://example.com/cover.png" />,
    );
    const theme = buildTheme('teal', 'light');
    expect(resolvedStyle(getByTestId('card').props.style)).toMatchObject({
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      overflow: 'hidden',
    });
    expect(resolvedStyle(getByTestId('card-cover').props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      height: 165,
      borderTopLeftRadius: 23,
      borderTopRightRadius: 23,
      backgroundColor: theme.colors.backgroundTertiary,
    });
    expect(getByTestId('card-cover-image', { includeHiddenElements: true })).toBeTruthy();
    expect(resolvedStyle(getByTestId('card-content').props.style)).toMatchObject({
      gap: 15,
      paddingTop: 124,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
    });
  });

  it('crops the cover like object-position 50% 45% once the photo reports its size', () => {
    viewport(1440);
    const { getByTestId } = renderCard(
      <AiProfileCard testID="card" name="Maya" contributions={1} countUpDuration={0} cells={CELLS} coverSource="https://example.com/cover.png" />,
    );
    const image = getByTestId('card-cover-image', { includeHiddenElements: true });
    act(() => {
      fireEvent(getByTestId('card-cover-image-frame', { includeHiddenElements: true }), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 678, height: 165 } },
      });
    });
    act(() => {
      fireEvent(image, 'load', { nativeEvent: { source: { width: 1356, height: 400, uri: 'x' } } });
    });
    // Cover scale max(678/1356, 165/400) = 0.5 → 678 × 200, 35px of overflow, 45% of it above.
    expect(resolvedStyle(getByTestId('card-cover-image', { includeHiddenElements: true }).props.style)).toMatchObject({
      position: 'absolute',
      left: 0,
      width: 678,
      height: 200,
      top: -15.75,
    });
  });

  it('renders the name row, the badge, the actions hung 34px above it, and a status-purple chip', () => {
    viewport(1440);
    const theme = buildTheme('teal', 'light');
    const { getByTestId, getByText } = renderCard(
      <AiProfileCard
        testID="card"
        name="Maya Collins"
        handle="@maya"
        badge="PRO"
        contributions={7462}
        countUpDuration={0}
        delta="+14.8%"
        stats={STATS}
        cells={CELLS}
        actions={<Button size="sm" appearance="outline" tone="neutral">Share</Button>}
      />,
    );
    expect(getByText('Maya Collins')).toBeTruthy();
    expect(getByText('@maya')).toBeTruthy();
    expect(getByText('PRO')).toBeTruthy();
    expect(getByText('Share')).toBeTruthy();
    expect(resolvedStyle(getByTestId('card-actions').props.style)).toMatchObject({ position: 'absolute', top: -34, right: 4, gap: 10 });
    expect(getByTestId('card-headline').props.children).toBe('$7,462');
    expect(resolvedStyle(getByTestId('card-delta').props.style).backgroundColor).toBe(
      theme.colors.secondarySubtle,
    );
    for (const stat of STATS) {
      expect(getByText(stat.value)).toBeTruthy();
      expect(getByText(stat.label)).toBeTruthy();
    }
    expect(resolvedStyle(getByTestId('card-stat-0').props.style)).toMatchObject({
      borderRadius: 10,
      paddingTop: 10,
      paddingLeft: 10,
      backgroundColor: theme.colors.backgroundSecondary,
    });
  });

  it('lays the tiles in one row from 640px and two columns below', () => {
    viewport(1024);
    const wide = renderCard(<AiProfileCard testID="card" name="M" contributions={1} countUpDuration={0} stats={STATS} cells={CELLS} />);
    expect(wide.getByTestId('card-stats').props.children).toHaveLength(1);
    wide.unmount();
    viewport(390);
    const narrow = renderCard(<AiProfileCard testID="card" name="M" contributions={1} countUpDuration={0} stats={STATS} cells={CELLS} />);
    expect(narrow.getByTestId('card-stats').props.children).toHaveLength(2);
  });

  it('lands the mount count-up on the total (jest snaps the roll) and follows a new total', () => {
    viewport(1440);
    const { getByTestId, rerender } = renderCard(<AiProfileCard testID="card" name="M" contributions={7462} cells={CELLS} />);
    expect(getByTestId('card-headline').props.children).toBe('$7,462');
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AiProfileCard testID="card" name="M" contributions={958} cells={CELLS} format={(v) => `${v} PRs`} />
      </BloomThemeProvider>,
    );
    expect(getByTestId('card-headline').props.children).toBe('958 PRs');
  });

  it('switches the activity period, uncontrolled by default', () => {
    viewport(1440);
    const onPeriodChange = jest.fn();
    const { getByTestId } = renderCard(
      <AiProfileCard testID="card" name="M" contributions={1} countUpDuration={0} cells={CELLS} onPeriodChange={onPeriodChange} />,
    );
    fireEvent.press(getByTestId('card-period-monthly'));
    expect(onPeriodChange).toHaveBeenLastCalledWith('monthly');
  });

  it('paints the dark border, tiles and chip over the page', () => {
    viewport(1440);
    const theme = buildTheme('teal', 'dark');
    const { getByTestId } = renderCard(
      <AiProfileCard testID="card" name="M" contributions={1} countUpDuration={0} delta="+1%" stats={STATS} cells={CELLS} />,
      'dark',
    );
    expect(resolvedStyle(getByTestId('card').props.style).borderColor).toBe(theme.colors.borderLight);
    expect(resolvedStyle(getByTestId('card-stat-0').props.style).backgroundColor).toBe(theme.colors.backgroundSecondary);
    expect(resolvedStyle(getByTestId('card-delta').props.style).backgroundColor).toBe(
      theme.colors.secondarySubtle,
    );
  });
});
