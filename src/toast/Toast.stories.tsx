import React from 'react';
import { Text, View } from 'react-native';
import { SlideInLeft } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { toast, ToastOutlet } from './index';
import type { ToasterProps } from './types';

/**
 * These stories run against the REAL `react-native-reanimated` /
 * `react-native-gesture-handler` / `react-native-safe-area-context` bundled
 * against react-native-web WITHOUT the worklets babel plugin — exactly what
 * every Oxy consumer ships, which is what makes this a genuine web gate.
 *
 * Two shapes of multi-toast story exist on purpose and BOTH must be kept:
 *
 *  - `Stacking` fires four toasts in ONE tick. Every row enters at its final
 *    slot, so no row ever changes position after it has settled.
 *  - `Sequential*` fires one toast, waits, then fires another while the first
 *    is AT REST. Only this shape moves a settled row, and only this shape
 *    catches the class of bug where something pins a row at a stale position.
 *
 * A one-tick story passing proves nothing about the sequential case. Verify a
 * `Sequential*` story by comparing the two rows' `getBoundingClientRect().y`:
 * unstacked they must be ~54px apart (46px measured row + 8px gap), collapsed-
 * stack ~8px apart. Equal `y` values mean the rows are drawn on top of each
 * other — the failure this shape exists to catch.
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

/**
 * All six rows must share ONE neutral surface — only the leading icon changes
 * colour. Compare against `RichColors`, which keeps that same surface and adds the
 * status colour to the border and title.
 */
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

/**
 * The direct comparison against `Variants`. The SURFACE is identical in both
 * stories — `richColors` only widens the status colour from the icon alone to the
 * border and title as well, so a success row here is a neutral card with a green
 * icon, green border and green title. Two failure modes to watch for: a tinted or
 * brand-coloured surface (the status/brand token families got mixed again), or a
 * row indistinguishable from `Variants` (the prop stopped doing anything).
 */
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

/**
 * The three sequential regression stories. Fire `One`, let it settle, then fire
 * `Two` — the second toast must land BESIDE the first, never on top of it. See
 * the file header for the expected geometry.
 */
function SequentialDemo({ outlet }: { outlet?: ToasterProps }) {
  return (
    <Demo outlet={outlet}>
      <Button onPress={() => toast('Row one', { duration: Infinity })}>One</Button>
      <Button onPress={() => toast('Row two', { duration: Infinity })}>Two</Button>
    </Demo>
  );
}

export const SequentialStacked: Story = {
  render: () => <SequentialDemo outlet={{ enableStacking: true, visibleToasts: 3 }} />,
};

export const SequentialUnstacked: Story = {
  render: () => <SequentialDemo outlet={{ enableStacking: false, visibleToasts: 5 }} />,
};

export const SequentialTopCenter: Story = {
  render: () => <SequentialDemo outlet={{ position: 'top-center', visibleToasts: 5 }} />,
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

/**
 * The consumer-override branch: Bloom's own enter is imperative, so a supplied
 * `animation.enter` is the ONLY thing ever handed to reanimated's `entering`.
 * Sequential on purpose — an override must not reintroduce the stale-position
 * pin the default enter was moved off `entering` to avoid.
 */
export const CustomEnterAnimation: Story = {
  render: () => (
    <Demo outlet={{ animation: { enter: SlideInLeft.duration(300) }, visibleToasts: 5 }}>
      <Button onPress={() => toast('Row one', { duration: Infinity })}>One</Button>
      <Button onPress={() => toast('Row two', { duration: Infinity })}>Two</Button>
    </Demo>
  ),
};
