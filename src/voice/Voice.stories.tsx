import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { AudioWaveVisualizer, VoiceControls, VoiceOverlay, type VoiceState } from './index';

const meta: Meta<typeof AudioWaveVisualizer> = {
  id: 'agents-voice',
  title: 'Components/Media/Voice',
  component: AudioWaveVisualizer,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'support', 'danger'] },
    bars: { control: 'number' },
    active: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AudioWaveVisualizer>;

/** A speech-like envelope: a few overlapping sines, 0–1, one value per band. */
function frame(time: number, bands: number): number[] {
  return Array.from({ length: bands }, (_, band) => {
    const slow = Math.sin(time / 380 + band * 0.55) * 0.5 + 0.5;
    const fast = Math.sin(time / 130 + band * 1.7) * 0.5 + 0.5;
    return Math.min(1, slow * 0.7 * fast + 0.12);
  });
}

/** A meter writing into a shared value ten times a second: no React render per frame. */
function useMeter(bands = 32) {
  const levels = useSharedValue<readonly number[]>(frame(0, bands));
  useEffect(() => {
    const timer = setInterval(() => {
      levels.value = frame(Date.now(), bands);
    }, 100);
    return () => clearInterval(timer);
  }, [bands, levels]);
  return levels;
}

export const Wave: Story = {
  args: { size: 'md', tone: 'neutral', bars: 24, active: true },
  render: (args) => {
    const levels = useMeter();
    return <AudioWaveVisualizer {...args} levels={levels} />;
  },
};

export const FromState: Story = {
  render: () => {
    const [levels, setLevels] = useState<number[]>(frame(0, 12));
    useEffect(() => {
      const timer = setInterval(() => setLevels(frame(Date.now(), 12)), 120);
      return () => clearInterval(timer);
    }, []);
    return <AudioWaveVisualizer levels={levels} bars={12} tone="accent" />;
  },
};

export const Sizes: Story = {
  render: () => {
    const levels = useMeter();
    return (
      <View style={{ gap: 24 }}>
        <AudioWaveVisualizer levels={levels} size="sm" />
        <AudioWaveVisualizer levels={levels} size="md" />
        <AudioWaveVisualizer levels={levels} size="lg" />
        <AudioWaveVisualizer levels={levels} size="md" active={false} />
      </View>
    );
  },
};

export const Controls: Story = {
  render: () => {
    const [muted, setMuted] = useState(false);
    const [paused, setPaused] = useState(false);
    return (
      <View style={{ gap: 16 }}>
        <VoiceControls
          muted={muted}
          onMutedChange={setMuted}
          paused={paused}
          onPausedChange={setPaused}
          onTypeInstead={() => {}}
          onEnd={() => {}}
        />
        <VoiceControls state="idle" onMutedChange={() => {}} onEnd={() => {}} size="sm" />
      </View>
    );
  },
};

const SCRIPT: { state: VoiceState; transcript: string }[] = [
  { state: 'listening', transcript: 'Can you move my meeting with Marta to Thursday' },
  {
    state: 'transcribing',
    transcript: 'Can you move my meeting with Marta to Thursday afternoon?',
  },
  { state: 'thinking', transcript: 'Can you move my meeting with Marta to Thursday afternoon?' },
  { state: 'speaking', transcript: 'Done. Your meeting with Marta is now on Thursday at 3 pm.' },
];

export const Overlay: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(false);
    const [step, setStep] = useState(0);
    const levels = useMeter();
    useEffect(() => {
      if (!open) return;
      setStep(0);
      const timer = setInterval(() => setStep((s) => (s + 1) % SCRIPT.length), 3000);
      return () => clearInterval(timer);
    }, [open]);
    const { state, transcript } = SCRIPT[step]!;
    return (
      <>
        <Button onPress={() => setOpen(true)}>Start voice mode</Button>
        <VoiceOverlay
          open={open}
          onOpenChange={setOpen}
          state={state}
          transcript={transcript}
          levels={levels}
          muted={muted}
          onMutedChange={setMuted}
          onTypeInstead={() => setOpen(false)}
          onEnd={() => setOpen(false)}
        />
      </>
    );
  },
};

export const ErrorState: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Show error</Button>
        <VoiceOverlay
          open={open}
          onOpenChange={setOpen}
          state="error"
          error="The microphone is unavailable"
          levels={[]}
          onEnd={() => setOpen(false)}
        />
      </>
    );
  },
};
