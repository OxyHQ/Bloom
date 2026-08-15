/**
 * `Divider` exists so nothing in the library draws a separator by hand. The two
 * things worth pinning are the ones a hand-rolled copy always gets wrong: the
 * colour comes from the `border` role rather than a literal, and the vertical
 * form STRETCHES to its parent's height instead of inventing one — a vertical
 * divider with a hardcoded height is the usual reason a toolbar rule is the
 * wrong length.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Divider } from '../divider';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The `border` role as the active theme resolves it. */
function borderRole(): string {
  let captured = '';
  function Probe() {
    captured = useTheme().colors.border;
    return null;
  }
  renderWithTheme(<Probe />);
  return captured;
}

describe('Divider', () => {
  it('takes its colour from the border role, not a literal', () => {
    const { getByTestId } = renderWithTheme(<Divider testID="d" />);
    expect(resolvedStyle(getByTestId('d').props.style).backgroundColor).toBe(borderRole());
  });

  it('lays out horizontally by default: full width, thickness as height', () => {
    const { getByTestId } = renderWithTheme(<Divider thickness={2} testID="d" />);
    const style = resolvedStyle(getByTestId('d').props.style);
    expect(style.height).toBe(2);
    expect(style.width).toBe('100%');
  });

  it('stretches to the parent height when vertical rather than inventing one', () => {
    const { getByTestId } = renderWithTheme(<Divider vertical thickness={2} testID="d" />);
    const style = resolvedStyle(getByTestId('d').props.style);
    expect(style.width).toBe(2);
    expect(style.alignSelf).toBe('stretch');
    expect(style.height).toBeUndefined();
  });

  it('spends spacing on the axis it separates', () => {
    const horizontal = renderWithTheme(<Divider spacing={12} testID="d" />);
    expect(resolvedStyle(horizontal.getByTestId('d').props.style).marginVertical).toBe(12);

    const vertical = renderWithTheme(<Divider vertical spacing={12} testID="d" />);
    expect(resolvedStyle(vertical.getByTestId('d').props.style).marginHorizontal).toBe(12);
  });

  it('lets an explicit colour win over the role', () => {
    const { getByTestId } = renderWithTheme(<Divider color="tomato" testID="d" />);
    expect(resolvedStyle(getByTestId('d').props.style).backgroundColor).toBe('tomato');
  });
});
