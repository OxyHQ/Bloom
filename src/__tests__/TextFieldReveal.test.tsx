import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { LocaleProvider } from '../locale';
import { TextField, TextFieldInput } from '../text-field';
import { TEXT_FIELD_MESSAGES } from '../text-field/messages';
import { messagesIn } from './support/messages-in';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Password(props: Partial<React.ComponentProps<typeof TextFieldInput>>) {
  const [value, setValue] = useState('hunter2');
  return (
    <TextFieldInput
      label="Password"
      value={value}
      onValueChange={setValue}
      secureTextEntry
      revealable
      testID="input"
      {...props}
    />
  );
}

describe('TextFieldInput revealable', () => {
  it('draws a "Show password" button that unmasks the input, and "Hide password" masks it again', () => {
    const { getByLabelText, getByTestId, queryByLabelText } = renderWithTheme(<Password />);
    expect(getByTestId('input').props.secureTextEntry).toBe(true);
    expect(queryByLabelText('Hide password')).toBeNull();

    fireEvent.press(getByLabelText('Show password'));
    expect(getByTestId('input').props.secureTextEntry).toBe(false);
    expect(queryByLabelText('Show password')).toBeNull();

    fireEvent.press(getByLabelText('Hide password'));
    expect(getByTestId('input').props.secureTextEntry).toBe(true);
  });

  it('keeps the value across a reveal', () => {
    const { getByLabelText, getByTestId } = renderWithTheme(<Password />);
    fireEvent.press(getByLabelText('Show password'));
    expect(getByTestId('input').props.value).toBe('hunter2');
  });

  it('is inert without secureTextEntry: no button, and the input stays plain', () => {
    const { queryByLabelText, getByTestId } = renderWithTheme(<Password secureTextEntry={false} />);
    expect(queryByLabelText('Show password')).toBeNull();
    expect(getByTestId('input').props.secureTextEntry).toBe(false);
  });

  it('draws nothing when not revealable, and secureTextEntry passes through', () => {
    const { queryByLabelText, getByTestId } = renderWithTheme(<Password revealable={false} />);
    expect(queryByLabelText('Show password')).toBeNull();
    expect(getByTestId('input').props.secureTextEntry).toBe(true);
  });

  it('works inside an explicit TextField and with a floating label', () => {
    const { getByLabelText, getByTestId } = renderWithTheme(
      <TextField>
        <Password floatingLabel />
      </TextField>,
    );
    fireEvent.press(getByLabelText('Show password'));
    expect(getByTestId('input').props.secureTextEntry).toBe(false);
  });

  it('speaks the nearest LocaleProvider, and a locale prop wins over it', () => {
    const es = renderWithTheme(
      <LocaleProvider locale="es-ES">
        <Password />
      </LocaleProvider>,
    );
    expect(es.getByLabelText(messagesIn(TEXT_FIELD_MESSAGES, 'es').showPassword)).toBeTruthy();
    fireEvent.press(es.getByLabelText('Mostrar contraseña'));
    expect(es.getByLabelText('Ocultar contraseña')).toBeTruthy();
    es.unmount();

    const de = renderWithTheme(
      <LocaleProvider locale="es">
        <Password locale="de" />
      </LocaleProvider>,
    );
    expect(de.getByLabelText('Passwort anzeigen')).toBeTruthy();
  });

  it('lets revealLabels override one name at a time', () => {
    const { getByLabelText } = renderWithTheme(<Password revealLabels={{ show: 'Show PIN' }} />);
    fireEvent.press(getByLabelText('Show PIN'));
    expect(getByLabelText('Hide password')).toBeTruthy();
  });

  it("paints the eye in the error colour when only the INPUT is invalid", () => {
    const { resolveIconColor, resolveTextFieldPalette } = jest.requireActual('../text-field/shared') as typeof import('../text-field/shared');
    const { useTheme } = jest.requireActual('../theme/use-theme') as typeof import('../theme/use-theme');
    let palette: ReturnType<typeof resolveTextFieldPalette> | undefined;
    function Probe() {
      palette = resolveTextFieldPalette(useTheme());
      return null;
    }
    const { UNSAFE_getAllByProps } = renderWithTheme(
      <>
        <Probe />
        <TextField>
          <Password invalid />
        </TextField>
      </>,
    );
    const eye = UNSAFE_getAllByProps({ accessibilityLabel: 'Show password' }).find((n) => n.props.color !== undefined);
    expect(eye?.props.color).toBe(resolveIconColor(palette!, { invalid: true, disabled: false }));
  });

  it('is disabled with the field', () => {
    const { getByLabelText } = renderWithTheme(<Password disabled />);
    const button = getByLabelText('Show password');
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('names the required asterisk in the locale', () => {
    const { TextFieldLabel } = jest.requireActual('../text-field') as typeof import('../text-field');
    const { getByLabelText } = renderWithTheme(
      <LocaleProvider locale="fr">
        <TextFieldLabel required>Mot de passe</TextFieldLabel>
      </LocaleProvider>,
    );
    expect(getByLabelText('obligatoire')).toBeTruthy();
  });
});
