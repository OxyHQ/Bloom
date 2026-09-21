import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarketingDashboardTemplate } from './MarketingDashboardTemplate';

/**
 * The marketing dashboard template: the responsive sidebar (adaptive navigation below
 * 1024), KPI cards (one per row below 640), acquisition funnel / spend by
 * channel / traffic sources (3 across from 1280, 2 + 1 from 768, stacked
 * below), ad spend vs. ROAS and visitors (2 across from 1024) and the
 * campaigns table.
 */
const meta: Meta<typeof MarketingDashboardTemplate> = {
  component: MarketingDashboardTemplate,
  title: 'Templates/Marketing Dashboard',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof MarketingDashboardTemplate>;

export const Default: Story = {
  render: () => <MarketingDashboardTemplate />,
};
