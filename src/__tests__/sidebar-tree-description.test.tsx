import { render } from '@testing-library/react-native';
import React from 'react';
import { Sidebar, type SidebarSize, type SidebarTree } from '../sidebar';
import { SIDEBAR_METRICS } from '../sidebar/metrics';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { typeScale } from '../typography/scale';

const SIZES: SidebarSize[] = ['sm', 'md', 'lg'];

const TREE: SidebarTree[] = [
  {
    key: 'agents',
    label: 'Agents',
    items: [
      { key: 'pepe', label: 'Pepe', description: 'Sent the quarterly notes', meta: '2h' },
      { key: 'ana', label: 'Ana' },
    ],
  },
];

function fontSizeOf(node: { props: { style?: unknown } }): number | undefined {
  const flat = ([] as unknown[]).concat(node.props.style ?? []).flat(4);
  let size: number | undefined;
  for (const entry of flat) {
    if (entry && typeof entry === 'object' && 'fontSize' in entry) {
      size = (entry as { fontSize: number }).fontSize;
    }
  }
  return size;
}

describe('tree rows with a description', () => {
  it.each(SIZES)('draw it under the label, one line, at the %s tree metrics', (size) => {
    const view = render(
      <BloomThemeProvider mode="light">
        <Sidebar size={size} items={[]} tree={TREE} showSearch={false} showThemeToggle={false} />
      </BloomThemeProvider>,
    );
    const description = view.getByText('Sent the quarterly notes');
    expect(description.props.numberOfLines).toBe(1);
    expect(fontSizeOf(description)).toBe(typeScale(SIDEBAR_METRICS[size].tree.meta).fontSize);
    // The label and the chip are still there beside it.
    expect(view.getByText('Pepe')).toBeTruthy();
    expect(view.getByText('2h')).toBeTruthy();
    expect(view.getByLabelText('Pepe, Sent the quarterly notes, 2h')).toBeTruthy();
  });

  it('leave a row without one as it was: its label alone', () => {
    const view = render(
      <BloomThemeProvider mode="light">
        <Sidebar items={[]} tree={TREE} showSearch={false} showThemeToggle={false} />
      </BloomThemeProvider>,
    );
    expect(view.getByText('Ana')).toBeTruthy();
    expect(view.getAllByText('Sent the quarterly notes')).toHaveLength(1);
  });
});
