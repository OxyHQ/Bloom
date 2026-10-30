import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from './Surface';
import { Button, InverseButton } from '../button/Button';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Card } from '../card';
import { LinkPreviewCard } from '../link-preview';
import { Text } from '../typography/Typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta<typeof Surface> = {
  id: 'base-surface',
  title: 'Components/Surfaces/Surface',
  component: Surface,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Surface>;

export const BorderLighting: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => (
    <View style={{ padding: 32, gap: 24, maxWidth: 1000 }}>
      <Text variant="title-3-semibold">Shared surface lighting</Text>
      <Text>Use the theme toolbar to compare light and dark mode.</Text>
      <Surface style={{ padding: 24, gap: 24 }}>
        <Text variant="title-3-semibold">Buttons at every size</Text>
        {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
          <View
            key={size}
            style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}
          >
            <Button size={size}>Continue</Button>
            <Button size={size} tone="neutral" appearance="outline">
              Secondary
            </Button>
            <Button size={size} tone="danger" appearance="solid">
              Delete
            </Button>
            <InverseButton size={size}>Inverse</InverseButton>
            <Button size={size} disabled>
              Disabled
            </Button>
          </View>
        ))}
        <ButtonGroup accessibilityLabel="Date range">
          <ButtonGroupItem checked>Day</ButtonGroupItem>
          <ButtonGroupItem>Week</ButtonGroupItem>
          <ButtonGroupItem disabled>Month</ButtonGroupItem>
        </ButtonGroup>
      </Surface>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        <Surface style={{ padding: 24, gap: 16, flexGrow: 1, flexBasis: 320 }}>
          <Text variant="title-3-semibold">Nested surfaces</Text>
          <Card style={{ padding: 20, gap: 16 }}>
            <Text>Card inside a surface</Text>
            <LinkPreviewCard
              url="https://example.com"
              title="A link inside the card"
              description="Shared lighting, with each layer keeping its own fill."
            />
          </Card>
        </Surface>
        <Card style={{ padding: 24, gap: 16, flexGrow: 1, flexBasis: 240 }}>
          <Text variant="title-3-semibold">Card</Text>
          <Text>The same edge treatment on a larger shape.</Text>
          <Button>Continue</Button>
          <Button tone="neutral" appearance="outline">
            Save for later
          </Button>
        </Card>
      </View>
    </View>
  ),
};

function MaterialExample() {
  const [range, setRange] = useState('day');
  return (
    <div
      style={{
        padding: 40,
        minHeight: 560,
        background:
          'repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0 6px, transparent 6px 22px), radial-gradient(circle at 18% 22%, #f97316 0 14%, transparent 34%), radial-gradient(circle at 78% 18%, #8b5cf6 0 12%, transparent 32%), radial-gradient(circle at 62% 78%, #06b6d4 0 14%, transparent 36%), radial-gradient(circle at 24% 82%, #ec4899 0 12%, transparent 32%), linear-gradient(135deg, #fde68a, #a7f3d0 50%, #bfdbfe)',
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      <Surface
        testID="surface-material"
        style={{ padding: 24, width: 360, maxWidth: '100%', gap: 20 }}
      >
        <Text variant="title-3-semibold">Shared material</Text>
        <Text>A mostly opaque body with a little transparency and a subtle edge.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button>Continue</Button>
          <Button tone="neutral" appearance="outline">
            Explore
          </Button>
          <Button disabled tone="neutral" appearance="outline">
            Later
          </Button>
        </View>
        <ButtonGroup accessibilityLabel="Date range" testID="material-range">
          <ButtonGroupItem checked={range === 'day'} onPress={() => setRange('day')}>
            Day
          </ButtonGroupItem>
          <ButtonGroupItem checked={range === 'week'} onPress={() => setRange('week')}>
            Week
          </ButtonGroupItem>
          <ButtonGroupItem disabled>Month</ButtonGroupItem>
        </ButtonGroup>
        <Card style={{ padding: 20, gap: 16 }}>
          <Text variant="title-3-semibold">Nested card</Text>
          <LinkPreviewCard
            url="https://example.com"
            title="A link inside the card"
            description="Each layer uses the shared material."
          />
        </Card>
      </Surface>
      <Card testID="material-card" style={{ padding: 24, width: 300, maxWidth: '100%', gap: 16 }}>
        <Text variant="title-3-semibold">Card</Text>
        <Text>The same material on a separate panel.</Text>
        <Button tone="neutral" appearance="outline">
          Save for later
        </Button>
      </Card>
    </div>
  );
}

export const Material: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => <MaterialExample />,
};

/**
 * The material with transparency reduced (the provider's `reduceTransparency`,
 * iOS Reduce Transparency, `prefers-reduced-transparency`): opaque bodies, no
 * backdrop filter, no edge light. The Material toolbar switches any story.
 */
export const ReducedTransparency: Story = {
  parameters: { bloomScroll: 'document' },
  globals: { material: 'reduced' },
  render: () => <MaterialExample />,
};

/**
 * The material with contrast increased (`increaseContrast`, iOS Increase
 * Contrast, Android high-contrast text, `prefers-contrast: more`,
 * `forced-colors`): opaque bodies edged with a hairline that holds 3:1. The
 * outlined button keeps its own border instead.
 */
export const IncreasedContrast: Story = {
  parameters: { bloomScroll: 'document' },
  globals: { material: 'contrast' },
  render: () => <MaterialExample />,
};

/** Only the exterior bands change; the background directly under the pane stays gray. */
export const BackdropReflection: Story = {
  render: function Render() {
    const [alternate, setAlternate] = useState(false);
    const side = alternate ? '#22c55e' : '#f43f5e';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
        <div
          style={{
            position: 'relative',
            height: 180,
            borderRadius: 20,
            background: `linear-gradient(90deg, ${side} 0 calc(50% - 100px), #888888 calc(50% - 100px) calc(50% + 100px), ${side} calc(50% + 100px))`,
          }}
        >
          <Surface
            testID="side-reflection"
            radius={20}
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -100,
              top: 50,
              width: 200,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span>Subtle edge</span>
          </Surface>
        </div>
        <Button appearance="subtle" tone="neutral" onPress={() => setAlternate((value) => !value)}>
          Change only the sides
        </Button>
      </div>
    );
  },
};

