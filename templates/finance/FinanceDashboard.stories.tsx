import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FinanceDashboardTemplate } from './FinanceDashboardTemplate';

/**
 * The finance dashboard template: the floating sidebar (a reveal drawer below
 * 1024), KPI cards, the cash-flow sankey, spending rings / portfolio bubbles /
 * daily spending heatmap (3 across from 1280, 2 + 1 from 768, stacked below)
 * and the transactions table.
 */
const meta: Meta = {
  title: 'Templates/Finance Dashboard',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <FinanceDashboardTemplate />,
};
