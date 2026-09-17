/**
 * `Divider` exists so nothing in the library draws a separator by hand. The
 * things worth pinning are the ones a hand-rolled copy always gets wrong: the
 * colour comes from ONE derived source (the separator stop on the
 * theme-tinted neutral ramp) rather than a literal, and the vertical form
 * STRETCHES to its parent's height instead of inventing one — a vertical
 * divider with a hardcoded height is the usual reason a toolbar rule is the
 * wrong length. Plus the three treatments and their content layout.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Divider } from '../divider';
import { useTheme } from '../theme/use-theme';
import { resolveButtonRamps } from '../button/shared';
import { borderRadius } from '../styles/tokens';
import { renderedChildren, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The neutral ramp as the active theme resolves it. */
function neutral(mode: 'light' | 'dark') {
  let captured: ReturnType<typeof resolveButtonRamps>['neutral'] | null = null;
  function Probe() {
    captured = resolveButtonRamps(useTheme()).neutral;
    return null;
  }
  renderWithTheme(<Probe />, mode);
  return captured!;
}

describe('Divider', () => {
  it('takes its colour from the separator stop: neutral-200 light, neutral-800 dark', () => {
    const light = renderWithTheme(<Divider testID="d" />);
    expect(resolvedStyle(light.getByTestId('d').props.style).backgroundColor).toBe(neutral('light')[200]);
    const dark = renderWithTheme(<Divider testID="d" />, 'dark');
    expect(resolvedStyle(dark.getByTestId('d').props.style).backgroundColor).toBe(neutral('dark')[800]);
  });

  it('lays out horizontally by default: full width, 1px, thickness as height', () => {
    const plain = renderWithTheme(<Divider testID="d" />);
    expect(resolvedStyle(plain.getByTestId('d').props.style).height).toBe(1);
    const { getByTestId } = renderWithTheme(<Divider thickness={2} testID="d" />);
    const style = resolvedStyle(getByTestId('d').props.style);
    expect(style.height).toBe(2);
    expect(style.width).toBe('100%');
    expect(getByTestId('d').props.role).toBe('separator');
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

  it('draws the empty double (8px, top + bottom hairline) and fill (8px pill) strips', () => {
    const n = neutral('light');
    const double = resolvedStyle(renderWithTheme(<Divider variant="double" testID="d" />).getByTestId('d').props.style);
    expect(double).toMatchObject({ height: 8, borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: n[200] });
    const fill = resolvedStyle(renderWithTheme(<Divider variant="fill" testID="d" />).getByTestId('d').props.style);
    expect(fill).toMatchObject({ height: 8, borderRadius: borderRadius.full, backgroundColor: n[100] });
  });

  it('places content between two flexible lines, dropping the line on the aligned side', () => {
    const count = (ui: React.ReactElement) => renderedChildren(renderWithTheme(ui).toJSON(), 'd').length;
    expect(count(<Divider testID="d">Today</Divider>)).toBe(3);
    expect(count(<Divider align="start" testID="d">Today</Divider>)).toBe(2);
    expect(count(<Divider align="end" testID="d">Today</Divider>)).toBe(2);
    // `double` and `fill` frame the content instead of running lines beside it.
    expect(count(<Divider variant="double" testID="d">Today</Divider>)).toBe(1);
    expect(count(<Divider variant="fill" testID="d">Today</Divider>)).toBe(1);
  });

  it('frames content: gap 12 single, py 10 double, radius 10 / px 16 / py 10 fill', () => {
    const style = (ui: React.ReactElement) => resolvedStyle(renderWithTheme(ui).getByTestId('d').props.style);
    expect(style(<Divider testID="d">x</Divider>).gap).toBe(12);
    expect(style(<Divider variant="double" testID="d">x</Divider>)).toMatchObject({ paddingTop: 10, paddingBottom: 10 });
    expect(style(<Divider variant="fill" align="end" testID="d">x</Divider>)).toMatchObject({
      borderRadius: 10,
      paddingLeft: 16,
      paddingTop: 10,
      justifyContent: 'flex-end',
    });
  });

  it('sets a string label in 14/20 medium secondary text', () => {
    const { getByText } = renderWithTheme(<Divider>Today</Divider>);
    expect(resolvedStyle(getByText('Today').props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: neutral('light')[500],
    });
  });
});
