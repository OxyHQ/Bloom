import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ResponsiveSheet } from './index';
import type { ResponsiveSheetSide } from './types';
import { Button } from '../button';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/ResponsiveSheet',
};

export default meta;

type Story = StoryObj;

function Demo({ side }: { side: ResponsiveSheetSide }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ padding: 24, minHeight: 480 }}>
      <Button onPress={() => setOpen(true)}>Open sheet ({side})</Button>
      <ResponsiveSheet
        open={open}
        onClose={() => setOpen(false)}
        side={side}
        width={420}
        inset={{ top: 16, bottom: 16, left: 16 }}
        label="Demo sheet"
      >
        <View style={{ padding: 20, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Responsive sheet</Text>
          <Text>
            On a wide viewport this is an anchored side-sheet; below the
            breakpoint it becomes a bottom-sheet with a drag handle. Resize the
            preview to switch modes.
          </Text>
          <Button variant="secondary" onPress={() => setOpen(false)}>
            Close
          </Button>
        </View>
      </ResponsiveSheet>
    </View>
  );
}

export const SideLeft: Story = {
  render: () => <Demo side="left" />,
};

export const SideRight: Story = {
  render: () => <Demo side="right" />,
};
