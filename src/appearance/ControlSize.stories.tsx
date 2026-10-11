import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiMore2Line, RiSearchLine, RiShare2Line } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BloomScope } from './index';

const meta: Meta<typeof BloomScope> = {
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
  title: 'Foundations/Control Size',
  component: BloomScope,
};

export default meta;

type Story = StoryObj<typeof BloomScope>;

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
 * intent, the container declares the density.
 */
export const Inheritance: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 24, alignItems: 'flex-start' }}>
      <View style={{ gap: 8 }}>
        <Caption>No container — the group's medium density.</Caption>
        <Actions />
      </View>

      <View style={{ gap: 8 }}>
        <Caption>Small density inherited from the container.</Caption>
        <BloomScope size="sm">
          <Actions />
        </BloomScope>
      </View>

      <View style={{ gap: 8 }}>
        <Caption>Small container, explicit medium group — the caller still wins.</Caption>
        <BloomScope size="sm">
          <ButtonGroup size="md" accessibilityLabel="Page actions">
            <ButtonGroupItem iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Search" />
            <ButtonGroupItem iconOnly leadingIcon={RiShare2Line} accessibilityLabel="Share" />
          </ButtonGroup>
        </BloomScope>
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
        <Caption>`size="sm"` — 30px items.</Caption>
        <BloomScope size="sm">
          <Actions />
        </BloomScope>
      </View>
      <View style={{ gap: 8 }}>
        <Caption>Small outside, no inner density: the nested context inherits small.</Caption>
        <BloomScope size="sm">
          <BloomScope>
            <Actions />
          </BloomScope>
        </BloomScope>
      </View>
    </View>
  ),
};

/**
 * A glass island only reads as one over something. On a flat page there is
 * nothing behind it to blur; over a picture the material does its work.
 */
export const OverContent: Story = {
  args: {},
  parameters: { controls: { include: ['size'] } },
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
      <BloomScope {...args}>
        <Actions />
      </BloomScope>
      <Text variant="body-medium" style={{ color: 'rgba(255,255,255,0.86)' }}>
        The island takes its fill from the surface ladder and its alpha from the chrome role, so it
        reads on a colour Bloom did not choose.
      </Text>
    </View>
  ),
};
