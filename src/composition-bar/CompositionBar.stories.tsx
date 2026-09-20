import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CompositionBar } from './index';
import type { CompositionCategory } from './index';
import { BloomThemeProvider } from '../theme';

const CATEGORIES: CompositionCategory[] = [
  { key: 'content', name: 'Content', amount: 320, color: '#6366F1' },
  { key: 'social', name: 'Social', amount: 180, color: '#10B981' },
  { key: 'trust', name: 'Trust', amount: 96, color: '#F59E0B' },
  { key: 'physical', name: 'Physical', amount: 44, color: '#EF4444' },
];

function Demo() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  return (
    <CompositionBar
      categories={CATEGORIES}
      selectedKey={selectedKey}
      onSelect={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
      hintLabel="Tap a segment to see its share"
    />
  );
}

const meta: Meta<typeof CompositionBar> = {
  argTypes: {
    "selectedKey": { control: 'text' },
    "hintLabel": { control: 'text' }
  },
  title: 'Charts/Composition Bar',
  component: CompositionBar,
};

export default meta;

type Story = StoryObj<typeof CompositionBar>;

export const Light: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ maxWidth: '100%', padding: 24, width: 360 }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

export const Dark: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ maxWidth: '100%', padding: 24, width: 360, backgroundColor: '#000' }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

export const Empty: Story = {
  args: { hintLabel: "No data yet" },
  parameters: { controls: { include: ["hintLabel"] } },
  render: (args) => (
    <BloomThemeProvider mode="light">
      <View style={{ maxWidth: '100%', padding: 24, width: 360 }}>
        <CompositionBar {...args}
          categories={[]}
          selectedKey={null}
          onSelect={() => {}}

        />
      </View>
    </BloomThemeProvider>
  ),
};
