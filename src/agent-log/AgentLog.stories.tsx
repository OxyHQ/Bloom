import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  AgentLogGuideBridge,
  AgentLogReveal,
  AgentLogRow,
  AgentLogShimmerText,
  AgentLogWorkingRow,
  useAgentLogMotion,
  useAgentLogRevealTicker,
} from './index';

const meta: Meta = {
  title: 'Blocks/Agent Log',
};

export default meta;

type Story = StoryObj;

/** Paints the theme background, so the dark globals read as a dark page. */
function Frame({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ padding: 40, width: 480, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

/** Demo data: the steps a coding agent narrates. */
const STEPS = [
  'Reading the project structure',
  'Found 3 components using the legacy theme API',
  'Updating Button, Chip and Badge to resolved tokens',
  'Running the type checker',
  'All checks passed',
];

const NESTED = ['packages/ui/src/button.tsx', 'packages/ui/src/chip.tsx'];

function StepText({ label, active }: { label: string; active: boolean }) {
  // The step text: `py-1 text-body-regular text-text-secondary`.
  const secondary = resolveButtonRamps(useTheme()).neutral[500];
  return (
    <Text variant="body-regular" style={{ paddingTop: 4, paddingBottom: 4, color: secondary }}>
      {active ? <AgentLogShimmerText>{label}</AgentLogShimmerText> : label}
    </Text>
  );
}

function Transcript({ reduce: forceReduce }: { reduce?: boolean }) {
  const systemReduce = useAgentLogMotion();
  const reduce = forceReduce ?? systemReduce;
  const revealed = useAgentLogRevealTicker({
    total: STEPS.length,
    revealed: reduce ? STEPS.length : undefined,
  });
  const busy = revealed < STEPS.length;
  const shown = STEPS.slice(0, revealed);

  return (
    <View>
      <View role="list">
        {shown.map((label, index) => (
          <AgentLogRow
            key={label}
            first={index === 0}
            last={index === shown.length - 1}
            reduce={reduce}
          >
            <StepText label={label} active={busy && index === revealed - 1} />
            {index === 1 ? (
              <View style={{ position: 'relative', marginTop: 2 }}>
                <AgentLogGuideBridge height={6} offset={8} reduce={reduce} />
                <View role="list" style={{ marginLeft: 8 }}>
                  {NESTED.map((file, i) => (
                    <AgentLogRow
                      key={file}
                      first={false}
                      last={i === NESTED.length - 1}
                      reduce={reduce}
                    >
                      <StepText label={file} active={false} />
                    </AgentLogRow>
                  ))}
                </View>
              </View>
            ) : null}
          </AgentLogRow>
        ))}
      </View>
      {busy ? <AgentLogWorkingRow label="Working" reduce={reduce} /> : null}
    </View>
  );
}

/** A realistic streaming transcript: units arrive on the ticker, the guide draws alongside. */
export const Streaming: Story = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <Frame>
        <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
          <Button variant="secondary" size="small" onPress={() => setRun((n) => n + 1)}>
            Replay
          </Button>
        </View>
        <Transcript key={run} />
      </Frame>
    );
  },
};

/** The settled transcript (reduced motion): every row, guide fully drawn, nested bridge. */
export const Settled: Story = {
  render: () => (
    <Frame testID="settled">
      <Transcript reduce />
    </Frame>
  ),
};

/** The pieces on their own: a working row, the shimmer, and a bare reveal. */
export const Pieces: Story = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <Frame>
        <View style={{ gap: 12, alignItems: 'flex-start' }}>
          <Button variant="secondary" size="small" onPress={() => setRun((n) => n + 1)}>
            Replay reveal
          </Button>
          <AgentLogReveal key={run}>
            <Text variant="body-regular">A unit blurring in as it lands.</Text>
          </AgentLogReveal>
          <Text variant="body-regular">
            <AgentLogShimmerText>Searching the web for "reanimated 4 web"</AgentLogShimmerText>
          </Text>
          <AgentLogWorkingRow label="Searching" />
        </View>
      </Frame>
    );
  },
};
