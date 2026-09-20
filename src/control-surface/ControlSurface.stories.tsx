import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiMore2Line, RiSearchLine, RiShare2Line } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ControlSurface } from './index';

const meta: Meta<typeof ControlSurface> = {
  argTypes: {
    "material": { control: 'select', options: ["solid","glass"] },
    "density": { control: 'select', options: ["sm","md"] }
  },
  title: 'Foundations/Control Surface',
  component: ControlSurface,
};

export default meta;

type Story = StoryObj<typeof ControlSurface>;

function Caption({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function Actions() {
  return (
    <ButtonGroup accessibilityLabel="Page actions">
      <ButtonGroupItem iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Search" />
      <ButtonGroupItem iconOnly leadingIcon={RiShare2Line} accessibilityLabel="Share" />
      <ButtonGroupItem iconOnly leadingIcon={RiMore2Line} accessibilityLabel="More" />
    </ButtonGroup>
  );
}

/**
 * The same `ButtonGroup`, written identically three times. What changes is the
 * container around it — which is the whole point: the app declares grouping and
 * intent, the container declares the material.
 */
export const Inheritance: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 24, alignItems: 'flex-start' }}>
      <View style={{ gap: 8 }}>
        <Caption>No container — the group's own default, solid.</Caption>
        <Actions />
      </View>

      <View style={{ gap: 8 }}>
        <Caption>Inside a glass control surface — one island, items flush.</Caption>
        <ControlSurface material="glass">
          <Actions />
        </ControlSurface>
      </View>

      <View style={{ gap: 8 }}>
        <Caption>Glass container, explicit `material="solid"` — the caller still wins.</Caption>
        <ControlSurface material="glass">
          <ButtonGroup material="solid" accessibilityLabel="Page actions">
            <ButtonGroupItem iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Search" />
            <ButtonGroupItem iconOnly leadingIcon={RiShare2Line} accessibilityLabel="Share" />
          </ButtonGroup>
        </ControlSurface>
      </View>
    </View>
  ),
};

/** Density travels the same way, and a nested surface inherits what it leaves undefined. */
export const Density: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 24, alignItems: 'flex-start' }}>
      <View style={{ gap: 8 }}>
        <Caption>`density="sm"` — 30px items.</Caption>
        <ControlSurface density="sm">
          <Actions />
        </ControlSurface>
      </View>
      <View style={{ gap: 8 }}>
        <Caption>Glass outside, `density="sm"` inside: still glass, now small.</Caption>
        <ControlSurface material="glass">
          <ControlSurface density="sm">
            <Actions />
          </ControlSurface>
        </ControlSurface>
      </View>
    </View>
  ),
};

/**
 * A glass island only reads as one over something. On a flat page there is
 * nothing behind it to blur; over a picture the material does its work.
 */
export const OverContent: Story = {
  args: { material: "glass" },
  parameters: { controls: { include: ["material","density"] } },
  render: (args) => (
    <View
      style={{
        padding: 24,
        gap: 16,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#2b4a63',
      }}
    >
      <ControlSurface {...args} >
        <Actions />
      </ControlSurface>
      <Text variant="body-medium" style={{ color: 'rgba(255,255,255,0.86)' }}>
        The island takes its fill from the surface ladder and its alpha from the chrome
        role, so it reads on a colour Bloom did not choose.
      </Text>
    </View>
  ),
};
