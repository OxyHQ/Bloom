/** One shared Surface paint per group, with actual plain Buttons flush inside. */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { BloomScope } from '../appearance';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const materialCount = (tree: unknown) =>
  hostNodes(tree).filter(
    (n) => n.type === 'LinearGradient' && /^bloom-surface-.*-sheen$/.test(String(n.props.id)),
  ).length;

/** A divider is the only 1px-wide box a group renders. */
const hairlineCount = (tree: unknown) =>
  hostNodes(tree).filter((n) => resolvedStyle(n.props.style).width === 1).length;

describe('ButtonGroup, glass', () => {
  it('paints ONE material for the whole group and none on the items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
      </ButtonGroup>,
    );
    expect(materialCount(toJSON())).toBe(1);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toMatch(
      /^(transparent|rgba\(0, 0, 0, 0\))$/,
    );
    expect(resolvedStyle(getByTestId('b').props.style).backgroundColor).toMatch(
      /^(transparent|rgba\(0, 0, 0, 0\))$/,
    );
  });

  it('keeps the group a named group, and draws a divider between items by default', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
        <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
      </ButtonGroup>,
    );
    const group = getByTestId('group');
    expect(group.props.role).toBe('group');
    expect(group.props.accessibilityLabel).toBe('Actions');
    expect(hairlineCount(toJSON())).toBe(1);
    const items = hostNodes(toJSON()).filter(
      (n) => n.props.testID === 'a' || n.props.testID === 'b',
    );
    expect(items).toHaveLength(2);
  });

  it('allows dividers to be explicitly enabled or disabled', () => {
    // Counted rather than eyeballed, and in BOTH directions: the default has to
    // be zero and the opt-in has to be one, or "dividers are optional" is a
    // sentence in a doc with nothing behind it.
    const group = (dividers: boolean) =>
      renderWithTheme(
        <ButtonGroup dividers={dividers} testID="group" accessibilityLabel="Actions">
          <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
          <ButtonGroupItem testID="b" iconOnly accessibilityLabel="Share" />
        </ButtonGroup>,
      ).toJSON();
    expect(hairlineCount(group(false))).toBe(0);
    expect(hairlineCount(group(true))).toBe(1);
  });

  it('does not clip — an island that clips loses its shadow on iOS', () => {
    const { getByTestId } = renderWithTheme(
      <ButtonGroup accessibilityLabel="Actions" testID="group">
        <ButtonGroupItem testID="a" iconOnly accessibilityLabel="Search" />
      </ButtonGroup>,
    );
    expect(resolvedStyle(getByTestId('group').props.style).overflow ?? 'visible').toBe('visible');
  });

  it('keeps joined geometry and clips only the inner row', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <ButtonGroup testID="group" accessibilityLabel="Align">
        <ButtonGroupItem testID="a">Left</ButtonGroupItem>
        <ButtonGroupItem testID="b">Right</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(materialCount(toJSON())).toBe(1);
    const group = resolvedStyle(getByTestId('group').props.style);
    expect(group.overflow).toBeUndefined();
    expect(resolvedStyle(getByTestId('group-items').props.style).overflow).toBe('hidden');
    expect(group.borderWidth ?? 0).toBe(0);
    expect(resolvedStyle(getByTestId('a').props.style).backgroundColor).toBe('transparent');
    expect(resolvedStyle(getByTestId('a').props.style).borderRadius).toBeGreaterThan(0);
  });
});

it('inherits compact density while explicit group and item sizes win', () => {
  const screen = renderWithTheme(
    <BloomScope size="sm">
      <ButtonGroup accessibilityLabel="Inherited">
        <ButtonGroupItem testID="inherited">A</ButtonGroupItem>
      </ButtonGroup>
      <ButtonGroup size="md" accessibilityLabel="Override">
        <ButtonGroupItem testID="group-size">B</ButtonGroupItem>
        <ButtonGroupItem size="sm" testID="item-size">
          C
        </ButtonGroupItem>
      </ButtonGroup>
    </BloomScope>,
  );
  expect(resolvedStyle(screen.getByTestId('inherited').props.style).height).toBe(30);
  expect(resolvedStyle(screen.getByTestId('group-size').props.style).height).toBe(34);
  expect(resolvedStyle(screen.getByTestId('item-size').props.style).height).toBe(30);
});

