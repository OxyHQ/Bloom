import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AlertDialog } from './index';
import { confirm } from '../surfaces';
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
    // NO `<SurfaceHost />` here: the preview decorator mounts the ONE host, the
    // way an app root does. A second mount subscribes to the same module-scope
    // store and renders every surface TWICE — the duplicate's backdrop then sits
    // over the original's buttons, so the confirm is unclickable. Jest cannot see
    // it (both copies' markup is valid); a real browser click can.
    <View style={{ padding: 40, gap: 12 }}>
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
