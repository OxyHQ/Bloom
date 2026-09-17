import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { ImportantAlertsCard } from '../important-alerts-card';
import type { ImportantAlertsCardAlert } from '../important-alerts-card';
import { resolveDashboardSurfaces, toneColor } from '../stat-cards/tones';
import { RiHeartPulseFill } from '../icons/remix/RiHeartPulseFill';
import { resolvedStyle } from './support/rendered-style';

const ALERTS: ImportantAlertsCardAlert[] = [
  { icon: RiHeartPulseFill, tone: 'rose', title: 'High Heart rate', description: 'Above 120 BPM.', date: 'June, 12' },
  { icon: RiHeartPulseFill, iconBackground: 'rgb(1 2 3)', title: 'Custom', description: 'Explicit.', date: 'June, 9' },
];

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('ImportantAlertsCard', () => {
  it("keeps the card chrome: 330 tall, radius 20, a border in the card's own colour, no bottom padding", () => {
    const { getByTestId } = renderIn(<ImportantAlertsCard testID="card" alerts={ALERTS} count={12} />);
    const surfaces = resolveDashboardSurfaces(buildTheme('teal', 'light'));
    const card = resolvedStyle(getByTestId('card').props.style);
    expect(card).toMatchObject({
      height: 330,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: surfaces.secondary,
      backgroundColor: surfaces.secondary,
      paddingTop: 10,
      paddingLeft: 10,
      paddingRight: 10,
      overflow: 'hidden',
    });
    expect(card.paddingBottom).toBeUndefined();
  });

  it('paints icon circles from the tone, and lets an explicit colour win', () => {
    const { getByTestId } = renderIn(<ImportantAlertsCard testID="card" alerts={ALERTS} count={2} />);
    const theme = buildTheme('teal', 'light');
    const circle = (index: number) => resolvedStyle(getByTestId(`card-icon-${index}`).props.style);
    expect(circle(0).backgroundColor).toBe(toneColor(theme, 'rose', 600));
    expect(circle(1).backgroundColor).toBe('rgb(1 2 3)');
  });

  it('renders the headline, the caption and the range pill only when given a label', () => {
    const { getByText, getByTestId, rerender, queryByTestId } = renderIn(
      <ImportantAlertsCard testID="card" alerts={ALERTS} count={12} rangeLabel="29 Jun - 5 Jul" />,
    );
    expect(getByText('Important alerts')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('this week')).toBeTruthy();
    expect(resolvedStyle(getByTestId('card-range').props.style)).toMatchObject({ width: 151, height: 32, borderRadius: 10 });
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ImportantAlertsCard testID="card" alerts={ALERTS} count={12} />
      </BloomThemeProvider>,
    );
    expect(queryByTestId('card-range')).toBeNull();
  });

  it('pins the date pill to the row corner', () => {
    const { getByTestId } = renderIn(<ImportantAlertsCard testID="card" alerts={ALERTS} count={2} />);
    const pill = resolvedStyle(getByTestId('card-date-0').props.style);
    expect(pill).toMatchObject({ position: 'absolute', top: 10, right: 10, borderRadius: 6 });
  });

  it('accepts scrolling without throwing', () => {
    const { getByTestId } = renderIn(<ImportantAlertsCard testID="card" alerts={ALERTS} count={2} />);
    fireEvent.scroll(getByTestId('card-feed'), { nativeEvent: { contentOffset: { y: 40 } } });
    fireEvent.scroll(getByTestId('card-feed'), { nativeEvent: { contentOffset: { y: 0 } } });
  });
});
