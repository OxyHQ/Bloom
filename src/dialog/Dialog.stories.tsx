import React from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Dialog } from './Dialog';
import { useDialogControl } from './context';
import { alert } from '../surfaces';

const meta: Meta<typeof Dialog> = {
  argTypes: {
    "open": { control: 'boolean' },
    "title": { control: 'text' },
    "description": { control: 'text' },
    "width": { control: 'number' },
    "maxWidth": { control: 'number' },
    "maxHeightRatio": { control: 'number' },
    "showHandle": { control: 'boolean' },
    "startOpen": { control: 'boolean' },
    "scrollable": { control: 'boolean' },
    "contentPadding": { control: 'number' },
    "dismissOnBackdrop": { control: 'boolean' },
    "morph": { control: 'boolean' },
    "panelClassName": { control: 'text' },
    "containerClassName": { control: 'text' },
    "label": { control: 'text' }
  },
  title: 'Base/Dialog',
  component: Dialog,
};

export default meta;

type Story = StoryObj<typeof Dialog>;

function DeclarativeDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open dialog</Button>
      <Dialog
        control={control}
        title="Sign out?"
        description="You'll need to enter your password to sign in again."
        actions={[
          { label: 'Sign out', color: 'destructive' },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}

function CustomChildrenDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open custom dialog</Button>
      <Dialog control={control} title="Custom body">
        <View style={{ gap: 12 }}>
          <Text>Render any JSX inside the dialog body.</Text>
          <Button onPress={() => control.close()} appearance="outline" tone="neutral">
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

function AlertDemo() {
  return (
    <Button onPress={() =>
        alert('Delete project?', 'This action cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive' },
        ])
      }>
      Trigger alert()
    </Button>
  );
}

function ThreeActionDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Three actions</Button>
      <Dialog
        control={control}
        title="Save changes?"
        description="You have unsaved changes."
        actions={[
          { label: 'Save', color: 'default' },
          { label: 'Discard', color: 'destructive' },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}

/**
 * The side-sheet placement, which is a DIFFERENT web surface from the centered
 * card: it resolves `SheetSurface` in `Dialog.web.tsx`, whose entry animation is
 * a CSS transition handed to the backdrop layers rather than a shared value.
 *
 * It needs its own story because that difference is exactly what broke. The
 * layers used to be reanimated components, and on web reanimated routes a style
 * carrying `transitionProperty` into its CSS transitions manager, which writes
 * to `ref.style` — undefined on expo-blur's web `BlurView`, whose ref is a
 * `setNativeProps`-only handle. Opening the sheet threw before it painted. Only
 * a real browser sees it: jest mocks both packages, so the whole suite passed.
 */
function SideSheetDemo({ placement }: { placement: 'left' | 'right' }) {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open {placement} sheet</Button>
      <Dialog control={control} placement={placement} title="Store menu">
        <View style={{ gap: 12 }}>
          <Text>An anchored drawer, blurred and dimmed behind.</Text>
          <Button onPress={() => control.close()} appearance="outline" tone="neutral">
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DeclarativeDemo />,
};

export const SideSheetLeft: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SideSheetDemo placement="left" />,
};

export const SideSheetRight: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SideSheetDemo placement="right" />,
};

export const CustomChildren: Story = {
  parameters: { controls: { disable: true } },
  render: () => <CustomChildrenDemo />,
};

export const AlertHelper: Story = {
  parameters: { controls: { disable: true } },
  render: () => <AlertDemo />,
};

export const ThreeAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ThreeActionDemo />,
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <DeclarativeDemo />
      <CustomChildrenDemo />
      <AlertDemo />
    </View>
  ),
};

/** Controls configure the next presentation; dismissal stays imperative. */
export const Playground: Story = {
  args: { title: 'Review changes', description: 'Everything is ready to save.', width: 440, showHandle: true, dismissOnBackdrop: true, scrollable: true },
  parameters: { controls: { include: ['title', 'description', 'width', 'showHandle', 'dismissOnBackdrop', 'scrollable'] } },
  render: function PlaygroundDialog(args) {
    const control = useDialogControl();
    return <><Button onPress={() => control.open()}>Open dialog</Button><Dialog {...args} control={control} actions={[{ label: 'Done', color: 'default' }, { label: 'Cancel', color: 'cancel' }]} /></>;
  },
};
