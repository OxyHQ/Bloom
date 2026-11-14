import type React from 'react';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { TimeField } from '../date-picker';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

it.each([
  ['xs', 96, 32],
  ['sm', 96, 32],
  ['md', 104, 38],
  ['lg', 104, 38],
] as const)('maps TimeField %s scope to the supported density rung', (size, width, height) => {
  const tree = renderWithTheme(
    <BloomScope size={size}>
      <TimeField value="09:00" onChange={() => undefined} accessibilityLabel="Time" testID="time" />
    </BloomScope>,
  );
  expect(resolvedStyle(tree.getByTestId('time').props.style)).toMatchObject({ width, height });
});

it('defaults to md and honors explicit sm inside nested scopes on native', () => {
  const defaults = renderWithTheme(
    <TimeField value="09:00" onChange={() => undefined} accessibilityLabel="Time" testID="time" />,
  );
  expect(resolvedStyle(defaults.getByTestId('time').props.style)).toMatchObject({
    width: 104,
    height: 38,
  });

  const explicit = renderWithTheme(
    <BloomScope size="xs">
      <BloomScope size="lg">
        <TimeField
          value="09:00"
          onChange={() => undefined}
          size="sm"
          accessibilityLabel="Time"
          testID="time"
        />
      </BloomScope>
    </BloomScope>,
  );
  expect(resolvedStyle(explicit.getByTestId('time').props.style)).toMatchObject({
    width: 96,
    height: 32,
  });
});
