/** One shared Surface paint per group, with actual Buttons sharing that material. */
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button } from '../button';
import { BloomScope } from '../appearance';
import { hostNodes, resolvedStyle, surfaceSheens } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const materialCount = (tree: unknown) => surfaceSheens(tree).length;

/** A divider is the only 1px-wide box a group renders. */
const hairlineCount = (tree: unknown) =>
  hostNodes(tree).filter((n) => resolvedStyle(n.props.style).width === 1).length;

describe('Button.Group, surface', () => {
  it('paints ONE material for the whole group and none on the items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <Button.Group accessibilityLabel="Actions" testID="group">
        <Button testID="a" iconOnly accessibilityLabel="Search" />
        <Button testID="b" iconOnly accessibilityLabel="Share" />
      </Button.Group>,
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
      <Button.Group accessibilityLabel="Actions" testID="group">
        <Button testID="a" iconOnly accessibilityLabel="Search" />
        <Button testID="b" iconOnly accessibilityLabel="Share" />
      </Button.Group>,
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
        <Button.Group dividers={dividers} testID="group" accessibilityLabel="Actions">
          <Button testID="a" iconOnly accessibilityLabel="Search" />
          <Button testID="b" iconOnly accessibilityLabel="Share" />
        </Button.Group>,
      ).toJSON();
    expect(hairlineCount(group(false))).toBe(0);
    expect(hairlineCount(group(true))).toBe(1);
  });

  it('does not clip — an island that clips loses its shadow on iOS', () => {
    const { getByTestId } = renderWithTheme(
      <Button.Group accessibilityLabel="Actions" testID="group">
        <Button testID="a" iconOnly accessibilityLabel="Search" />
      </Button.Group>,
    );
    expect(resolvedStyle(getByTestId('group').props.style).overflow ?? 'visible').toBe('visible');
  });

  it('keeps joined geometry and clips only the inner row', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <Button.Group testID="group" accessibilityLabel="Align">
        <Button testID="a">Left</Button>
        <Button testID="b">Right</Button>
      </Button.Group>,
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
      <Button.Group accessibilityLabel="Inherited">
        <Button testID="inherited">A</Button>
      </Button.Group>
      <Button.Group size="md" accessibilityLabel="Override">
        <Button testID="group-size">B</Button>
        <Button size="sm" testID="item-size">
          C
        </Button>
      </Button.Group>
    </BloomScope>,
  );
  expect(resolvedStyle(screen.getByTestId('inherited').props.style).height).toBe(32);
  expect(resolvedStyle(screen.getByTestId('group-size').props.style).height).toBe(36);
  expect(resolvedStyle(screen.getByTestId('item-size').props.style).height).toBe(32);
});

it('adds an inset material only for checked items', () => {
  const { getByTestId, toJSON } = renderWithTheme(
    <Button.Group testID="group">
      <Button testID="selected" pressed>
        Day
      </Button>
      <Button testID="unselected">Week</Button>
      <Button>Month</Button>
    </Button.Group>,
  );
  expect(materialCount(toJSON())).toBe(2);
  expect(resolvedStyle(getByTestId('group-items').props.style).padding).toBe(0);
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
      <Button.Group testID="moving-group">
        {!removeFirst ? (
          <Button key="day" testID="day" pressed={checked.includes('day')}>
            Day
          </Button>
        ) : null}
        <Button key="month" testID="month" pressed={checked.includes('month')}>
          Long month label
        </Button>
      </Button.Group>
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
