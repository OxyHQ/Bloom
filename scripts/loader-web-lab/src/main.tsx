import '../style.css';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { View } from 'react-native';
import { BloomProvider } from '@oxy.so/bloom/provider';
import { ComposerLoader } from '@oxy.so/bloom/composer-loader';
import type { ComposerLoaderPhase } from '@oxy.so/bloom/composer-loader';
import { ComposerPill } from '@oxy.so/bloom/composer-panel';
import { AgentChatComposer } from '@oxy.so/bloom/agent-chat';
import { Screen } from '@oxy.so/bloom/screen';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [phase, setPhase] = useState<ComposerLoaderPhase>('streaming');
  const [narrow, setNarrow] = useState(false);
  const [retained, setRetained] = useState(false);
  const [attachment, setAttachment] = useState(false);
  const [pill, setPill] = useState('Synthetic draft retained through transitions');
  const [agent, setAgent] = useState('Synthetic agent draft retained through transitions');
  const [stops, setStops] = useState(0);
  const busy = phase === 'streaming' || phase === 'submitting';
  const stop = () => {
    setStops((n) => n + 1);
    setPhase('stopping');
  };
  const attachments = attachment
    ? [{ id: 'offline', name: 'Synthetic.txt', kind: 'document' as const }]
    : [];
  // Diagnostic controls are outside the composition under test. Preventing their
  // pointer-down default lets a test change props without moving input focus.
  return (
    <BloomProvider mode={mode} locale="en">
      <main
        style={{
          padding: 32,
          minHeight: '100vh',
          background: mode === 'light' ? '#fff' : '#161618',
        }}
      >
        <nav
          aria-label="Fixture controls"
          onMouseDown={(e) => e.preventDefault()}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}
        >
          <button type="button" onClick={() => setMode((v) => (v === 'light' ? 'dark' : 'light'))}>
            Theme
          </button>
          <button type="button" onClick={() => setNarrow((v) => !v)}>
            Width
          </button>
          <button type="button" onClick={() => setRetained((v) => !v)}>
            Retain
          </button>
          <button type="button" onClick={() => setAttachment((v) => !v)}>
            Attachment
          </button>
          {(['idle', 'submitting', 'streaming', 'stopping', 'error', 'complete'] as const).map(
            (p) => (
              <button type="button" key={p} onClick={() => setPhase(p)}>
                {p}
              </button>
            ),
          )}
        </nav>
        <output data-testid="state">
          {JSON.stringify({ mode, phase, narrow, retained, attachment, stops })}
        </output>
        <div style={{ width: narrow ? 300 : 620, maxWidth: '100%', marginTop: 24 }}>
          <Screen active={!retained} scroll="none">
            <View style={{ gap: 40 }}>
              <ComposerLoader phase={phase} testID="isolated">
                <View style={{ height: 52 }} />
              </ComposerLoader>
              <ComposerLoader phase={phase} taper={0.5} radius={16} testID="tall">
                <View style={{ height: 160 }} />
              </ComposerLoader>
              <ComposerLoader phase={phase} testID="pill-loader">
                <ComposerPill
                  value={pill}
                  onValueChange={setPill}
                  busy={busy}
                  onStop={stop}
                  onSubmit={() => setPhase('submitting')}
                  attachments={attachments}
                  onRemoveAttachment={() => setAttachment(false)}
                  addMenu={[]}
                  models={[]}
                  effortLevels={[]}
                  showVoice={false}
                  testID="pill"
                />
              </ComposerLoader>
              <AgentChatComposer
                value={agent}
                onValueChange={setAgent}
                phase={phase}
                busy={busy}
                onStop={stop}
                onSubmit={() => setPhase('submitting')}
                testID="agent"
              />
            </View>
          </Screen>
        </div>
      </main>
    </BloomProvider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
