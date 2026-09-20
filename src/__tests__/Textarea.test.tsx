import React from 'react';
import { TextInput, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Textarea } from '../textarea';
import { resolveTextFieldPalette } from '../text-field/shared';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function captureTheme(): Theme {
  let captured: Theme | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  renderWithTheme(<Probe />);
  if (!captured) throw new Error('theme probe never rendered');
  return captured;
}

/** The shell: the View carrying the 2px inset ring. */
function shellStyle(root: ReturnType<typeof render>) {
  const shells = root
    .UNSAFE_getAllByType(View)
    .map((v) => resolvedStyle(v.props.style))
    .filter((s) => s.borderWidth === 2 && s.borderRadius === 10);
  if (shells.length !== 1) throw new Error(`expected one shell, found ${shells.length}`);
  return shells[0]!;
}

describe('Textarea', () => {
  it('names the control from its label and renders label + hint', () => {
    const root = renderWithTheme(<Textarea label="Bio" hint="Markdown ok" />);
    expect(root.getByLabelText('Bio')).toBeTruthy();
    expect(root.getByText('Bio')).toBeTruthy();
    expect(root.getByText('Markdown ok')).toBeTruthy();
  });

  it('falls back to the placeholder as the name when unlabelled', () => {
    const root = renderWithTheme(<Textarea placeholder="Tell us" />);
    expect(root.getByLabelText('Tell us')).toBeTruthy();
  });

  it('matches the geometry: rows × 20, px-1, p-2 shell with the ring inside it', () => {
    const root = renderWithTheme(<Textarea label="Bio" />);
    const input = resolvedStyle(root.UNSAFE_getByType(TextInput).props.style);
    expect(input).toMatchObject({ height: 60, fontSize: 14, lineHeight: 20, paddingLeft: 4, paddingRight: 4 });
    // 2px ring + 6px padding = the 8px `p-2`.
    expect(shellStyle(root)).toMatchObject({ paddingHorizontal: 6, paddingVertical: 6 });
  });

  it('small keeps px-1.5 py-2', () => {
    const root = renderWithTheme(<Textarea label="Bio" size="sm" rows={2} />);
    expect(resolvedStyle(root.UNSAFE_getByType(TextInput).props.style).height).toBe(40);
    expect(shellStyle(root)).toMatchObject({ paddingHorizontal: 4, paddingVertical: 6 });
  });

  it('autoResize swaps the fixed height for a rows..maxRows band', () => {
    const root = renderWithTheme(<Textarea label="Bio" autoResize rows={1} maxRows={6} />);
    const input = resolvedStyle(root.UNSAFE_getByType(TextInput).props.style);
    expect(input.height).toBeUndefined();
    expect(input).toMatchObject({ minHeight: 20, maxHeight: 120 });
  });

  it('paints focus, invalid and disabled from the shared input palette', () => {
    const p = resolveTextFieldPalette(captureTheme());
    const rest = renderWithTheme(<Textarea label="Bio" />);
    expect(shellStyle(rest)).toMatchObject({ backgroundColor: p.background, borderColor: 'rgba(0, 0, 0, 0)' });
    act(() => {
      rest.UNSAFE_getByType(TextInput).props.onFocus({});
    });
    expect(shellStyle(rest).borderColor).toBe(p.ringFocus);

    const invalid = renderWithTheme(<Textarea label="Bio" invalid hint="Too short" />);
    expect(shellStyle(invalid).backgroundColor).toBe(p.backgroundInvalid);
    expect(invalid.UNSAFE_getByType(TextInput).props['aria-invalid']).toBe(true);
    expect(resolvedStyle(invalid.getByText('Too short').props.style).color).toBe(p.error);

    const disabled = renderWithTheme(<Textarea label="Bio" disabled />);
    const input = disabled.UNSAFE_getByType(TextInput);
    expect(input.props.editable).toBe(false);
    expect(input.props['aria-disabled']).toBe(true);
    expect(shellStyle(disabled).backgroundColor).toBe(p.backgroundDisabled);
  });

  it('counts uncontrolled typing against maxLength', () => {
    const root = renderWithTheme(<Textarea label="Bio" showCount maxLength={280} defaultValue="Hello" />);
    expect(root.getByText('5/280')).toBeTruthy();
    fireEvent.changeText(root.getByLabelText('Bio'), 'Hello there');
    expect(root.getByText('11/280')).toBeTruthy();
  });

  it('counts a controlled value without maxLength', () => {
    const root = renderWithTheme(<Textarea label="Bio" showCount value="abc" onValueChange={() => {}} />);
    expect(root.getByText('3')).toBeTruthy();
  });
});
