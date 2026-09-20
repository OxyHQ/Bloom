import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './index';
import { IconCircle } from '../icon-circle';
import { RiNotificationLine as BellIcon } from '../icons/remix';
import type { BloomAppearance, BloomTone } from '../appearance';

const meta: Meta<typeof Badge> = {
  argTypes: {
    "appearance": { control: 'select', options: ["solid","subtle","outline","plain"] },
    "tone": { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    "size": { control: 'select', options: ["xs","sm","md","lg"] },
    "dot": { control: 'boolean' },
    "max": { control: 'number' },
    "invisible": { control: 'boolean' },
    "placement": { control: 'select', options: ["top-right","top-left","bottom-right","bottom-left"] }
  },
  title: 'Base/Badge',
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

const TONES: BloomTone[] = ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'];
const FILLS: BloomAppearance[] = ['solid', 'subtle', 'outline'];

/**
 * Standalone: `content` is the label. `color` picks the tone and `variant` the
 * fill — the pair is resolved together by `resolveAccentColors`, which is why a
 * subtle badge is legible rather than same-colour-on-same-colour.
 */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {TONES.map((color) => (
            <Badge
              key={color}
              appearance={variant}
              tone={color}
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
 * Sidebar counters: `medium` is 18 tall, 12/16 semibold, 4px
 * padding-x. A single digit keeps a circle.
 */
export const Counters: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {(['accent', 'neutral'] as const).map((color) =>
            [3, 12, 128].map((count) => (
              <Badge key={`${color}-${count}`} appearance={variant} tone={color} content={count} />
            )),
          )}
        </View>
      ))}
    </View>
  ),
};

/**
 * A standalone `dot` is a status dot: a solid centre on the tone's tint
 * halo, at every size (medium is 12 / 6).
 */
export const StatusDots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {TONES.map((color) => (
            <Badge key={color} dot size={size} tone={color} testID={`dot-${size}-${color}`} />
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32 }}>
      {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map((placement) => (
        <Badge key={placement} content={8} tone="danger" placement={placement}>
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32, alignItems: 'center' }}>
      <Badge content={5} tone="accent">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge content={1204} max={99} tone="accent">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge dot tone="success">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
      <Badge content={5} invisible tone="accent">
        <IconCircle icon={BellIcon} size="lg" />
      </Badge>
    </View>
  ),
};

/** The three sizes, inline. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Badge size="sm" tone="accent" content="sm" />
      <Badge size="md" tone="accent" content="md" />
      <Badge size="lg" tone="accent" content="lg" />
    </View>
  ),
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { content: 12, max: 99, appearance: 'subtle', tone: 'accent', size: 'md', dot: false, invisible: false },
};
