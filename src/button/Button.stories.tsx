import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { CloseButton } from './CloseButton';
import { BloomScope } from '../appearance';
import { RiAddLine, RiArrowRightLine } from '../icons/remix';

const meta = {
  title: 'Base/Button', component: Button,
  parameters: { controls: { include: ['children', 'appearance', 'tone', 'size', 'disabled', 'loading', 'loadingColor', 'href'] } },
  args: { children: 'Save', appearance: 'solid', tone: 'accent', size: 'md', disabled: false, loading: false, onPress: () => {} },
  argTypes: {
    children: { control: 'text' },
    "loadingColor": { control: 'text' },
    "href": { control: 'text' },
    "target": { control: 'text' },
    "rel": { control: 'text' },
    "type": { control: 'select', options: ["button","submit","reset"] },
    "asChild": { control: 'boolean' },
    "name": { control: 'text' },
    "value": { control: 'text' },
    "title": { control: 'text' },
    "autoFocus": { control: 'boolean' },
    "tabIndex": { control: 'number' },
    appearance: { control: 'select', options: ['solid', 'subtle', 'outline', 'plain'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    disabled: { control: 'boolean' }, loading: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof Button>;
export const Basic: Story = {};
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <View style={{gap: 20}}>{(['solid','subtle','outline','plain'] as const).map(appearance =>
    <View key={appearance} style={{flexDirection:'row', gap:12, flexWrap:'wrap'}}>
      {(['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] as const).map(tone =>
        <Button key={tone} appearance={appearance} tone={tone} leadingIcon={RiAddLine}>{tone}</Button>)}
    </View>)}</View>,
};
export const Sizes: Story = {
  parameters: { controls: { disable: true } }, render: () => <View style={{gap:12,alignItems:'flex-start'}}>{(['xs','sm','md','lg'] as const).map(size => <Button key={size} size={size}>{size}</Button>)}</View> };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Icon: Story = { args: { icon: RiAddLine, accessibilityLabel: 'Add item', children: undefined } };
export const Link: Story = { args: { href: '#', appearance: 'plain', children: 'Learn more', trailingIcon: RiArrowRightLine } };
export const Inherited: Story = {
  parameters: { controls: { disable: true } },
  render: () => <BloomScope size="lg" tone="success"><View style={{gap:12,alignItems:'flex-start'}}>
    <Button>Inherited</Button><Button tone="danger" size="sm">Explicit override</Button>
    <BloomScope size="xs"><Button>Nested size, inherited tone</Button></BloomScope>
  </View></BloomScope>,
};
export const CloseButtons: Story = {
  parameters: { controls: { disable: true } }, render: () => <View style={{flexDirection:'row',gap:16}}>{(['xs','sm','md','lg'] as const).map(size => <CloseButton key={size} size={size} accessibilityLabel="Close" />)}</View> };
