import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { fontFamilies, fontCssVars } from './index';
import { Text } from '../typography';
import { Card } from '../card';

const meta: Meta = {
  title: 'Foundations/Fonts',
};

export default meta;

type Story = StoryObj;

const SPECIMEN = 'Bloom keeps the ecosystem coherent — 0123456789';
const PANGRAM = 'Sphinx of black quartz, judge my vow.';

function Specimen({ name, stack }: { name: string; stack: string }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 8, width: 620 }}>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        {name} · var({fontCssVars[name as keyof typeof fontCssVars]})
      </Text>
      <Text style={{ fontFamily: stack, fontSize: 28 }}>{SPECIMEN}</Text>
      <Text style={{ fontFamily: stack, fontSize: 16 }}>{PANGRAM}</Text>
      <Text style={{ fontFamily: stack, fontSize: 13, opacity: 0.8 }}>{stack}</Text>
    </Card>
  );
}

/**
 * The three families, as they actually resolve.
 *
 * This page exists to be LOOKED AT, because the font system is one that fails
 * by looking fine: a missing `@font-face` falls back to a system face rather
 * than erroring. Bloom's own Storybook ran with `fonts={false}` for months and
 * every story looked plausible the whole time.
 *
 * If a specimen below renders in a system serif or in Arial, the faces are not
 * loading — which is a real failure, not a styling preference.
 */
export const Specimens: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {Object.entries(fontFamilies).map(([name, stack]) => (
        <Specimen key={name} name={name} stack={stack} />
      ))}
    </View>
  ),
};

/**
 * Each stack ends in system fallbacks, so text is readable during the swap
 * period and on a platform where the asset never arrives. That is a feature —
 * and it is also exactly why a missing face is invisible.
 */
export const Fallbacks: Story = {
  render: () => (
    <View style={{ gap: 12, width: 620 }}>
      {Object.entries(fontFamilies).map(([name, stack]) => (
        <View key={name} style={{ gap: 4 }}>
          <Text style={{ fontWeight: '600' }}>{name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {stack.split(',').map((face, index) => (
              <Text
                key={face}
                style={{
                  fontSize: 12,
                  opacity: index === 0 ? 1 : 0.6,
                  fontWeight: index === 0 ? '600' : '400',
                }}
              >
                {face.trim()}
                {index === 0 ? '  ← Bloom' : ''}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  ),
};

/**
 * Weights, on the body family. Consuming apps must NOT set `fontFamily`
 * themselves — `BloomThemeProvider` installs the family as `Text.defaultProps`,
 * and an app that also names a face by hand overrides it with a name that may
 * not match the loaded asset. The failure is a silent fallback: text that looks
 * almost right.
 */
export const Weights: Story = {
  render: () => (
    <View style={{ gap: 8, width: 620 }}>
      {(['400', '500', '600', '700'] as const).map((weight) => (
        <Text key={weight} style={{ fontFamily: fontFamilies.sans, fontSize: 20, fontWeight: weight }}>
          {weight} — {PANGRAM}
        </Text>
      ))}
    </View>
  ),
};
