import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './index';
import { IconCircle } from '../icon-circle';
import { Bell_Stroke2_Corner0_Rounded as BellIcon } from '../icons/Bell';
import type { AccentFill, AccentTone } from '../theme/accent-colors';

const meta: Meta<typeof Badge> = {
  title: 'Data Display/Badge',
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const FILLS: AccentFill[] = ['solid', 'subtle', 'outlined'];

/**
 * Standalone: `content` is the label. `color` picks the tone and `variant` the
 * fill — the pair is resolved together by `resolveAccentColors`, which is why a
 * subtle badge is legible rather than same-colour-on-same-colour.
 */
export const Tones: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {TONES.map((color) => (
            <Badge
              key={color}
              variant={variant}
              color={color}
              content={color}
              testID={`badge-${variant}-${color}`}
            />
          ))}
        </View>
      ))}
    </View>
  ),
};

/**
 * With `children`, the badge becomes an overlay on whatever it wraps and
 * `placement` decides the corner. Without children it is an inline pill.
 */
export const Placements: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32 }}>
      {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map((placement) => (
        <Badge key={placement} content={8} color="error" placement={placement}>
          <IconCircle icon={BellIcon} size="lg" />
        </Badge>
      ))}
    </View>
  ),
};

/**
 * `max` caps the number and appends a plus; `dot` drops the label entirely for
 * a presence marker; `invisible` hides the badge without unmounting the child,
 * so a count going to zero does not reflow the layout.
 */
export const CountsAndDots: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32, alignItems: 'center' }}>
      <Badge content={5} color="primary">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge content={1204} max={99} color="primary">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge dot color="success">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge content={5} invisible color="primary">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
    </View>
  ),
};

/** The three sizes, inline. */
export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Badge size="small" color="primary" content="small" />
      <Badge size="medium" color="primary" content="medium" />
      <Badge size="large" color="primary" content="large" />
    </View>
  ),
};
