import type { Meta, StoryObj } from '@storybook/react-vite';

import { HomeDashboardTemplate } from './HomeDashboardTemplate';

/**
 * The Home Dashboard template: the floating sidebar, the breadcrumb header with
 * notifications, recent hires beside the earnings chart, the revenue line chart
 * beside the contributions grid, the KPI cards and the customers data table.
 * Below 1280 the first row stacks, below 1024 the second row stacks and the
 * navigation adapts to the available width.
 */
const meta: Meta<typeof HomeDashboardTemplate> = {
  component: HomeDashboardTemplate,
  title: 'Templates/Home Dashboard',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof HomeDashboardTemplate>;

export const Default: Story = {
  render: () => <HomeDashboardTemplate />,
};

/** Reference views of the shared tonal surfaces, using the real app composition. */
export const TonalOlive: Story = {
  ...Default,
  globals: { theme: 'dark', colorPreset: 'olive' },
};

export const TonalCopper: Story = {
  ...Default,
  globals: { theme: 'dark', colorPreset: 'copper-field' },
};
