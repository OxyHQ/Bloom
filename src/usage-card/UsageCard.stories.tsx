import type { Meta, StoryObj } from '@storybook/react-vite';
import { UsageCard } from './index';
const meta: Meta<typeof UsageCard> = { title: 'Data/Usage Card', component: UsageCard };
export default meta;
type Story = StoryObj<typeof UsageCard>;
export const Storage: Story = {
  args: {
    title: 'Storage',
    usage: {
      max: 100,
      segments: [
        { label: 'Photos', value: 40 },
        { label: 'Documents', value: 12 },
      ],
    },
    formatValue: (value) => `${value} GB`,
  },
};
export const Unavailable: Story = {
  args: { title: 'Storage', fallback: 'Usage is temporarily unavailable' },
};
