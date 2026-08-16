import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  TextField,
  TextFieldGhost,
  TextFieldIcon,
  TextFieldInput,
  TextFieldLabel,
  TextFieldSuffix,
} from '../text-field';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '../icons/MagnifyingGlass';

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

/**
 * Which parts need the root, and which do not.
 *
 * The context used to hand out a filled-in default, so a part rendered outside a
 * `<TextField>` looked finished and was permanently wrong: an icon that never
 * takes the focus colour, a suffix stuck on the resting tint. Nothing errored.
 *
 * But "throw whenever the context is missing" is the wrong rule here, and this
 * block is as much about the parts that must NOT throw. Standalone
 * `<TextFieldInput>` is a supported spelling with dozens of call sites across the
 * fleet, and it works by reading a missing context as "wrap yourself"; the label
 * is deliberately rendered ABOVE the field, outside it, everywhere it is used.
 * Making either of those throw would break real screens.
 */
describe('TextField context', () => {
  /** React logs the thrown render before it propagates; the throw is the assertion. */
  function expectThrows(ui: React.ReactElement) {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderWithTheme(ui)).toThrow(
        /TextField parts must be rendered inside a <TextField>\./,
      );
    } finally {
      spy.mockRestore();
    }
  }

  it('refuses to render a state-reading part outside a root', () => {
    expectThrows(<TextFieldIcon icon={MagnifyingGlassIcon} />);
    expectThrows(<TextFieldSuffix label="domain">.oxy.so</TextFieldSuffix>);
  });

  it('renders those same parts inside a root, so the throw is about the ROOT', () => {
    // The control for the two above: without it, a part broken for any other
    // reason would satisfy them just as well.
    const { getByLabelText } = renderWithTheme(
      <TextField>
        <TextFieldIcon icon={MagnifyingGlassIcon} />
        <TextFieldInput label="Domain" value="" onChangeText={() => {}} />
        <TextFieldSuffix label="domain">.oxy.so</TextFieldSuffix>
      </TextField>,
    );
    expect(getByLabelText('domain')).toBeTruthy();
    expect(getByLabelText('Domain')).toBeTruthy();
  });

  it('lets the parts that do not need the root render without one', () => {
    // `TextFieldInput` reads the missing context as "no root above me" and wraps
    // itself; `TextFieldLabel` sits above the field by design; `TextFieldGhost`
    // reads nothing. All three are live spellings in the fleet.
    const { getByLabelText, getByText, toJSON } = renderWithTheme(
      <>
        <TextFieldLabel>Workspace</TextFieldLabel>
        <TextFieldInput label="Slug" value="" onChangeText={() => {}} />
        <TextFieldGhost value="oxy.so">acme.</TextFieldGhost>
      </>,
    );
    expect(getByText('Workspace')).toBeTruthy();
    expect(getByLabelText('Slug')).toBeTruthy();
    // The ghost is aria-hidden by design, so it is read off the tree.
    expect(JSON.stringify(toJSON())).toContain('oxy.so');
  });
});
