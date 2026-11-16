import type React from 'react';
import { View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button } from '../button';
import { BUTTON_RADIUS } from '../button/shared';
import { pressHost } from './support/press-host';
import { renderedChildren, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Button.Group', () => {
  it.each([false, true])(
    'keeps its items its children in the mounted tree (separated: %s)',
    (separated) => {
      // Fabric flattens a view with no stacking context and mounts its children
      // in the nearest ancestor that has one: a role and a label are not one.
      const { getByTestId } = renderWithTheme(
        <Button.Group testID="group" accessibilityLabel="Back and forward" separated={separated}>
          <Button iconOnly accessibilityLabel="Back" />
          <Button iconOnly accessibilityLabel="Forward" />
        </Button.Group>,
      );
      const group = getByTestId('group');
      expect(group.props.role).toBe('group');
      expect(group.props.collapsable).toBe(false);
    },
  );

  it('is one rimmed surface with inset separators between items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <View testID="host">
        <Button.Group testID="group">
          <Button>Left</Button>
          <Button>Center</Button>
          <Button>Right</Button>
        </Button.Group>
      </View>,
    );
    const group = resolvedStyle(getByTestId('group').props.style);
    expect(group.borderRadius).toBe(BUTTON_RADIUS);
    expect(group.borderWidth ?? 0).toBe(0);
    // Three controls and two separators; the parent owns the shared material.
    expect(renderedChildren(toJSON(), 'group-items')).toHaveLength(5);
  });

  it('sizes items from the group: 36 medium, 32 small', () => {
    const { getByTestId } = renderWithTheme(
      <Button.Group size="sm">
        <Button testID="item">One</Button>
        <Button testID="icon" iconOnly accessibilityLabel="Add" />
      </Button.Group>,
    );
    expect(resolvedStyle(getByTestId('item').props.style).height).toBe(32);
    expect(resolvedStyle(getByTestId('icon').props.style).width).toBe(32);
  });

  it('presses, and announces selection with both spellings', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Button.Group>
        <Button testID="item" pressed onPress={onPress}>
          Week
        </Button>
      </Button.Group>,
    );
    const item = getByTestId('item');
    pressHost(item);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(item.props['aria-pressed']).toBe(true);
    expect(item.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('an item that is not a toggle carries NO pressed state', () => {
    // `aria-pressed="false"` on a plain action announces a state it does not
    // have — "not pressed" on an attach button that fires and is done.
    const screen = renderWithTheme(
      <Button.Group accessibilityLabel="Format">
        <Button testID="action" onPress={() => {}}>
          Attach
        </Button>
        <Button testID="off" pressed={false} onPress={() => {}}>
          Bold
        </Button>
      </Button.Group>,
    );
    const action = screen.getByTestId('action');
    expect(action.props['aria-pressed']).toBeUndefined();
    expect(action.props.accessibilityState?.selected).toBeUndefined();
    // A toggle that is OFF still says so.
    expect(screen.getByTestId('off').props['aria-pressed']).toBe(false);
  });

  it('keeps controlled changes and disabled state on the real Button', () => {
    const change = jest.fn();
    const screen = renderWithTheme(
      <Button.Group>
        <Button testID="selected" pressed onPressedChange={change}>
          B
        </Button>
        <Button testID="disabled" disabled onPressedChange={change}>
          C
        </Button>
      </Button.Group>,
    );
    pressHost(screen.getByTestId('selected'));
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('disabled').props.disabled).toBe(true);
    expect(screen.getByTestId('disabled').props.onPress).toBeUndefined();
  });
  describe('separated', () => {
    it('is one pill cut into segments: one surface, no hairlines, a 2px gap, ends clipped', () => {
      const { getByTestId, toJSON } = renderWithTheme(
        <Button.Group separated size="xs" testID="group" accessibilityLabel="Actions">
          <Button iconOnly accessibilityLabel="One" />
          <Button iconOnly accessibilityLabel="Two" />
          <Button iconOnly accessibilityLabel="Three" />
        </Button.Group>,
      );
      const group = getByTestId('group');
      expect(group.props.role).toBe('group');
      // The group's own surface is the pill: its rim and shadow are drawn once, around the whole.
      expect(resolvedStyle(group.props.style).borderRadius).toBe(BUTTON_RADIUS);
      expect(resolvedStyle(getByTestId('group-items').props.style)).toMatchObject({
        flexDirection: 'row',
        gap: 2,
        overflow: 'hidden',
        borderRadius: BUTTON_RADIUS,
      });
      // Three items and nothing between them: the joined group would draw two separators.
      expect(renderedChildren(toJSON(), 'group-items')).toHaveLength(3);
    });

    it('makes the items straight segments: only the group’s ends are rounded', () => {
      const { getByTestId } = renderWithTheme(
        <Button.Group separated size="xs">
          <Button testID="item">One</Button>
        </Button.Group>,
      );
      expect(resolvedStyle(getByTestId('item').props.style).borderRadius).toBe(0);
    });

    it('makes an icon-only item 1.5 times as wide as tall, never a circle', () => {
      const { getByTestId } = renderWithTheme(
        <Button.Group separated size="xs">
          <Button iconOnly testID="item" accessibilityLabel="One" />
        </Button.Group>,
      );
      const style = resolvedStyle(getByTestId('item').props.style);
      expect([style.width, style.height]).toEqual([36, 24]);
    });

    it('sizes items 24 at xs, 32 at sm and 36 at md', () => {
      const heights = (['xs', 'sm', 'md'] as const).map((size) => {
        const { getByTestId } = renderWithTheme(
          <Button.Group separated size={size}>
            <Button testID="item">Pill</Button>
          </Button.Group>,
        );
        return resolvedStyle(getByTestId('item').props.style).height;
      });
      expect(heights).toEqual([24, 32, 36]);
    });
  });
});

it.each(['xs', 'sm', 'md', 'lg'] as const)(
  'keeps standalone and grouped Button geometry identical at %s',
  (size) => {
    const screen = renderWithTheme(
      <View>
        <Button size={size} iconOnly accessibilityLabel="Standalone" testID="standalone" />
        <Button.Group size={size}>
          <Button iconOnly accessibilityLabel="Grouped" testID="grouped" />
        </Button.Group>
      </View>,
    );
    const standalone = resolvedStyle(screen.getByTestId('standalone').props.style);
    const grouped = resolvedStyle(screen.getByTestId('grouped').props.style);
    expect(grouped.height).toBe(standalone.height);
    expect(grouped.width).toBe(standalone.width);
  },
);

it('composes layout callbacks while measuring selection and blocks loading toggles', () => {
  const onLayout = jest.fn();
  const onPressedChange = jest.fn();
  const screen = renderWithTheme(
    <Button.Group testID="group">
      <Button testID="toggle" pressed onLayout={onLayout} onPressedChange={onPressedChange}>
        Toggle
      </Button>
      <Button testID="busy" loading onPressedChange={onPressedChange}>
        Busy
      </Button>
    </Button.Group>,
  );
  const event = { nativeEvent: { layout: { x: 0, y: 0, width: 90, height: 36 } } };
  fireEvent(screen.getByTestId('toggle'), 'layout', event);
  expect(onLayout).toHaveBeenCalledWith(event);
  expect(screen.getByTestId('group-selection')).toBeTruthy();
  expect(screen.getByTestId('busy').props.onPress).toBeUndefined();
  fireEvent.press(screen.getByTestId('busy'));
  expect(onPressedChange).not.toHaveBeenCalled();
  pressHost(screen.getByTestId('toggle'));
  expect(onPressedChange).toHaveBeenCalledWith(false);
});
