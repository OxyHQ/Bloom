import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Sidebar } from '../sidebar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiHome5Line } from '../icons/remix/RiHome5Line';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';
import type { SidebarProps } from '../sidebar/types';

function mount(props: SidebarProps) {
  return render(<BloomThemeProvider fonts={false}><Sidebar showSearch={false} showThemeToggle={false} {...props} /></BloomThemeProvider>);
}
const items = Array.from({ length: 20 }, (_, index) => ({ key: String(index), label: `Destination ${index}`, icon: RiHome5Line, onPress: () => {} }));

it.each([
  { variant: 'panel' as const, collapsed: false },
  { variant: 'panel' as const, collapsed: true },
  { variant: 'rail' as const },
])('keeps one named, operable action outside the scrolling destinations: %j', (mode) => {
  const onPress = jest.fn();
  const tree = mount({ ...mode, testID: 'nav', items, primaryAction: { label: 'New post', icon: RiAddLine, onPress } });
  const button = tree.getByLabelText('New post');
  expect(tree.getAllByLabelText('New post')).toHaveLength(1);
  expect(button.props.accessibilityRole).toBe('button');
  pressHost(button);
  expect(onPress).toHaveBeenCalledTimes(1);
  for (let ancestor = button.parent; ancestor; ancestor = ancestor.parent) {
    expect(ancestor.props.testID).not.toBe('nav-scroll');
  }
});

it.each(['panel', 'rail'] as const)('prevents disabled primary action callbacks in %s', (variant) => {
  const onPress = jest.fn();
  const tree = mount({ variant, primaryAction: { label: 'New post', icon: RiAddLine, onPress, disabled: true } });
  const button = tree.getByLabelText('New post');
  expect(button.props.disabled).toBe(true);
  // The RN mock removes the disabled host handler. fireEvent would climb
  // past that host to Button's public onPress prop and call the test callback.
  // Invoke only what the real host installs, never the composite ancestor.
  act(() => button.props.onPress?.());
  expect(onPress).not.toHaveBeenCalled();
});

it('keeps its accessible name and callback across collapse and expansion', () => {
  const onPress = jest.fn();
  const props = { primaryAction: { label: 'New post', icon: RiAddLine, onPress }, showSearch: false, showThemeToggle: false };
  const ui = (collapsed: boolean) => <BloomThemeProvider fonts={false}><Sidebar {...props} collapsed={collapsed} /></BloomThemeProvider>;
  const tree = render(ui(false));
  for (const collapsed of [true, false, true]) {
    tree.rerender(ui(collapsed));
    pressHost(tree.getByLabelText('New post'));
  }
  expect(onPress).toHaveBeenCalledTimes(3);
});
