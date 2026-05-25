import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { BottomSheet, type BottomSheetRef } from './index';

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
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
  render: () => <BasicSheet />,
};

export const Detached: Story = {
  render: () => <DetachedSheet />,
};

export const NonScrollable: Story = {
  render: () => <NonScrollableSheet />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <BasicSheet />
      <DetachedSheet />
      <NonScrollableSheet />
    </View>
  ),
};
