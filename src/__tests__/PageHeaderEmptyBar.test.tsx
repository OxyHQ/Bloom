/**
 * A header with nothing to show in its bar draws no bar.
 *
 * Commons' ID tab passes a floating header with no title, back or actions, so it
 * owns the status bar and its scrim and nothing else. Once the bar's minimum
 * height applied on native, that empty bar reserved a 56dp blank band above the
 * content (Pixel 8a, Bloom 15.50). A header with anything in its bar keeps it.
 */
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PageHeader } from '../page-header';
import type { PageHeaderProps } from '../page-header';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function hasBar(props: PageHeaderProps): boolean {
  const screen = render(
    <BloomThemeProvider mode="light">
      <PageHeader {...props} testID="header" />
    </BloomThemeProvider>,
  );
  return screen.queryByTestId('header-bar', { includeHiddenElements: true }) !== null;
}

describe('PageHeader bar', () => {
  it('is not drawn when it would be empty', () => {
    expect(hasBar({ presentation: 'floating' })).toBe(false);
  });

  it('is drawn for a title, a back action, a leading slot or actions', () => {
    expect(hasBar({ title: 'Ajustes' })).toBe(true);
    expect(hasBar({ onBack: () => {} })).toBe(true);
    expect(hasBar({ leading: <Text>L</Text> })).toBe(true);
    expect(hasBar({ actions: <Text>A</Text> })).toBe(true);
  });

  it('still owns the top safe area and its scrim when it has no bar', () => {
    const screen = render(
      <BloomThemeProvider mode="light">
        <PageHeader presentation="floating" testID="header" />
      </BloomThemeProvider>,
    );
    expect(screen.queryByTestId('header-scrim', { includeHiddenElements: true })).not.toBeNull();
  });
});
