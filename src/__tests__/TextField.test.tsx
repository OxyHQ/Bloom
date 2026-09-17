import React from 'react';
import { contrastRatio } from '../styles/color-contrast';
import { AA_TEXT, hairlineOn, resolveSurfaceLevel, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import { resolveMenuPalette } from '../floating/menu-palette';
import { View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { DANGER_TABLE, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import {
  TextField,
  TextFieldHint,
  TextFieldIcon,
  TextFieldInput,
  TextFieldLabel,
} from '../text-field';
import {
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_RADIUS,
  resolvePlaceholderColor,
  resolveShellPaint,
  resolveTextFieldPalette,
} from '../text-field/shared';
import { RiSearchLine as MagnifyingGlassIcon } from '../icons/remix/RiSearchLine';
import { resolvedStyle } from './support/rendered-style';

type Mode = 'light' | 'dark';

function renderWithTheme(ui: React.ReactElement, mode: Mode = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function captureTheme(mode: Mode): Theme {
  let captured: Theme | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  renderWithTheme(<Probe />, mode);
  if (!captured) throw new Error('theme probe never rendered');
  return captured;
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const flat = (style: unknown) => resolvedStyle(style);

/** The absolutely-positioned shell the input paints behind itself. */
function findChrome(root: ReturnType<typeof render>) {
  const views = root.UNSAFE_getAllByType(View).filter((v) => {
    const s = flat(v.props.style);
    return s.position === 'absolute' && s.borderWidth === 2;
  });
  if (views.length !== 1) throw new Error(`expected one chrome, found ${views.length}`);
  return flat(views[0]!.props.style);
}

describe('TextField palette (input tokens)', () => {
  it('maps the light tokens onto the neutral and danger ramps', () => {
    const theme = captureTheme('light');
    const { neutral: n } = resolveButtonRamps(theme);
    const red = colorRamp(theme.colors.negative, DANGER_TABLE);
    const surface = theme.colors.background;
    const background = surfaceFillOn(theme, surface);
    expect(resolveTextFieldPalette(theme)).toEqual({
      background,
      backgroundDisabled: mixColor(surface, background, 0.5),
      backgroundInvalid: red[100],
      ringHover: hairlineOn(theme, background),
      ringFocus: n[400],
      text: theme.colors.text,
      textDisabled: n[300],
      placeholder: surfaceTextOn(theme, background).textTertiary,
      placeholderInvalid: red[400],
      icon: surfaceTextOn(theme, background).textTertiary,
      iconDisabled: n[300],
      iconInvalid: red[600],
      hint: surfaceTextOn(theme, surface).textTertiary,
      error: red[500],
      infoIcon: n[300],
      count: surfaceTextOn(theme, background).textTertiary,
    });
  });

  it('maps the dark tokens, compositing the color-mix ones over the surface', () => {
    const theme = captureTheme('dark');
    expect(theme.isDark).toBe(true);
    const { neutral: n } = resolveButtonRamps(theme);
    const red = colorRamp(theme.colors.negative, DANGER_TABLE);
    const surface = theme.colors.background;
    const background = surfaceFillOn(theme, surface);
    const disabledBg = mixColor(surface, background, 0.3);
    expect(resolveTextFieldPalette(theme)).toEqual({
      background,
      backgroundDisabled: disabledBg,
      backgroundInvalid: mixColor(surface, red[950], 0.6),
      ringHover: hairlineOn(theme, background),
      ringFocus: n[600],
      text: theme.colors.text,
      textDisabled: mixColor(disabledBg, n[500], 0.4),
      placeholder: surfaceTextOn(theme, background).textTertiary,
      placeholderInvalid: red[400],
      icon: surfaceTextOn(theme, background).textTertiary,
      iconDisabled: n[600],
      iconInvalid: red[400],
      hint: surfaceTextOn(theme, surface).textTertiary,
      error: red[400],
      infoIcon: n[700],
      count: surfaceTextOn(theme, background).textTertiary,
    });
  });

  it.each(['light', 'dark'] as const)(
    'gives the field a shell on every surface it can land on (%s)',
    (mode) => {
      const theme = captureTheme(mode);
      const parents = [
        theme.colors.background,
        theme.colors.card,
        resolveMenuPalette(theme).surface,
        resolveSurfaceLevel(theme, 1).background,
        resolveSurfaceLevel(theme, 2).background,
      ];
      for (const parent of parents) {
        const p = resolveTextFieldPalette(theme, parent);
        // The bug this replaced: the dark fill was `neutral-800`, the EXACT
        // colour of a menu surface — 1.000:1, a field with no shell.
        expect(contrastRatio(p.background, parent)).toBeGreaterThanOrEqual(1.1);
        // And the placeholder stays AA on whatever fill that produced.
        expect(contrastRatio(p.placeholder, p.background)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(p.hint, parent)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    },
  );

  it('follows the precedence for the shell: focus over hover, no ring when invalid or disabled', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const s = (o: Partial<Record<'hovered' | 'focused' | 'invalid' | 'disabled', boolean>>) =>
      resolveShellPaint(p, { hovered: false, focused: false, invalid: false, disabled: false, ...o });
    expect(s({})).toEqual({ backgroundColor: p.background, borderColor: TRANSPARENT });
    expect(s({ hovered: true })).toEqual({ backgroundColor: p.background, borderColor: p.ringHover });
    expect(s({ hovered: true, focused: true })).toEqual({ backgroundColor: p.background, borderColor: p.ringFocus });
    expect(s({ focused: true, invalid: true })).toEqual({ backgroundColor: p.backgroundInvalid, borderColor: TRANSPARENT });
    expect(s({ hovered: true, disabled: true })).toEqual({ backgroundColor: p.backgroundDisabled, borderColor: TRANSPARENT });
    // Invalid's fill is declared after disabled's.
    expect(s({ invalid: true, disabled: true }).backgroundColor).toBe(p.backgroundInvalid);
  });

  it('follows the precedence for the placeholder: invalid > disabled > focus > rest', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const c = (o: Partial<Record<'focused' | 'invalid' | 'disabled', boolean>>) =>
      resolvePlaceholderColor(p, { hovered: false, focused: false, invalid: false, disabled: false, ...o });
    expect(c({})).toBe(p.placeholder);
    expect(c({ focused: true })).toBe(p.text);
    expect(c({ focused: true, disabled: true })).toBe(p.textDisabled);
    expect(c({ focused: true, disabled: true, invalid: true })).toBe(p.placeholderInvalid);
  });
});

describe('TextField geometry', () => {
  it.each(['medium', 'small'] as const)('%s: the input is the shell height, 14/20, 4px inset', (size) => {
    const root = renderWithTheme(
      <TextField size={size}>
        <TextFieldInput label="Email" value="" onChangeText={() => {}} />
      </TextField>,
    );
    const input = flat(root.getByLabelText('Email').props.style);
    expect(input.height).toBe(TEXT_FIELD_GEOMETRY[size].height);
    expect(input.fontSize).toBe(14);
    expect(input.fontWeight).toBe('400');
    expect(input.paddingLeft).toBe(4);
    const chrome = findChrome(root);
    expect(chrome.borderRadius).toBe(TEXT_FIELD_RADIUS);
    expect(chrome.borderRadius).toBe(10);
  });

  it('pins the geometry numbers', () => {
    expect(TEXT_FIELD_GEOMETRY).toEqual({
      medium: { height: 36, paddingHorizontal: 8 },
      small: { height: 32, paddingHorizontal: 6 },
    });
  });

  it('keeps a caller paddingRight over the base (longhand, not paddingHorizontal)', () => {
    const root = renderWithTheme(
      <TextFieldInput label="Search" value="" onChangeText={() => {}} style={{ paddingRight: 24 }} />,
    );
    const input = flat(root.getByLabelText('Search').props.style);
    expect(input.paddingRight).toBe(24);
    expect(input.paddingHorizontal).toBeUndefined();
  });
});

describe('TextField states', () => {
  it('paints the rest shell and placeholder', () => {
    const theme = captureTheme('light');
    const p = resolveTextFieldPalette(theme);
    const root = renderWithTheme(<TextFieldInput label="Email" value="" onChangeText={() => {}} />);
    expect(findChrome(root)).toMatchObject({ backgroundColor: p.background, borderColor: TRANSPARENT });
    expect(root.getByLabelText('Email').props.placeholderTextColor).toBe(p.placeholder);
  });

  it('focus rings the shell and darkens the placeholder', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(<TextFieldInput label="Email" value="" onChangeText={() => {}} />);
    act(() => {
      root.getByLabelText('Email').props.onFocus({});
    });
    expect(findChrome(root).borderColor).toBe(p.ringFocus);
    expect(root.getByLabelText('Email').props.placeholderTextColor).toBe(p.text);
  });

  it('invalid tints the shell, reddens placeholder and icon, and sets aria-invalid', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(
      <TextField isInvalid>
        <TextFieldIcon icon={MagnifyingGlassIcon} />
        <TextFieldInput label="Email" value="" onChangeText={() => {}} />
      </TextField>,
    );
    expect(findChrome(root).backgroundColor).toBe(p.backgroundInvalid);
    const input = root.getByLabelText('Email');
    expect(input.props.placeholderTextColor).toBe(p.placeholderInvalid);
    expect(input.props['aria-invalid']).toBe(true);
    expect(JSON.stringify(root.toJSON())).toContain(p.iconInvalid);
  });

  it('disabled on the root disables the input and dims the shell and icon', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(
      <TextField disabled>
        <TextFieldIcon icon={MagnifyingGlassIcon} />
        <TextFieldInput label="Email" value="x" onChangeText={() => {}} />
      </TextField>,
    );
    const input = root.getByLabelText('Email');
    expect(input.props.editable).toBe(false);
    expect(input.props['aria-disabled']).toBe(true);
    expect(flat(input.props.style).color).toBe(p.textDisabled);
    expect(findChrome(root).backgroundColor).toBe(p.backgroundDisabled);
    expect(JSON.stringify(root.toJSON())).toContain(p.iconDisabled);
  });

  it('an input with editable={false} reports disabled up to its siblings', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(
      <TextField>
        <TextFieldIcon icon={MagnifyingGlassIcon} />
        <TextFieldInput label="Email" value="x" onChangeText={() => {}} editable={false} />
      </TextField>,
    );
    expect(findChrome(root).backgroundColor).toBe(p.backgroundDisabled);
    expect(JSON.stringify(root.toJSON())).toContain(p.iconDisabled);
  });
});

describe('TextFieldLabel and TextFieldHint', () => {
  it('label is 14/20 500 text-primary with a red asterisk', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(<TextFieldLabel required>Email</TextFieldLabel>);
    expect(flat(root.getByText('Email').props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: p.text,
    });
    expect(flat(root.getByText('*').props.style).color).toBe(p.error);
  });

  it('hint is caption-1-medium, text-secondary or the error colour', () => {
    const p = resolveTextFieldPalette(captureTheme('light'));
    const root = renderWithTheme(
      <>
        <TextFieldHint>Helpful</TextFieldHint>
        <TextFieldHint isInvalid>Broken</TextFieldHint>
      </>,
    );
    expect(flat(root.getByText('Helpful').props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.15,
      paddingTop: 1,
      marginTop: 4,
      color: p.hint,
    });
    expect(flat(root.getByText('Broken').props.style).color).toBe(p.error);
  });
});
