import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';
import { ComposerLoader } from '@oxy.so/bloom/composer-loader';
import type { ComposerLoaderPhase } from '@oxy.so/bloom/composer-loader';
import { ComposerPill } from '@oxy.so/bloom/composer-panel';
import { AgentChatComposer } from '@oxy.so/bloom/agent-chat';
import { AliaComposer } from './node_modules/@alia.onl/sdk/src/components/AliaComposer';
import { OxyProvider } from '@oxy.so/services/ui/client';

/** Real packaged owners with synthetic state; no chat service or copied input. */
export function ComposerCases({ onToggleMode }: { onToggleMode: () => void }) {
  const [multiline, setMultiline] = useState(false);
  const [pill, setPill] = useState('Draft retained through resize');
  const [agent, setAgent] = useState('Agent draft retained through resize');
  const [alia, setAlia] = useState('Alia draft retained through resize');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<ComposerLoaderPhase>('idle');
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [narrow, setNarrow] = useState(false);
  const [taper, setTaper] = useState(0);
  const [stops, setStops] = useState(0);
  const [submits, setSubmits] = useState(0);
  const [attached, setAttached] = useState(false);
  const [pending, setPending] = useState('none');
  const state = `busy=${busy} phase=${phase} narrow=${narrow} taper=${taper} multiline=${multiline} attached=${attached} stops=${stops} submits=${submits} pending=${pending}`;
  const cancelPhaseTimers = () => {
    for (const timer of phaseTimers.current) clearTimeout(timer);
    phaseTimers.current = [];
  };
  useEffect(
    () => () => {
      for (const timer of phaseTimers.current) clearTimeout(timer);
    },
    [],
  );
  const runTwoLaps = () => {
    cancelPhaseTimers();
    setPending('phase-sequence');
    const advance = (delay: number, action: () => void) => {
      phaseTimers.current.push(setTimeout(action, delay));
    };
    const lap = (start: number) => {
      advance(start, () => {
        setBusy(true);
        setPhase('submitting');
      });
      advance(start + 3000, () => setPhase('streaming'));
      advance(start + 8000, () => setPhase('stopping'));
      advance(start + 11000, () => {
        setPhase('complete');
        setBusy(false);
      });
    };
    lap(0);
    lap(13000);
    advance(26000, () => {
      setPhase('idle');
      setPending('none');
    });
  };
  const setDraftLength = (next: boolean) => {
    const drafts = next
      ? {
          pill: 'A longer draft wraps across lines as the loader tracks its height.',
          agent: 'An agent reply grows across lines while the active loader follows.',
          alia: 'An Alia message wraps across lines in the packaged composer.',
        }
      : {
          pill: 'Draft retained through resize',
          agent: 'Agent draft retained through resize',
          alia: 'Alia draft retained through resize',
        };
    setMultiline(next);
    setPill(drafts.pill);
    setAgent(drafts.agent);
    setAlia(drafts.alia);
  };
  const stop = () => {
    cancelPhaseTimers();
    setStops((value) => value + 1);
    setPhase('stopping');
    phaseTimers.current.push(
      setTimeout(() => {
        setPhase('complete');
        setBusy(false);
      }, 450),
    );
  };
  const submit = () => {
    cancelPhaseTimers();
    setSubmits((value) => value + 1);
    setBusy(true);
    setPhase('submitting');
    phaseTimers.current.push(setTimeout(() => setPhase('streaming'), 400));
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
              onPress={() =>
                later('busy', () => {
                  setBusy((value) => !value);
                  setPhase((value) => (value === 'idle' ? 'streaming' : 'idle'));
                })
              }
            >
              Busy in 4s
            </Button>
            <Button testID="cases-run-phases" onPress={runTwoLaps}>
              Run two laps
            </Button>
            <Button
              testID="cases-phase-error"
              onPress={() => {
                setBusy(false);
                setPhase('error');
              }}
            >
              Error phase
            </Button>
            <Button
              testID="cases-phase-reset"
              onPress={() => {
                cancelPhaseTimers();
                setBusy(false);
                setPhase('idle');
                setPending('none');
              }}
            >
              Reset phase
            </Button>
            <Button testID="cases-theme" onPress={onToggleMode}>
              Theme
            </Button>
            <Button
              testID="cases-rapid-phase"
              onPress={() => {
                cancelPhaseTimers();
                setBusy(true);
                setPhase('submitting');
                phaseTimers.current.push(setTimeout(() => setPhase('streaming'), 120));
                phaseTimers.current.push(
                  setTimeout(() => {
                    setPhase('stopping');
                    setBusy(false);
                  }, 240),
                );
                phaseTimers.current.push(setTimeout(() => setPhase('idle'), 360));
              }}
            >
              Rapid phases
            </Button>
            <Button
              testID="cases-attachment"
              onPress={() => setAttached((value) => !value)}
            >
              {attached ? 'Remove fixture attachment' : 'Attach fixture file'}
            </Button>
            <Button
              testID="cases-taper"
              onPress={() => setTaper((value) => (value === 0 ? 0.5 : 0))}
            >
              {taper === 0 ? 'No taper' : 'Taper'}
            </Button>
            <Button testID="cases-content" onPress={() => setDraftLength(!multiline)}>
              {multiline ? 'Short draft' : 'Multiline draft'}
            </Button>
          </View>
          <Text testID="cases-state">{state}</Text>
          <View style={{ width: narrow ? 260 : '100%', gap: 24 }}>
            <View style={{ gap: 8 }}>
              <Text variant="body-2-medium">Standalone ComposerLoader</Text>
              <ComposerLoader phase={phase} taper={taper} testID="cases-isolated-loader">
                <View
                  testID="cases-isolated-loader-content"
                  style={{ height: 68, borderRadius: 24 }}
                />
              </ComposerLoader>
            </View>
            <ComposerLoader phase={phase} taper={taper} testID="cases-pill-loader">
              <ComposerPill
                value={pill}
                onValueChange={setPill}
                onSubmit={submit}
                onStop={stop}
                busy={busy}
                surface={false}
                frosted={busy}
                addMenu={[
                  {
                    label: 'Add',
                    rows: [{ id: 'fixture-file', label: 'Fixture document' }],
                  },
                ]}
                onAddMenuSelect={() => setAttached(true)}
                attachments={
                  attached
                    ? [{ id: 'fixture-document', name: 'fixture.txt', kind: 'document' }]
                    : []
                }
                onRemoveAttachment={() => setAttached(false)}
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
              phase={phase}
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
