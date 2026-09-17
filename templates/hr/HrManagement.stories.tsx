import type { Meta, StoryObj } from '@storybook/react-vite';

import { HrTemplate } from './HrTemplate';

/**
 * The HR Management template: the dashboard shell with headcount KPIs, recent
 * hires, the hiring pipeline, the team engagement radar, hires vs. attrition,
 * the team breakdown and the employees data table. Below 1280 the chart row
 * reflows to two columns (the radar spanning both), below 768 to one; below
 * 1024 the sidebar becomes the page-slide drawer.
 */
const meta: Meta = {
  title: 'Templates/HR Management',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <HrTemplate />,
};
