import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextField, TextFieldInput } from '../text-field';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('TextFieldInput floatingLabel', () => {
  it('renders the floating label text inside the field', () => {
    const { toJSON } = renderWithTheme(
      <TextField>
        <TextFieldInput floatingLabel label="Email" value="" onChangeText={() => {}} />
      </TextField>,
    );
    // The visual label renders in an animated text node; assert it lands in the
    // tree (it's aria-hidden because the input carries the accessibilityLabel).
    expect(JSON.stringify(toJSON())).toContain('Email');
  });

  it('drives accessibilityLabel from the label', () => {
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldInput floatingLabel label="Email" value="" onChangeText={() => {}} />
      </TextField>,
    );
    expect(getByLabelText('Email')).toBeTruthy();
  });

  it('suppresses the native placeholder (the floating label replaces it)', () => {
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldInput floatingLabel label="Email" value="" onChangeText={() => {}} />
      </TextField>,
    );
    const input = getByLabelText('Email');
    expect(input.props.placeholder).toBeUndefined();
  });

  it('self-wraps in a TextField when rendered without a root', () => {
    const { getByLabelText, toJSON } = renderWithTheme(
      <TextFieldInput floatingLabel label="Standalone" value="" onChangeText={() => {}} />,
    );
    expect(getByLabelText('Standalone')).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain('Standalone');
  });

  it('reflects a present value on the input', () => {
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldInput
          floatingLabel
          label="Email"
          value="nate@oxy.so"
          onChangeText={() => {}}
        />
      </TextField>,
    );
    expect(getByLabelText('Email').props.value).toBe('nate@oxy.so');
  });
});

describe('TextFieldInput default (non-floating) is unchanged', () => {
  it('falls back to the label as the placeholder when none is given', () => {
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldInput label="Username" value="" onChangeText={() => {}} />
      </TextField>,
    );
    // Default variant keeps the existing behavior: placeholder defaults to label.
    expect(getByLabelText('Username').props.placeholder).toBe('Username');
  });

  it('honors an explicit placeholder', () => {
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldInput
          label="Username"
          placeholder="oxylander"
          value=""
          onChangeText={() => {}}
        />
      </TextField>,
    );
    expect(getByLabelText('Username').props.placeholder).toBe('oxylander');
  });
});
