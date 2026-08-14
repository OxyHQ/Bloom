import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import type { AccentFill, AccentTone } from '../theme/accent-colors';
import { Chip } from './index';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const FILLS: AccentFill[] = ['solid', 'subtle', 'outlined'];

/**
 * Every tone against every fill. The colours come from
 * `theme/accent-colors.ts`, the one resolver `Chip` and `Badge` share — a chip
 * never derives a tint by appending alpha to a token.
 */
export const Variants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {TONES.map((color) => (
            <Chip key={color} variant={variant} color={color}>
              {color}
            </Chip>
          ))}
        </View>
      ))}
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Chip size="small">Small</Chip>
      <Chip size="medium">Medium</Chip>
      <Chip size="large">Large</Chip>
    </View>
  ),
};

/** Icons inside the pill are sized to the pill, not to whatever was passed. */
export const WithIcons: Story = {
  render: function IconChips() {
    const theme = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Chip size="small" startIcon={<CheckIcon size="lg" fill={theme.colors.text} />}>
          Small
        </Chip>
        <Chip size="medium" startIcon={<CheckIcon size="lg" fill={theme.colors.text} />}>
          Medium
        </Chip>
        <Chip size="large" startIcon={<CheckIcon size="lg" fill={theme.colors.text} />}>
          Large
        </Chip>
      </View>
    );
  },
};

/**
 * Filter pills. Selection promotes the chip to the brand tone rather than to a
 * colour system of its own. Tab onto one in a browser to see the
 * `:focus-visible` ring — it is keyboard-only, so a mouse click leaves none.
 */
export const Selectable: Story = {
  render: function SelectableChips() {
    const [selected, setSelected] = useState<string[]>(['news']);
    const toggle = (id: string) =>
      setSelected((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      );
    return (
      <View style={{ gap: 12 }}>
        <Text>selected: {selected.join(', ') || 'none'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['news', 'sport', 'music', 'travel'].map((id) => (
            <Chip
              key={id}
              testID={`chip-${id}`}
              variant="subtle"
              selected={selected.includes(id)}
              onPress={() => toggle(id)}>
              {id}
            </Chip>
          ))}
        </View>
      </View>
    );
  },
};

/** Removable tags. The close affordance is its own control inside the pill. */
export const Removable: Story = {
  render: function RemovableChips() {
    const [tags, setTags] = useState(['design', 'react-native', 'accessibility']);
    return (
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Chip key={tag} onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
            {tag}
          </Chip>
        ))}
      </View>
    );
  },
};

/**
 * A pill does not shrink. In a row narrower than its contents the chips keep
 * their size and the row overflows, rather than each pill squeezing its label
 * into an ellipsis.
 */
export const DoesNotShrink: Story = {
  render: () => (
    <View style={{ width: 240, flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
      <Chip>A long-ish label</Chip>
      <Chip>Another one</Chip>
      <Chip>And a third</Chip>
    </View>
  ),
};

export const Disabled: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip disabled onPress={() => {}}>
        Disabled
      </Chip>
      <Chip disabled variant="solid" color="primary" onPress={() => {}}>
        Disabled
      </Chip>
    </View>
  ),
};
