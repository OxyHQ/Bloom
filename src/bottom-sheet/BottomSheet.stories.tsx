import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { BottomSheet } from './index';
import type { BottomSheetRef } from './types';

const meta: Meta<typeof BottomSheet> = {
  argTypes: {
    "open": { control: 'boolean' },
    "enablePanDownToClose": { control: 'boolean' },
    "enableHandlePanningGesture": { control: 'boolean' },
    "detached": { control: 'boolean' },
    "showHandle": { control: 'boolean' },
    "backdropOpacity": { control: 'number' },
    "scrollable": { control: 'boolean' },
    "manualActivation": { control: 'boolean' },
    "dynamicBackdrop": { control: 'boolean' }
  },
  title: 'Base/Bottom Sheet',
  component: BottomSheet,
};

export default meta;

type Story = StoryObj<typeof BottomSheet>;

function BasicSheet() {
  const ref = useRef<BottomSheetRef>(null);
  return (
    <>
      <Button onPress={() => ref.current?.present()}>Open sheet</Button>
      <BottomSheet ref={ref}>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Bottom sheet</Text>
          <Text>
            Pan down to close, or tap the backdrop. This is the default sheet
            (flush, rounded top corners only).
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}

function DetachedSheet() {
  const ref = useRef<BottomSheetRef>(null);
  return (
    <>
      <Button onPress={() => ref.current?.present()}>Open detached</Button>
      <BottomSheet ref={ref} detached>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Detached</Text>
          <Text>
            Floating card with margins and rounded corners on all sides.
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}

function NonScrollableSheet() {
  const ref = useRef<BottomSheetRef>(null);
  return (
    <>
      <Button onPress={() => ref.current?.present()}>Open non-scrollable</Button>
      <BottomSheet ref={ref} scrollable={false}>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            Non-scrollable
          </Text>
          <Text>
            Use when the body owns its own VirtualizedList (FlatList,
            SectionList, etc.).
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => <BasicSheet />,
};

export const Detached: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DetachedSheet />,
};

export const NonScrollable: Story = {
  parameters: { controls: { disable: true } },
  render: () => <NonScrollableSheet />,
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <BasicSheet />
      <DetachedSheet />
      <NonScrollableSheet />
    </View>
  ),
};

export const Playground: Story = {
  args: { detached: false, showHandle: true, enablePanDownToClose: true, backdropOpacity: 0.5, scrollable: true },
  parameters: { controls: { include: ['detached', 'showHandle', 'enablePanDownToClose', 'backdropOpacity', 'scrollable'] } },
  render: function PlaygroundSheet(args) {
    const ref = useRef<BottomSheetRef>(null);
    return <><Button onPress={() => ref.current?.present()}>Open sheet</Button><BottomSheet {...args} ref={ref}><View style={{ padding: 24, gap: 12 }}><Text>Configure this sheet in Controls.</Text><Button onPress={() => ref.current?.dismiss()}>Close sheet</Button></View></BottomSheet></>;
  },
};
