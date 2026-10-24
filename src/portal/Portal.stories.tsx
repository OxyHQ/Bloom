import React, { createContext, useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Portal, PortalProvider, PortalOutlet } from './index';
import { Text } from '../typography';
import { Button } from '../button';
import { Card } from '../card';
import { OverlayRoot } from '../overlay';
import { useTheme } from '../theme';

const meta: Meta = {
  id: 'foundations-portal',
  title: 'Composition/Overlays/Portal',
};

export default meta;

type Story = StoryObj;

/**
 * The problem, shown rather than described: a clipping parent.
 *
 * The left card renders its panel inline, so `overflow: hidden` cuts it off.
 * The right card renders the same panel through a `Portal`, so it escapes the
 * clip entirely — which is why menus, tooltips and sheets are portaled.
 */
export const EscapingAClip: Story = {
  parameters: { controls: { disable: true } },
  render: function EscapingAClipStory() {
    const { colors } = useTheme();
    const [open, setOpen] = useState(true);

    const panel = (
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.primary,
          maxWidth: 260,
        }}
      >
        <Text style={{ color: colors.primaryForeground }}>
          A panel taller than its parent allows.
        </Text>
      </View>
    );

    return (
      <PortalProvider>
        <View style={{ gap: 12 }}>
          <Button onPress={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Show'}</Button>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 24 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>inline — clipped</Text>
              <Card
                appearance="outline"
                radius="radius-16"
                clipContent
                contentStyle={{ padding: 12 }}
                style={{ width: 260, height: 110 }}
              >
                <Text>Parent with overflow hidden</Text>
                {open ? panel : null}
              </Card>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>portaled — escapes</Text>
              <Card
                appearance="outline"
                radius="radius-16"
                clipContent
                contentStyle={{ padding: 12 }}
                style={{ width: 260, height: 110 }}
              >
                <Text>Same parent, same clip</Text>
                {open ? (
                  <Portal>
                    <OverlayRoot>
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 24,
                          left: 24,
                          right: 24,
                          alignItems: 'flex-start',
                        }}
                      >
                        {panel}
                      </View>
                    </OverlayRoot>
                  </Portal>
                ) : null}
              </Card>
            </View>
          </View>
          <PortalOutlet />
        </View>
      </PortalProvider>
    );
  },
};

/**
 * Several portals coexist. Each is tracked by its own id, so opening a second
 * does not replace the first and unmounting one removes only that one.
 */
export const ManyAtOnce: Story = {
  parameters: { controls: { disable: true } },
  render: function ManyAtOnceStory() {
    const [ids, setIds] = useState<number[]>([1, 2, 3]);
    return (
      <PortalProvider>
        <View style={{ gap: 12, width: 420, maxWidth: '100%' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button onPress={() => setIds((v) => [...v, (v[v.length - 1] ?? 0) + 1])}>Add</Button>
            <Button
              onPress={() => setIds((v) => v.slice(0, -1))}
              appearance="outline"
              tone="neutral"
            >
              Remove last
            </Button>
          </View>
          {ids.map((id) => (
            <Portal key={id}>
              <Text>portalled #{id}</Text>
            </Portal>
          ))}
          <Card appearance="outline" radius="radius-16" style={{ padding: 12, gap: 4 }}>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>outlet ↓</Text>
            <PortalOutlet />
          </Card>
        </View>
      </PortalProvider>
    );
  },
};

const AccountContext = createContext<string | null>(null);

function AccountName() {
  const name = useContext(AccountContext);
  if (name === null) throw new Error('AccountProvider is missing');
  return <Text>Signed in as {name}</Text>;
}

/**
 * Portaled content keeps the context of the place `<Portal>` is written. The
 * account provider wraps the portal and NOT the outlet — the shape of every app
 * root — and the content still reads it. On native that is the context bridge
 * (`portal/context-bridge.tsx`); before it, this threw "AccountProvider is
 * missing" on a device while web, where `createPortal` keeps context, was fine.
 */
export const KeepsTheAppsContext: Story = {
  parameters: { controls: { disable: true } },
  render: function KeepsTheAppsContextStory() {
    const [name, setName] = useState('Maya');
    return (
      <PortalProvider>
        <View style={{ gap: 12, width: 420, maxWidth: '100%' }}>
          <AccountContext.Provider value={name}>
            <Button onPress={() => setName((v) => (v === 'Maya' ? 'Ade' : 'Maya'))}>
              Switch account
            </Button>
            <Portal>
              <AccountName />
            </Portal>
          </AccountContext.Provider>
          <Card appearance="outline" radius="radius-16" style={{ padding: 12, gap: 4 }}>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>outlet ↓ (outside the provider)</Text>
            <PortalOutlet />
          </Card>
        </View>
      </PortalProvider>
    );
  },
};

/**
 * `PortalProvider` and `PortalOutlet` are NATIVE-ONLY: on web the fork ports
 * straight to `document.body`, and both are explicit no-op exports there. You
 * still render them — the API is identical on both platforms — they simply do
 * nothing in a browser, which is why the outlet card above stays empty here
 * while the content is still on screen.
 */
export const WebPortsToTheDocument: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PortalProvider>
      <View style={{ gap: 8, width: 420, maxWidth: '100%' }}>
        <Text>On web the content below is attached to `document.body`, not to the outlet.</Text>
        <Portal>
          <View style={{ position: 'absolute', top: 24, right: 24 }}>
            <Card appearance="solid" radius="radius-12" style={{ padding: 12 }}>
              <Text>Top-right of the document</Text>
            </Card>
          </View>
        </Portal>
        <PortalOutlet />
      </View>
    </PortalProvider>
  ),
};
