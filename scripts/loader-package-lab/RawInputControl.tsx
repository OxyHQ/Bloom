import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

/** Direct RN control for separating native TextInput layout behavior from Bloom. */
export function RawInputControl({ autoSize = false }: { autoSize?: boolean }) {
  const [narrow, setNarrow] = useState(false);
  const [value, setValue] = useState('Draft retained through resize');
  const [contentHeight, setContentHeight] = useState(20);
  return (
    <View style={{ flex: 1, padding: 24, gap: 24, backgroundColor: '#f8eef5' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#321c35' }}>
        {autoSize ? 'Direct React Native autosize control' : 'Direct React Native input control'}
      </Text>
      <Pressable
        testID="raw-resize"
        accessibilityRole="button"
        onPress={() => setNarrow((current) => !current)}
        style={{ alignSelf: 'flex-start', padding: 16, backgroundColor: '#8c28a8' }}
      >
        <Text style={{ color: 'white', fontSize: 18 }}>Toggle width</Text>
      </Pressable>
      <Text testID="raw-state" style={{ fontSize: 18, color: '#321c35' }}>
        narrow={String(narrow)}
      </Text>
      <View style={{ width: autoSize ? (narrow ? 155 : 250) : narrow ? 260 : '100%' }}>
        <TextInput
          testID="raw-input"
          accessibilityLabel="Direct React Native input"
          value={value}
          onChangeText={setValue}
          onKeyPress={autoSize ? () => undefined : undefined}
          multiline
          onContentSizeChange={
            autoSize ? (event) => setContentHeight(event.nativeEvent.contentSize.height) : undefined
          }
          style={{
            width: '100%',
            ...(autoSize ? { height: contentHeight, padding: 0 } : { minHeight: 56, padding: 12 }),
            color: '#321c35',
            backgroundColor: 'white',
          }}
        />
      </View>
    </View>
  );
}
