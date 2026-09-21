import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { resolveButtonRamps } from '../button/shared';
import { RiBikeLine, RiEarthLine, RiMap2Line, RiSubwayLine, RiCarLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MapCompass } from './MapCompass';
import { MapControls } from './MapControls';
import { MapLayerPicker } from './MapLayerPicker';
import type { MapLayerOption, MapOverlayOption } from './types';

const meta: Meta<typeof MapControls> = {
  title: 'Blocks/Maps/MapControls',
  component: MapControls,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof MapControls>;

const LAYERS: MapLayerOption[] = [
  { id: 'standard', label: 'Standard', icon: RiMap2Line },
  { id: 'satellite', label: 'Satellite', icon: RiEarthLine },
  { id: 'transit', label: 'Transit', icon: RiSubwayLine },
];

const OVERLAYS: MapOverlayOption[] = [
  { id: 'traffic', label: 'Traffic', icon: RiCarLine },
  { id: 'bike', label: 'Bike lanes', icon: RiBikeLine },
];

/**
 * A stand-in for the app's own map: the chrome floats over content Bloom does
 * not own, and this story does not own one either.
 */
function MockMap({ children, height = 460 }: { children: React.ReactNode; height?: number }) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  const line = theme.isDark ? n[800] : n[100];
  const park = theme.isDark ? n[800] : n[300];
  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.isDark ? n[900] : n[200],
        position: 'relative',
      }}
    >
      <View style={{ position: 'absolute', left: '8%', top: '12%', width: '38%', height: '34%', borderRadius: 24, backgroundColor: park }} />
      <View style={{ position: 'absolute', left: '55%', top: '58%', width: '40%', height: '30%', borderRadius: 24, backgroundColor: park }} />
      {[0.12, 0.38, 0.64, 0.88].map((top) => (
        <View
          key={`h${top}`}
          style={{ position: 'absolute', left: 0, right: 0, top: height * top, height: 8, backgroundColor: line }}
        />
      ))}
      {[0.2, 0.52, 0.78].map((left) => (
        <View
          key={`v${left}`}
          style={{ position: 'absolute', top: 0, bottom: 0, left: `${left * 100}%`, width: 8, backgroundColor: line }}
        />
      ))}
      {children}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 900, padding: 16, gap: 32 }}>{children}</View>;
}

function LiveStack({ align = 'end' as const }) {
  const [following, setFollowing] = useState(false);
  const [heading, setHeading] = useState(34);
  const [zoom, setZoom] = useState(12);
  const [tilted, setTilted] = useState(false);
  const [layer, setLayer] = useState('standard');
  const [overlays, setOverlays] = useState<string[]>(['traffic']);

  return (
    <MapControls
      align={align}
      onLocate={() => setFollowing((v) => !v)}
      following={following}
      heading={heading}
      onResetNorth={() => setHeading(0)}
      onZoomIn={() => setZoom((z) => Math.min(20, z + 1))}
      onZoomOut={() => setZoom((z) => Math.max(3, z - 1))}
      canZoomIn={zoom < 20}
      canZoomOut={zoom > 3}
      tilted={tilted}
      onTiltChange={setTilted}
      testID="stack"
    >
      <MapLayerPicker
        layers={LAYERS}
        layerId={layer}
        onLayerChange={setLayer}
        overlays={OVERLAYS}
        activeOverlayIds={overlays}
        onOverlayChange={(id, active) =>
          setOverlays((current) => (active ? [...current, id] : current.filter((x) => x !== id)))
        }
        testID="layers"
      />
    </MapControls>
  );
}

export const OverAMap: Story = {
  render: () => (
    <Page>
      <Section title="The stack, floating over a map the app supplies">
        <MockMap>
          <View style={{ position: 'absolute', top: 16, right: 16 }}>
            <LiveStack />
          </View>
        </MockMap>
      </Section>
    </Page>
  ),
};

export const States: Story = {
  render: () => (
    <Page>
      <Section title="Following, tilted, and at the end of the zoom range">
        <MockMap height={360}>
          <View style={{ position: 'absolute', top: 16, right: 16 }}>
            <MapControls
              onLocate={() => undefined}
              following
              heading={120}
              onResetNorth={() => undefined}
              onZoomIn={() => undefined}
              onZoomOut={() => undefined}
              canZoomIn={false}
              tilted
              onTiltChange={() => undefined}
              testID="states"
            />
          </View>
          <View style={{ position: 'absolute', top: 16, left: 16 }}>
            <MapControls
              align="start"
              onLocate={() => undefined}
              onZoomIn={() => undefined}
              onZoomOut={() => undefined}
              labels={{ group: 'Map controls, left' }}
            />
          </View>
        </MockMap>
      </Section>
      <Section title="The compass on its own, at four headings — it hides itself at north">
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          {[0, 45, 135, 270].map((heading) => (
            <View key={heading} style={{ alignItems: 'center', gap: 6, width: 72 }}>
              <View style={{ height: 44, justifyContent: 'center' }}>
                <MapCompass heading={heading} onPress={() => undefined} testID={`compass-${heading}`} />
              </View>
              <Text variant="caption-2-regular" style={{ opacity: 0.6 }}>
                {heading === 0 ? '0° — hidden' : `${heading}°`}
              </Text>
            </View>
          ))}
          <View style={{ alignItems: 'center', gap: 6, width: 72 }}>
            <View style={{ height: 44, justifyContent: 'center' }}>
              <MapCompass heading={0} hideAtNorth={false} onPress={() => undefined} />
            </View>
            <Text variant="caption-2-regular" style={{ opacity: 0.6 }}>
              0°, pinned
            </Text>
          </View>
        </View>
      </Section>
      <Section title="The layer picker on its own">
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <MapLayerPicker layers={LAYERS} layerId="satellite" overlays={OVERLAYS} activeOverlayIds={[]} />
          <MapLayerPicker layers={LAYERS} layerId="standard" disabled />
        </View>
      </Section>
    </Page>
  ),
};
