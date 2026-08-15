import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'inverse', 'icon', 'ghost', 'text'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: { children: 'Save' },
};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const TextOnly: Story = {
  args: { variant: 'text', children: 'Text button' },
  name: 'Text',
};

export const Inverse: Story = {
  args: { variant: 'inverse', children: 'Inverse' },
};

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="inverse">Inverse</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="text">Text</Button>
    </View>
  ),
};

/**
 * The two GLASS variants over three backdrops, because a translucent surface
 * cannot be judged against one.
 *
 * The middle band is a hard STRIPE pattern on purpose: a blur that silently
 * stopped applying looks identical to a working one over a flat fill, and the
 * only cheap way to see the difference is a backdrop whose frequency makes
 * averaging unmistakable. It is built from real `View`s rather than a CSS
 * gradient so the story shows the same thing on a device.
 *
 * The bottom band is over media. At 0.85 that is no longer the failure case it
 * was at 0.25 — measured, the label clears AA on 85 of 108 preset x mode x
 * backdrop rows, worst 3.61, against 50% failing at worst 1.02 before. It stays
 * in the story because it is where the residual risk lives, not because it is
 * unsupported.
 */
const STRIPES = Array.from({ length: 40 }, (_, i) => i);

function Stripes() {
  return (
    <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', overflow: 'hidden' }]}>
      {STRIPES.map((i) => (
        <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#e2dcee' : '#5d5270' }} />
      ))}
    </View>
  );
}

function GlassBand({ label, children, backdrop }: {
  label: string;
  children: React.ReactNode;
  backdrop?: React.ReactNode;
}) {
  return (
    <View style={{ padding: 16, borderRadius: 16, gap: 10, overflow: 'hidden' }}>
      {backdrop}
      <Text style={{ fontSize: 11, fontWeight: '600' }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>{children}</View>
    </View>
  );
}

export const Glass: Story = {
  render: () => {
    const buttons = (
      <>
        <Button variant="primary">Comprar</Button>
        <Button variant="destructive">Eliminar</Button>
        <Button variant="inverse">Inverse</Button>
      </>
    );
    return (
      <View style={{ gap: 16 }}>
        <GlassBand label="on the page">{buttons}</GlassBand>
        <GlassBand label="on a texture — the blur is only visible here" backdrop={<Stripes />}>
          {buttons}
        </GlassBand>
        <GlassBand
          label='over media — the pane is 85%, so it behaves nearly like the solid fill'
          backdrop={
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: '#7b3f7a', opacity: 0.9 }]}
            />
          }
        >
          {buttons}
        </GlassBand>
      </View>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </View>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Submitting' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const Composition: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </View>
  ),
};
