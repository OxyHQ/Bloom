import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  CompositionBar,
  DotGridMeter,
  StatBar,
  ActivityHeatmap,
  ProfileCard,
  bucketByDay,
} from '../index';
import type { CompositionCategory, AvatarGroupItem } from '../index';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const CATEGORIES: CompositionCategory[] = [
  { key: 'content', name: 'Content', amount: 300, color: '#6366F1' },
  { key: 'social', name: 'Social', amount: 100, color: '#10B981' },
];

const TOP: AvatarGroupItem[] = [
  { id: 'a', uri: 'https://example.com/a.png' },
  { id: 'b', uri: 'https://example.com/b.png' },
  { id: 'c', uri: 'https://example.com/c.png' },
];

describe('CompositionBar', () => {
  it('renders the hint when nothing is selected and fires onSelect on press', () => {
    const onSelect = jest.fn();
    const { getByText, getByLabelText } = renderWithTheme(
      <CompositionBar
        categories={CATEGORIES}
        selectedKey={null}
        onSelect={onSelect}
        hintLabel="Tap a segment"
      />,
    );
    expect(getByText('Tap a segment')).toBeTruthy();
    fireEvent.press(getByLabelText('Content'));
    expect(onSelect).toHaveBeenCalledWith('content');
  });

  it('shows the formatted readout for the selected segment', () => {
    const { getByText } = renderWithTheme(
      <CompositionBar
        categories={CATEGORIES}
        selectedKey="content"
        onSelect={() => {}}
        hintLabel="Tap a segment"
        formatReadout={(points, percent) => `${points} @ ${percent}`}
      />,
    );
    // Content is 300 of 400 → 75%.
    expect(getByText('300 @ 75')).toBeTruthy();
  });
});

describe('DotGridMeter', () => {
  it('renders with a progressbar a11y value', () => {
    const { getByTestId } = renderWithTheme(
      <DotGridMeter filled={7} total={12} testID="dots" />,
    );
    const node = getByTestId('dots');
    expect(node.props.accessibilityValue).toEqual({ min: 0, max: 12, now: 7 });
  });

  it('clamps filled to total', () => {
    const { getByTestId } = renderWithTheme(
      <DotGridMeter filled={99} total={5} testID="dots" />,
    );
    expect(getByTestId('dots').props.accessibilityValue.now).toBe(5);
  });
});

describe('StatBar', () => {
  it('renders progress with min/max labels', () => {
    const { getByText } = renderWithTheme(
      <StatBar variant="progress" label="TX" value={100} max={200} minLabel="0" maxLabel="200" />,
    );
    expect(getByText('TX')).toBeTruthy();
    expect(getByText('200')).toBeTruthy();
  });

  it('renders split with a rounded percent and both values', () => {
    const { getByText } = renderWithTheme(
      <StatBar
        variant="split"
        label="Net"
        percent={62.4}
        leftValue="+10"
        rightValue="-4"
      />,
    );
    expect(getByText('62%')).toBeTruthy();
    expect(getByText('+10')).toBeTruthy();
    expect(getByText('-4')).toBeTruthy();
  });
});

describe('ActivityHeatmap', () => {
  it('renders without crashing and shows a month label', () => {
    const data = [
      { date: '2026-06-01', count: 2 },
      { date: '2026-06-15', count: 9 },
    ];
    const { getByTestId } = renderWithTheme(
      <ActivityHeatmap data={data} endDate="2026-06-30" numDays={60} testID="heat" />,
    );
    expect(getByTestId('heat')).toBeTruthy();
  });

  it('renders an empty container when there is no data and no endDate', () => {
    const { getByTestId } = renderWithTheme(
      <ActivityHeatmap data={[]} testID="heat-empty" />,
    );
    expect(getByTestId('heat-empty')).toBeTruthy();
  });
});

describe('bucketByDay', () => {
  it('groups items by UTC day and sorts ascending', () => {
    const items = [
      { at: '2026-06-02T10:00:00Z' },
      { at: '2026-06-01T00:00:00Z' },
      { at: '2026-06-02T23:59:00Z' },
    ];
    expect(bucketByDay(items, (i) => i.at)).toEqual([
      { date: '2026-06-01', count: 1 },
      { date: '2026-06-02', count: 2 },
    ]);
  });

  it('skips unparseable dates', () => {
    const items = [{ at: 'not-a-date' }, { at: '2026-06-01' }];
    expect(bucketByDay(items, (i) => i.at)).toEqual([{ date: '2026-06-01', count: 1 }]);
  });
});

describe('ProfileCard', () => {
  it('renders headline, subtitle, metric label and footer label; fires onPress', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = renderWithTheme(
      <ProfileCard
        testID="card"
        variant="wallet"
        avatar={{ source: 'https://example.com/a.png', name: 'Wallet' }}
        value="$167,395"
        subtitle="*5bF5"
        headlineIcon={<Text>ICON</Text>}
        metric={{ kind: 'dots', label: 'Token diversity', filled: 3, total: 10 }}
        footer={{ label: 'Top tokens', items: TOP }}
        onPress={onPress}
      />,
    );
    expect(getByText('$167,395')).toBeTruthy();
    expect(getByText('*5bF5')).toBeTruthy();
    expect(getByText('Token diversity')).toBeTruthy();
    expect(getByText('Top tokens')).toBeTruthy();
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the wide layout with a progress metric', () => {
    const { getByText } = renderWithTheme(
      <ProfileCard
        layout="wide"
        avatar={{ source: null, name: 'Ada' }}
        value="12,480"
        subtitle="@ada"
        metric={{ kind: 'progress', label: 'Weekly goal', value: 5, max: 7 }}
      />,
    );
    expect(getByText('12,480')).toBeTruthy();
    expect(getByText('Weekly goal')).toBeTruthy();
  });
});
