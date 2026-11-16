import type { Meta, StoryObj } from '@storybook/react-vite';

import { FinanceDashboardTemplate } from './FinanceDashboardTemplate';

/**
 * The finance dashboard template: the responsive sidebar (adaptive navigation below
 * 1024), KPI cards, the cash-flow sankey, spending rings / portfolio bubbles /
 * daily spending heatmap (3 across from 1280, 2 + 1 from 768, stacked below)
 * and the transactions table.
 */
const meta: Meta<typeof FinanceDashboardTemplate> = {
  component: FinanceDashboardTemplate,
  title: 'Templates/Finance Dashboard',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof FinanceDashboardTemplate>;

export const Default: Story = {
  render: () => <FinanceDashboardTemplate />,
};
