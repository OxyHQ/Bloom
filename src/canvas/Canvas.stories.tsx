import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Text } from '../typography';
import { TextField, TextFieldInput } from '../text-field';
import { Canvas, CanvasBackground, CanvasPanel, useCanvasRegion } from './index';
import type { CanvasPanelSnap } from './types';

const meta: Meta<typeof Canvas> = { title: 'Components/Layout/Canvas', component: Canvas };
export default meta;
type Story = StoryObj<typeof Canvas>;
let nextScene = 0;
function Scene() {
  const [identity] = useState(() => ++nextScene);
  const [selection, setSelection] = useState(0);
  const region = useCanvasRegion();
  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text testID="scene-identity">
        Synthetic scene {identity} · selection {selection}
      </Text>
      <Button onPress={() => setSelection((v) => v + 1)}>Select object</Button>
      <Text testID="scene-region">
        {Math.round(region.viewport.width)} × {Math.round(region.viewport.height)}
      </Text>
    </View>
  );
}
function Contents() {
  const [value, setValue] = useState('Retained draft');
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <TextField>
        <TextFieldInput label="Retained draft" value={value} onChangeText={setValue} />
      </TextField>
      {Array.from({ length: 40 }, (_, i) => (
        <Text key={i}>Synthetic row {i + 1}</Text>
      ))}
    </View>
  );
}
/** Also mounted by the offline Android fixture; no map or location APIs. */
export function CanvasFixture() {
  const [narrow, setNarrow] = useState(false),
    [active, setActive] = useState(true);
  const [snap, setSnap] = useState<CanvasPanelSnap>('half');
  const [acceptance, setAcceptance] = useState<'accept' | 'reject' | 'delay'>('accept');
  const propose = (next: CanvasPanelSnap) => {
    if (acceptance === 'accept') setSnap(next);
    else if (acceptance === 'delay') setTimeout(() => setSnap(next), 500);
  };
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 }}>
        <Button onPress={() => setNarrow((v) => !v)}>Change room</Button>
        <Button onPress={() => setActive((v) => !v)}>Toggle active</Button>
        <Button onPress={() => setSnap('peek')}>Peek</Button>
        <Button onPress={() => setSnap('full')}>Full</Button>
        <Button
          onPress={() =>
            setAcceptance((v) => (v === 'accept' ? 'reject' : v === 'reject' ? 'delay' : 'accept'))
          }
        >
          Acceptance: {acceptance}
        </Button>
      </View>
      <View style={{ flex: 1, minHeight: 0, width: narrow ? 280 : '100%' }}>
        <Canvas active={active} testID="fixture-canvas">
          <CanvasBackground>
            <Scene />
          </CanvasBackground>
          <CanvasPanel
            side={{ from: 360, width: 180 }}
            snap={snap}
            onSnapChange={propose}
            accessibilityLabel="Synthetic panel"
            header={<Text style={{ padding: 16 }}>Persistent panel</Text>}
            testID="fixture-panel"
          >
            <Contents />
          </CanvasPanel>
        </Canvas>
      </View>
    </View>
  );
}
export const Persistent: Story = {
  render: () => (
    <View style={{ height: 700 }}>
      <CanvasFixture />
    </View>
  ),
};
