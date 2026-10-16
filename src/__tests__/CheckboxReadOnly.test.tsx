/**
 * `Checkbox readOnly`: a checkmark in a published, read-only page. It shows its
 * state, takes no input, and is NOT dimmed the way `disabled` is.
 */
import type React from 'react';
import { Pressable } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';

import { Checkbox } from '../checkbox';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderBox(props: React.ComponentProps<typeof Checkbox>) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Checkbox testID="box" label="Ship it" {...props} />
    </BloomThemeProvider>,
  );
}

/** Every opacity any host node under `root` paints. */
function opacities(root: ReactTestInstance): unknown[] {
  return root
    .findAll((node) => typeof node.type === 'string')
    .map((node) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)).opacity)
    .filter((value) => value !== undefined);
}

describe('Checkbox readOnly', () => {
  it.each([true, false])('announces a read-only checkbox, checked=%s', (checked) => {
    const { getByTestId } = renderBox({ readOnly: true, checked });
    const box = getByTestId('box');
    expect(box.props.accessibilityRole).toBe('checkbox');
    expect(box.props.role).toBe('checkbox');
    expect(box.props['aria-checked']).toBe(checked);
    expect(box.props['aria-readonly']).toBe(true);
    expect(box.props.accessibilityLabel).toBe('Ship it');
  });

  it('takes no press: there is no Pressable at all, and onCheckedChange never runs', () => {
    const onCheckedChange = jest.fn();
    const { getByTestId, UNSAFE_queryAllByType } = renderBox({
      readOnly: true,
      checked: true,
      onCheckedChange,
    });
    expect(UNSAFE_queryAllByType(Pressable)).toHaveLength(0);
    fireEvent.press(getByTestId('box'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('is not dimmed, where disabled dims the box', () => {
    const readOnly = renderBox({ readOnly: true, checked: true });
    expect(opacities(readOnly.getByTestId('box'))).not.toContain(0.5);
    const disabled = renderBox({ disabled: true, checked: true });
    expect(opacities(disabled.getByTestId('box'))).toContain(0.5);
  });

  it('shows the mixed state too', () => {
    const { getByTestId } = renderBox({ readOnly: true, indeterminate: true });
    expect(getByTestId('box').props['aria-checked']).toBe('mixed');
  });

  it('leaves a checkbox without readOnly interactive', () => {
    const onCheckedChange = jest.fn();
    const { getByTestId } = renderBox({ onCheckedChange });
    expect(getByTestId('box').props['aria-readonly']).toBeUndefined();
    fireEvent.press(getByTestId('box'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
