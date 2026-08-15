import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
  title: 'Overlays/Menubar',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: function BasicMenubar() {
    const [last, setLast] = useState('idle');
    return (
      <View style={{ padding: 40, gap: 16 }}>
        <Text testID="result">last: {last}</Text>
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger testID="menubar-file">
              <Text style={{ paddingHorizontal: 8, paddingVertical: 4 }}>File</Text>
            </MenubarTrigger>
            <MenubarContent testID="menubar-file-panel">
              <MenubarItem
                testID="menubar-new"
                onPress={() => setLast('new')}
                trailing={<MenubarShortcut>⌘N</MenubarShortcut>}>
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
              <MenubarItem variant="destructive" onPress={() => setLast('close')}>
                Close window
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="edit">
            <MenubarTrigger testID="menubar-edit">
              <Text style={{ paddingHorizontal: 8, paddingVertical: 4 }}>Edit</Text>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onPress={() => setLast('undo')}>Undo</MenubarItem>
              <MenubarItem onPress={() => setLast('redo')}>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="view">
            <MenubarTrigger testID="menubar-view">
              <Text style={{ paddingHorizontal: 8, paddingVertical: 4 }}>View</Text>
            </MenubarTrigger>
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
  render: function ControlledMenubar() {
    const [open, setOpen] = useState<string | undefined>('view');
    const [dense, setDense] = useState(false);
    return (
      <View style={{ padding: 40, gap: 16 }}>
        <Text>open: {open ?? 'none'}</Text>
        <Menubar value={open} onValueChange={setOpen}>
          <MenubarMenu value="view">
            <MenubarTrigger>
              <Text style={{ paddingHorizontal: 8, paddingVertical: 4 }}>View</Text>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={dense} onCheckedChange={setDense} keepOpen>
                Dense rows
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="help">
            <MenubarTrigger>
              <Text style={{ paddingHorizontal: 8, paddingVertical: 4 }}>Help</Text>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </View>
    );
  },
};
