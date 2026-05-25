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

export const Basic: Story = {
  render: () => <DeclarativeDemo />,
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
