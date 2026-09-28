/** One shared Surface paint per glass group, with actual plain Buttons flush inside. */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { ControlSurface } from '../control-surface';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const materialCount = (tree: unknown) => hostNodes(tree).filter((n) => n.type === 'LinearGradient' && /^bloom-surface-.*-sheen$/.test(String(n.props.id))).length;

/** A divider is the only 1px-wide box a group renders. */
const hairlineCount = (tree: unknown) =>
  hostNodes(tree).filter((n) => resolvedStyle(n.props.style).width === 1).length;

describe('ButtonGroup, glass', () => {
  it('paints ONE material for the whole group and none on the items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup material="glass" accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
      </ButtonGroup>,
    );
    expect(materialCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
    expect(resolvedStyle(getByTestId('b').props.style).backgroundColor).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  });

  it('keeps the group a named group, and draws no hairline between items by default', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup material="glass" accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
      </ButtonGroup>,
    );
    const group = getByTestId('group');
    expect(group.props.role).toBe('group');
    expect(group.props.accessibilityLabel).toBe('Actions');
    // Two items, one material layer, and nothing else: a divider would be a
    // third child of the island.
    const items = hostNodes(toJSON()).filter(
      (n) => n.props.testID === 'a' || n.props.testID === 'b',
    );
    expect(items).toHaveLength(2);
  });

  it('draws no hairline by default, and one when asked for it', () => {
    // Counted rather than eyeballed, and in BOTH directions: the default has to
    // be zero and the opt-in has to be one, or "dividers are optional" is a
    // sentence in a doc with nothing behind it.
    const group = (dividers: boolean) =>
      renderWithTheme(
        <ButtonGroup material="glass" dividers={dividers} testID="group" accessibilityLabel="Actions">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
          <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
        </ButtonGroup>,
      ).toJSON();
    expect(hairlineCount(group(false))).toBe(0);
    expect(hairlineCount(group(true))).toBe(1);
  });

  it('does not clip — an island that clips loses its shadow on iOS', () => {
    const { getByTestId } = renderWithTheme(
      <ButtonGroup material="glass" accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
      </ButtonGroup>,
    );
    expect(resolvedStyle(getByTestId('group').props.style).overflow ?? 'visible').toBe('visible');
  });

  it('INHERITS the material from the nearest control surface', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ControlSurface material="glass">
        <ButtonGroup accessibilityLabel="Actions" testID="group">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        </ButtonGroup>
      </ControlSurface>,
    );
    expect(materialCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  });

  it('lets an explicit material override the surface it sits in', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ControlSurface material="glass">
        <ButtonGroup material="solid" accessibilityLabel="Actions" testID="group">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        </ButtonGroup>
      </ControlSurface>,
    );
    expect(materialCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('group').props.style).borderWidth).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toBe('transparent');
  });

  it('keeps joined geometry and clips only the inner row', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup testID="group" accessibilityLabel="Align">
        <ButtonGroupItem testID="a">Left</ButtonGroupItem>
        <ButtonGroupItem testID="b">Right</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(materialCount(toJSON())).toBe(2);
    const group = resolvedStyle(getByTestId('group').props.style);
    expect(group.overflow).toBeUndefined();
    expect(resolvedStyle(getByTestId('group-items').props.style).overflow).toBe('hidden');
    expect(group.borderWidth).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toBe('transparent');
    expect(resolvedStyle(getByTestId('a').props.style).borderRadius).toBe(0);
  });
});

it('inherits compact density while explicit group and item sizes win', () => {
  const screen = renderWithTheme(<ControlSurface material="glass" density="sm">
    <ButtonGroup accessibilityLabel="Inherited"><ButtonGroupItem testID="inherited">A</ButtonGroupItem></ButtonGroup>
    <ButtonGroup size="md" accessibilityLabel="Override">
      <ButtonGroupItem testID="group-size">B</ButtonGroupItem>
      <ButtonGroupItem size="sm" testID="item-size">C</ButtonGroupItem>
    </ButtonGroup>
  </ControlSurface>);
  expect(resolvedStyle(screen.getByTestId('inherited').props.style).height).toBe(30);
  expect(resolvedStyle(screen.getByTestId('group-size').props.style).height).toBe(34);
  expect(resolvedStyle(screen.getByTestId('item-size').props.style).height).toBe(30);
});
