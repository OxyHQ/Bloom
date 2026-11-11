/** @jest-environment jsdom */
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { TextField, TextFieldInput } from '../text-field/TextField';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Portal } from '../portal/Portal.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{fields}</BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>{fields}</BloomScope>
      ) : (
        fields
      )}
    </BloomThemeProvider>
  );
}

it('resolves TextField and TextFieldInput size through wrappers, overrides and web portals', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const draw = (props?: ComponentProps<typeof Subject>) =>
      act(() => root.render(<Subject {...props} />));
    const height = (id: string) => {
      const input = document.body.querySelector<HTMLInputElement>(`[data-testid="${id}"]`);
      if (!input) throw new Error(`TextFieldInput ${id} did not render`);
      return input.style.height;
    };
    const assertAll = (expected: string) => {
      for (const id of ['field-input', 'standalone-input', 'portalled-input']) {
        expect(height(id)).toBe(expected);
      }
    };

    draw();
    assertAll('36px');
    draw({ outerSize: 'xs' });
    assertAll('28px');
    draw({ outerSize: 'xs', fieldSize: 'lg', inputSize: 'md' });
    expect(height('field-input')).toBe('44px');
    expect(height('standalone-input')).toBe('36px');
    expect(height('portalled-input')).toBe('28px');
    draw({ outerSize: 'lg' });
    assertAll('44px');
    draw({ nested: true });
    assertAll('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
