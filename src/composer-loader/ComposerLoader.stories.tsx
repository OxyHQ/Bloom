import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiArrowUpLine } from '../icons/remix';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { ComposerLoader } from './index';

const meta: Meta<typeof ComposerLoader> = {
  title: 'Blocks/Composer Loader',
  component: ComposerLoader,
};

export default meta;

type Story = StoryObj<typeof ComposerLoader>;

const WIDTH = 520;

/** An empty 52px pill — what the loader wraps in this demo. */
function Pill({ height = 52 }: { height?: number }) {
  return <View style={{ height }} />;
}

function Label({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

export const Default: Story = {
  render: () => (
    <View style={{ padding: 40, width: WIDTH + 80 }}>
      <ComposerLoader active testID="loader">
        <Pill />
      </ComposerLoader>
    </View>
  ),
};

/** Every prop `ComposerLoader` exposes, one row each. */
export const Variants: Story = {
  render: () => (
    <View style={{ padding: 40, gap: 24, width: WIDTH + 80 }}>
      <View>
        <Label>default</Label>
        <ComposerLoader active>
          <Pill />
        </ComposerLoader>
      </View>
      <View>
        <Label>inactive (surface only)</Label>
        <ComposerLoader active={false}>
          <Pill />
        </ComposerLoader>
      </View>
      <View>
        <Label>taper 0.6 · radius 16</Label>
        <ComposerLoader active taper={0.6} radius={16}>
          <Pill height={120} />
        </ComposerLoader>
      </View>
      <View>
        <Label>bloomOnly · arc 200</Label>
        <ComposerLoader active bloomOnly arc={200} bloom={24} bloomStrength={0.5}>
          <Pill />
        </ComposerLoader>
      </View>
      <View>
        <Label>reverse · speed 2.5 · line 4</Label>
        <ComposerLoader active reverse speed={2.5} line={4}>
          <Pill />
        </ComposerLoader>
      </View>
      <View>
        <Label>custom colours · intensity 1</Label>
        <ComposerLoader active intensity={1} colors={['#f97316', '#facc15', '#ef4444', '#a855f7']}>
          <Pill />
        </ComposerLoader>
      </View>
      <View>
        <Label>no surface · blend screen</Label>
        <View style={{ backgroundColor: '#18181b', borderRadius: 9999 }}>
          <ComposerLoader active surface={false} blend="screen">
            <Pill />
          </ComposerLoader>
        </View>
      </View>
      <View>
        <Label>beam leading a glow (offset)</Label>
        <View>
          <ComposerLoader active bloomOnly arc={160} bloom={22}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <ComposerLoader active surface={false} arc={60} bloom={0} offset={(160 - 60) / 360}>
                <Pill />
              </ComposerLoader>
            </View>
            <Pill />
          </ComposerLoader>
        </View>
      </View>
    </View>
  ),
};

/** The realistic use: a composer that lights up while waiting for a reply. */
export const WithComposer: Story = {
  render: function Render() {
    const theme = useTheme();
    const [busy, setBusy] = useState(false);
    const [value, setValue] = useState('Summarise the release notes');
    return (
      <View style={{ padding: 40, width: WIDTH + 80 }}>
        <ComposerLoader active={busy}>
          <View
            style={{
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 8,
              borderRadius: 9999,
            }}
          >
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Ask anything"
              accessibilityLabel="Message"
              style={{ flex: 1, color: theme.colors.text, fontSize: 14, lineHeight: 20 }}
            />
            <Button
              variant="primary"
              size="small"
              icon={RiArrowUpLine}
              accessibilityLabel={busy ? 'Stop' : 'Send'}
              onPress={() => setBusy((b) => !b)}
            />
          </View>
        </ComposerLoader>
      </View>
    );
  },
};
