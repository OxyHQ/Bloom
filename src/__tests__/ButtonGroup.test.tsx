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
        <ButtonGroupItem testID="action" onPress={() => {}}>Attach</ButtonGroupItem>
        <ButtonGroupItem testID="off" selected={false} onPress={() => {}}>Bold</ButtonGroupItem>
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
    const screen = renderWithTheme(<ButtonGroup>
      <ButtonGroupItem testID="selected" checked onCheckedChange={change}>B</ButtonGroupItem>
      <ButtonGroupItem testID="disabled" disabled onCheckedChange={change}>C</ButtonGroupItem>
    </ButtonGroup>);
    pressHost(screen.getByTestId('selected'));
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('disabled').props.disabled).toBe(true);
    expect(screen.getByTestId('disabled').props.onPress).toBeUndefined();
  });
});
