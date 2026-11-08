import { useState } from 'react';
import { View } from 'react-native';
import { AliaComposer, type AliaAttachment } from '@alia.onl/sdk';
import { OxyProvider } from '@oxy.so/services/ui/client';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';

const OFFLINE = 'http://127.0.0.1:9';
const NOTE: AliaAttachment = {
  id: 'offline-note',
  uri: 'data:text/plain;base64,T2ZmbGluZSBmaXh0dXJl',
  type: 'document',
  name: 'Offline note.txt',
  size: 15,
  mimeType: 'text/plain',
};

/** Published Alia SDK owner and real Oxy provider; no account, model or transport calls. */
export function AliaCases() {
  const [draft, setDraft] = useState('Alia draft retained through resize');
  const [busy, setBusy] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [attachments, setAttachments] = useState<AliaAttachment[]>([]);
  const [pending, setPending] = useState('none');
  const [stops, setStops] = useState(0);
  const [submits, setSubmits] = useState(0);
  const [error, setError] = useState('none');
  const later = (name: string, action: () => void) => {
    setPending(name);
    setTimeout(() => {
      action();
      setPending('none');
    }, 4000);
  };
  return (
    <OxyProvider
      baseURL={OFFLINE}
      authWebUrl={OFFLINE}
      authorizeBaseUrl={OFFLINE}
      storageKeyPrefix="bloom-663-alia-offline"
      requireAuth="off"
      backgroundSession={false}
      accountQueries={{ roots: [], memoryOnlyRoots: 'all' }}
    >
      <AppShell scroll="page" header={null}>
        <Screen>
          <ScreenScrollView
            contentContainerStyle={{ padding: 16, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="title-3-semibold">Published AliaComposer · offline</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button
                testID="alia-resize"
                onPress={() => later('resize', () => setNarrow((v) => !v))}
              >
                Resize in 4s
              </Button>
              <Button testID="alia-busy" onPress={() => later('busy', () => setBusy((v) => !v))}>
                Busy in 4s
              </Button>
              <Button
                testID="alia-attachment"
                onPress={() => setAttachments((v) => (v.length ? [] : [NOTE]))}
              >
                Offline attachment
              </Button>
            </View>
            <Text testID="alia-state">{`busy=${busy} narrow=${narrow} stops=${stops} submits=${submits} pending=${pending} error=${error}`}</Text>
            <View testID="alia-owner" style={{ width: narrow ? 260 : '100%' }}>
              <AliaComposer
                value={draft}
                onValueChange={setDraft}
                busy={busy}
                onSubmit={() => {
                  setSubmits((v) => v + 1);
                  setBusy(true);
                }}
                onStop={() => {
                  setStops((v) => v + 1);
                  setBusy(false);
                }}
                onError={setError}
                apiUrl={OFFLINE}
                disableKeyboardAvoidance
                attachments={attachments}
                onAddAttachment={(a) => setAttachments((v) => [...v, a])}
                onRemoveAttachment={(id) => setAttachments((v) => v.filter((a) => a.id !== id))}
              />
            </View>
            <Text testID="alia-draft">{draft}</Text>
          </ScreenScrollView>
        </Screen>
      </AppShell>
    </OxyProvider>
  );
}
