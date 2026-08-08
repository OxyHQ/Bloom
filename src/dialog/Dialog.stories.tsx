import React from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Dialog } from './Dialog';
import { useDialogControl } from './context';
import { alert } from './alert';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
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
          <Button variant="secondary" onPress={() => control.close()}>
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

function AlertDemo() {
  return (
    <Button
      onPress={() =>
        alert('Delete project?', 'This action cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive' },
        ])
      }
    >
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
          <Button variant="secondary" onPress={() => control.close()}>
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

export const Basic: Story = {
  render: () => <DeclarativeDemo />,
};

export const SideSheetLeft: Story = {
  render: () => <SideSheetDemo placement="left" />,
};

export const SideSheetRight: Story = {
  render: () => <SideSheetDemo placement="right" />,
};

export const CustomChildren: Story = {
  render: () => <CustomChildrenDemo />,
};

export const AlertHelper: Story = {
  render: () => <AlertDemo />,
};

export const ThreeAction: Story = {
  render: () => <ThreeActionDemo />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <DeclarativeDemo />
      <CustomChildrenDemo />
      <AlertDemo />
    </View>
  ),
};
