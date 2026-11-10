import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BloomProvider } from '@oxy.so/bloom/provider';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { View, Text } from 'react-native';
import { Workspace } from './workspace';
import { Canvas } from './canvas';
import { Conversation } from './conversation';
import '../style.css';

function Document() {
  const [value, setValue] = useState('Initial document');
  return (
    <View style={{ gap: 12, padding: 16 }}>
      <TextFieldInput label="Document draft" value={value} onValueChange={setValue} />
      {Array.from({ length: 24 }, (_, index) => (
        <Text key={index}>Document paragraph {index + 1}</Text>
      ))}
    </View>
  );
}

function Inspector() {
  const [value, setValue] = useState('Initial inspector');
  return <TextFieldInput label="Inspector note" value={value} onValueChange={setValue} />;
}

function MapCanvas() {
  return <View testID="map-canvas" style={{ flex: 1, minHeight: 240, backgroundColor: '#d7e9dc' }} />;
}

function App() {
  const [busy, setBusy] = useState(false);
  const task = new URLSearchParams(location.search).get('task') ?? 'workspace';
  return (
    <BloomProvider mode="light" locale="en">
      <View style={{ flex: 1, minHeight: 0 }}>
        {task === 'workspace' ? (
          <Workspace document={<Document />} inspector={<Inspector />} />
        ) : task === 'canvas' ? (
          <Canvas canvas={<MapCanvas />} />
        ) : (
          <Conversation busy={busy} onSubmit={() => setBusy(true)} onStop={() => setBusy(false)} />
        )}
      </View>
    </BloomProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
