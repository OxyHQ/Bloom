import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Meter } from './Meter';
import { MeterRing } from './MeterRing';
import { resolveMeterColors } from './shared';

const meta: Meta<typeof Meter> = {
  title: 'Base/Meter',
  component: Meter,
};

export default meta;

type Story = StoryObj<typeof Meter>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12, width: '100%' }}>
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Labelled({ caption, children }: { caption: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text variant="body-2-regular" style={{ width: 132, color: theme.colors.textTertiary }}>
        {caption}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}

/** The bar at every value it can take, including the two ends. */
export const Bar: Story = {
  render: () => (
    <View style={{ gap: 28, width: 480, maxWidth: '100%' }}>
      <Section title="Values">
        <Labelled caption="empty (0)">
          <Meter value={0} max={100} accessibilityLabel="Empty" valueText="0%" />
        </Labelled>
        <Labelled caption="a third">
          <Meter value={33} max={100} accessibilityLabel="A third" valueText="33%" />
        </Labelled>
        <Labelled caption="most of it">
          <Meter value={86} max={100} accessibilityLabel="Most of it" valueText="86%" />
        </Labelled>
        <Labelled caption="full (100)">
          <Meter value={100} max={100} accessibilityLabel="Full" valueText="100%" />
        </Labelled>
        <Labelled caption="over max">
          <Meter value={140} max={100} accessibilityLabel="Clamped" valueText="100%" />
        </Labelled>
      </Section>

      <Section title="Heights — the radius follows unless you set one">
        <Labelled caption="2">
          <Meter value={62} max={100} height={2} accessibilityLabel="Two tall" />
        </Labelled>
        <Labelled caption="4 (rating, media)">
          <Meter value={62} max={100} height={4} accessibilityLabel="Four tall" />
        </Labelled>
        <Labelled caption="6 (the default)">
          <Meter value={62} max={100} accessibilityLabel="Six tall" />
        </Labelled>
        <Labelled caption="8 (comparisons)">
          <Meter value={62} max={100} height={8} accessibilityLabel="Eight tall" />
        </Labelled>
        <Labelled caption="12, square ends">
          <Meter value={62} max={100} height={12} radius={2} accessibilityLabel="Square ends" />
        </Labelled>
      </Section>

      <Section title="Widths">
        <Labelled caption="fixed 56">
          <Meter value={62} max={100} height={4} width={56} accessibilityLabel="Fixed width" />
        </Labelled>
        <Labelled caption="fills the parent">
          <Meter value={62} max={100} height={4} accessibilityLabel="Full width" />
        </Labelled>
      </Section>
    </View>
  ),
};

/** Fills other than the default accent — a status tone, a chart hue, a custom rail. */
export const Colours: Story = {
  render: function ColoursStory() {
    const theme = useTheme();
    const meter = resolveMeterColors(theme);
    const tone = (name: 'success' | 'warning' | 'error') =>
      resolveAccentColors(theme.colors, name, 'solid').background;
    return (
      <View style={{ gap: 28, width: 480, maxWidth: '100%' }}>
        <Section title="Default — the accent over neutral-200 / dark neutral-700">
          <Meter value={62} max={100} accessibilityLabel="Default" />
        </Section>
        <Section title="Status tones (pass a fill; never derive one from a token)">
          <Labelled caption="success">
            <Meter value={92} max={100} fill={tone('success')} accessibilityLabel="Success" />
          </Labelled>
          <Labelled caption="warning">
            <Meter value={48} max={100} fill={tone('warning')} accessibilityLabel="Warning" />
          </Labelled>
          <Labelled caption="error">
            <Meter value={14} max={100} fill={tone('error')} accessibilityLabel="Error" />
          </Labelled>
        </Section>
        <Section title="A custom rail">
          <Meter
            value={62}
            max={100}
            fill={meter.fill}
            track={theme.colors.border}
            accessibilityLabel="Custom rail"
          />
        </Section>
      </View>
    );
  },
};

/** The ring: the same measurement, the same defaults, centred content. */
export const Ring: Story = {
  render: function RingStory() {
    const theme = useTheme();
    return (
      <View style={{ gap: 28, width: 480, maxWidth: '100%' }}>
        <Section title="Sizes">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <MeterRing value={72} max={100} size={40} thickness={4} accessibilityLabel="Forty">
              <Text variant="caption-1-medium" style={{ color: theme.colors.text }}>
                72
              </Text>
            </MeterRing>
            <MeterRing value={72} max={100} accessibilityLabel="Fifty-six">
              <Text variant="body-semibold" style={{ color: theme.colors.text }}>
                72
              </Text>
            </MeterRing>
            <MeterRing value={72} max={100} size={72} thickness={6} accessibilityLabel="Seventy-two">
              <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
                72
              </Text>
            </MeterRing>
          </View>
        </Section>
        <Section title="Values — 0 drops the round cap, so an empty ring is not a dot">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {[0, 25, 50, 75, 100].map((n) => (
              <MeterRing key={n} value={n} max={100} accessibilityLabel={`${n} percent`}>
                <Text variant="body-semibold" style={{ color: theme.colors.text }}>
                  {n}
                </Text>
              </MeterRing>
            ))}
          </View>
        </Section>
        <Section title="Butt cap, and a ring with nothing in it">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <MeterRing value={40} max={100} cap="butt" accessibilityLabel="Butt cap" />
            <MeterRing value={40} max={100} size={24} thickness={3} accessibilityLabel="Small" />
          </View>
        </Section>
      </View>
    );
  },
};

/**
 * The web transition. `transitionMs` eases the fill and the arc; native snaps,
 * and so does a browser under `prefers-reduced-motion`.
 */
export const Animated: Story = {
  render: function AnimatedStory() {
    const theme = useTheme();
    const [value, setValue] = useState(20);
    useEffect(() => {
      const id = setInterval(() => setValue((v) => (v >= 100 ? 10 : v + 30)), 1200);
      return () => clearInterval(id);
    }, []);
    return (
      <View style={{ gap: 28, width: 480, maxWidth: '100%' }}>
        <Section title="transitionMs 300 — the wizard's step segments">
          <Meter value={value} max={100} transitionMs={300} accessibilityLabel="Eased bar" />
        </Section>
        <Section title="transitionMs 400 — the listing quality ring">
          <MeterRing value={value} max={100} size={72} thickness={6} transitionMs={400} accessibilityLabel="Eased ring">
            <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
              {value}
            </Text>
          </MeterRing>
        </Section>
      </View>
    );
  },
};
