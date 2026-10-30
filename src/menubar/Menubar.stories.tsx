import { useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlatformSurfaceProvider } from '../platform-surface';
import type {
  PlatformMenu,
  PlatformMenuBar,
  PlatformMenuItem,
  PlatformSurfaceAdapter,
} from '../platform-surface';
import { Text } from '../typography';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './index';

const meta: Meta = {
  argTypes: {
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    label: { control: 'text' },
  },
  component: Menubar,
  parameters: { controls: { disable: true } },
  id: 'base-menubar',
  title: 'Components/Navigation/Menubar',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: function BasicMenubar() {
    const [last, setLast] = useState('idle');
    return (
      <View style={{ padding: 40, gap: 16 }}>
        <Text testID="result">last: {last}</Text>
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger testID="menubar-file">File</MenubarTrigger>
            <MenubarContent testID="menubar-file-panel">
              <MenubarItem
                testID="menubar-new"
                onPress={() => setLast('new')}
                trailing={<MenubarShortcut>⌘N</MenubarShortcut>}
              >
                New tab
              </MenubarItem>
              <MenubarItem onPress={() => setLast('open')}>Open…</MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem inset onPress={() => setLast('email')}>
                    Email link
                  </MenubarItem>
                  <MenubarItem inset onPress={() => setLast('messages')}>
                    Messages
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem tone="danger" onPress={() => setLast('close')}>
                Close window
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="edit">
            <MenubarTrigger testID="menubar-edit">Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onPress={() => setLast('undo')}>Undo</MenubarItem>
              <MenubarItem onPress={() => setLast('redo')}>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="view">
            <MenubarTrigger testID="menubar-view">View</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Layout</MenubarLabel>
              <MenubarRadioGroup value="comfortable" onValueChange={setLast}>
                <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
                <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </View>
    );
  },
};

/**
 * Controlled: the bar's `value` IS the open menu, so switching menus is a single
 * state write rather than a close followed by an open.
 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledMenubar() {
    const [open, setOpen] = useState<string | undefined>('view');
    const [dense, setDense] = useState(false);
    return (
      <View style={{ padding: 40, gap: 16 }}>
        <Text>open: {open ?? 'none'}</Text>
        <Menubar value={open} onValueChange={setOpen}>
          <MenubarMenu value="view">
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={dense} onCheckedChange={setDense} keepOpen>
                Dense rows
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="help">
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </View>
    );
  },
};

/**
 * The same declaration, with an adapter whose platform shows the menus in a
 * bar of its own (`menu-bar`, OxyOS ADR 0021). The `Menubar` draws nothing in
 * the page; the strip above stands in for the platform's bar: it draws the
 * description Bloom gives it and reports the item chosen by its id. The
 * shortcuts (Ctrl+N, or ⌘N on a Mac; Ctrl+Shift+D) run the items from the page
 * without either bar, and the field keeps Ctrl+C.
 */
export const PlatformMenuBarStory: Story = {
  name: 'Platform menu bar',
  parameters: { controls: { disable: true } },
  render: function PlatformMenuBarExample() {
    const platform = useFakePlatformBar();
    const [last, setLast] = useState('idle');
    const [dense, setDense] = useState(false);
    const [layout, setLayout] = useState('comfortable');
    return (
      <View style={{ padding: 40, gap: 16 }}>
        <FakePlatformBar menus={platform.menus} choose={platform.choose} />
        <Text testID="result">last: {last}</Text>
        <TextInput
          accessibilityLabel="A field"
          placeholder="A field: Ctrl+C copies here, Ctrl+N still makes a new tab"
          style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
        />
        <PlatformSurfaceProvider value={platform.adapter}>
          <Menubar>
            <MenubarMenu value="file">
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem shortcut="Mod+N" onPress={() => setLast('new')}>
                  New tab
                </MenubarItem>
                <MenubarItem onPress={() => setLast('open')}>Open…</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Share</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onPress={() => setLast('email')}>Email link</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarItem disabled shortcut="Mod+P">
                  Print
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="view">
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem
                  shortcut="Mod+Shift+D"
                  checked={dense}
                  onCheckedChange={(next) => {
                    setDense(next);
                    setLast(`dense ${next}`);
                  }}
                >
                  Dense rows
                </MenubarCheckboxItem>
                <MenubarLabel>Layout</MenubarLabel>
                <MenubarRadioGroup
                  value={layout}
                  onValueChange={(next) => {
                    setLayout(next);
                    setLast(next);
                  }}
                >
                  <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
                  <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </PlatformSurfaceProvider>
      </View>
    );
  },
};

/** A platform's menu bar for the story: the menus Bloom gave it, and a way to choose. */
function useFakePlatformBar() {
  const [menus, setMenus] = useState<readonly PlatformMenu[]>([]);
  const listeners = useRef(new Set<(id: string) => void>());
  const adapter = useMemo<PlatformSurfaceAdapter>(() => {
    const menuBar: PlatformMenuBar = {
      setMenus,
      onActivate(listener) {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
    };
    return { platform: 'story', capabilities: new Set(['menu-bar']), menuBar };
  }, []);
  const choose = (id: string) => {
    for (const listener of [...listeners.current]) listener(id);
  };
  return { adapter, menus, choose };
}

function FakePlatformBar({
  menus,
  choose,
}: {
  menus: readonly PlatformMenu[];
  choose: (id: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const menu = menus.find((candidate) => candidate.id === open);
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          padding: 8,
          borderRadius: 8,
          backgroundColor: '#eee',
        }}
      >
        <Text style={{ fontWeight: '700' }}>Platform bar</Text>
        {menus.map((candidate) => (
          <Pressable
            key={candidate.id}
            onPress={() => setOpen(open === candidate.id ? null : candidate.id)}
          >
            <Text>{candidate.label}</Text>
          </Pressable>
        ))}
      </View>
      {menu ? (
        <View style={{ padding: 8, borderRadius: 8, backgroundColor: '#f6f6f6', gap: 4 }}>
          <FakePlatformItems
            items={menu.items}
            depth={0}
            choose={(id) => {
              setOpen(null);
              choose(id);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function FakePlatformItems({
  items,
  depth,
  choose,
}: {
  items: readonly PlatformMenuItem[];
  depth: number;
  choose: (id: string) => void;
}) {
  return (
    <>
      {items.map((item, index) => {
        if (item.kind === 'separator') {
          return (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: separators carry no id.
              key={`separator-${index}`}
              style={{ height: 1, backgroundColor: '#ccc', marginLeft: depth * 16 }}
            />
          );
        }
        const mark =
          item.kind === 'item' && item.checked !== undefined ? (item.checked ? '✓ ' : '   ') : '';
        return (
          <View key={item.id}>
            <Pressable
              disabled={!item.enabled || item.kind === 'submenu'}
              onPress={() => choose(item.id)}
              style={{ flexDirection: 'row', gap: 16, marginLeft: depth * 16 }}
            >
              <Text style={{ opacity: item.enabled ? 1 : 0.4 }}>
                {mark}
                {item.label}
                {item.kind === 'submenu' ? ' ▸' : ''}
              </Text>
              {item.kind === 'item' && item.shortcut ? (
                <Text style={{ opacity: 0.6 }}>{item.shortcut}</Text>
              ) : null}
            </Pressable>
            {item.kind === 'submenu' ? (
              <FakePlatformItems items={item.items} depth={depth + 1} choose={choose} />
            ) : null}
          </View>
        );
      })}
    </>
  );
}
