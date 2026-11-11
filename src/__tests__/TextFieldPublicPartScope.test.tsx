import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { TextField, TextFieldInput } from '../text-field';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  outerSize,
  fieldSize,
  inputSize,
  nested,
}: {
  outerSize?: 'xs' | 'lg';
  fieldSize?: 'md' | 'lg';
  inputSize?: 'md';
  nested?: boolean;
}) {
  const fields = (
    <>
      <TextField size={fieldSize}>
        <TextFieldInput label="Field" testID="field-input" value="" />
      </TextField>
      <TextFieldInput label="Standalone" testID="standalone-input" size={inputSize} value="" />
      <Portal>
        <TextField>
          <TextFieldInput label="Portalled" testID="portalled-input" value="" />
        </TextField>
      </Portal>
    </>
  );
  return (
    <BloomThemeProvider>
      <PortalProvider>
        {nested ? (
          <BloomScope size="xs">
            <BloomScope size="lg">{fields}</BloomScope>
          </BloomScope>
        ) : outerSize ? (
          <BloomScope size={outerSize}>{fields}</BloomScope>
        ) : (
          fields
        )}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it('resolves TextField and TextFieldInput size through wrappers, overrides and native portals', () => {
  const screen = render(<Subject />);
  const height = (id: string) => resolvedStyle(screen.getByTestId(id).props.style).height;
  const assertAll = (expected: number) => {
    for (const id of ['field-input', 'standalone-input', 'portalled-input']) {
      expect(height(id)).toBe(expected);
    }
  };

  assertAll(36);
  screen.rerender(<Subject outerSize="xs" />);
  assertAll(28);
  screen.rerender(<Subject outerSize="xs" fieldSize="lg" inputSize="md" />);
  expect(height('field-input')).toBe(44);
  expect(height('standalone-input')).toBe(36);
  expect(height('portalled-input')).toBe(28);
  screen.rerender(<Subject outerSize="lg" />);
  assertAll(44);
  screen.rerender(<Subject nested />);
  assertAll(44);
  screen.unmount();
});
