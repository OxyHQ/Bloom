import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Sidebar, type SidebarTree, type SidebarTreeItem } from '../sidebar';
import { ListItem } from '../list';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const hidden = { includeHiddenElements: true } as const;
type Placement = 'section' | 'nested' | 'folder';
function treeFor(item: SidebarTreeItem, placement: Placement): SidebarTree {
  if (placement === 'folder')
    return {
      key: 'tree',
      label: 'Tree',
      folders: [{ key: 'folder', label: 'Folder', defaultOpen: true, items: [item] }],
    };
  return {
    key: 'tree',
    label: 'Tree',
    items:
      placement === 'nested'
        ? [{ key: 'parent', label: 'Parent', defaultOpen: true, items: [item] }]
        : [item],
  };
}

const navigate = jest.fn();
const rowPress = jest.fn();
const select = jest.fn();
const prefetch = jest.fn();
function Fixture({
  placement,
  disabled = false,
  draggable = false,
}: {
  placement: Placement;
  disabled?: boolean;
  draggable?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const item: SidebarTreeItem = {
    key: 'ana',
    label: 'Ana',
    href: '/ana',
    leading: <View testID="portrait" />,
    checked,
    selecting: checked,
    disabled,
    draggable,
    onCheckedChange: (next) => {
      select(next);
      setChecked(next);
    },
    onPress: rowPress,
    onPrefetch: prefetch,
  };
  return (
    <BloomThemeProvider>
      <Sidebar
        tree={treeFor(item, placement)}
        onTreeItemPress={navigate}
        onTreeItemDrop={draggable ? () => {} : undefined}
        showSearch={false}
        showThemeToggle={false}
      />
    </BloomThemeProvider>
  );
}
beforeEach(() => jest.clearAllMocks());

describe.each<Placement>(['section', 'nested', 'folder'])(
  '%s tree list interactions',
  (placement) => {
    it('uses long press selection, keeps its target mounted and toggles without navigating', () => {
      const screen = render(<Fixture placement={placement} />);
      const target = screen.getByTestId('sidebar-tree-item-ana-link', hidden);
      expect(screen.getByTestId('portrait', hidden)).toBeTruthy();
      fireEvent(target, 'longPress');
      expect(select).toHaveBeenLastCalledWith(true);
      expect(screen.queryByTestId('portrait', hidden)).toBeNull();
      expect(screen.getByTestId('sidebar-tree-item-ana-link', hidden)).toBe(target);
      fireEvent.press(target, { preventDefault: jest.fn() });
      expect(select).toHaveBeenLastCalledWith(false);
      expect(navigate).not.toHaveBeenCalled();
      expect(rowPress).not.toHaveBeenCalled();
      fireEvent.press(target, { preventDefault: jest.fn() });
      expect(rowPress).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate.mock.calls[0]?.[1]?.key).toBe(placement === 'folder' ? 'folder' : undefined);
    });

    it('selects via the leading checkbox without activating the row', () => {
      const screen = render(<Fixture placement={placement} />);
      fireEvent.press(screen.getByTestId('sidebar-tree-item-ana-check', hidden));
      expect(select).toHaveBeenCalledWith(true);
      expect(navigate).not.toHaveBeenCalled();
      expect(rowPress).not.toHaveBeenCalled();
    });

    it('blocks selection, press, long press and prefetch when disabled', () => {
      const screen = render(<Fixture placement={placement} disabled />);
      const target = screen.getByTestId('sidebar-tree-item-ana-link', hidden);
      fireEvent.press(target, { preventDefault: jest.fn() });
      fireEvent(target, 'longPress');
      fireEvent(target, 'focus');
      fireEvent.press(screen.getByTestId('sidebar-tree-item-ana-check', hidden));
      expect(select).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(rowPress).not.toHaveBeenCalled();
      expect(prefetch).not.toHaveBeenCalled();
    });
  },
);

it('reserves the section row long press for the existing native drag lift', () => {
  const screen = render(<Fixture placement="section" draggable />);
  const target = screen
    .UNSAFE_getAllByType(Pressable)
    .find((node) => node.props.testID === 'sidebar-tree-item-ana-link');
  expect(target?.props.onLongPress).toBeUndefined();
  fireEvent.press(screen.getByTestId('sidebar-tree-item-ana-check', hidden));
  expect(select).toHaveBeenCalledWith(true);
});

it('passes shared prefetch and selection handlers to a custom renderer', () => {
  const screen = render(
    <BloomThemeProvider>
      <ListItem
        title="Ana"
        selecting
        checked
        onCheckedChange={select}
        onPrefetch={prefetch}
        onPress={navigate}
        trigger={(props) => <Pressable {...props} testID="custom" />}
      />
    </BloomThemeProvider>,
  );
  const target = screen.getByTestId('custom');
  fireEvent(target, 'focus');
  expect(prefetch).toHaveBeenCalledTimes(1);
  fireEvent.press(target, { preventDefault: jest.fn() });
  expect(select).toHaveBeenCalledWith(false);
  expect(navigate).not.toHaveBeenCalled();
});

it('retains ready-node trigger compatibility', () => {
  const screen = render(
    <BloomThemeProvider>
      <ListItem title="Ana" trigger={<Pressable onPress={navigate} testID="legacy" />} />
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByTestId('legacy'));
  expect(navigate).toHaveBeenCalledTimes(1);
});
