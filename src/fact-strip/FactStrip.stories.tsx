import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Rating } from '../rating';
import { FactStrip } from './index';

const meta: Meta<typeof FactStrip> = {
  id: 'base-fact-strip',
  title: 'Components/Data Display/Fact Strip',
  component: FactStrip,
};

export default meta;

type Story = StoryObj<typeof FactStrip>;

const FACTS = [
  {
    key: 'ratings',
    label: '1.2K ratings',
    value: '4.7',
    caption: <Rating value={4.7} variant="stars" showValue={false} starSize={11} size="sm" />,
  },
  { key: 'category', label: 'Category', value: 'Productivity', caption: 'Work' },
  { key: 'released', label: 'Released', value: '2026', caption: 'March' },
  { key: 'languages', label: 'Languages', value: 'EN', caption: '+ 12 more' },
  { key: 'website', label: 'Website', value: 'tidewater.app', caption: 'Developer' },
];

/** Wide: the facts share the width. */
export const Wide: Story = {
  render: () => (
    <View style={{ maxWidth: 900 }}>
      <FactStrip items={FACTS} accessibilityLabel="About this app" />
    </View>
  ),
};

/** Narrow: the facts keep their width and the strip scrolls sideways. */
export const Narrow: Story = {
  render: () => (
    <View style={{ width: 360 }}>
      <FactStrip items={FACTS} contentInset={16} accessibilityLabel="About this app" />
    </View>
  ),
};
