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
  it('is one bordered pill with hairlines only BETWEEN items', () => {
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
    expect(group.borderWidth).toBe(1);
    // 3 items + 2 dividers.
    expect(renderedChildren(toJSON(), 'group')).toHaveLength(5);
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

  it('paints a selected item like its hover state, and a disabled one differently', () => {
    const { getByTestId } = renderWithTheme(
      <ButtonGroup>
        <ButtonGroupItem testID="rest">A</ButtonGroupItem>
        <ButtonGroupItem testID="selected" checked>
          B
        </ButtonGroupItem>
        <ButtonGroupItem testID="disabled" disabled>
          C
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    const bg = (id: string) => resolvedStyle(getByTestId(id).props.style).backgroundColor;
    expect(bg('selected')).not.toBe(bg('rest'));
    expect(bg('disabled')).not.toBe(bg('rest'));
    expect(getByTestId('disabled').props.disabled).toBe(true);
  });
});
