import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { WizardFooter } from './WizardFooter';
import { WizardProgress } from './WizardProgress';
import type { WizardStep } from './types';

const meta: Meta = {
  title: 'Base/Wizard',
};

export default meta;

type Story = StoryObj;

const STEPS: WizardStep[] = [
  { title: 'Property type', description: 'Which of these best describes your home?' },
  { title: 'Address', description: 'Only people you confirm see the exact address.' },
  { title: 'The basics', description: 'Rooms, beds and floor area.' },
  { title: 'How is it offered?', description: 'Pick every way you would like to offer it.' },
  { title: 'Photos', description: 'Add at least five. Drag to change the order.' },
  { title: 'Description' },
  { title: 'Quality check' },
  { title: 'Publish' },
];

function Frame({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', maxWidth: width, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

/** Stepping through the flow: the bar, the count and the title follow `current`. */
export const Playground: Story = {
  render: function PlaygroundStory() {
    const [current, setCurrent] = useState(2);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const last = current === STEPS.length - 1;
    return (
      <View style={{ width: '100%', gap: 32 }}>
        {[720, 375].map((width) => (
          <Frame key={width} width={width}>
            <View style={{ paddingTop: 24, paddingLeft: width < 480 ? 16 : 24, paddingRight: width < 480 ? 16 : 24, paddingBottom: 24 }}>
              <WizardProgress
                steps={STEPS}
                current={current}
                action={<Button variant="secondary" size="small">Save and exit</Button>}
                testID={`progress-${width}`}
              />
              <View style={{ height: 160, justifyContent: 'center' }}>
                <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
                  Step content
                </Text>
              </View>
            </View>
            <WizardFooter
              onBack={current > 0 ? () => setCurrent((c) => c - 1) : undefined}
              onNext={() => {
                if (last) {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1500);
                  return;
                }
                setCurrent((c) => c + 1);
              }}
              nextLabel={last ? 'Publish' : 'Next'}
              loading={loading}
              status="Draft saved"
              testID={`footer-${width}`}
            />
          </Frame>
        ))}
      </View>
    );
  },
};

/** The bar at the first step, mid-flow with the current step partly done, and complete. */
export const ProgressStates: Story = {
  render: () => (
    <View style={{ width: '100%', maxWidth: 560, gap: 40 }}>
      <WizardProgress steps={STEPS} current={0} currentProgress={0} testID="first" />
      <WizardProgress steps={STEPS} current={4} currentProgress={0.3} testID="middle" />
      <WizardProgress steps={STEPS} current={7} currentProgress={1} hideTitle testID="done" />
    </View>
  ),
};

/** The footer's states: first step (no Back), disabled Next, loading, and the last step. */
export const FooterStates: Story = {
  render: () => (
    <View style={{ width: '100%', gap: 20 }}>
      {[
        { key: 'first', props: {} },
        { key: 'disabled', props: { onBack: () => undefined, nextDisabled: true } },
        { key: 'loading', props: { onBack: () => undefined, loading: true, nextLabel: 'Publish' } },
        { key: 'last', props: { onBack: () => undefined, nextLabel: 'Publish', status: 'Everything looks good' } },
      ].map(({ key, props }) => (
        <Frame key={key} width={560}>
          <WizardFooter onNext={() => undefined} sticky={false} {...props} testID={`footer-${key}`} />
        </Frame>
      ))}
    </View>
  ),
};
