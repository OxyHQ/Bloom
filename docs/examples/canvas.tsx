import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { MapControls, MapLayerPicker } from '@oxy.so/bloom/map-controls';
import { Text } from '@oxy.so/bloom/typography';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen } from '@oxy.so/bloom/screen';

/** The application supplies a map/board engine with its own gestures. */
export function Canvas({ canvas }: { canvas: ReactNode }) {
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <Screen scroll="none" header={<PageHeader title="Explore" />}>
        <View style={{ flex: 1, minHeight: 0 }}>
          {canvas}
          <View style={{ position: 'absolute', top: 16, right: 16 }}>
            <MapTools />
          </View>
        </View>
      </Screen>
    </AppShell>
  );
}

const layers = [
  { id: 'standard', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
];

/** Synthetic engine state: replace callbacks with your map engine's commands. */
export function MapTools() {
  const [zoom, setZoom] = useState(12);
  const [following, setFollowing] = useState(false);
  const [heading, setHeading] = useState(35);
  const [tilted, setTilted] = useState(false);
  const [layer, setLayer] = useState('standard');
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
      <MapControls
        onLocate={() => setFollowing((value) => !value)}
        following={following}
        heading={heading}
        onResetNorth={() => setHeading(0)}
        onZoomIn={() => setZoom((value) => value + 1)}
        onZoomOut={() => setZoom((value) => value - 1)}
        tilted={tilted}
        onTiltChange={setTilted}
      >
        <MapLayerPicker layers={layers} layerId={layer} onLayerChange={setLayer} />
      </MapControls>
      <Text>{`Zoom ${zoom}; ${layer}; ${following ? 'following' : 'free'}; ${tilted ? 'tilted' : 'flat'}`}</Text>
    </View>
  );
}
