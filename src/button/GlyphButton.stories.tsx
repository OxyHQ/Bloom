import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlyphButton } from './GlyphButton';
import { Text as BloomText } from '../typography';
import { useTheme } from '../theme/use-theme';
import { resolveButtonRamps } from './shared';
import {
  RiCloseLine,
  RiHeart3Fill,
  RiMoreFill,
  RiRepeat2Line,
  RiShuffleLine,
} from '../icons/remix';

const meta: Meta<typeof GlyphButton> = {
  title: 'Base/GlyphButton',
  component: GlyphButton,
  args: {
    accessibilityLabel: 'More options',
    icon: RiMoreFill,
    onPress: () => {},
  },
  argTypes: {
    size: { control: { type: 'number' } },
    glyphSize: { control: { type: 'number' } },
    pressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
    grow: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof GlyphButton>;

export const Basic: Story = {};

/** Every size a family already draws: 24 · 28 · 32 · 36 · 40 · 44 · 56. */
export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {[24, 28, 32, 36, 40, 44, 56].map((size) => (
        <View key={size} style={{ alignItems: 'center', gap: 6 }}>
          <GlyphButton size={size} icon={RiMoreFill} accessibilityLabel={`More, ${size}`} />
          <BloomText variant="caption-2-regular">{size}</BloomText>
        </View>
      ))}
    </View>
  ),
};

/** The glyph ratio: 0.6 by default, overridden per call site with `glyphSize`. */
export const GlyphRatio: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {[0.5, 0.6, 0.7, 0.75].map((ratio) => (
        <View key={ratio} style={{ alignItems: 'center', gap: 6 }}>
          <GlyphButton
            size={40}
            glyphSize={Math.round(40 * ratio)}
            icon={RiHeart3Fill}
            accessibilityLabel={`Like, ${ratio}`}
          />
          <BloomText variant="caption-2-regular">{ratio}</BloomText>
        </View>
      ))}
    </View>
  ),
};

/** A toggle: `aria-pressed` plus `accessibilityState.selected`, and the four colour corners. */
export const Toggle: Story = {
  render: function ToggleStory() {
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(true);
    return (
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <GlyphButton
          size={40}
          icon={RiShuffleLine}
          accessibilityLabel="Shuffle"
          pressed={shuffle}
          onPress={() => setShuffle((on) => !on)}
        />
        <GlyphButton
          size={40}
          icon={RiRepeat2Line}
          accessibilityLabel="Repeat"
          pressed={repeat}
          onPress={() => setRepeat((on) => !on)}
        />
      </View>
    );
  },
};

/** Fills: transparent by default, a rest fill, and a family's own wash. */
export const Fills: Story = {
  render: function FillsStory() {
    const theme = useTheme();
    const { neutral: n, accent } = resolveButtonRamps(theme);
    return (
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <GlyphButton size={40} icon={RiMoreFill} accessibilityLabel="Default" />
        <GlyphButton
          size={40}
          icon={RiMoreFill}
          accessibilityLabel="No wash at all"
          hoverFill="transparent"
        />
        <GlyphButton
          size={40}
          icon={RiMoreFill}
          accessibilityLabel="Filled at rest"
          fill={theme.isDark ? n[800] : n[100]}
          hoverFill={theme.isDark ? n[700] : n[200]}
        />
        <GlyphButton
          size={40}
          icon={RiHeart3Fill}
          accessibilityLabel="Accent glyph"
          color={accent[500]}
          hoverColor={accent[600]}
        />
      </View>
    );
  },
};

/** `disabled`, and `grow` for a text glyph that is wider than its box. */
export const DisabledAndGrow: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <GlyphButton size={40} icon={RiMoreFill} accessibilityLabel="Disabled" disabled />
      <GlyphButton
        size={40}
        icon={RiCloseLine}
        accessibilityLabel="Disabled, dimmed harder"
        disabled
        disabledOpacity={0.3}
      />
      <GlyphButton size={32} grow accessibilityLabel="Playback speed">
        {(foreground: string) => (
          <BloomText variant="body-semibold" style={{ color: foreground }}>
            1.5×
          </BloomText>
        )}
      </GlyphButton>
    </View>
  ),
};
