import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RADIUS, SPACING, BORDER_WIDTH, TYPOGRAPHY } from './scales';
import { SHADOW_BOX } from './shadows';
import { Text } from '../typography';
import { useTheme } from '../theme';

const meta: Meta = {
  title: 'Foundations/Design Tokens',
};

export default meta;

type Story = StoryObj;

function Caption({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 11, opacity: 0.7 }}>{children}</Text>;
}

/**
 * The colour ROLES, as the active preset and mode resolve them. This is what
 * `useTheme().colors` hands you and what the `--x` CSS variables carry on web.
 *
 * The rule that matters here: read the PAIR, never derive one from the other.
 * A token resolves to a full `rgb(...)`, so appending hex alpha to it produces
 * a string react-native-web parses back as fully opaque — which is how a
 * "tinted" control ends up drawn at contrast 1.00, invisible and valid.
 */
export const Colors: Story = {
  render: function ColorsStory() {
    const { colors } = useTheme();
    const entries = Object.entries(colors).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    );
    return (
      <View style={{ width: 820, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {entries.map(([name, value]) => (
          <View key={name} style={{ width: 160, gap: 4 }}>
            <View
              style={{
                height: 40,
                borderRadius: RADIUS['radius-8'],
                backgroundColor: value,
                borderWidth: BORDER_WIDTH.hairline,
                borderColor: colors.border,
              }}
            />
            <Text style={{ fontSize: 11 }}>{name}</Text>
            <Caption>{value}</Caption>
          </View>
        ))}
      </View>
    );
  },
};

/**
 * The corner rungs. `Card` takes one of these by NAME rather than a number,
 * which is what keeps "this surface is a little rounder" to seven values
 * instead of seven hundred.
 */
export const Radius: Story = {
  render: function RadiusStory() {
    const { colors } = useTheme();
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {Object.entries(RADIUS).map(([name, value]) => (
          <View key={name} style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: value,
                backgroundColor: colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text style={{ fontSize: 11 }}>{name}</Text>
            <Caption>{value}px</Caption>
          </View>
        ))}
      </View>
    );
  },
};

/** The spacing ramp, drawn to scale. */
export const Spacing: Story = {
  render: function SpacingStory() {
    const { colors } = useTheme();
    return (
      <View style={{ gap: 8 }}>
        {Object.entries(SPACING).map(([name, value]) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 11, width: 90 }}>{name}</Text>
            <View style={{ height: 12, width: value, backgroundColor: colors.primary }} />
            <Caption>{value}px</Caption>
          </View>
        ))}
      </View>
    );
  },
};

/**
 * The two elevation roles, and only two: `shadow-s` is a subtle raise (cards,
 * chips) and `shadow-m` is for overlays (menus, popovers, dialogs). Anything
 * hand-rolled is a third one that will not match either.
 */
export const Elevation: Story = {
  render: function ElevationStory() {
    const { colors } = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 32, padding: 24 }}>
        {(['s', 'm'] as const).map((role) => (
          <View key={role} style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 120,
                height: 80,
                borderRadius: RADIUS['radius-12'],
                backgroundColor: colors.card,
                boxShadow: SHADOW_BOX[role],
              }}
            />
            <Text style={{ fontSize: 11 }}>shadow-{role}</Text>
          </View>
        ))}
      </View>
    );
  },
};

/**
 * Typography ROLES, not a raw size ramp. Each role is a size, a line height, a
 * weight and a family together — picking a size alone is how a heading ends up
 * with body leading.
 */
export const Type: Story = {
  render: () => (
    <View style={{ width: 620, gap: 12 }}>
      {Object.entries(TYPOGRAPHY).map(([name, role]) => (
        <View key={name} style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: role.size,
              lineHeight: role.lineHeight,
              fontWeight: role.weight,
            }}
          >
            {name} — Bloom keeps the ecosystem coherent
          </Text>
          <Caption>
            {role.size}/{role.lineHeight} · {role.weight} · {role.family}
          </Caption>
        </View>
      ))}
    </View>
  ),
};
