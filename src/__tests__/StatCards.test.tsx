import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { StatCard, StatCards } from '../stat-cards';
import type { StatCardsItem } from '../stat-cards';
import { statCardsColumnCount } from '../stat-cards/StatCards';
import { resolveDashboardSurfaces, statusPair } from '../stat-cards/tones';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { resolvedStyle } from './support/rendered-style';

const STATS: StatCardsItem[] = [
  { icon: RiGroupLine, label: 'Customers', value: '14,592', delta: '+5.3%', deltaColor: 'lime' },
  { icon: RiGroupLine, label: 'Unit sold', value: '385', delta: '-2.1%', deltaColor: 'rose', hint: 'Units' },
  { icon: RiGroupLine, label: 'Orders', value: '1,394', delta: '0.00%', deltaColor: 'neutral' },
];

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('StatCards', () => {
  it('keeps the plain card geometry in longhands: 132 tall, radius 16, padding 16', () => {
    const { getByTestId } = renderIn(<StatCard testID="card" stat={STATS[0]!} />);
    const card = resolvedStyle(getByTestId('card').props.style);
    expect(card).toMatchObject({
      height: 132,
      borderRadius: 16,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
      justifyContent: 'space-between',
    });
    expect(card.padding).toBeUndefined();
  });

  it('renders the footer band with the card shadow and a delta pill in the status pair', () => {
    const { getByTestId, getByText } = renderIn(
      <StatCard testID="card" variant="footer" stat={STATS[1]!} />,
      'dark',
    );
    const theme = buildTheme('teal', 'dark');
    const surfaces = resolveDashboardSurfaces(theme);
    const band = resolvedStyle(getByTestId('card-band').props.style);
    expect(band).toMatchObject({
      borderRadius: 10,
      paddingTop: 6,
      paddingBottom: 6,
      paddingRight: 6,
      paddingLeft: 10,
      boxShadow: '0 1px 1px 0 rgb(0 0 0 / 0.14)',
      backgroundColor: surfaces.inner,
    });
    const pill = resolvedStyle(getByTestId('card-delta').props.style);
    expect(pill.backgroundColor).toBe(statusPair(theme, 'rose', surfaces.inner).background);
    expect(pill).toMatchObject({ paddingLeft: 4, paddingRight: 8, paddingTop: 2, paddingBottom: 2 });
    expect(getByText('From last month')).toBeTruthy();
  });

  it('names the info glyph after the stat, and only renders it with a hint', () => {
    const { getByLabelText, queryByTestId } = renderIn(
      <>
        <StatCard testID="with" variant="footer" stat={STATS[1]!} />
        <StatCard testID="without" variant="footer" stat={STATS[0]!} />
      </>,
    );
    expect(getByLabelText('About Unit sold')).toBeTruthy();
    expect(queryByTestId('without-hint')).toBeNull();
  });

  it('follows the responsive breakpoints per variant', () => {
    expect(statCardsColumnCount('plain', 4, 800)).toBe(2);
    expect(statCardsColumnCount('plain', 4, 1024)).toBe(4);
    expect(statCardsColumnCount('plain', 2, 1440)).toBe(2);
    expect(statCardsColumnCount('footer', 4, 500)).toBe(1);
    expect(statCardsColumnCount('footer', 4, 640)).toBe(2);
    expect(statCardsColumnCount('footer', 4, 1280)).toBe(4);
    expect(statCardsColumnCount('footer', 1, 1440)).toBe(1);
    expect(statCardsColumnCount('plain', 1, 1440)).toBe(1);
  });

  it('renders only the first `count` stats', () => {
    const { getByText, queryByText } = renderIn(<StatCards stats={STATS} count={2} />);
    expect(getByText('Customers')).toBeTruthy();
    expect(getByText('Unit sold')).toBeTruthy();
    expect(queryByText('Orders')).toBeNull();
  });
});
