import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomScope } from './BloomScope';
import { Button } from '../button';
import { Badge } from '../badge';
import { Chip } from '../chip';

const meta = { title: 'Foundations/Appearance', component: BloomScope,
  args: { size: 'md', tone: 'accent' },
  argTypes: { size: { control: 'select', options: ['xs','sm','md','lg'] }, tone: {control:'select',options:['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info']} },
} satisfies Meta<typeof BloomScope>;
export default meta;
type Story = StoryObj<typeof BloomScope>;
export const Inheritance: Story = {
  render: args => <BloomScope {...args}><View style={{gap:16,alignItems:'flex-start'}}>
    <Button>Inherited action</Button><Badge appearance="solid">Inherited badge</Badge><Chip appearance="subtle">Inherited chip</Chip>
    <BloomScope size="xs"><Button>Nested size</Button></BloomScope>
    <Button tone="danger" appearance="outline">Explicit tone</Button>
  </View></BloomScope>,
};