it('adds an inset material only for checked items', () => {
  const { getByTestId, toJSON } = renderWithTheme(
    <ButtonGroup testID="group">
      <ButtonGroupItem testID="selected" checked>
        Day
      </ButtonGroupItem>
      <ButtonGroupItem testID="unselected">Week</ButtonGroupItem>
      <ButtonGroupItem>Month</ButtonGroupItem>
    </ButtonGroup>,
  );
  expect(materialCount(toJSON())).toBe(2);
  expect(resolvedStyle(getByTestId('group-items').props.style).padding).toBe(2);
  expect(resolvedStyle(getByTestId('selected').props.style).borderRadius).toBeGreaterThan(0);
  expect(getByTestId('selected').props['aria-pressed']).toBe(true);
  const separators = hostNodes(toJSON()).filter((n) => resolvedStyle(n.props.style).width === 1);
  expect(separators).toHaveLength(2);
  for (const separator of separators)
    expect(resolvedStyle(separator.props.style)).toMatchObject({ marginTop: 8, marginBottom: 8 });
});

// Layout callbacks are the real registration boundary. Reanimated's test mock
// snapshots animated styles on render, so a second render reads effect writes;
// spring interpolation itself belongs to the real-browser check.
function selectionFixture(checked: readonly string[], removeFirst = false) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ButtonGroup testID="moving-group">
        {!removeFirst ? (
          <ButtonGroupItem key="day" testID="day" checked={checked.includes('day')}>
            Day
          </ButtonGroupItem>
        ) : null}
        <ButtonGroupItem key="month" testID="month" checked={checked.includes('month')}>
          Long month label
        </ButtonGroupItem>
      </ButtonGroup>
    </BloomThemeProvider>
  );
}

it('moves one measured capsule between unequal items without duplicating their materials', () => {
  const screen = render(selectionFixture(['day']));
  fireEvent(screen.getByTestId('day'), 'layout', {
    nativeEvent: { layout: { x: 2, y: 2, width: 48, height: 34 } },
  });
  fireEvent(screen.getByTestId('month'), 'layout', {
    nativeEvent: { layout: { x: 51, y: 2, width: 130, height: 34 } },
  });
  screen.rerender(selectionFixture(['day']));
  expect(resolvedStyle(screen.getByTestId('moving-group-selection').props.style)).toMatchObject({
    width: 48,
    height: 34,
    opacity: 1,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  });
  expect(materialCount(screen.toJSON())).toBe(2);
  screen.rerender(selectionFixture(['month']));
  screen.rerender(selectionFixture(['month']));
  expect(resolvedStyle(screen.getByTestId('moving-group-selection').props.style)).toMatchObject({
    width: 130,
    transform: [{ translateX: 51 }, { translateY: 2 }],
  });
  expect(materialCount(screen.toJSON())).toBe(2);
  expect(screen.getByTestId('month').props['aria-pressed']).toBe(true);
  expect(screen.getByTestId('day').props['aria-pressed']).toBe(false);
});

it('keeps independently checked controls painted locally instead of moving one shared capsule', () => {
  const screen = render(selectionFixture(['day', 'month']));
  for (const [id, x] of [
    ['day', 2],
    ['month', 51],
  ] as const) {
    fireEvent(screen.getByTestId(id), 'layout', {
      nativeEvent: { layout: { x, y: 2, width: 48, height: 34 } },
    });
  }
  screen.rerender(selectionFixture(['day', 'month']));
  expect(screen.queryByTestId('moving-group-selection')).toBeNull();
  expect(materialCount(screen.toJSON())).toBe(3);
  expect(screen.getByTestId('day').props['aria-pressed']).toBe(true);
  expect(screen.getByTestId('month').props['aria-pressed']).toBe(true);
});

it('unregisters a removed selected item and fades its capsule without moving to another item', () => {
  const screen = render(selectionFixture(['day']));
  fireEvent(screen.getByTestId('day'), 'layout', {
    nativeEvent: { layout: { x: 2, y: 2, width: 48, height: 34 } },
  });
  screen.rerender(selectionFixture(['day']));
  screen.rerender(selectionFixture(['day'], true));
  screen.rerender(selectionFixture(['day'], true));
  expect(screen.queryByTestId('day')).toBeNull();
  expect(resolvedStyle(screen.getByTestId('moving-group-selection').props.style)).toMatchObject({
    opacity: 0,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  });
  expect(screen.getByTestId('month').props['aria-pressed']).toBe(false);
});
