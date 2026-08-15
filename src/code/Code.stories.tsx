import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, Pre } from './index';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Components/Code',
};

export default meta;

type Story = StoryObj;

/**
 * `Code` is INLINE monospace — an identifier, a flag, a key inside a sentence.
 * It renders a real `<code>` element on web and a monospace `Text` on native,
 * so a screen reader and a browser's find-in-page both treat it as text rather
 * than as decoration.
 */
export const Inline: Story = {
  render: () => (
    <View style={{ width: 420, gap: 12 }}>
      <Text>
        Pass <Code>variant="outlined"</Code> to draw the border, and{' '}
        <Code>radius</Code> to pick the rung.
      </Text>
      <Text>
        The token is <Code>--primary</Code>; reference it as <Code>var(--primary)</Code>.
      </Text>
    </View>
  ),
};

/**
 * `Pre` is a BLOCK: it keeps its own line breaks and indentation and scrolls
 * horizontally rather than wrapping, because a wrapped command is a command
 * someone will copy wrong.
 */
export const Block: Story = {
  render: () => (
    <View style={{ width: 420 }}>
      <Pre>{`bun add @oxyhq/bloom
bun run build
bun run test`}</Pre>
    </View>
  ),
};

/** A long line: the block scrolls instead of reflowing. */
export const LongLine: Story = {
  render: () => (
    <View style={{ width: 420 }}>
      <Pre>{`bunx storybook dev -p 6006 --no-open --quiet # one very long line that should not wrap`}</Pre>
    </View>
  ),
};
