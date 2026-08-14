import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeProvider, BloomColorScope, APP_COLOR_PRESETS, useTheme } from './index';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { Text } from '../typography';
import { Button } from '../button';
import { Card } from '../card';

const meta: Meta = {
  title: 'Foundations/Theme',
};

export default meta;

type Story = StoryObj;

/** A small surface that reads only from the theme, so it shows what changed. */
function Sample({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 10, width: 220 }}>
      <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>
      <Text style={{ color: colors.textSecondary }}>Secondary text</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(['primary', 'success', 'warning', 'error'] as const).map((role) => (
          <View
            key={role}
            style={{
              width: 28,
              height: 28,
              borderRadius: RADIUS['radius-max'],
              backgroundColor: colors[role],
              borderWidth: BORDER_WIDTH.hairline,
              borderColor: colors.border,
            }}
          />
        ))}
      </View>
      <Button size="small">Primary</Button>
    </Card>
  );
}

/**
 * `BloomThemeProvider` is the one root that decides colour. It takes a PRESET
 * (which hue the whole palette is derived from) and a MODE, and hands both to
 * every component through `useTheme()` — plus, on web, as `--x` CSS variables
 * so a consumer's own CSS can reference the same values.
 *
 * `mode="system"` observes the OS colour scheme PASSIVELY. Bloom never calls
 * `Appearance.setColorScheme()`: that is a global mutation, and an app that
 * does it once affects every other surface in the process.
 *
 * The trap worth knowing before you place this: `useTheme()` THROWS outside the
 * provider, and the classic way to hit that is a splash or loading screen that
 * early-returns above where the provider is mounted. It fails at runtime only —
 * `tsc` and the build stay green — so hoist the provider above every render
 * branch rather than nesting it inside an app-providers component.
 */
export const Modes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {(['light', 'dark'] as const).map((mode) => (
        <BloomThemeProvider key={mode} mode={mode} colorPreset="oxy">
          <View style={{ padding: 16 }}>
            <Sample label={mode} />
          </View>
        </BloomThemeProvider>
      ))}
    </View>
  ),
};

/**
 * Every built-in preset. The list is the keys of `APP_COLOR_PRESETS` — reading
 * it from the map rather than typing the names out means a preset added later
 * shows up here instead of silently missing.
 */
export const Presets: Story = {
  render: () => (
    <View style={{ width: 820, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {Object.keys(APP_COLOR_PRESETS).map((preset) => (
        <BloomThemeProvider
          key={preset}
          mode="light"
          colorPreset={preset as keyof typeof APP_COLOR_PRESETS}
        >
          <Sample label={preset} />
        </BloomThemeProvider>
      ))}
    </View>
  ),
};

/**
 * `BloomColorScope` re-colours a SUBTREE without touching the app's theme —
 * a brand-coloured hero, a per-community accent. On web it emits both the
 * canonical `--x` tokens and the Tailwind `--color-x` aliases, because a scoped
 * `--primary` alone does not move a `--color-primary` that was declared at the
 * root: the alias substitutes where it is DECLARED, not where it is read.
 */
export const Scoped: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Sample label="app theme" />
      <BloomColorScope colorPreset="pink">
        <Sample label="scoped: pink" />
      </BloomColorScope>
      <BloomColorScope colorPreset="green">
        <Sample label="scoped: green" />
      </BloomColorScope>
    </View>
  ),
};
