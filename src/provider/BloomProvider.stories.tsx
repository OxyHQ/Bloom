import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Card } from '../card';
import { ErrorBoundary } from '../error-boundary';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { useMinimizeState } from '../tab-bar/context';
import { useScrollRestorationContext } from '../scroll/context';
import { BloomProvider } from './index';
import type { ImageResolver } from '../image-resolver';

/**
 * `BloomProvider` renders no UI at all — it is a composition of the app-wide
 * contexts, and what it prevents is a provider landing at the WRONG DEPTH. So
 * the story is the composition itself, shown twice: everything mounted, and the
 * same probes with the provider taken away.
 *
 * The two failures it exists to prevent are not equally visible, and the
 * stories are arranged to make that the point:
 *
 *   - `useScrollRestoration()` THROWS outside its provider — loud, immediate,
 *     and it takes the screen with it;
 *   - `useMinimizeState()` hands every caller a PRIVATE fallback instead —
 *     silent, and the only symptom is a tab bar that never minimizes.
 *
 * Storybook's own decorator mounts `BloomThemeProvider`, so the theme keeps
 * working in the "without" story. That is a limit of this harness, not of the
 * claim: an app with no Bloom root at all loses the theme too.
 */
const meta: Meta = {
  title: 'Foundations/BloomProvider',
};

export default meta;

type Story = StoryObj;

/** Stands in for `oxyServices.getFileDownloadUrl` — see the ImageResolver story. */
const resolver: ImageResolver = (id, variant) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>` +
      `<rect width='96' height='96' fill='hsl(210 70% 55%)'/>` +
      `<text x='48' y='54' font-size='12' fill='white' text-anchor='middle'>${variant ?? '—'}</text>` +
      `</svg>`,
  )}`;

function Probe({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 14, gap: 8, width: 230 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {children}
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{note}</Text>
    </Card>
  );
}

/** Reads the image resolver: a bare file id only resolves under the provider. */
function ResolverProbe() {
  return (
    <Probe title="ImageResolver" note="A bare file id — resolved, or a placeholder letter.">
      <Avatar source="file_abc123" name="Ada Lovelace" size={56} />
    </Probe>
  );
}

/** Reads the theme, which is the one context this harness also supplies itself. */
function ThemeProbe() {
  const { colors } = useTheme();
  return (
    <Probe title="Theme" note="Storybook mounts a theme provider too, so this survives either way.">
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[colors.primary, colors.success, colors.warning].map((color) => (
          <View key={color} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color }} />
        ))}
      </View>
    </Probe>
  );
}

/**
 * Reads the scroll context the provider mounts. The public
 * `useScrollRestoration()` hook calls this first — and then the router adapter,
 * which needs a real navigator, so the context read is as far as a Storybook
 * page can go. It is the read that throws.
 */
function ScrollProbe() {
  useScrollRestorationContext();
  return (
    <Probe title="Scroll restoration" note="Provided. Outside the provider this line throws.">
      <Text style={{ fontSize: 22 }}>✓</Text>
    </Probe>
  );
}

/**
 * The silent one. `MinimizeDriver` and `MinimizeReadout` are SIBLINGS: under the
 * provider they share one shared value, so pressing the button moves the bar.
 * Outside it each gets its own private fallback and the bar never moves —
 * with nothing in the console to say so.
 */
function MinimizeDriver() {
  const state = useMinimizeState();
  return (
    <Button
      onPress={() => {
        const next = state.target.value === 1 ? 0 : 1;
        state.target.value = next;
        state.progress.value = withSpring(next);
      }}
    >
      Toggle minimize
    </Button>
  );
}

function MinimizeReadout() {
  const { progress } = useMinimizeState();
  const { colors } = useTheme();
  // `progress` is listed as a dependency deliberately: without the worklets
  // babel plugin — which is what every Oxy web app ships — a mapper re-runs on
  // its DEPS, not on the shared values it reads.
  const style = useAnimatedStyle(() => ({ width: 40 + progress.value * 140 }), [progress]);
  return (
    <Animated.View
      style={[{ height: 14, borderRadius: 7, backgroundColor: colors.primary }, style]}
    />
  );
}

function MinimizePair({ note }: { note: string }) {
  return (
    <Probe title="Tab-bar minimize" note={note}>
      <MinimizeDriver />
      <MinimizeReadout />
    </Probe>
  );
}

/**
 * One root, every context. Everything below `BloomProvider` sits at the same
 * depth, which is the whole design: scope stops being a per-app decision.
 */
export const Composed: Story = {
  render: () => (
    <BloomProvider imageResolver={resolver}>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <ResolverProbe />
        <ThemeProbe />
        <ScrollProbe />
        <MinimizePair note="The button moves the bar: both probes read one shared value." />
      </View>
    </BloomProvider>
  ),
};

/**
 * The same probes with no `BloomProvider` above them — the two failure modes
 * side by side. The left card shows the crash; the right one shows nothing at
 * all, which is the worse of the two.
 */
export const WithoutIt: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <ResolverProbe />
      <ErrorBoundary
        fallback={({ error }) => (
          <Probe title="Scroll restoration" note="Loud: the screen goes with it.">
            <Text style={{ fontSize: 12 }}>{error.message}</Text>
          </Probe>
        )}
      >
        <ScrollProbe />
      </ErrorBoundary>
      <MinimizePair note="Silent: the button does nothing, and nothing reports it." />
    </View>
  ),
};