export const Nested: Story = {
  render: () => (
    <View style={{ padding: 32, maxWidth: 640 }}>
      <Surface testID="nested-outer" style={{ padding: 24, gap: 20 }}>
        <Text variant="title-3-semibold">Panel</Text>
        <Card testID="nested-card" style={{ padding: 20, gap: 16 }}>
          <Text>Card on the panel</Text>
          <LinkPreviewCard
            url="https://example.com"
            title="A link inside the card"
            description="Each surface derives its fill from its actual parent."
          />
        </Card>
        <Card appearance="plain" style={{ gap: 16 }}>
          <Text>A plain container keeps the panel's level</Text>
          <Surface testID="nested-plain-child" style={{ padding: 20 }}>
            <Text>Surface on the panel</Text>
          </Surface>
        </Card>
      </Surface>
    </View>
  ),
};

const TILE = { width: 54, height: 40, radius: 10 };

function Glyph({ dim }: { dim?: boolean }) {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 5,
        backgroundColor: dim ? 'rgba(80, 40, 50, 0.45)' : '#1a1a1a',
      }}
    />
  );
}

/** Astro's pinned tabs: the reference this material was measured from, at their own size. */
export const PinnedTabs: Story = {
  render: function Render() {
    const { isDark } = useTheme();
    const sidebar = isDark
      ? 'linear-gradient(180deg, #4a3239, #3d2a30)'
      : 'linear-gradient(180deg, #ebcbd3, #f1dde2)';
    const active = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.56)';
    const resting = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    return (
      <div style={{ display: 'flex', gap: 32, padding: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 190, padding: 8, borderRadius: 16, background: sidebar }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {[active, resting, resting].map((fill, index) => (
              <Surface
                key={index}
                testID={`pinned-tile-${index}`}
                fill={fill}
                radius={TILE.radius}
                cornerCurve="smooth"
                style={{
                  width: TILE.width,
                  height: TILE.height,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph dim={index > 0} />
              </Surface>
            ))}
          </View>
        </div>
        <div style={{ width: 360, padding: 24, borderRadius: 20, background: sidebar }}>
          <Surface style={{ padding: 20, gap: 12 }}>
            <Text variant="title-3-semibold">The same material on a panel</Text>
            <Text>
              Bright top and bottom edges, a soft glow, and the material over whatever is behind.
            </Text>
            <Button>Continue</Button>
          </Surface>
        </div>
      </div>
    );
  },
};
