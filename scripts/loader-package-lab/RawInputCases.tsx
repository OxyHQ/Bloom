import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';

/** RN control: same draft, width, field typography and autosize; no pill or loader. */
export function RawInputCases({ autosize = true }: { autosize?: boolean }) {
  const [text, setText] = useState('Draft retained through resize');
  const [height, setHeight] = useState(20);
  const [narrow, setNarrow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState('none');
  const [selection, setSelection] = useState<{ start: number; end: number }>();
  const later = (kind: string, change: () => void) => {
    setPending(kind);
    setTimeout(() => {
      change();
      setPending('none');
    }, 4000);
  };
  const fieldHeight = autosize ? Math.min(8, Math.max(1, Math.ceil(height / 20))) * 20 : 80;
  return (
    <AppShell scroll="page" header={null}>
      <Screen>
        <ScreenScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 24 }}>Direct RN TextInput control</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable
              testID="cases-resize"
              onPress={() => later('resize', () => setNarrow((v) => !v))}
              style={{ padding: 16 }}
            >
              <Text>Resize in 4s</Text>
            </Pressable>
            <Pressable
              testID="cases-busy"
              onPress={() => later('busy', () => setBusy((v) => !v))}
              style={{ padding: 16 }}
            >
              <Text>Busy in 4s</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['forward', 4, 10],
              ['backward', 10, 4],
              ['collapsed', 7, 7],
            ].map(([name, start, end]) => (
              <Pressable
                key={name}
                testID={`cases-selection-${name}`}
                onPress={() =>
                  later(`selection-${name}`, () =>
                    setSelection({ start: Number(start), end: Number(end) }),
                  )
                }
                style={{ padding: 8 }}
              >
                <Text>{`Select ${name} in 4s`}</Text>
              </Pressable>
            ))}
          </View>
          <Text testID="cases-state">{`busy=${busy} narrow=${narrow} pending=${pending} autosize=${autosize}`}</Text>
          <View
            style={{
              width: narrow ? 260 : '100%',
              minHeight: 52,
              padding: 8,
              gap: 10,
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: '#fff',
            }}
          >
            <View style={{ flex: 1, minWidth: 0, height: fieldHeight }}>
              <TextInput
                testID="cases-pill-input"
                accessibilityLabel="Direct RN draft"
                value={text}
                selection={selection}
                onChangeText={setText}
                multiline
                onContentSizeChange={
                  autosize ? (event) => setHeight(event.nativeEvent.contentSize.height) : undefined
                }
                style={{
                  width: '100%',
                  height: fieldHeight,
                  padding: 0,
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 20,
                  fontWeight: '400',
                  fontFamily: 'Inter',
                  color: '#20102a',
                  backgroundColor: 'transparent',
                }}
              />
            </View>
            <View style={{ width: 32, height: 32 }} />
          </View>
        </ScreenScrollView>
      </Screen>
    </AppShell>
  );
}
