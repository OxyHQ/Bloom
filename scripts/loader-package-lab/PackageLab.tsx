import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BloomProvider } from '@oxy.so/bloom/provider';
import { PortalProvider, PortalOutlet } from '@oxy.so/bloom/portal';
import { SurfaceProvider } from '@oxy.so/bloom/surfaces';
import { LoaderBenchmark } from './LoaderBenchmark';
import { ComposerCases } from './ComposerCases';
import build from './build.json';

/** Negative probes run before the scene. Timeout never proves isolation.
 * The merged APK must independently pass the no-INTERNET-permission gate. */
async function assertNetworkDenied(): Promise<void> {
  const http = await fetch('https://example.com/bloom-offline-probe').then(
    () => false,
    () => true,
  );
  if (!http) throw new Error('ISOLATION FAILED: HTTP succeeded');
  const websocket = await new Promise<boolean>((resolve) => {
    const socket = new WebSocket('wss://example.com/bloom-offline-probe');
    const timeout = setTimeout(() => {
      socket.close();
      resolve(false);
    }, 8000);
    socket.onopen = () => {
      clearTimeout(timeout);
      socket.close();
      resolve(false);
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      resolve(true);
    };
  });
  if (!websocket) throw new Error('ISOLATION FAILED: WebSocket not denied');
}
export function PackageLab() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [isolation, setIsolation] = useState('Checking offline boundary');
  useEffect(() => {
    assertNetworkDenied().then(
      () => setIsolation('offline-verified'),
      (error) => setIsolation(String(error)),
    );
  }, []);
  if (isolation !== 'offline-verified')
    return (
      <View style={{ padding: 32 }}>
        <Text testID="isolation-status">{isolation}</Text>
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BloomProvider mode={mode} colorPreset="oxy" haptics={false}>
          <PortalProvider>
            <SurfaceProvider>
              {build.scene === 'composers' ? (
                <ComposerCases
                  onToggleMode={() => setMode((value) => (value === 'light' ? 'dark' : 'light'))}
                />
              ) : (
                <LoaderBenchmark
                  onToggleMode={() => setMode((value) => (value === 'light' ? 'dark' : 'light'))}
                  label={`${build.commit.slice(0, 12)} · ${Platform.OS} ${Platform.Version} · offline-verified`}
                />
              )}
              <PortalOutlet />
            </SurfaceProvider>
          </PortalProvider>
        </BloomProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
