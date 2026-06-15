import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AlertDialog, AlertDialogHost, confirm } from './index';
import { Button } from '../button';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/AlertDialog',
};

export default meta;

type Story = StoryObj;

export const Declarative: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <View style={{ padding: 40 }}>
        <Button onPress={() => setOpen(true)}>Delete app</Button>
        <AlertDialog
          visible={open}
          onClose={() => setOpen(false)}
          title="Delete this app?"
          description="This permanently removes the application and all of its credentials. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {}}
        />
      </View>
    );
  },
};

function ImperativeDemo() {
  const [result, setResult] = useState<string>('—');
  return (
    <View style={{ padding: 40, gap: 12 }}>
      <AlertDialogHost />
      <Button
        onPress={async () => {
          const ok = await confirm({
            title: 'Sign out everywhere?',
            description: 'You will need to sign in again on all devices.',
            confirmLabel: 'Sign out',
            destructive: true,
          });
          setResult(ok ? 'confirmed' : 'cancelled');
        }}>
        Sign out everywhere
      </Button>
      <Text>{`Result: ${result}`}</Text>
    </View>
  );
}

export const ImperativeConfirm: Story = {
  render: () => <ImperativeDemo />,
};
