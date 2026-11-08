import '../style.css';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { BloomProvider } from '@oxy.so/bloom/provider';
import { Button } from '@oxy.so/bloom/button';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <BloomProvider mode="light" locale="en">
      <View style={{ flex: 1, minHeight: 0 }}>
        <AppShell header={null} scroll="fixed">
          {/* 17.23.0: non-panel fixed shells need the explicit Screen override.
              Remove when the shared host-inference correction is published. */}
          <Screen documentScroll={false}>
            <ScreenScrollView>
              <div data-testid="utilities" className="flex flex-row gap-4 p-4">
                <Button onPress={() => setCount((value) => value + 1)}>Continue</Button>
                <Text testID="utility-text" className="text-2xl p-4">{`Count ${count}`}</Text>
              </div>
              <View style={{ height: 1600 }}>
                <Text>Scroll this screen</Text>
              </View>
            </ScreenScrollView>
          </Screen>
        </AppShell>
      </View>
    </BloomProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
