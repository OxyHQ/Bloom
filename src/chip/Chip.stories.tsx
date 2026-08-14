import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Chip } from './index';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import type { AccentFill, AccentTone } from '../theme/accent-colors';

const meta: Meta<typeof Chip> = {
  title: 'Data Display/Chip',
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const FILLS: AccentFill[] = ['solid', 'subtle', 'outlined'];

/**
 * Tone × fill. `subtle` is the one worth looking at: its background and its
 * label are a resolved PAIR, not a token with alpha appended — the version that
 * appended alpha rendered a chip at contrast 1.00, drawn correctly and unreadable.
 */
export const Tones: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {TONES.map((color) => (
            <Chip
              key={color}
              variant={variant}
              color={color}
              testID={`chip-${variant}-${color}`}
            >
              {`${variant}/${color}`}
            </Chip>
          ))}
        </View>
      ))}
    </View>
  ),
};

/** `onClose` adds the dismiss affordance; `onPress` makes the body pressable. */
export const Removable: Story = {
  render: function RemovableStory() {
    const [tags, setTags] = useState(['design', 'infra', 'mobile', 'web']);
    return (
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: 380 }}>
        {tags.map((t) => (
          <Chip
            key={t}
            color="primary"
            variant="subtle"
            onClose={() => setTags(tags.filter((x) => x !== t))}
          >
            {t}
          </Chip>
        ))}
        {tags.length === 0 ? <Chip variant="outlined">nothing left</Chip> : null}
      </View>
    );
  },
};

/**
 * `selected` is the filter-row state. The chip announces it as a pressed toggle,
 * which is why it needs `onPress` rather than a caller-drawn highlight.
 */
export const Selectable: Story = {
  render: function SelectableStory() {
    const [active, setActive] = useState('all');
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['all', 'unread', 'mentions'].map((k) => (
          <Chip
            key={k}
            selected={active === k}
            onPress={() => setActive(k)}
            color="primary"
            variant={active === k ? 'solid' : 'outlined'}
          >
            {k}
          </Chip>
        ))}
      </View>
    );
  },
};

/** Sizes, icons and the disabled state. */
export const SizesAndIcons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Chip size="small">small</Chip>
        <Chip size="medium">medium</Chip>
        <Chip size="large">large</Chip>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Chip color="success" variant="subtle" startIcon={<CheckIcon size="xs" />}>
          verified
        </Chip>
        <Chip disabled onPress={() => {}}>
          disabled
        </Chip>
      </View>
    </View>
  ),
};
