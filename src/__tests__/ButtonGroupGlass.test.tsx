/**
 * The GLASS variant of `ButtonGroup`, and the property that makes it a
 * variant rather than a second component: the group owns ONE material and the
 * items paint none.
 *
 * The defect this exists to catch is not a crash and not a wrong colour — it is
 * a row of controls each carrying its own fill and its own blur inside a
 * translucent capsule. That renders perfectly, reads as a row of cards, and is
 * indistinguishable from the intended result in any prop snapshot that does not
 * ask what the ITEMS painted. So the assertions here are about absence: no item
 * fill at rest, no divider by default, exactly one blur node in the tree.
 *
 * `expo-blur`'s `BlurView` is mocked as a host element (`__mocks__/expo-blur.ts`),
 * which is what makes "how many blurs" countable at all.
 */
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

const blurCount = (tree: unknown) => hostNodes(tree).filter((n) => n.type === 'BlurView').length;

/** A divider is the only 1px-wide box a group renders. */
const hairlineCount = (tree: unknown) =>
  hostNodes(tree).filter((n) => resolvedStyle(n.props.style).width === 1).length;

describe('ButtonGroup, glass', () => {
  it('paints ONE material for the whole group and none on the items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup variant="glass" accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
      </ButtonGroup>,
    );
    expect(blurCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toBe('transparent');
    expect(resolvedStyle(getByTestId('b').props.style).backgroundColor).toBe('transparent');
  });

  it('keeps the group a named group, and draws no hairline between items by default', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup variant="glass" accessibilityLabel="Actions" testID="group">
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
        <ButtonGroup variant="glass" dividers={dividers} testID="group" accessibilityLabel="Actions">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
          <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
        </ButtonGroup>,
      ).toJSON();
    expect(hairlineCount(group(false))).toBe(0);
    expect(hairlineCount(group(true))).toBe(1);
  });

  it('does not clip — an island that clips loses its shadow on iOS', () => {
    const { getByTestId } = renderWithTheme(
      <ButtonGroup variant="glass" accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
      </ButtonGroup>,
    );
    expect(resolvedStyle(getByTestId('group').props.style).overflow).toBeUndefined();
  });

  it('INHERITS the material from the nearest control surface', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ControlSurface material="glass">
        <ButtonGroup accessibilityLabel="Actions" testID="group">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        </ButtonGroup>
      </ControlSurface>,
    );
    expect(blurCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toBe('transparent');
  });

  it('lets an explicit variant override the surface it sits in', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ControlSurface material="glass">
        <ButtonGroup variant="solid" accessibilityLabel="Actions" testID="group">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        </ButtonGroup>
      </ControlSurface>,
    );
    expect(blurCount(toJSON())).toBe(0);
    expect(resolvedStyle(getByTestId('group').props.style).borderWidth).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).not.toBe('transparent');
  });

  it('leaves the solid variant exactly as it was', () => {
    // The regression this pins: `solid` is what every existing call site
    // renders, and it must not acquire a material, lose its hairlines or stop
    // clipping because a second variant arrived.
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup testID="group" accessibilityLabel="Align">
        <ButtonGroupItem testID="a">Left</ButtonGroupItem>
        <ButtonGroupItem testID="b">Right</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(blurCount(toJSON())).toBe(0);
    const group = resolvedStyle(getByTestId('group').props.style);
    expect(group.overflow).toBe('hidden');
    expect(group.borderWidth).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).not.toBe('transparent');
    expect(resolvedStyle(getByTestId('a').props.style).borderRadius).toBeUndefined();
  });
});
