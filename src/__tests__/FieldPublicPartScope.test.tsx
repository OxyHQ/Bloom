import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Field } from '../field';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

it.each(sizes)('Field delegates child control scope at %s', (size, height) => {
  const child = (
    <Button testID="field-action">
      <Text>Apply</Text>
    </Button>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? (
        <BloomScope size={size}>
          <View>
            <Field label="Preference">{child}</Field>
          </View>
        </BloomScope>
      ) : (
        <View>
          <Field label="Preference">{child}</Field>
        </View>
      )}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('field-action').props.style).height).toBe(height);
});

it('Field child controls retain nested scope through a portal', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
        <BloomScope size="xs">
          <Field label="Preference">
            <Portal>
              <Button testID="field-action">
                <Text>Apply</Text>
              </Button>
            </Portal>
          </Field>
        </BloomScope>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('field-action').props.style).height).toBe(24);
});

it('explicit child size overrides the delegated scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <Field label="Preference">
          <Button size="lg" testID="field-action">
            <Text>Apply</Text>
          </Button>
        </Field>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('field-action').props.style).height).toBe(44);
});
