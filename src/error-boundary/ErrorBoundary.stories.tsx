import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorBoundary } from './index';
import { Text } from '../typography';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
};

export default meta;

type Story = StoryObj<typeof ErrorBoundary>;

/** Throws on demand, so the boundary has something real to catch. */
function Bomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error('The feed could not be loaded.');
  return <Text>Everything is fine.</Text>;
}

function Harness({ children }: { children: (armed: boolean) => React.ReactNode }) {
  const [armed, setArmed] = useState(false);
  return (
    <View style={{ width: 420, gap: 12 }}>
      <Pressable onPress={() => setArmed((value) => !value)}>
        <Text>{armed ? 'Disarm' : 'Throw'}</Text>
      </Pressable>
      {children(armed)}
    </View>
  );
}

/**
 * The default fallback. A boundary is worth placing where a failure should cost
 * the user a SECTION rather than the screen — around a feed, a widget, a tab's
 * content. Wrapping the whole app in one turns every error into a blank page,
 * which is the thing it was meant to prevent.
 */
export const Default: Story = {
  render: () => (
    <Harness>
      {(armed) => (
        <ErrorBoundary>
          <Bomb armed={armed} />
        </ErrorBoundary>
      )}
    </Harness>
  ),
};

/**
 * `title` / `message` / `retryLabel` reword the default fallback without
 * replacing it. Say what the USER lost and what pressing retry will do — a
 * boundary's message is read by someone who does not know what a boundary is.
 */
export const Worded: Story = {
  render: () => (
    <Harness>
      {(armed) => (
        <ErrorBoundary
          title="This feed didn't load"
          message="Your other tabs are unaffected."
          retryLabel="Try again"
        >
          <Bomb armed={armed} />
        </ErrorBoundary>
      )}
    </Harness>
  ),
};

/**
 * A function `fallback` receives `retry` and `retryCount`. The count is the
 * reason to take the function form: after two or three failed retries the
 * honest move is to stop offering the button and point somewhere else.
 */
export const CustomFallback: Story = {
  render: () => (
    <Harness>
      {(armed) => (
        <ErrorBoundary
          fallback={({ error, retry, retryCount }) => (
            <View style={{ gap: 8 }}>
              <Text>{error.message}</Text>
              {retryCount < 2 ? (
                <Pressable onPress={retry}>
                  <Text>Retry ({retryCount})</Text>
                </Pressable>
              ) : (
                <Text>Still failing — check your connection.</Text>
              )}
            </View>
          )}
        >
          <Bomb armed={armed} />
        </ErrorBoundary>
      )}
    </Harness>
  ),
};
