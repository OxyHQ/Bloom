import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomColorScope, useTheme } from './index.web';
import { COLOR_PRESET_REGISTRY } from './color-presets';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { Text } from '../typography';
import { Button } from '../button/index.web';
import { Card } from '../card';

const meta: Meta = {
  id: 'foundations-color',
  title: 'Foundations/Color/Modes and Presets',
};

export default meta;

type Story = StoryObj;

/** A small surface that reads only from the theme, so it shows what changed. */
function Sample({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Card appearance="outline" radius="radius-16" style={{ padding: 16, gap: 10, width: 220 }}>
      <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>
      <Text style={{ color: colors.textSecondary }}>Secondary text</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {(
          [
            ['Identity', 'primary'],
            ['Support', 'secondary'],
            ['Action', 'tertiary'],
          ] as const
        ).map(([name, role]) => (
          <View key={role} style={{ gap: 4, alignItems: 'center' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: RADIUS['radius-max'],
                backgroundColor: colors[role],
                borderWidth: BORDER_WIDTH.hairline,
                borderColor: colors.border,
              }}
            />
            <Text variant="caption-1-regular">{name}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button size="sm" tone="accent">
          Identity
        </Button>
        <Button size="sm" tone="action">
          Action
        </Button>
      </View>
    </Card>
  );
}

/**
 * The root provider owns the application theme. Local color scopes let both
 * modes appear together without changing the document or the Storybook theme.
 */
export const Modes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16 }}>
      {(['light', 'dark'] as const).map((mode) => (
        <BloomColorScope key={mode} mode={mode}>
          <View style={{ padding: 16 }}>
            <Sample label={mode} />
          </View>
        </BloomColorScope>
      ))}
    </View>
  ),
};

/**
 * Every built-in recipe, using the registry's names and the toolbar's mode.
 * Local scopes change the preset without resetting the application mode.
 */
export const Presets: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 820, maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {COLOR_PRESET_REGISTRY.map((preset) => (
        <BloomColorScope key={preset.name} colorPreset={preset.name}>
          <Sample label={preset.displayName} />
        </BloomColorScope>
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16 }}>
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
