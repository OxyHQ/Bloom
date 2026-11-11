import type React from 'react';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { CallControlButton, CallControls } from '../call-ui';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { View } from 'react-native';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

it.each([
  ['xs', 40, 8],
  ['sm', 40, 8],
  ['md', 48, 12],
  ['lg', 56, 16],
] as const)('maps CallControls %s scope to its call-stage geometry', (size, buttonSize, gap) => {
  const tree = renderWithTheme(
    <BloomScope size={size}>
      <CallControls testID="controls" onMutedChange={() => undefined} />
    </BloomScope>,
  );
  expect(resolvedStyle(tree.getByTestId('controls').props.style).gap).toBe(gap);
  expect(resolvedStyle(tree.getByTestId('controls-mute').props.style).width).toBe(buttonSize);
});

it('resolves standalone CallControlButton scope and explicit override on native', () => {
  const scoped = renderWithTheme(
    <BloomScope size="xs">
      <CallControlButton icon={RiMicLine} label="Mute" testID="standalone" />
    </BloomScope>,
  );
  expect(resolvedStyle(scoped.getByTestId('standalone').props.style).width).toBe(40);

  const explicit = renderWithTheme(
    <BloomScope size="lg">
      <CallControlButton icon={RiMicLine} label="Mute" size="md" testID="standalone" />
    </BloomScope>,
  );
  expect(resolvedStyle(explicit.getByTestId('standalone').props.style).width).toBe(48);
});

it('uses the full-stage default and lets an explicit group size override its scope', () => {
  const defaults = renderWithTheme(
    <CallControls testID="controls" onMutedChange={() => undefined} />,
  );
  expect(resolvedStyle(defaults.getByTestId('controls').props.style).gap).toBe(16);
  expect(resolvedStyle(defaults.getByTestId('controls-mute').props.style).width).toBe(56);

  const explicit = renderWithTheme(
    <BloomScope size="xs">
      <CallControls testID="controls" size="md" onMutedChange={() => undefined} />
    </BloomScope>,
  );
  expect(resolvedStyle(explicit.getByTestId('controls').props.style).gap).toBe(12);
  expect(resolvedStyle(explicit.getByTestId('controls-mute').props.style).width).toBe(48);
});

it('resolves a nested scope through a native wrapper', () => {
  const nested = renderWithTheme(
    <BloomScope size="xs">
      <View>
        <BloomScope size="lg">
          <CallControls testID="controls" onMutedChange={() => undefined} />
        </BloomScope>
      </View>
    </BloomScope>,
  );
  expect(resolvedStyle(nested.getByTestId('controls-mute').props.style).width).toBe(56);
});
