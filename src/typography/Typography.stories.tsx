import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Large,
  Lead,
  Muted,
  P,
  Small,
  Span,
  Text,
} from './index';

const meta: Meta = {
  title: 'Components/Typography',
};

export default meta;

type Story = StoryObj;

export const Headings: Story = {
  render: () => (
    <View style={{ gap: 8, maxWidth: 560 }}>
      <H1>Heading one</H1>
      <H2>Heading two</H2>
      <H3>Heading three</H3>
      <H4>Heading four</H4>
      <H5>Heading five</H5>
      <H6>Heading six</H6>
    </View>
  ),
};

/**
 * The semantic prose variants ported from react-native-reusables, as flat
 * components rather than a `variant` prop — `H1`–`H6` are already flat, and a
 * second way to ask for a heading is the ambiguity Bloom removes.
 */
export const Prose: Story = {
  render: () => (
    <View style={{ gap: 12, maxWidth: 560 }}>
      <H2>Device sessions</H2>
      <Lead>
        Every device you sign in from gets its own session, and you can end any of them without
        touching the others.
      </Lead>
      <P>
        A session is minted per origin and refreshed in the background. Ending one signs that
        device out immediately.
      </P>
      <Blockquote>
        A session that cannot be ended from another device is not a session, it is a key you
        cannot take back.
      </Blockquote>
      <Large>Ending a session</Large>
      <P>Open the device list, pick a session and choose Sign out.</P>
      <Small>Last active 4 minutes ago</Small>
      <Muted>Sessions older than 90 days end on their own.</Muted>
    </View>
  ),
};

/** Every variant beside the base `Text`, for size and colour comparison. */
export const Scale: Story = {
  render: () => (
    <View style={{ gap: 6, maxWidth: 560 }}>
      <Lead>Lead — an intro paragraph</Lead>
      <Large>Large — emphasised body</Large>
      <P>P — body copy</P>
      <Text>Text — the base</Text>
      <Span>Span — the base, inline</Span>
      <Small>Small — a dense label</Small>
      <Muted>Muted — supporting text</Muted>
    </View>
  ),
};

/**
 * `Blockquote` is the one variant that is not a bare `Text`: React Native draws
 * no border on a text node, so the rule is a `View` and the quotation a `Text`
 * inside it. That is also why it takes `style` (container) and `textStyle`
 * (quotation) instead of `className`.
 */
export const Quotation: Story = {
  render: () => (
    <View style={{ gap: 12, maxWidth: 560 }}>
      <Blockquote>The rule is a real border, on every platform.</Blockquote>
      <Blockquote
        style={{ borderLeftWidth: 4 }}
        textStyle={{ fontStyle: 'normal', fontWeight: '600' }}>
        With the container and the text restyled separately.
      </Blockquote>
    </View>
  ),
};
