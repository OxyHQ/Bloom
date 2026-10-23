import { render } from '@testing-library/react-native';
import React from 'react';
import { SidebarUserMenu } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const NAME = 'A remarkably long organisation or person display name';

it('lets the switcher name shrink and truncate while the chevron keeps its place', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <SidebarUserMenu testID="who" account={{ name: NAME }} />
    </BloomThemeProvider>,
  );
  const name = resolvedStyle(tree.getByText(NAME).props.style);
  expect(name.flexShrink).toBe(1);
  expect(name.minWidth).toBe(0);
  expect(tree.getByText(NAME).props.numberOfLines).toBe(1);
  const row = resolvedStyle(tree.getByTestId('who-label').props.style);
  expect(row.flexShrink).toBe(1);
  expect(row.minWidth).toBe(0);
});
