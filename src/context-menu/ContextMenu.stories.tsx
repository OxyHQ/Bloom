import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from '../card';
import { Text } from '../typography';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './index';

const meta: Meta = {
  title: 'Overlays/ContextMenu',
};

export default meta;

type Story = StoryObj;

/**
 * Right-click (web) or long-press (native) the card. On web the menu opens AT
 * THE CURSOR, so the anchor is the click point rather than the trigger's box.
 */
export const Basic: Story = {
  render: function BasicContextMenu() {
    const [last, setLast] = useState('idle');
    return (
      <View style={{ padding: 60, gap: 16 }}>
        <Text testID="result">last: {last}</Text>
        <ContextMenu>
          <ContextMenuTrigger label="Post actions" testID="context-trigger">
            <Card style={{ width: 320, height: 160, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center' }}>Right-click or long-press me</Text>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent testID="context-panel">
            <ContextMenuLabel>Post</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem
              testID="context-copy"
              onPress={() => setLast('copy')}
              trailing={<ContextMenuShortcut>⌘C</ContextMenuShortcut>}>
              Copy link
            </ContextMenuItem>
            <ContextMenuItem onPress={() => setLast('pin')}>Pin to profile</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onPress={() => setLast('delete')}>
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </View>
    );
  },
};

/** The same row vocabulary the other two menu families publish. */
export const WithSelectionAndSubmenu: Story = {
  render: function RichContextMenu() {
    const [pinned, setPinned] = useState(false);
    return (
      <View style={{ padding: 60 }}>
        <ContextMenu>
          <ContextMenuTrigger label="Message actions">
            <Card style={{ width: 320, height: 120, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center' }}>Right-click or long-press me</Text>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned} keepOpen>
              Pinned
            </ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>Move to…</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem inset>Archive</ContextMenuItem>
                <ContextMenuItem inset>Spam</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </View>
    );
  },
};
