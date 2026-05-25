import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import * as ContextMenu from './index';

const meta: Meta = {
  title: 'Components/ContextMenu',
};

export default meta;

type Story = StoryObj;

function TriggerSurface() {
  const theme = useTheme();
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger label="Long-press for actions">
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
      </ContextMenu.Trigger>
      <ContextMenu.Outer>
        <ContextMenu.Group>
          <ContextMenu.Item label="Open" onPress={() => {}}>
            <ContextMenu.ItemText>Open</ContextMenu.ItemText>
          </ContextMenu.Item>
          <ContextMenu.Item label="Rename" onPress={() => {}}>
            <ContextMenu.ItemText>Rename</ContextMenu.ItemText>
          </ContextMenu.Item>
          <ContextMenu.Item label="Delete" onPress={() => {}}>
            <ContextMenu.ItemText>Delete</ContextMenu.ItemText>
          </ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Outer>
    </ContextMenu.Root>
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
