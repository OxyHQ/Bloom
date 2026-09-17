import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './index';
import { IconCircle } from '../icon-circle';
import { RiNotificationLine as BellIcon, RiKey2Line as KeyIcon } from '../icons/remix';
import type { AccentFill, AccentTone } from '../theme/accent-colors';

const meta: Meta<typeof Badge> = {
  title: 'Base/Badge',
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
 * Sidebar counters: `medium` is 18 tall, 12/16 semibold, 4px
 * padding-x. A single digit keeps a circle.
 */
export const Counters: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {(['primary', 'default'] as const).map((color) =>
            [3, 12, 128].map((count) => (
              <Badge key={`${color}-${count}`} variant={variant} color={color} content={count} />
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
  render: () => (
    <View style={{ gap: 12 }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {TONES.map((color) => (
            <Badge key={color} dot size={size} color={color} testID={`dot-${size}-${color}`} />
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

/**
 * Five rungs in two families. `small`/`medium`/`large` are sized to a DIGIT:
 * `minWidth` equals the height so "3" stays a circle, and the pill never
 * shrinks. `label-small` (20) and `label-medium` (24) are sized to a WORD —
 * the side padding a word needs, a leading icon slot, and they SHRINK, because
 * a two-word status in a narrow card has to yield before the card's title does.
 */
export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Badge size="small" color="primary" content="small" />
        <Badge size="medium" color="primary" content="medium" />
        <Badge size="large" color="primary" content="large" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Badge size="label-small" variant="subtle" color="info" icon={KeyIcon} content="label-small" />
        <Badge size="label-medium" variant="subtle" color="info" icon={KeyIcon} content="label-medium" />
      </View>
    </View>
  ),
};

/**
 * `icon` is a leading glyph drawn at the rung's size in the LABEL's own colour
 * and hidden from assistive technology — the badge announces its text, never
 * "image, key" beside it. It tucks the leading padding in by 2, optically.
 */
export const WithIcon: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {TONES.map((color) => (
        <Badge key={color} size="label-medium" variant="subtle" color={color} icon={KeyIcon} content={color} />
      ))}
    </View>
  ),
};

/**
 * `onMedia` is the fourth fill: a light pill with a shadow, for over a
 * photograph. It ignores `color` and is the same in both modes, because the
 * photograph under it does not change with them — a badge that followed the
 * mode would go dark-on-dark over half the images in a library.
 */
export const OnMedia: Story = {
  render: () => (
    <View
      style={{
        padding: 16,
        gap: 8,
        borderRadius: 16,
        alignItems: 'flex-start',
        backgroundColor: '#3f4b5b',
        backgroundImage:
          'linear-gradient(135deg, #2b3440 0%, #5c6b7a 50%, #8a99a8 100%)',
      } as object}
    >
      <Badge variant="onMedia" size="label-medium" icon={KeyIcon} content="For rent" />
      <Badge variant="onMedia" size="label-small" content="Reserved" />
      <Badge variant="onMedia" size="label-medium" color="error" content="Tone is ignored" />
    </View>
  ),
};
