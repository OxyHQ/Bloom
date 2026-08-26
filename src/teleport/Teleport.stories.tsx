import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Portal, PortalHost, PortalProvider } from './index';

/**
 * The vendored react-native-teleport, doing the one thing it is here for:
 * moving a node between hosts instead of rebuilding it. See `docs/teleport.mdx`
 * for what Bloom changed (import paths) and what Bloom does differently (who
 * mounts the portal).
 */
const meta: Meta = { title: 'Overlays/Teleport' };
export default meta;
type Story = StoryObj;

function TeleportDemo() {
  const [away, setAway] = React.useState(false);
  return (
    <PortalProvider>
      <View style={styles.page}>
        <Pressable onPress={() => setAway((v) => !v)} testID="teleport-toggle">
          <Text>{away ? 'Bring it back' : 'Send it across'}</Text>
        </Pressable>

        <View style={styles.slot}>
          <Text style={styles.label}>here</Text>
          <Portal hostName={away ? 'there' : undefined} name="demo">
            <View style={styles.box} />
          </Portal>
        </View>

        <View style={styles.slot}>
          <Text style={styles.label}>there</Text>
          <PortalHost name="there" style={styles.host} />
        </View>
      </View>
    </PortalProvider>
  );
}

export const MoveBetweenHosts: Story = { render: () => <TeleportDemo /> };

const styles = StyleSheet.create({
  page: { gap: 16, padding: 16 },
  slot: { minHeight: 90, borderWidth: 1, borderStyle: 'dashed', borderColor: '#888', padding: 8 },
  label: { fontSize: 11, opacity: 0.6 },
  host: { minHeight: 64 },
  box: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#4f46e5' },
});
