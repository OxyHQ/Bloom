import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiProfileTemplate } from './AiProfileTemplate';
import { MONTH_NAMES } from './demo-data';

/**
 * The AI profile template: the floating sidebar, the profile card (cover,
 * contributions headline, stat tiles, heatmap), the agents bar chart with its
 * month switcher and the tokens line chart. Navigation adapts from bottom bar
 * to rail to sidebar with the available shell width.
 */
const meta: Meta<typeof AiProfileTemplate> = {
  component: AiProfileTemplate,
  args: { initialMonth: 11 },
  argTypes: { initialMonth: { name: 'Month', control: { type: 'select', labels: Object.fromEntries(MONTH_NAMES.map((name, month) => [month, name])) }, options: Array.from({ length: 12 }, (_, month) => month), description: 'Changing the month restarts the profile demo.' } },
  render: args => <AiProfileTemplate key={args.initialMonth} {...args} />,
  title: 'Templates/AI Profile',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof AiProfileTemplate>;

/** December, per the design. */
export const Default: Story = {};

/** Another month: the bars and the headline swap, the rise replays. */
export const June: Story = {
  args: { initialMonth: 5 },
};
