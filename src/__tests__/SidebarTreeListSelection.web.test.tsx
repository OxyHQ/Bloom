/** @jest-environment jsdom */
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../list', () => jest.requireActual('../list/index.web'));
import { View } from 'react-native';
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../dropdown-menu/index.web';
import { Sidebar, type SidebarTreeItem } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const navigate = jest.fn();
const rowPress = jest.fn();
const prefetch = jest.fn();
const menuAction = jest.fn();
const radioChange = jest.fn();
let setSelection: (next: boolean) => void;
function Fixture({ folder = false }: { folder?: boolean }) {
  const [checked, setChecked] = useState(false);
  setSelection = setChecked;
  const item: SidebarTreeItem = {
    contextMenu: (
      <>
        <DropdownMenuItem onPress={menuAction}>Archive</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Notifications</DropdownMenuSubTrigger>
          <DropdownMenuSubContent testID="notifications">
            <DropdownMenuRadioGroup value="all" onValueChange={radioChange}>
              <DropdownMenuRadioItem value="all">All messages</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mentions">Mentions</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    ),
    key: 'ana',
    label: 'Ana',
    href: '/ana',
    leading: <View testID="portrait" />,
    checked,
    selecting: checked,
    onCheckedChange: setChecked,
    onPress: rowPress,
    onPrefetch: prefetch,
  };
  return (
    <BloomThemeProvider>
      <Sidebar
        selectedTreeItem="ana"
        onTreeItemPress={navigate}
        tree={{
          label: 'Tree',
          ...(folder
            ? { folders: [{ key: 'folder', label: 'Folder', defaultOpen: true, items: [item] }] }
            : { items: [item] }),
        }}
        showThemeToggle={false}
        showSearch={false}
      />
    </BloomThemeProvider>
  );
}
function byID(id: string) {
  const node = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`Missing ${id}`);
  return node;
}
beforeEach(() => {
  jest.clearAllMocks();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
it.each([false, true])(
  'retains real links and focus hooks while selection suppresses navigation (folder=%s)',
  (folder) => {
    act(() => root.render(<Fixture folder={folder} />));
    const link = byID('sidebar-tree-item-ana-link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/ana');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.hasAttribute('data-bloom-list-link')).toBe(true);
    act(() => link.focus());
    expect(prefetch).toHaveBeenCalled();
    act(() => setSelection(true));
    const target = byID('sidebar-tree-item-ana-link');
    expect(target.hasAttribute('href')).toBe(false);
    expect(target.getAttribute('role')).toBe('button');
    expect(byID('sidebar-tree-item-ana-check').getAttribute('aria-checked')).toBe('true');
    act(() => target.click());
    expect(byID('sidebar-tree-item-ana-check').getAttribute('aria-checked')).toBe('false');
    expect(navigate).not.toHaveBeenCalled();
    expect(rowPress).not.toHaveBeenCalled();
    act(() => byID('sidebar-tree-item-ana-link').click());
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(rowPress).toHaveBeenCalledTimes(1);
  },
);

it.each([false, true])(
  'delegates complex context menus without activating the row (folder=%s)',
  (folder) => {
    act(() => root.render(<Fixture folder={folder} />));
    act(() =>
      byID('sidebar-tree-item-ana-link').dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 40,
          clientY: 40,
        }),
      ),
    );
    const archive = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (node) => node.textContent === 'Archive',
    );
    expect(archive).toBeDefined();
    act(() => archive?.click());
    expect(menuAction).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(rowPress).not.toHaveBeenCalled();
  },
);
it('retains submenu radio actions in the shared row context menu', () => {
  act(() => root.render(<Fixture />));
  act(() =>
    byID('sidebar-tree-item-ana-link').dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }),
    ),
  );
  const submenu = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (node) => node.textContent === 'Notifications',
  );
  expect(submenu).toBeDefined();
  act(() => submenu?.click());
  const mentions = [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find(
    (node) => node.textContent === 'Mentions',
  );
  expect(mentions).toBeDefined();
  act(() => mentions?.click());
  expect(radioChange).toHaveBeenCalledWith('mentions');
  expect(navigate).not.toHaveBeenCalled();
});
