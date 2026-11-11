import type React from 'react';
import { act, render } from '@testing-library/react-native';
import { Fab } from '../fab';
import { Sidebar } from '../sidebar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiHome5Line } from '../icons/remix/RiHome5Line';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';
import type { SidebarProps } from '../sidebar/types';

function mount(props: SidebarProps) {
  return render(
    <BloomThemeProvider fonts={false}>
      <Sidebar showSearch={false} showThemeToggle={false} {...props} />
    </BloomThemeProvider>,
  );
}
const items = Array.from({ length: 20 }, (_, index) => ({
  key: String(index),
  label: `Destination ${index}`,
  icon: RiHome5Line,
  onPress: () => {},
}));

it.each([
  { variant: 'panel' as const, collapsed: false },
  { variant: 'panel' as const, collapsed: true },
  { variant: 'rail' as const },
])(
  'keeps one named, operable action in the sticky footer of the whole-sidebar scroll: %j',
  (mode) => {
    const onPress = jest.fn();
    const tree = mount({
      ...mode,
      testID: 'nav',
      items,
      primaryAction: { label: 'New post', icon: RiAddLine, onPress },
    });
    const fab = tree.UNSAFE_root.findByType((Fab as unknown as { type: React.ComponentType }).type);
    expect(fab.props.label).toBe('New post');
    const button = tree.getByLabelText('New post');
    expect(tree.getAllByLabelText('New post')).toHaveLength(1);
    expect(button.props.accessibilityRole).toBe('button');
    pressHost(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    let insideScroll = false;
    for (let ancestor = button.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.props.testID === 'nav-scroll') insideScroll = true;
    }
    expect(insideScroll).toBe(true);
  },
);

it.each(['panel', 'rail'] as const)(
  'prevents disabled primary action callbacks in %s',
  (variant) => {
    const onPress = jest.fn();
    const tree = mount({
      variant,
      primaryAction: { label: 'New post', icon: RiAddLine, onPress, disabled: true },
    });
    const button = tree.getByLabelText('New post');
    expect(button.props.disabled).toBe(true);
    // The RN mock removes the disabled host handler. fireEvent would climb
    // past that host to Button's public onPress prop and call the test callback.
    // Invoke only what the real host installs, never the composite ancestor.
    act(() => button.props.onPress?.());
    expect(onPress).not.toHaveBeenCalled();
  },
);

it('keeps its accessible name and callback across collapse and expansion', () => {
  const onPress = jest.fn();
  const props = {
    primaryAction: { label: 'New post', icon: RiAddLine, onPress },
    showSearch: false,
    showThemeToggle: false,
  };
  const ui = (collapsed: boolean) => (
    <BloomThemeProvider fonts={false}>
      <Sidebar {...props} collapsed={collapsed} />
    </BloomThemeProvider>
  );
  const tree = render(ui(false));
  for (const collapsed of [true, false, true]) {
    tree.rerender(ui(collapsed));
    pressHost(tree.getByLabelText('New post'));
  }
  expect(onPress).toHaveBeenCalledTimes(3);
});

describe('primaryActionPlacement', () => {
  const insideTestID = (node: { parent: unknown }, testID: string) => {
    for (
      let ancestor = node.parent as { props: { testID?: string }; parent: unknown } | null;
      ancestor;
      ancestor = ancestor.parent as typeof ancestor | null
    ) {
      if (ancestor.props.testID === testID) return true;
    }
    return false;
  };

  it('draws the action in the sticky footer by default and leaves the header without it', () => {
    const tree = mount({
      testID: 'nav',
      items,
      primaryAction: { label: 'New post', icon: RiAddLine, onPress: () => {} },
    });
    const button = tree.getByLabelText('New post');
    expect(insideTestID(button, 'nav-sticky-footer')).toBe(true);
    expect(insideTestID(button, 'nav-fixed-header')).toBe(false);
  });

  it.each([false, true])(
    'draws one named, operable action in the fixed header above the destinations when top (collapsed=%s)',
    (collapsed) => {
      const onPress = jest.fn();
      const tree = mount({
        testID: 'nav',
        items,
        collapsed,
        primaryActionPlacement: 'top',
        primaryAction: { label: 'New post', icon: RiAddLine, onPress },
      });
      expect(tree.getAllByLabelText('New post')).toHaveLength(1);
      const button = tree.getByLabelText('New post');
      expect(button.props.accessibilityRole).toBe('button');
      expect(insideTestID(button, 'nav-fixed-header')).toBe(true);
      expect(insideTestID(button, 'nav-sticky-footer')).toBe(false);
      expect(insideTestID(button, 'nav-scroll')).toBe(true);
      pressHost(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('sits after the toolbar and adds no air of its own above, since the header already gaps its children', () => {
    const tree = mount({
      testID: 'nav',
      items,
      toolbar: <RiHome5Line testID="toolbar-mark" />,
      primaryActionPlacement: 'top',
      primaryAction: { label: 'New post', icon: RiAddLine, onPress: () => {} },
    });
    const header = tree.getByTestId('nav-fixed-header');
    const order = (testID: string) =>
      header.children.findIndex(
        (child) =>
          typeof child !== 'string' &&
          (child.props.testID === testID ||
            child.findAll((n) => n.props.testID === testID).length > 0),
      );
    expect(order('toolbar-mark')).toBeGreaterThanOrEqual(0);
    expect(order('nav-primary-action')).toBeGreaterThan(order('toolbar-mark'));
    const wrapper = tree.getByTestId('nav-primary-action').parent;
    expect(wrapper).toBeTruthy();
    let paddingTop: unknown;
    for (
      let node = tree.getByTestId('nav-primary-action').parent;
      node && paddingTop === undefined;
      node = node.parent
    ) {
      const flat = ([] as unknown[]).concat(node.props.style ?? []).flat(4) as Record<
        string,
        unknown
      >[];
      for (const entry of flat) if (entry && 'paddingTop' in entry) paddingTop = entry.paddingTop;
    }
    expect(paddingTop).toBe(0);
  });

  it('keeps the rail variant at the bottom whatever the placement', () => {
    const tree = mount({
      variant: 'rail',
      testID: 'nav',
      items,
      primaryActionPlacement: 'top',
      primaryAction: { label: 'New post', icon: RiAddLine, onPress: () => {} },
    });
    expect(tree.getAllByLabelText('New post')).toHaveLength(1);
  });
});
