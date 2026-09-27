import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { BUTTON_SHADOW } from '../button/shared';
import { InputOtp, cleanInputOtpValue } from '../input-otp';
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
  it.each(['light', 'dark'] as const)('inherits field surfaces and error pairs in %s', mode => {
    const theme = captureTheme(mode);
    const c = theme.colors;
    expect(resolveInputOtpPalette(theme)).toMatchObject({
      background: c.backgroundSecondary,
      backgroundInvalid: c.errorSubtle,
      border: c.borderLight,
      borderInvalid: c.errorSubtleForeground,
      ring: c.primary,
      text: c.text,
      textInvalid: c.errorSubtleForeground,
      shadow: BUTTON_SHADOW[mode],
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
    // Narrows, never grows, when the row does not fit (ten boxes on a phone).
    expect(style).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(style.flexGrow).toBeUndefined();
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
    const invalid = renderWithTheme(<InputOtp invalid length={2} />);
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

  // On Android RN's `selectTextOnFocus` selects at the NEXT layout, which a
  // focus does not cause, so a keystroke into a filled box landed beside the old
  // digit. Native selects the digit in `onFocus`; see Search (OxyHQ/Mention#1126).
  it('selects a filled box on focus so a keystroke replaces its digit', () => {
    const setSelection = jest.fn();
    const root = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <InputOtp length={2} value="5" />
      </BloomThemeProvider>,
      { createNodeMock: () => ({ setSelection, focus: jest.fn(), blur: jest.fn() }) },
    );
    expect(box(root, 0, 2).props.selectTextOnFocus).toBe(false);
    act(() => {
      box(root, 1, 2).props.onFocus({});
    });
    expect(setSelection).not.toHaveBeenCalled();
    act(() => {
      box(root, 0, 2).props.onFocus({});
    });
    expect(setSelection).toHaveBeenCalledWith(0, 1);
  });

  it('accepts a pasted code with separators whole: maxLength leaves room for them', () => {
    const root = renderWithTheme(<InputOtp />);
    expect(box(root, 0).props.maxLength).toBe(12);
    fireEvent.changeText(box(root, 0), '123-456');
    expect(values(root)).toBe('1|2|3|4|5|6');
  });
});

describe('InputOtp type="alphanumeric"', () => {
  const chars = (root: ReturnType<typeof render>, length: number) =>
    Array.from({ length }, (_, i) => root.getByLabelText(`Character ${i + 1} of ${length}`).props.value).join('');

  it('cleans per type: numeric keeps digits, alphanumeric upper-cases and keeps A-Z0-9', () => {
    expect(cleanInputOtpValue('ab-12 3c')).toBe('123');
    expect(cleanInputOtpValue('ab-12 3c', 'alphanumeric')).toBe('AB123C');
    expect(cleanInputOtpValue('ñé_!', 'alphanumeric')).toBe('');
  });

  it('keeps the numeric default: number pad, digit boxes', () => {
    const root = renderWithTheme(<InputOtp length={2} />);
    expect(box(root, 0, 2).props).toMatchObject({ inputMode: 'numeric', keyboardType: 'number-pad' });
    expect(box(root, 0, 2).props.autoCapitalize).toBeUndefined();
  });

  it('uses a letters keyboard that capitalises, and keeps the one-time-code hint', () => {
    const root = renderWithTheme(<InputOtp type="alphanumeric" length={10} />);
    const first = root.getByLabelText('Character 1 of 10');
    // No `inputMode` on native: it would outrank `keyboardType` (web gets `text`).
    expect(first.props.inputMode).toBeUndefined();
    expect(first.props).toMatchObject({
      keyboardType: 'ascii-capable',
      autoCapitalize: 'characters',
      autoCorrect: false,
      spellCheck: false,
      autoComplete: 'one-time-code',
      textContentType: 'oneTimeCode',
    });
  });

  it('a pasted XXXXX-XXXXX fills all ten boxes, upper-cased, and completes', () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    const root = renderWithTheme(
      <InputOtp type="alphanumeric" length={10} groupEvery={5} onChange={onChange} onComplete={onComplete} />,
    );
    fireEvent.changeText(root.getByLabelText('Character 1 of 10'), 'abcde-fg234');
    expect(chars(root, 10)).toBe('ABCDEFG234');
    expect(onChange).toHaveBeenLastCalledWith('ABCDEFG234');
    expect(onComplete).toHaveBeenCalledWith('ABCDEFG234');
  });

  it('groupEvery={5} splits ten boxes into two groups of five', () => {
    const root = renderWithTheme(<InputOtp type="alphanumeric" length={10} groupEvery={5} />);
    const margin = (i: number) => resolvedStyle(root.getByLabelText(`Character ${i + 1} of 10`).props.style).marginLeft;
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(margin)).toEqual([0, 0, 0, 0, 0, 12, 0, 0, 0, 0]);
  });

  it('typing a letter fills and a symbol is dropped; a controlled value is cleaned too', () => {
    const root = renderWithTheme(<InputOtp type="alphanumeric" length={4} />);
    fireEvent.changeText(root.getByLabelText('Character 1 of 4'), 'x');
    fireEvent.changeText(root.getByLabelText('Character 2 of 4'), '-');
    expect(chars(root, 4)).toBe('X');
    const controlled = renderWithTheme(<InputOtp type="alphanumeric" length={4} value="a-9z" />);
    expect(chars(controlled, 4)).toBe('A9Z');
  });
});
