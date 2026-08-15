import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Card } from '../card';
import { Text } from '../typography';
import { ToastOutlet } from '../toast';
import { ConnectionStatusToasts } from './index';
import { useConnectionStatusToasts } from './shared';

/**
 * `ConnectionStatusToasts` renders NOTHING — it is a mount-once component that
 * drives the toast host from the device's connection signal. So the thing to
 * look at in these stories is the toast, and the thing to check is that the
 * three states replace each other IN PLACE (one id for the whole lifecycle)
 * rather than stacking into a pile of contradictory rows.
 *
 * `Signal` drives the platform-agnostic half — the same hook both forks call —
 * from buttons, because the browser will not let a page lie about
 * `navigator.onLine`. `DeviceSignal` mounts the real component for the case the
 * buttons cannot reach: the browser's own signal, which is what ships.
 */
const meta: Meta = {
  title: 'Overlays/ConnectionStatusToasts',
};

export default meta;

type Story = StoryObj;

/** Short enough that the escalation is visible while you watch it. */
const RECONNECTING_DELAY_MS = 1500;

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 8, maxWidth: 420 }}>
      {children}
    </Card>
  );
}

function SignalDemo() {
  // `null` is the state a first paint is in: nothing is known yet, and nothing
  // must be shown. It is a state, not an absence — starting at `false` would
  // accuse every user of being offline for one frame.
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  useConnectionStatusToasts(isOnline, { reconnectingDelayMs: RECONNECTING_DELAY_MS });

  return (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Legend>
        <Text style={{ fontWeight: '600' }}>isOnline: {String(isOnline)}</Text>
        <Text style={{ fontSize: 13, opacity: 0.75 }}>
          Offline shows a persistent error row, which becomes the warning “Reconnecting…” after{' '}
          {RECONNECTING_DELAY_MS}ms — the SAME row, updated in place. Coming back replaces it with a
          success row that auto-dismisses. Going online from `null` shows nothing at all: only
          someone who saw the outage is told it ended.
        </Text>
      </Legend>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button onPress={() => setIsOnline(null)}>Undetermined</Button>
        <Button onPress={() => setIsOnline(false)}>Go offline</Button>
        <Button onPress={() => setIsOnline(true)}>Come back online</Button>
      </View>
      <ToastOutlet />
    </View>
  );
}

/**
 * The three states a reader needs to compare, driven by hand.
 *
 * Watch the ROW, not the screen: offline → reconnecting is one row changing
 * colour and text, and a second row appearing there would mean the shared id
 * stopped working. The outage row is also deliberately not dismissible — an
 * outage ends when the network says so, not when the user swipes it away.
 */
export const Signal: Story = {
  render: () => <SignalDemo />,
};

/**
 * The real component, on the browser's own signal.
 *
 * To drive it: DevTools → Network → Offline (or unplug). `navigator.onLine`
 * cannot be faked from the page, which is exactly why the story above exists —
 * and why this one is still here, since it is the only one that exercises the
 * fork a consumer actually mounts.
 *
 * Web reads the LINK; native additionally reads NetInfo's reachability, so a
 * captive portal shows as offline there and as online here. That difference is
 * in the fork, never in what the user sees.
 */
export const DeviceSignal: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Legend>
        <Text style={{ fontWeight: '600' }}>Mounted: &lt;ConnectionStatusToasts /&gt;</Text>
        <Text style={{ fontSize: 13, opacity: 0.75 }}>
          Renders nothing by design — mount it once at the app root, beside the toast outlet. Toggle
          DevTools → Network → Offline to see the outage row, then back online for the restored row.
        </Text>
      </Legend>
      <ConnectionStatusToasts reconnectingDelayMs={RECONNECTING_DELAY_MS} />
      <ToastOutlet />
    </View>
  ),
};
