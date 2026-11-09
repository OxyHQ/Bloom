import { useState } from 'react';
import { View } from 'react-native';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';
import { ComposerLoader } from '@oxy.so/bloom/composer-loader';
import { ComposerPill } from '@oxy.so/bloom/composer-panel';
import { AgentChatComposer } from '@oxy.so/bloom/agent-chat';
import { AliaComposer } from './node_modules/@alia.onl/sdk/src/components/AliaComposer';
import { OxyProvider } from '@oxy.so/services/ui/client';

/** Real packaged owners with synthetic state; no chat service or copied input. */
export function ComposerCases({ onToggleMode }: { onToggleMode: () => void }) {
  const [pill, setPill] = useState('Draft retained through resize');
  const [agent, setAgent] = useState('Agent draft retained through resize');
  const [alia, setAlia] = useState('Alia draft retained through resize');
  const [busy, setBusy] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [stops, setStops] = useState(0);
  const [submits, setSubmits] = useState(0);
  const [pending, setPending] = useState('none');
  const stop = () => {
    setStops((value) => value + 1);
    setBusy(false);
  };
  const submit = () => {
    setSubmits((value) => value + 1);
    setBusy(true);
  };
  const later = (name: string, action: () => void) => {
    setPending(name);
    setTimeout(() => {
      action();
      setPending('none');
    }, 4000);
  };
  return (
    <AppShell scroll="page" header={null}>
      <Screen testID="composer-cases-screen">
        <ScreenScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="title-3-semibold">Packaged composer cases</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button
              testID="cases-resize"
              onPress={() => later('resize', () => setNarrow((value) => !value))}
            >
              Resize in 4s
            </Button>
            <Button
              testID="cases-busy"
              onPress={() => later('busy', () => setBusy((value) => !value))}
            >
              Busy in 4s
            </Button>
            <Button testID="cases-theme" onPress={onToggleMode}>
              Theme
            </Button>
          </View>
          <Text testID="cases-state">{`busy=${busy} narrow=${narrow} stops=${stops} submits=${submits} pending=${pending}`}</Text>
          <View style={{ width: narrow ? 260 : '100%', gap: 24 }}>
            <View style={{ gap: 8 }}>
              <Text variant="body-2-medium">Standalone ComposerLoader</Text>
              <ComposerLoader active={busy} taper={0.5} testID="cases-isolated-loader">
                <View
                  testID="cases-isolated-loader-content"
                  style={{ height: 68, borderRadius: 24 }}
                />
              </ComposerLoader>
            </View>
            <ComposerLoader active={busy} taper={0.5} testID="cases-pill-loader">
              <ComposerPill
                value={pill}
                onValueChange={setPill}
                onSubmit={submit}
                onStop={stop}
                busy={busy}
                surface={false}
                frosted={busy}
                addMenu={[]}
                effortLevels={[]}
                showVoice={false}
                testID="cases-pill"
              />
            </ComposerLoader>
            <AgentChatComposer
              value={agent}
              onValueChange={setAgent}
              onSubmit={submit}
              onStop={stop}
              busy={busy}
              provider="Offline fixture"
              testID="cases-agent"
              composerProps={{ showVoice: false, addMenu: [], effortLevels: [] }}
            />
            <OxyProvider baseURL="https://example.invalid" clientId="offline-fixture">
              <AliaComposer
                value={alia}
                onValueChange={setAlia}
                onSubmit={submit}
                onStop={stop}
                busy={busy}
                disableKeyboardAvoidance
                onError={() => {}}
              />
            </OxyProvider>
          </View>
          <Text testID="cases-drafts">{JSON.stringify({ pill, agent })}</Text>
        </ScreenScrollView>
      </Screen>
    </AppShell>
  );
}
