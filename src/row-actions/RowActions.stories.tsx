import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  RiDeleteBin6Line,
  RiDownload2Line,
  RiEditLine,
  RiFileCopyLine,
  RiUserLine,
} from '../icons/remix';
import { RowActionButton, RowActions } from './index';

const meta: Meta<typeof RowActions> = {
  id: 'base-row-actions',
  title: 'Components/Data Display/Row Actions',
  component: RowActions,
  args: {
    name: 'Invoice.pdf',
    menuAppearance: 'plain',
    menuWidth: 220,
  },
  argTypes: {
    menuAppearance: { control: 'select', options: ['plain', 'outline'] },
    menuWidth: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof RowActions>;

export const Default: Story = {
  render: (args) => (
    <View style={{ width: 160 }}>
      <RowActions
        {...args}
        actions={[
          { icon: RiDeleteBin6Line, label: 'Delete', accessibilityLabel: `Delete ${args.name}` },
          { icon: RiEditLine, label: 'Edit' },
        ]}
        menu={[
          { icon: RiUserLine, label: 'View owner' },
          { icon: RiFileCopyLine, label: 'Copy link' },
          { icon: RiDownload2Line, label: 'Download' },
        ]}
      />
    </View>
  ),
};

export const MenuOnly: Story = {
  args: { menuAppearance: 'outline', menuWidth: 200 },
  render: (args) => (
    <View style={{ width: 160 }}>
      <RowActions {...args} menu={[{ label: 'Rename' }, { label: 'Move to folder' }]} />
    </View>
  ),
};

export const SingleButton: Story = {
  parameters: { controls: { disable: true } },
  render: () => <RowActionButton icon={RiEditLine} label="Edit" />,
};
