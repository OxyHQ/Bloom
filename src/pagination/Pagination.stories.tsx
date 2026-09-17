import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination } from './index';

const meta: Meta<typeof Pagination> = {
  title: 'Base/Pagination',
  component: Pagination,
};

export default meta;

type Story = StoryObj<typeof Pagination>;

function Controlled({ initial, totalPages, width = 620 }: { initial: number; totalPages: number; width?: number }) {
  const [page, setPage] = useState(initial);
  return (
    <View style={{ width }}>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </View>
  );
}

/** Interactive: click pages, Previous and Next. */
export const Basic: Story = {
  render: () => <Controlled initial={1} totalPages={10} />,
};

/**
 * First page (Previous disabled), a middle page (both ellipses), the last page
 * (Next disabled), a short range with no ellipsis, and the compact layout below
 * 420px (icon-only Previous/Next, no siblings).
 */
export const Matrix: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Controlled initial={1} totalPages={10} />
      <Controlled initial={5} totalPages={10} />
      <Controlled initial={10} totalPages={10} />
      <Controlled initial={2} totalPages={4} />
      <Controlled initial={5} totalPages={10} width={360} />
    </View>
  ),
};
