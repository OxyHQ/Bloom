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

function Introduction({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links: readonly { label: string; story: string }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text accessibilityRole="header" variant="title-2-semibold">
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary }}>{description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {links.map(({ label, story }) => (
          <Button
            key={story}
            href={`./?path=/story/${story}`}
            target="_top"
            size="sm"
            tone="neutral"
            appearance="outline"
          >
            {label}
          </Button>
        ))}
      </View>
    </View>
  );
}

/** The same real controls read the scope's resolved roles in every example. */
function Sample({ label, detail }: { label: string; detail?: string }) {
  const { colors } = useTheme();
  return (
    <Card appearance="outline" radius="radius-16" style={{ padding: 16, gap: 10, width: 220 }}>
      <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>
      {detail ? (
        <Text variant="caption-1-regular" style={{ color: colors.textSecondary }}>
          {detail}
        </Text>
      ) : null}
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
        <Button size="sm" tone="support">
          Support
        </Button>
        <Button size="sm" tone="action">
          Action
        </Button>
      </View>
    </Card>
  );
}

/** Local modes coexist without changing the root provider or Storybook toolbar. */
export const Modes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: '100%', maxWidth: 820, gap: 20 }}>
      <Introduction
        title="Root mode and local color scopes"
        description="BloomProvider owns the application mode and colorPreset. These two BloomColorScope regions override only mode, so the same selected preset resolves its light and dark roles together. The toolbar still controls the surrounding page."
        links={[
          { label: 'Browse registered presets', story: 'foundations-color--presets' },
          { label: 'Local preset inheritance', story: 'foundations-color--scoped' },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16 }}>
        {(['light', 'dark'] as const).map((mode) => (
          <BloomColorScope key={mode} mode={mode}>
            <View style={{ padding: 16 }}>
              <Sample label={mode} />
            </View>
          </BloomColorScope>
        ))}
      </View>
    </View>
  ),
};

/** Every registered preset is valid; pairing describes how its seeds are chosen. */
export const Presets: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: '100%', maxWidth: 820, gap: 20 }}>
      <Introduction
        title={`${COLOR_PRESET_REGISTRY.length} registered color presets`}
        description="COLOR_PRESET_REGISTRY supplies the same names as APP_COLOR_PRESETS. Both curated and derived pairings are official presets: curated recipes pin action seeds; derived recipes generate support and action from the identity seed. Each local colorPreset inherits the toolbar mode."
        links={[
          {
            label: 'Compare presets in the explorer',
            story: 'foundations-color-system-playground--playground',
          },
          {
            label: 'See roles in context',
            story: 'foundations-color-roles-in-context--first-direction',
          },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {COLOR_PRESET_REGISTRY.map((preset) => (
          <BloomColorScope key={preset.name} colorPreset={preset.name}>
            <Sample
              label={preset.displayName}
              detail={`${preset.name} · ${preset.pairing} pairing`}
            />
          </BloomColorScope>
        ))}
      </View>
    </View>
  ),
};

/** A subtree changes preset while retaining the surrounding mode. */
export const Scoped: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: '100%', maxWidth: 820, gap: 20 }}>
      <Introduction
        title="A local preset inherits the application mode"
        description="The first sample reads the application theme. The next two set BloomColorScope colorPreset to pink and green; they inherit mode and leave the root untouched. Identity uses primary / tone=accent, support uses secondary / tone=support, and action uses tertiary / tone=action."
        links={[
          { label: 'Compare light and dark scopes', story: 'foundations-color--modes' },
          { label: 'Inspect exact scoped tokens', story: 'foundations-color-scope--exact-tokens' },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16 }}>
        <Sample label="app theme" />
        <BloomColorScope colorPreset="pink">
          <Sample label="scoped: pink" />
        </BloomColorScope>
        <BloomColorScope colorPreset="green">
          <Sample label="scoped: green" />
        </BloomColorScope>
      </View>
    </View>
  ),
};
