import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExpandableText } from './index';

const meta: Meta<typeof ExpandableText> = {
  id: 'base-expandable-text',
  title: 'Components/Typography/Expandable Text',
  component: ExpandableText,
};

export default meta;

type Story = StoryObj<typeof ExpandableText>;

const LONG =
  'Tidewater plans your week around what matters. Drag a task onto a day and it finds a slot; ' +
  'move a meeting and everything after it shifts with it. Shared calendars stay in step, ' +
  'reminders arrive when you can act on them, and the week ahead fits on one screen. ' +
  'Everything you write stays on your devices unless you choose to share it.';

/** A product description: three lines, then "More" at the end of the last one. */
export const Inline: Story = {
  render: () => (
    <View style={{ maxWidth: 420 }}>
      <ExpandableText toggle="inline">{LONG}</ExpandableText>
    </View>
  ),
};

/** A review: four lines and a "Show more" / "Show less" link under them. */
export const Below: Story = {
  render: () => (
    <View style={{ maxWidth: 420 }}>
      <ExpandableText numberOfLines={4}>{LONG}</ExpandableText>
    </View>
  ),
};

/** Short text draws no control: nothing is hidden. */
export const Short: Story = {
  render: () => (
    <View style={{ maxWidth: 420 }}>
      <ExpandableText toggle="inline">Plans your week.</ExpandableText>
    </View>
  ),
};
