import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { CheckboxCard } from '../checkbox';
import { Path } from 'react-native-svg';
import { buildTheme } from '../theme/build-theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('CheckboxCard', () => {
  it('renders its title and description', () => {
    const { getByText } = renderWithTheme(
      <CheckboxCard title="Weekly digest" description="Every Monday." checked={false} onCheckedChange={() => {}} />,
    );
    expect(getByText('Weekly digest')).toBeTruthy();
    expect(getByText('Every Monday.')).toBeTruthy();
  });

  it('toggles from a press anywhere on the card, named by its title', () => {
    const onCheckedChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CheckboxCard title="Mentions" checked={false} onCheckedChange={onCheckedChange} />,
    );
    const card = getByLabelText('Mentions');
    expect(card.props.accessibilityRole).toBe('checkbox');
    expect(card.props['aria-checked']).toBe(false);
    fireEvent.press(card);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('announces the mixed state', () => {
    const { getByLabelText } = renderWithTheme(
      <CheckboxCard title="All" checked={false} indeterminate onCheckedChange={() => {}} />,
    );
    expect(getByLabelText('All').props['aria-checked']).toBe('mixed');
  });

  it('dims the whole card and ignores presses when disabled', () => {
    const onCheckedChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CheckboxCard title="Billing" checked onCheckedChange={onCheckedChange} disabled />,
    );
    const card = getByLabelText('Billing');
    fireEvent.press(card);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

it('uses the paired dark mark on a bright semantic selection', () => {
  const theme = buildTheme('olive', 'dark');
  const root = render(<BloomThemeProvider mode="dark" colorPreset="olive"><CheckboxCard title="Selection" checked onCheckedChange={() => {}} /></BloomThemeProvider>);
  const marks = root.UNSAFE_getAllByType(Path).filter(node => node.props.strokeWidth === 2);
  expect(marks.length).toBeGreaterThan(0);
  expect(marks[0]!.props.stroke).toBe(theme.colors.primaryForeground);
  expect(theme.colors.primaryForeground).toBe('rgb(0 0 0)');
});
