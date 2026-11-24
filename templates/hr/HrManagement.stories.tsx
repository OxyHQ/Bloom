import type { Meta, StoryObj } from '@storybook/react-vite';

import { HrTemplate } from './HrTemplate';

/**
 * The HR Management template: the dashboard shell with headcount KPIs, the
 * hiring pipeline, the team engagement radar, hires vs. attrition, the team
 * breakdown and the employees data table. Below 768 the chart row reflows to
 * one column; below 1024 the navigation adapts to the available width.
 */
const meta: Meta<typeof HrTemplate> = {
  component: HrTemplate,
  title: 'Templates/HR Management',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof HrTemplate>;

export const Default: Story = {
  render: () => <HrTemplate />,
};
