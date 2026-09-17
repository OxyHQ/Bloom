import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { BUTTON_SHADOW, DANGER_TABLE, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import { InputOtp } from '../input-otp';
import { resolveInputOtpBoxPaint, resolveInputOtpPalette } from '../input-otp/InputOtp';
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

const box = (root: ReturnType<typeof render>, i: number, length = 6) =>
  root.getByLabelText(`Digit ${i + 1} of ${length}`);
const values = (root: ReturnType<typeof render>, length = 6) =>
  Array.from({ length }, (_, i) => box(root, i, length).props.value).join('|');
const key = (k: string) => ({ nativeEvent: { key: k }, preventDefault: () => {} });

describe('InputOtp palette (design tokens)', () => {
  it('light', () => {
    const theme = captureTheme('light');
    const { accent, neutral: n } = resolveButtonRamps(theme);
    const red = colorRamp(theme.colors.negative, DANGER_TABLE);
    expect(resolveInputOtpPalette(theme)).toEqual({
      background: theme.colors.card,
      backgroundDisabled: n[100],
      backgroundInvalid: red[100],
      border: n[200],
      borderHover: n[300],
      borderInvalid: red[500],
      ring: accent[500],
      text: theme.colors.text,
      textDisabled: n[400],
      textInvalid: red[600],
      shadow: BUTTON_SHADOW.light,
    });
  });

  it('dark', () => {
    const theme = captureTheme('dark');
    const { accent, neutral: n } = resolveButtonRamps(theme);
    const red = colorRamp(theme.colors.negative, DANGER_TABLE);
    expect(resolveInputOtpPalette(theme)).toEqual({
      background: n[800],
      backgroundDisabled: n[800],
      backgroundInvalid: mixColor(theme.colors.background, red[950], 0.6),
      border: n[700],
      borderHover: n[500],
      borderInvalid: red[400],
      ring: accent[500],
      text: theme.colors.text,
      textDisabled: n[600],
      textInvalid: red[400],
      shadow: BUTTON_SHADOW.dark,
    });
  });

  it('precedence: focus ring beats the red edge, invalid pins hover, disabled drops the shadow', () => {
    const p = resolveInputOtpPalette(captureTheme('light'));
    const s = (o: Partial<Record<'hovered' | 'focused' | 'invalid' | 'disabled', boolean>>) =>
      resolveInputOtpBoxPaint(p, { hovered: false, focused: false, invalid: false, disabled: false, ...o });
    expect(s({})).toEqual({ backgroundColor: p.background, borderColor: p.border, color: p.text, boxShadow: p.shadow });
    expect(s({ hovered: true }).borderColor).toBe(p.borderHover);
    expect(s({ focused: true })).toMatchObject({ borderColor: p.ring, boxShadow: `0 0 0 2px ${p.ring}, ${p.shadow}` });
    expect(s({ invalid: true, hovered: true })).toMatchObject({ borderColor: p.borderInvalid, backgroundColor: p.backgroundInvalid, color: p.textInvalid });
    expect(s({ invalid: true, focused: true }).borderColor).toBe(p.ring);
    expect(s({ disabled: true, hovered: true })).toEqual({ backgroundColor: p.backgroundDisabled, borderColor: p.border, color: p.textDisabled, boxShadow: 'none' });
  });
});

describe('InputOtp', () => {
  it('renders one 48px mono box per digit, in a named group', () => {
    const root = renderWithTheme(<InputOtp testID="otp" />);
    expect(root.getByLabelText('One-time code')).toBeTruthy();
    const style = resolvedStyle(box(root, 0).props.style);
    expect(style).toMatchObject({ width: 48, height: 48, borderRadius: 10, borderWidth: 1, fontSize: 18, fontWeight: '500', textAlign: 'center' });
    expect(box(root, 0).props.autoComplete).toBe('one-time-code');
  });

  it('adds the 12px group gap before each group', () => {
    const root = renderWithTheme(<InputOtp groupEvery={3} />);
    expect(resolvedStyle(box(root, 2).props.style).marginLeft).toBe(0);
    expect(resolvedStyle(box(root, 3).props.style).marginLeft).toBe(12);
  });

  it('typing fills and a full autofill distributes, firing onComplete once full', () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    const root = renderWithTheme(<InputOtp onChange={onChange} onComplete={onComplete} />);
    fireEvent.changeText(box(root, 0), '4');
    expect(values(root)).toBe('4|||||');
    fireEvent.changeText(box(root, 1), '12a345');
    expect(values(root)).toBe('4|1|2|3|4|5');
    expect(onChange).toHaveBeenLastCalledWith('412345');
    expect(onComplete).toHaveBeenCalledWith('412345');
  });

  it('Backspace clears in place, then steps back from an empty box', () => {
    const root = renderWithTheme(<InputOtp defaultValue="12" />);
    act(() => {
      box(root, 1).props.onKeyPress(key('Backspace'));
    });
    expect(values(root)).toBe('1|||||');
    act(() => {
      box(root, 1).props.onKeyPress(key('Backspace'));
    });
    expect(values(root)).toBe('|||||');
  });

  it('follows a controlled value, dropping non-digits', () => {
    const root = renderWithTheme(<InputOtp value="9x8" length={4} />);
    expect(values(root, 4)).toBe('9|8||');
  });

  it('invalid and disabled reach every box as ARIA state', () => {
    const p = resolveInputOtpPalette(captureTheme('light'));
    const invalid = renderWithTheme(<InputOtp isInvalid length={2} />);
    expect(box(invalid, 1, 2).props['aria-invalid']).toBe(true);
    expect(resolvedStyle(box(invalid, 1, 2).props.style).borderColor).toBe(p.borderInvalid);
    const disabled = renderWithTheme(<InputOtp disabled length={2} />);
    expect(box(disabled, 0, 2).props.editable).toBe(false);
    expect(box(disabled, 0, 2).props['aria-disabled']).toBe(true);
    expect(resolvedStyle(box(disabled, 0, 2).props.style).boxShadow).toBe('none');
  });

  it('focus paints the accent ring on that box only', () => {
    const p = resolveInputOtpPalette(captureTheme('light'));
    const root = renderWithTheme(<InputOtp length={2} />);
    act(() => {
      box(root, 0, 2).props.onFocus({});
    });
    expect(resolvedStyle(box(root, 0, 2).props.style).borderColor).toBe(p.ring);
    expect(resolvedStyle(box(root, 1, 2).props.style).borderColor).toBe(p.border);
  });
});
