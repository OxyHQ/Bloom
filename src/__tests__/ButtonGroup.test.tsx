import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
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

describe('ButtonGroup', () => {
  it.each([false, true])(
    'keeps its items its children in the mounted tree (separated: %s)',
    (separated) => {
      // Fabric flattens a view with no stacking context and mounts its children
      // in the nearest ancestor that has one: a role and a label are not one.
      const { getByTestId } = renderWithTheme(
        <ButtonGroup testID="group" accessibilityLabel="Back and forward" separated={separated}>
          <ButtonGroupItem iconOnly accessibilityLabel="Back" />
          <ButtonGroupItem iconOnly accessibilityLabel="Forward" />
        </ButtonGroup>,
      );
      const group = getByTestId('group');
      expect(group.props.role).toBe('group');
      expect(group.props.collapsable).toBe(false);
    },
  );

  it('is one rimmed surface with inset separators between items', () => {
    const { getByTestId, toJSON } = renderWithTheme(
      <View testID="host">
        <ButtonGroup testID="group">
          <ButtonGroupItem>Left</ButtonGroupItem>
          <ButtonGroupItem>Center</ButtonGroupItem>
          <ButtonGroupItem>Right</ButtonGroupItem>
        </ButtonGroup>
      </View>,
    );
    const group = resolvedStyle(getByTestId('group').props.style);
    expect(group.borderRadius).toBe(BUTTON_RADIUS);
    expect(group.borderWidth ?? 0).toBe(0);
    // Three controls and two separators; the parent owns the shared material.
    expect(renderedChildren(toJSON(), 'group-items')).toHaveLength(5);
  });

  it('sizes items from the group: 34 medium, 30 small', () => {
    const { getByTestId } = renderWithTheme(
      <ButtonGroup size="sm">
        <ButtonGroupItem testID="item">One</ButtonGroupItem>
        <ButtonGroupItem testID="icon" iconOnly accessibilityLabel="Add" />
      </ButtonGroup>,
    );
    expect(resolvedStyle(getByTestId('item').props.style).height).toBe(30);
    expect(resolvedStyle(getByTestId('icon').props.style).width).toBe(30);
  });

  it('presses, and announces selection with both spellings', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ButtonGroup>
        <ButtonGroupItem testID="item" checked onPress={onPress}>
          Week
        </ButtonGroupItem>
      </ButtonGroup>,
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
      <ButtonGroup accessibilityLabel="Format">
        <ButtonGroupItem testID="action" onPress={() => {}}>
          Attach
        </ButtonGroupItem>
        <ButtonGroupItem testID="off" selected={false} onPress={() => {}}>
          Bold
        </ButtonGroupItem>
      </ButtonGroup>,
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
      <ButtonGroup>
        <ButtonGroupItem testID="selected" checked onCheckedChange={change}>
          B
        </ButtonGroupItem>
        <ButtonGroupItem testID="disabled" disabled onCheckedChange={change}>
          C
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    pressHost(screen.getByTestId('selected'));
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('disabled').props.disabled).toBe(true);
    expect(screen.getByTestId('disabled').props.onPress).toBeUndefined();
  });
  describe('separated', () => {
    it('is one pill cut into segments: one surface, no hairlines, a 2px gap, ends clipped', () => {
      const { getByTestId, toJSON } = renderWithTheme(
        <ButtonGroup separated size="xs" testID="group" accessibilityLabel="Actions">
          <ButtonGroupItem iconOnly accessibilityLabel="One" />
          <ButtonGroupItem iconOnly accessibilityLabel="Two" />
          <ButtonGroupItem iconOnly accessibilityLabel="Three" />
        </ButtonGroup>,
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
        <ButtonGroup separated size="xs">
          <ButtonGroupItem testID="item">One</ButtonGroupItem>
        </ButtonGroup>,
      );
      expect(resolvedStyle(getByTestId('item').props.style).borderRadius).toBe(0);
    });

    it('makes an icon-only item 1.5 times as wide as tall, never a circle', () => {
      const { getByTestId } = renderWithTheme(
        <ButtonGroup separated size="xs">
          <ButtonGroupItem iconOnly testID="item" accessibilityLabel="One" />
        </ButtonGroup>,
      );
      const style = resolvedStyle(getByTestId('item').props.style);
      expect([style.width, style.height]).toEqual([36, 24]);
    });

    it('sizes items 24 at xs, 30 at sm and 34 at md', () => {
      const heights = (['xs', 'sm', 'md'] as const).map((size) => {
        const { getByTestId } = renderWithTheme(
          <ButtonGroup separated size={size}>
            <ButtonGroupItem testID="item">Pill</ButtonGroupItem>
          </ButtonGroup>,
        );
        return resolvedStyle(getByTestId('item').props.style).height;
      });
      expect(heights).toEqual([24, 30, 34]);
    });
  });
});
