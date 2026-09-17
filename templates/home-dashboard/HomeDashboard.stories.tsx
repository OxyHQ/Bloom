import type { Meta, StoryObj } from '@storybook/react-vite';

import { HomeDashboardTemplate } from './HomeDashboardTemplate';

/**
 * The Home Dashboard template: the floating sidebar, the breadcrumb header with
 * notifications, recent hires beside the earnings chart, the revenue line chart
 * beside the contributions grid, the KPI cards and the customers data table.
 * Below 1280 the first row stacks, below 1024 the second row stacks and the
 * sidebar becomes the page-slide drawer.
 */
const meta: Meta = {
  title: 'Templates/Home Dashboard',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <HomeDashboardTemplate />,
};
