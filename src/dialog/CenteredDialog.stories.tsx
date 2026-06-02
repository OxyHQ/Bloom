import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { CenteredDialog } from './CenteredDialog';

const meta: Meta<typeof CenteredDialog> = {
  title: 'Components/CenteredDialog',
  component: CenteredDialog,
};

export default meta;

type Story = StoryObj<typeof CenteredDialog>;

function CompactDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button onPress={() => setVisible(true)}>Open compact dialog</Button>
      <CenteredDialog
        visible={visible}
        onClose={() => setVisible(false)}
        title="Delete project?"
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" size="small" onPress={() => setVisible(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onPress={() => setVisible(false)}>
              Delete
            </Button>
          </View>
        }
      >
        <Text>This action cannot be undone. The project and all its data will be permanently removed.</Text>
      </CenteredDialog>
    </>
  );
}

function CozyDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button onPress={() => setVisible(true)}>Open cozy dialog</Button>
      <CenteredDialog
        visible={visible}
        onClose={() => setVisible(false)}
        title="Roomier layout"
        compact={false}
      >
        <Text>compact={'{false}'} relaxes the padding and header/footer gaps for content-heavy dialogs.</Text>
      </CenteredDialog>
    </>
  );
}

function ChromelessDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button onPress={() => setVisible(true)}>Open chromeless dialog</Button>
      <CenteredDialog visible={visible} onClose={() => setVisible(false)}>
        <View style={{ gap: 12 }}>
          <Text>No title, no close button — the card owns every pixel.</Text>
          <Button variant="secondary" size="small" onPress={() => setVisible(false)}>
            Done
          </Button>
        </View>
      </CenteredDialog>
    </>
  );
}

function NonDismissibleDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button onPress={() => setVisible(true)}>Open blocking dialog</Button>
      <CenteredDialog
        visible={visible}
        onClose={() => setVisible(false)}
        title="Action required"
        dismissible={false}
        showClose={false}
        footer={
          <Button size="small" onPress={() => setVisible(false)}>
            Acknowledge
          </Button>
        }
      >
        <Text>Backdrop tap and Escape are disabled — the user must choose an action.</Text>
      </CenteredDialog>
    </>
  );
}

export const Compact: Story = {
  render: () => <CompactDemo />,
};

export const Cozy: Story = {
  render: () => <CozyDemo />,
};

export const Chromeless: Story = {
  render: () => <ChromelessDemo />,
};

export const NonDismissible: Story = {
  render: () => <NonDismissibleDemo />,
};

export const Gallery: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <CompactDemo />
      <CozyDemo />
      <ChromelessDemo />
      <NonDismissibleDemo />
    </View>
  ),
};
