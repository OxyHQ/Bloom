import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AlertDialog } from './index';
import { confirm } from '../surfaces';
import { Button } from '../button';
import { Text } from '../typography';

const meta: Meta<typeof AlertDialog> = {
  argTypes: {
    "visible": { control: 'boolean' },
    "title": { control: 'text' },
    "description": { control: 'text' },
    "confirmLabel": { control: 'text' },
    "cancelLabel": { control: 'text' },
    "destructive": { control: 'boolean' },
    "hideCancel": { control: 'boolean' },
    "dismissible": { control: 'boolean' }
  },
  component: AlertDialog,
  title: 'Base/Alert Dialog',
};

export default meta;

type Story = StoryObj<Partial<React.ComponentProps<typeof AlertDialog>>>;

export const Declarative: Story = {
  args: { title: 'Delete this app?', description: 'This permanently removes the application and all of its credentials.', confirmLabel: 'Delete', destructive: true },
  parameters: { controls: { include: ['title', 'description', 'confirmLabel', 'destructive'] } },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <View style={{ padding: 40 }}>
        <Button onPress={() => setOpen(true)}>Delete app</Button>
        <AlertDialog {...args} title={String(args.title ?? 'Delete this app?')}
          visible={open}
          onClose={() => setOpen(false)}
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
      <Button onPress={async () => {
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
  parameters: { controls: { disable: true } },
  render: () => <ImperativeDemo />,
};
