import React, { useEffect, useState } from 'react';
import { Button } from '../button/index.web';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Fab } from './Fab';
import * as Icons from '../icons';

const meta: Meta<typeof Fab> = {
  title: 'Base/Fab',
  component: Fab,
  args: {
    accessibilityLabel: 'Compose',
    icon: Icons.RiAddLine,
    onPress: () => {},
  },
  argTypes: {
    "label": { control: 'text' },
    "title": { control: 'text' },
    "value": { control: 'text' },
    "target": { control: 'text' },
    "tabIndex": { control: 'number' },
    "loading": { control: 'boolean' },
    "appearance": { control: 'select', options: ["solid","subtle","outline","plain"] },
    "loadingColor": { control: 'text' },
    "href": { control: 'text' },
    "rel": { control: 'text' },
    "type": { control: 'select', options: ["button","submit","reset"] },
    "asChild": { control: 'boolean' },
    "name": { control: 'text' },
    "autoFocus": { control: 'boolean' },
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    collapsed: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Fab>;

/** Circular action in normal layout flow. */
export const Default: Story = {};

/** Lower-emphasis surface FAB. */
export const Surface: Story = {
  args: { tone: 'neutral', appearance: 'subtle' },
};

/** Extended FAB: icon + label pill. */
export const Extended: Story = {
  args: { label: 'Compose' },
};

/** Compact 48-point action using the common size vocabulary. */
export const CompactSize: Story = {
  args: { size: 'sm' },
};

/** Placement belongs to the parent container. */
export const InContainerColumn: Story = {
  render: (args) => (
    <View
      style={{ maxWidth: '100%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 16,
        width: 360,
        height: 480,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <Fab {...args} />
    </View>
  ),
};

/** The same action remains mounted while its extended label contracts. */
export const ControlledCollapse: Story = {
  args: { label: 'Create something', size: 'sm' },
  render: function ControlledCollapse(args) {
    const [collapsed, setCollapsed] = useState(Boolean(args.collapsed));
    useEffect(() => setCollapsed(Boolean(args.collapsed)), [args.collapsed]);
    return <View style={{ alignItems: 'flex-start', gap: 24, padding: 24 }}>
      <Button onPress={() => setCollapsed(value => !value)}>Toggle label</Button>
      <Fab {...args} collapsed={collapsed} testID="controlled-fab" />
    </View>;
  },
};
