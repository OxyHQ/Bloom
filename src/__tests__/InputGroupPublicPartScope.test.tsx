import type React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { InputGroup, InputGroupAddon } from '../input-group';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

const heights = { xs: 28, sm: 32, md: 36, lg: 44 } as const;

it.each(Object.entries(heights))(
  'resolves InputGroup %s geometry and addon inset on native',
  (size, height) => {
    const tree = renderWithTheme(
      <BloomScope size={size as keyof typeof heights}>
        <InputGroup testID="group">
          <InputGroupAddon noPadding testID="addon">
            <Text>https://</Text>
          </InputGroupAddon>
          <Text>field</Text>
        </InputGroup>
      </BloomScope>,
    );
    expect(resolvedStyle(tree.getByTestId('group').props.style).height).toBe(height);
    expect(resolvedStyle(tree.getByTestId('addon').props.style).marginLeft).toBe(
      4 - (size === 'xs' ? 4 : size === 'sm' ? 6 : size === 'md' ? 8 : 10),
    );
  },
);

it('defaults to md and honors an explicit nested group size on native', () => {
  const defaults = renderWithTheme(
    <InputGroup testID="group">
      <InputGroupAddon noPadding testID="addon">
        <Text>https://</Text>
      </InputGroupAddon>
      <Text>field</Text>
    </InputGroup>,
  );
  expect(resolvedStyle(defaults.getByTestId('group').props.style).height).toBe(36);

  const explicit = renderWithTheme(
    <BloomScope size="xs">
      <BloomScope size="lg">
        <InputGroup testID="group" size="sm">
          <InputGroupAddon noPadding testID="addon">
            <Text>https://</Text>
          </InputGroupAddon>
          <Text>field</Text>
        </InputGroup>
      </BloomScope>
    </BloomScope>,
  );
  expect(resolvedStyle(explicit.getByTestId('group').props.style).height).toBe(32);
  expect(resolvedStyle(explicit.getByTestId('addon').props.style).marginLeft).toBe(-2);
});
