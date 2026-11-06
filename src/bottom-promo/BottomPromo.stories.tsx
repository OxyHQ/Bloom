import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomPromo } from './index';

const meta: Meta<typeof BottomPromo> = {
  id: 'blocks-bottom-promo',
  title: 'Composition/Layout/Bottom Promo',
  component: BottomPromo,
  args: {
    title: 'Don’t miss what’s happening',
    description: 'People on Mention are the first to know.',
    actionLabel: 'Sign In',
    onAction: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof BottomPromo>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { description: undefined },
};
