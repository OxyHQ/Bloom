import React from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { toast, ToastOutlet } from './index';
import type { ToasterProps } from './types';

/**
 * These stories exercise the real engine, so they need the REAL
 * `react-native-reanimated` / `react-native-gesture-handler` /
 * `react-native-safe-area-context`. Until `.storybook/main.ts` stops aliasing those
 * to `.storybook/mocks/*`, this page cannot load: the reanimated stub exports no
 * `Keyframe`, `LinearTransition`, `useReducedMotion`, `Easing.bezierFn` or
 * `Easing.elastic`, and the safe-area stub exports `SafeAreaInsetsContext` as a
 * function rather than a context. Removing those aliases is deliberately a separate
 * step — running against the real packages WITHOUT the worklets babel plugin is
 * exactly what consumers ship, which is the whole point of the web gate.
 */
const meta: Meta = {
  title: 'Components/Toast',
};

export default meta;

type Story = StoryObj;

function Demo({
  children,
  outlet,
}: {
  children: React.ReactNode;
  outlet?: ToasterProps;
}) {
  return (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      {children}
      <ToastOutlet {...outlet} />
    </View>
  );
}

export const Variants: Story = {
  render: () => (
    <Demo>
      <Button onPress={() => toast('Saved')}>Default</Button>
      <Button onPress={() => toast.success('Profile updated')}>Success</Button>
      <Button onPress={() => toast.error('Network error')}>Error</Button>
      <Button onPress={() => toast.warning('Storage almost full')}>Warning</Button>
      <Button onPress={() => toast.info('New version available')}>Info</Button>
      <Button onPress={() => toast.loading('Uploading…')}>Loading</Button>
    </Demo>
  ),
};

export const RichColors: Story = {
  render: () => (
    <Demo outlet={{ richColors: true }}>
      <Button onPress={() => toast.success('Profile updated')}>Success</Button>
      <Button onPress={() => toast.error('Network error')}>Error</Button>
      <Button onPress={() => toast.warning('Storage almost full')}>Warning</Button>
      <Button onPress={() => toast.info('New version available')}>Info</Button>
    </Demo>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Demo>
      <Button
        onPress={() =>
          toast.success('Profile updated', {
            description: 'Your changes are visible to everyone.',
          })
        }
      >
        Title + description
      </Button>
    </Demo>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Demo>
      <Button
        onPress={() =>
          toast('Item moved to trash', {
            action: { label: 'Undo', onClick: () => toast.success('Restored') },
          })
        }
      >
        Action
      </Button>
      <Button
        onPress={() =>
          toast('Discard draft?', {
            action: { label: 'Discard', onClick: () => toast.error('Discarded') },
            cancel: { label: 'Keep', onClick: () => {} },
          })
        }
      >
        Action + cancel
      </Button>
    </Demo>
  ),
};

export const CloseButton: Story = {
  render: () => (
    <Demo outlet={{ closeButton: true }}>
      <Button onPress={() => toast('Dismiss me with the close button', { duration: Infinity })}>
        Close button
      </Button>
    </Demo>
  ),
};

export const PromiseToast: Story = {
  name: 'Promise',
  render: () => (
    <Demo>
      <Button
        onPress={() =>
          toast.promise(
            new Promise<{ name: string }>((resolve) =>
              setTimeout(() => resolve({ name: 'Nate' }), 1500),
            ),
            {
              loading: 'Saving…',
              success: (profile) => `Saved ${profile.name}`,
              error: 'Could not save',
            },
          )
        }
      >
        Resolves
      </Button>
      <Button
        onPress={() =>
          toast.promise(
            new Promise<void>((_resolve, reject) =>
              setTimeout(() => reject(new Error('offline')), 1500),
            ),
            {
              loading: 'Saving…',
              success: () => 'Saved',
              error: (err) =>
                `Failed: ${err instanceof Error ? err.message : 'unknown'}`,
            },
          )
        }
      >
        Rejects
      </Button>
    </Demo>
  ),
};

export const UpdateInPlace: Story = {
  render: () => (
    <Demo>
      <Button
        onPress={() => {
          toast.loading('Uploading…', { id: 'upload' });
          setTimeout(() => toast.success('Uploaded', { id: 'upload' }), 1500);
        }}
      >
        Same id, updated row
      </Button>
    </Demo>
  ),
};

export const Custom: Story = {
  render: () => (
    <Demo>
      <Button
        onPress={() =>
          toast.custom(
            <View
              style={{
                marginHorizontal: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#111',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                A completely custom row
              </Text>
            </View>,
          )
        }
      >
        toast.custom
      </Button>
    </Demo>
  ),
};

export const Stacking: Story = {
  render: () => (
    <Demo outlet={{ enableStacking: true, visibleToasts: 3 }}>
      <Button
        onPress={() => {
          toast('First');
          toast('Second');
          toast('Third');
          toast('Fourth — the first should be culled');
        }}
      >
        Queue four
      </Button>
    </Demo>
  ),
};

export const TopCenter: Story = {
  render: () => (
    <Demo outlet={{ position: 'top-center' }}>
      <Button onPress={() => toast('Anchored to the top')}>Top</Button>
    </Demo>
  ),
};

export const Center: Story = {
  render: () => (
    <Demo outlet={{ position: 'center' }}>
      <Button onPress={() => toast('Anchored to the middle')}>Center</Button>
    </Demo>
  ),
};

export const SwipeUp: Story = {
  render: () => (
    <Demo outlet={{ swipeToDismissDirection: 'up', position: 'top-center' }}>
      <Button onPress={() => toast('Swipe me up', { duration: Infinity })}>
        Swipe up to dismiss
      </Button>
    </Demo>
  ),
};
