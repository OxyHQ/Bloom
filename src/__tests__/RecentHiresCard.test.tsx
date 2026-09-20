import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { RecentHiresCard, type RecentHire } from '../recent-hires-card';
import { resolveRecentHiresPalette } from '../recent-hires-card/RecentHiresCard';
import { resolvedStyle } from './support/rendered-style';

const HIRES: RecentHire[] = [
  { name: 'Livia Saris', joined: 'Joined today', role: 'Backend Engineer', avatar: 'https://example.com/a.webp' },
  { name: 'Jaydon Aminoff', joined: '2 days ago', role: 'UI Designer' },
  { name: 'Maria Lubin', joined: '5 days ago', role: 'User Researcher' },
  { name: 'Ann Press', joined: 'A week ago', role: 'DevOps Engineer' },
];

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('RecentHiresCard', () => {
  it('keeps the card geometry in longhands: 329 tall, radius 16, padding 8', () => {
    const { getByTestId } = renderIn(<RecentHiresCard testID="card" count={56} hires={HIRES} />);
    const card = resolvedStyle(getByTestId('card').props.style);
    expect(card).toMatchObject({
      height: 329,
      borderRadius: 16,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      paddingRight: 8,
    });
    expect(card.padding).toBeUndefined();
  });

  it('renders the count, the four people with their roles, and the pager', () => {
    const { getByText, getByTestId } = renderIn(
      <RecentHiresCard testID="card" count={56} teamLabel="Design team" hires={HIRES} />,
    );
    expect(getByText('Recent hires')).toBeTruthy();
    expect(getByText('56')).toBeTruthy();
    for (const hire of HIRES) {
      expect(getByText(hire.name)).toBeTruthy();
      expect(getByText(hire.joined)).toBeTruthy();
      expect(getByText(hire.role)).toBeTruthy();
    }
    expect(getByText('Previous')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
    expect(getByTestId('card-team')).toBeTruthy();
  });

  it('paints the person cards as inner tiles: radius 10, padding 10, the card shadow', () => {
    const { getByTestId } = renderIn(<RecentHiresCard testID="card" count={56} hires={HIRES} />, 'dark');
    const theme = buildTheme('teal', 'dark');
    const palette = resolveRecentHiresPalette(theme);
    const tile = resolvedStyle(getByTestId('card-hire-0').props.style);
    expect(tile).toMatchObject({
      borderRadius: 10,
      paddingTop: 10,
      paddingLeft: 10,
      backgroundColor: palette.inner,
      boxShadow: '0 1px 1px 0 rgb(0 0 0 / 0.14)',
    });
  });

  it('uses the canonical tertiary surface for role chips in both modes', () => {
    const light = buildTheme('teal', 'light');
    const dark = buildTheme('teal', 'dark');
    expect(resolveRecentHiresPalette(light).role).toBe(light.colors.backgroundTertiary);
    const darkPalette = resolveRecentHiresPalette(dark);
    expect(darkPalette.role).toBe(dark.colors.backgroundTertiary);

    const { getByTestId } = renderIn(<RecentHiresCard testID="card" count={56} hires={HIRES} />);
    const chip = resolvedStyle(getByTestId('card-hire-1-role').props.style);
    expect(chip).toMatchObject({ alignSelf: 'stretch', justifyContent: 'center', backgroundColor: resolveRecentHiresPalette(light).role });
  });

  it('names the team switcher and forwards the presses', () => {
    const onTeam = jest.fn();
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const { getByLabelText, getByTestId } = renderIn(
      <RecentHiresCard
        testID="card"
        count={56}
        teamLabel="Design team"
        teamAccessibilityLabel="Switch team"
        onTeamPress={onTeam}
        onPreviousPress={onPrev}
        onNextPress={onNext}
        hires={HIRES}
      />,
    );
    fireEvent.press(getByLabelText('Switch team'));
    fireEvent.press(getByTestId('card-previous'));
    fireEvent.press(getByTestId('card-next'));
    expect(onTeam).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('omits the switcher without a team label, and sizes to content with height="auto"', () => {
    const { queryByTestId, getByTestId } = renderIn(
      <RecentHiresCard testID="card" count={3} hires={HIRES.slice(0, 3)} height="auto" />,
    );
    expect(queryByTestId('card-team')).toBeNull();
    expect(resolvedStyle(getByTestId('card').props.style).height).toBeUndefined();
    expect(queryByTestId('card-hire-3')).toBeNull();
  });
});


it.each(['light', 'dark'] as const)('RecentHires shares card and inset roles in %s', (mode) => {
  const theme = buildTheme('teal', mode);
  expect(resolveRecentHiresPalette(theme)).toMatchObject({ surface: theme.colors.card, inner: theme.colors.backgroundSecondary, textSecondary: theme.colors.textSecondary, ring: theme.colors.primary });
});
