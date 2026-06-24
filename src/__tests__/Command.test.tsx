import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Command } from '../command';
import type { CommandItem } from '../command';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function makeItems(onSelect: () => void): CommandItem[] {
  return [
    { id: 'profile', label: 'Go to profile', group: 'Navigation', onSelect },
    { id: 'settings', label: 'Open settings', group: 'Navigation', onSelect },
    {
      id: 'new-app',
      label: 'Create application',
      description: 'Register a new OAuth client',
      group: 'Actions',
      keywords: ['oauth', 'client'],
      onSelect,
    },
  ];
}

// `Command` is now a ⌘K palette built on `<Dialog placement="center">`. These
// tests assert the public-API contract it owns (controlled visibility, the
// grouped results list, query filtering, the empty state, and select →
// onClose) holds on the native Dialog surface.
describe('Command (built on Dialog)', () => {
  it('renders nothing when not visible', () => {
    const { queryByText } = renderWithTheme(
      <Command visible={false} onClose={() => {}} items={makeItems(() => {})} />,
    );
    expect(queryByText('Go to profile')).toBeNull();
  });

  it('renders grouped items and their group headers when visible', () => {
    const { getByText } = renderWithTheme(
      <Command visible onClose={() => {}} items={makeItems(() => {})} />,
    );
    expect(getByText('Go to profile')).toBeTruthy();
    expect(getByText('Open settings')).toBeTruthy();
    expect(getByText('Create application')).toBeTruthy();
    // Group headers are rendered above their items.
    expect(getByText('Navigation')).toBeTruthy();
    expect(getByText('Actions')).toBeTruthy();
  });

  it('filters items by a controlled query (label, description, keywords)', () => {
    const { getByText, queryByText, rerender } = renderWithTheme(
      <Command
        visible
        onClose={() => {}}
        items={makeItems(() => {})}
        query="settings"
      />,
    );
    expect(getByText('Open settings')).toBeTruthy();
    expect(queryByText('Go to profile')).toBeNull();

    // A keyword on a different item matches that item.
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Command
          visible
          onClose={() => {}}
          items={makeItems(() => {})}
          query="oauth"
        />
      </BloomThemeProvider>,
    );
    expect(getByText('Create application')).toBeTruthy();
    expect(queryByText('Open settings')).toBeNull();
  });

  it('shows the empty state when nothing matches', () => {
    const { getByText } = renderWithTheme(
      <Command
        visible
        onClose={() => {}}
        items={makeItems(() => {})}
        query="zzz-no-match"
        emptyText="Nothing here"
      />,
    );
    expect(getByText('Nothing here')).toBeTruthy();
  });

  it('invokes onSelect then onClose when an item is pressed', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <Command visible onClose={onClose} items={makeItems(onSelect)} />,
    );
    act(() => {
      fireEvent.press(getByText('Open settings'));
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
