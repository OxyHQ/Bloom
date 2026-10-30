import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Screen, ScreenScrollView } from '../screen';
import { PageHeader } from '../page-header';
import { TextField, TextFieldInput } from '../text-field';
import { BottomSheet } from './index';
import type { BottomSheetRef } from './types';

const meta: Meta<typeof BottomSheet> = {
  argTypes: {
    open: { control: 'boolean' },
    enablePanDownToClose: { control: 'boolean' },
    enableHandlePanningGesture: { control: 'boolean' },
    detached: { control: 'boolean' },
    showHandle: { control: 'boolean' },
    backdropOpacity: { control: 'number' },
    scrollable: { control: 'boolean' },
    sizing: { control: 'select', options: ['content', 'fill'] },
    manualActivation: { control: 'boolean' },
  },
  id: 'base-bottom-sheet',
  title: 'Components/Overlays/Bottom Sheet',
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
            Pan down to close, or tap the backdrop. This is the default sheet (flush, rounded top
            corners only).
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
          <Text>Floating card with margins and rounded corners on all sides.</Text>
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
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Non-scrollable</Text>
          <Text>Use when the body owns its own VirtualizedList (FlatList, SectionList, etc.).</Text>
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
  args: {
    detached: false,
    showHandle: true,
    enablePanDownToClose: true,
    backdropOpacity: 0.5,
    scrollable: true,
  },
  parameters: {
    controls: {
      include: ['detached', 'showHandle', 'enablePanDownToClose', 'backdropOpacity', 'scrollable'],
    },
  },
  render: function PlaygroundSheet(args) {
    const ref = useRef<BottomSheetRef>(null);
    return (
      <>
        <Button onPress={() => ref.current?.present()}>Open sheet</Button>
        <BottomSheet {...args} ref={ref}>
          <View style={{ padding: 24, gap: 12 }}>
            <Text>Configure this sheet in Controls.</Text>
            <Button onPress={() => ref.current?.dismiss()}>Close sheet</Button>
          </View>
        </BottomSheet>
      </>
    );
  },
};

export const FlexScreen: Story = {
  render: function FlexScreenStory() {
    const sheet = useRef<BottomSheetRef>(null);
    return (
      <>
        <Button onPress={() => sheet.current?.present()}>Open conversation</Button>
        <BottomSheet
          ref={sheet}
          detached
          sizing="fill"
          scrollable={false}
          accessibilityLabel="Conversation"
        >
          <Screen scroll="none" header={<PageHeader title="Conversation" />}>
            <ScreenScrollView>
              <TextField>
                <TextFieldInput label="Message" placeholder="A draft that survives resizing" />
              </TextField>
              {Array.from({ length: 30 }, (_, i) => (
                <Text key={`message-${i}`}>Message {i + 1}</Text>
              ))}
            </ScreenScrollView>
          </Screen>
        </BottomSheet>
      </>
    );
  },
};

export const CappedInWideWindow: Story = {
  parameters: { controls: { disable: true } },
  render: function CappedInWideWindowStory() {
    const ref = useRef<BottomSheetRef>(null);
    return (
      <>
        <Button onPress={() => ref.current?.present()}>Open capped sheet</Button>
        <BottomSheet ref={ref} detached style={{ maxWidth: 500 }}>
          <View style={{ padding: 24, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700' }}>Centred under its cap</Text>
            <Text>
              In a window wider than 500px the sheet keeps its cap and sits in the middle of the
              bottom edge, on the web and on a native tablet or desktop window alike.
            </Text>
          </View>
        </BottomSheet>
      </>
    );
  },
};
