import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsSelect } from './SettingsSelect';

/** The compact select a settings row puts on its right, at each size. */
function Demo({ size }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const [value, setValue] = useState('always');
  return (
    <SettingsSelect
      label="Autoplay videos"
      value={value}
      onChange={setValue}
      size={size}
      items={[
        { value: 'always', label: 'Always' },
        { value: 'wifi', label: 'On Wi-Fi' },
        { value: 'never', label: 'Never' },
      ]}
    />
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Components/SettingsSelect',
  component: Demo,
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
