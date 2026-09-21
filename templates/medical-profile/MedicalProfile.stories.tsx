import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MedicalProfileTemplate } from './MedicalProfileTemplate';

/**
 * The medical profile template: the floating sidebar, the breadcrumb header
 * with notifications, six medical cards (patient, steps, sleep score, most
 * active days, activity rings, important alerts) and the patients table.
 * Cards flow one per row, two from 768, three from 1280; below 1024 the
 * navigation adapts to the available width.
 */
const meta: Meta<typeof MedicalProfileTemplate> = {
  component: MedicalProfileTemplate,
  title: 'Templates/Medical Profile',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof MedicalProfileTemplate>;

/** The Figma frame: today (Jul 10) selected, the 29 Jun - 5 Jul week, page 1 of the roster. */
export const Default: Story = {
  render: () => <MedicalProfileTemplate />,
};
