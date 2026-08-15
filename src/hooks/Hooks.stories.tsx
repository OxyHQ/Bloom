import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  useDelayedLoading,
  useGutters,
  useInteractionState,
  useInteractionStates,
  useThrottledValue,
} from './index';
import { Text } from '../typography';
import { Button } from '../button';
import { Card } from '../card';
import { Loading } from '../loading';
import { useTheme } from '../theme';

const meta: Meta = {
  title: 'Foundations/Hooks',
};

export default meta;

type Story = StoryObj;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 10, width: 420 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {children}
    </Card>
  );
}

/**
 * `useInteractionState` is press/hover state as a plain boolean plus the two
 * handlers to wire it up.
 *
 * Bloom reaches for this instead of `Pressable`'s function-form `style`, which
 * NativeWind's css-interop swallows — taking the base container style
 * (background, radius, border, shadow) with it. That failure is silent and
 * total: the component renders unstyled and nothing errors.
 */
export const InteractionState: Story = {
  render: function InteractionStateStory() {
    const { colors } = useTheme();
    const { state: pressed, onIn, onOut } = useInteractionState();
    const { hovered, focused, hoverHandlers, focusHandlers } = useInteractionStates();

    return (
      <View style={{ gap: 16 }}>
        <Panel title="useInteractionState — one boolean">
          <Pressable
            onPressIn={onIn}
            onPressOut={onOut}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: pressed ? colors.primarySubtle : colors.backgroundSecondary,
            }}
          >
            <Text>{pressed ? 'pressed' : 'press and hold me'}</Text>
          </Pressable>
        </Panel>

        <Panel title="useInteractionStates — three states, three handler objects">
          {/*
            The handlers come back GROUPED rather than as one bag, so a control
            can take only the ones it wants — a row that highlights on hover but
            has no focus ring spreads `hoverHandlers` alone.
          */}
          <Pressable
            {...hoverHandlers}
            {...focusHandlers}
            style={{ padding: 16, borderRadius: 12, backgroundColor: colors.backgroundSecondary }}
          >
            <Text>
              hovered: {String(hovered)} · focused: {String(focused)}
            </Text>
          </Pressable>
        </Panel>
      </View>
    );
  },
};

/**
 * `useDelayedLoading(delay)` is true for `delay` and then false. It takes the
 * DELAY, not a loading flag.
 *
 * Use it to guarantee a minimum on-screen time. A spinner that appears for 80ms
 * and vanishes is worse than no spinner: the flash reads as a glitch, and the
 * user cannot tell whether anything happened.
 */
export const DelayedLoading: Story = {
  render: function DelayedLoadingStory() {
    const [run, setRun] = useState(0);
    return (
      <Panel title="useDelayedLoading — a floor on how briefly a spinner can appear">
        <Button onPress={() => setRun((n) => n + 1)}>Run again</Button>
        <Settling key={run} />
      </Panel>
    );
  },
};

function Settling() {
  const settling = useDelayedLoading(1200);
  return settling ? <Loading text="Working…" /> : <Text>Done — the spinner held for 1200ms.</Text>;
}

/**
 * `useThrottledValue` lets a continuously-changing value through at most once
 * per interval. For anything that re-renders an expensive tree from a drag, a
 * scroll offset or a typed query.
 */
export const ThrottledValue: Story = {
  render: function ThrottledValueStory() {
    const [value, setValue] = useState(0);
    const throttled = useThrottledValue(value, 500);
    return (
      <Panel title="useThrottledValue — 500ms">
        <Button onPress={() => setValue((n) => n + 1)}>Increment fast</Button>
        <Text>live: {value}</Text>
        <Text>throttled: {throttled}</Text>
      </Panel>
    );
  },
};

/**
 * `useGutters` resolves the screen's padding for the CURRENT viewport tier, so
 * a header and the content below it cannot disagree about where the margin is.
 *
 * Resize the preview: the numbers step up at the breakpoints rather than
 * scaling continuously.
 */
export const Gutters: Story = {
  render: function GuttersStory() {
    const { colors } = useTheme();
    const gutters = useGutters(['base']);
    const wide = useGutters(['wide']);
    return (
      <View style={{ gap: 16, width: 420 }}>
        <Panel title="useGutters(['base'])">
          <View style={{ ...gutters, backgroundColor: colors.primarySubtle, borderRadius: 8 }}>
            <Text>paddingLeft {gutters.paddingLeft} · paddingTop {gutters.paddingTop}</Text>
          </View>
        </Panel>
        <Panel title="useGutters(['wide'])">
          <View style={{ ...wide, backgroundColor: colors.primarySubtle, borderRadius: 8 }}>
            <Text>paddingLeft {wide.paddingLeft} · paddingTop {wide.paddingTop}</Text>
          </View>
        </Panel>
      </View>
    );
  },
};
