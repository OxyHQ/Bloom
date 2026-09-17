import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiProfileTemplate } from './AiProfileTemplate';

/**
 * The AI profile template: the floating sidebar, the profile card (cover,
 * contributions headline, stat tiles, heatmap), the agents bar chart with its
 * month switcher and the tokens line chart. Below 1024 the sidebar becomes the
 * reveal drawer, opened from the button on the profile card.
 */
const meta: Meta = {
  title: 'Templates/AI Profile',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** December, per the design. */
export const Default: Story = {
  render: () => <AiProfileTemplate />,
};

/** Another month: the bars and the headline swap, the rise replays. */
export const June: Story = {
  render: () => <AiProfileTemplate initialMonth={5} />,
};
