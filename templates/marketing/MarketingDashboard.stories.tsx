import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarketingDashboardTemplate } from './MarketingDashboardTemplate';

/**
 * The marketing dashboard template: the floating sidebar (a reveal drawer below
 * 1024), KPI cards (one per row below 640), acquisition funnel / spend by
 * channel / traffic sources (3 across from 1280, 2 + 1 from 768, stacked
 * below), ad spend vs. ROAS and visitors (2 across from 1024) and the
 * campaigns table.
 */
const meta: Meta = {
  title: 'Templates/Marketing Dashboard',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <MarketingDashboardTemplate />,
};
