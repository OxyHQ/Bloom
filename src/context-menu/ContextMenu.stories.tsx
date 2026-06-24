import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuDivider,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuItemText,
  ContextMenuTrigger,
} from './index';

const meta: Meta = {
  title: 'Components/ContextMenu',
};

export default meta;

type Story = StoryObj;

function TriggerSurface() {
  const theme = useTheme();
  return (
    <ContextMenu>
      <ContextMenuTrigger label="Long-press for actions">
        {({ props }) => (
          <Pressable
            onPress={() => props.onPress?.()}
            onLongPress={() => props.onLongPress?.()}
            accessibilityLabel={props.accessibilityLabel}
            accessibilityHint={props.accessibilityHint}
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: theme.colors.backgroundSecondary,
              borderWidth: 1,
              borderColor: theme.colors.borderLight,
              minWidth: 240,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.colors.text }}>
              Long-press / right-click me
            </Text>
          </Pressable>
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem label="Open" onPress={() => {}}>
            <ContextMenuItemText>Open</ContextMenuItemText>
          </ContextMenuItem>
          <ContextMenuItem label="Rename" onPress={() => {}}>
            <ContextMenuItemText>Rename</ContextMenuItemText>
          </ContextMenuItem>
          <ContextMenuItem label="Delete" onPress={() => {}}>
            <ContextMenuItemText>Delete</ContextMenuItemText>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const Basic: Story = {
  render: () => <TriggerSurface />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <TriggerSurface />
      <TriggerSurface />
    </View>
  ),
};
