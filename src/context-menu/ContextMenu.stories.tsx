import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
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
  type ContextMenuAnchor,
} from './index';

const meta: Meta = {
  component: ContextMenu,
  parameters: { controls: { disable: true } },
  id: 'base-context-menu',
  title: 'Components/Overlays/Context Menu',
};

export default meta;

type Story = StoryObj;

/**
 * Right-click (web) or long-press (native) the card. On web the menu opens AT
 * THE CURSOR, so the anchor is the click point rather than the trigger's box.
 */
export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: function BasicContextMenu() {
    const [last, setLast] = useState('idle');
    return (
      <View style={{ width: 320, maxWidth: '100%', gap: 16 }}>
        <Text testID="result">last: {last}</Text>
        <ContextMenu>
          <ContextMenuTrigger label="Post actions" testID="context-trigger">
            <Card style={{ maxWidth: '100%', width: 320, height: 160, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center' }}>Right-click or long-press me</Text>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent testID="context-panel">
            <ContextMenuLabel>Post</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem
              testID="context-copy"
              onPress={() => setLast('copy')}
              trailing={<ContextMenuShortcut>⌘C</ContextMenuShortcut>}
            >
              Copy link
            </ContextMenuItem>
            <ContextMenuItem onPress={() => setLast('pin')}>Pin to profile</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem tone="danger" onPress={() => setLast('delete')}>
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
  parameters: { controls: { disable: true } },
  render: function RichContextMenu() {
    const [pinned, setPinned] = useState(false);
    return (
      <View style={{ width: 320, maxWidth: '100%' }}>
        <ContextMenu>
          <ContextMenuTrigger label="Message actions">
            <Card style={{ maxWidth: '100%', width: 320, height: 120, justifyContent: 'center' }}>
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

/**
 * CONTROLLED, with no trigger: a menu opened by code at a point — here the last
 * pointer position, the way a browser opens a menu for a toolbar button or a
 * right-click forwarded from outside the page. The menu is open exactly while
 * `anchor` is non-null; every dismissal asks for it to be cleared.
 */
export const ControlledAnchor: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledAnchorContextMenu() {
    const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);
    const [last, setLast] = useState('idle');
    const pointer = useRef<{ x: number; y: number } | null>(null);
    useEffect(() => {
      if (typeof document === 'undefined') return undefined;
      const onPointerDown = (event: PointerEvent) => {
        pointer.current = { x: event.clientX, y: event.clientY };
      };
      document.addEventListener('pointerdown', onPointerDown, true);
      return () => document.removeEventListener('pointerdown', onPointerDown, true);
    }, []);
    const choose = (value: string) => () => setLast(value);
    return (
      <View style={{ width: 320, maxWidth: '100%', gap: 16 }}>
        <Text testID="anchor-result">
          last: {last} · {anchor ? 'open' : 'closed'}
        </Text>
        <Button testID="anchor-behind" onPress={choose('behind')}>
          Behind the menu
        </Button>
        <Button testID="anchor-open" onPress={() => setAnchor(pointer.current ?? { x: 24, y: 24 })}>
          Open menu here
        </Button>
        <Button
          testID="anchor-corner"
          onPress={() => setAnchor({ x: window.innerWidth - 4, y: window.innerHeight - 4 })}
        >
          Open at the bottom-right corner
        </Button>
        <ContextMenu anchor={anchor} onAnchorChange={setAnchor}>
          <ContextMenuContent testID="anchor-panel">
            <ContextMenuItem onPress={choose('rename')}>Rename</ContextMenuItem>
            <ContextMenuItem onPress={choose('duplicate')}>Duplicate</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Move to…</ContextMenuSubTrigger>
              <ContextMenuSubContent testID="anchor-sub-panel">
                <ContextMenuItem onPress={choose('inbox')}>Inbox</ContextMenuItem>
                <ContextMenuItem onPress={choose('archive')}>Archive</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem tone="danger" onPress={choose('delete')}>
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </View>
    );
  },
};
