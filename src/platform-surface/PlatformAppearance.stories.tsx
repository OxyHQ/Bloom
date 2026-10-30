import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Backdrop } from '../overlay';
import { BlurIsland } from '../blur';
import { Button } from '../button';
import { Card } from '../card';
import { BloomProvider } from '../provider';
import { Surface } from '../surface';
import { Switch } from '../switch';
import type { AppColorName } from '../theme/color-presets';
import type { WebCssStyle } from '../styles/web-view-style';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { useBloomTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { PlatformAppearanceState, PlatformSurfaceAdapter } from './types';

/**
 * The `appearance` capability with a fake platform: what OxyOS's Settings tells
 * every application (ADR 0019). The panel on the left is the "system": it
 * changes the platform's accent and reduce transparency, and the app on the
 * right follows at once, with no restart. The app's own colour (`Own colour`)
 * is its brand and keeps it, unless it follows the system's anyway.
 */
const meta: Meta = {
  id: 'composition-platform-appearance',
  title: 'Composition/Platform Appearance',
  parameters: { layout: 'padded', controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

const ACCENTS: readonly (AppColorName | 'unknown')[] = [
  'oxy',
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
  'green',
  'gray',
  'unknown',
];

const STRIPES: WebCssStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundImage: 'repeating-linear-gradient(45deg, #222 0 12px, #e8e8e8 12px 24px)',
};

/** A platform adapter whose appearance is a store the story writes. */
function useStoryAppearance(state: PlatformAppearanceState): PlatformSurfaceAdapter {
  const current = useRef(state);
  const listeners = useRef(new Set<() => void>());
  useEffect(() => {
    current.current = state;
    for (const listener of listeners.current) listener();
  }, [state]);
  return useMemo<PlatformSurfaceAdapter>(
    () => ({
      platform: 'storybook',
      capabilities: new Set(['appearance']),
      appearance: {
        // A fresh object on every read, as a host bridge gives it.
        getState: () => ({ ...current.current }),
        subscribe: (listener) => {
          listeners.current.add(listener);
          return () => {
            listeners.current.delete(listener);
          };
        },
      },
    }),
    [],
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 }}>
      <Text style={{ flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}

/** The application: what it draws, and what Bloom resolved for it. */
function App() {
  const { colorPreset } = useBloomTheme();
  const reduced = useReducedTransparency();
  return (
    <View style={{ width: 340, height: 300, borderRadius: 16, overflow: 'hidden', padding: 16 }}>
      {/* Stripes behind the material, so its blur (or its absence) shows. */}
      <View style={STRIPES} />
      {/* A blurred band: blur and tint, or the tint alone. */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 56,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Backdrop blurIntensity={40} blurTint="light" dimOpacity={0} />
      </View>
      <View style={{ gap: 12 }}>
        <Surface style={{ padding: 12, borderRadius: 12 }}>
          <Text>
            Preset: {colorPreset}. Transparency {reduced ? 'reduced' : 'full'}.
          </Text>
        </Surface>
        <Card style={{ padding: 12 }}>
          <Text>A card on the material</Text>
        </Card>
        <BlurIsland style={{ padding: 6 }}>
          <Button onPress={() => {}}>Primary</Button>
        </BlurIsland>
      </View>
    </View>
  );
}

function Demo() {
  const [accent, setAccent] = useState<AppColorName | 'unknown'>('pink');
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [own, setOwn] = useState(false);
  const [follow, setFollow] = useState(false);
  const state = useMemo<PlatformAppearanceState>(
    () => ({
      accent: accent === 'unknown' ? 'not-a-preset' : accent,
      reduceTransparency,
    }),
    [accent, reduceTransparency],
  );
  const platform = useStoryAppearance(state);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <Card style={{ padding: 16, gap: 8, width: 300 }}>
        <Text style={{ fontWeight: '600' }}>The system</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ACCENTS.map((name) => (
            <Button
              key={name}
              size="sm"
              appearance={accent === name ? 'solid' : 'outline'}
              onPress={() => setAccent(name)}
            >
              {name}
            </Button>
          ))}
        </View>
        <Row label="Reduce transparency">
          <Switch
            accessibilityLabel="Reduce transparency"
            checked={reduceTransparency}
            onCheckedChange={setReduceTransparency}
          />
        </Row>
        <Text style={{ fontWeight: '600', marginTop: 8 }}>The app</Text>
        <Row label="Own colour (teal)">
          <Switch accessibilityLabel="Own colour" checked={own} onCheckedChange={setOwn} />
        </Row>
        <Row label="followSystemAccent">
          <Switch
            accessibilityLabel="Follow the system accent"
            checked={follow}
            onCheckedChange={setFollow}
          />
        </Row>
      </Card>
      <BloomProvider
        platform={platform}
        mode="light"
        defaultColorPreset={own ? 'teal' : undefined}
        followSystemAccent={follow}
        // A new app instance when its own colour changes, as a relaunch would.
        key={own ? 'own' : 'none'}
      >
        <App />
      </BloomProvider>
    </View>
  );
}

export const FakePlatform: Story = {
  name: 'With a fake platform',
  render: () => <Demo />,
};
