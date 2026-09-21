import React from 'react';
import { render } from '@testing-library/react-native';
import { Sidebar, SIDEBAR_METRICS } from '../sidebar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiHome5Line } from '../icons/remix/RiHome5Line';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const sizes = ['sm', 'md', 'lg'] as const;
const surfaces = ['plain', 'card', 'docked'] as const;
for (const size of sizes) for (const surface of surfaces) for (const action of [false, true]) {
  it(`${size}/${surface}/action=${action}: retains circular rows and one shared compact centre`, () => {
    const metrics = SIDEBAR_METRICS[size];
    const lane = action ? 50 : metrics.row.square;
    const border = surface === 'card' ? 2 : surface === 'docked' ? 1 : 0;
    const tree = render(<BloomThemeProvider fonts={false}><Sidebar testID="geometry" size={size} surface={surface} collapsed
      items={[{ key: 'home', label: 'Home', icon: RiHome5Line }]}
      logo={{ icon: <RiHome5Line />, wordmark: 'Bloom' }}
      primaryAction={action ? { label: 'Create', icon: RiAddLine, onPress: () => {} } : undefined}
    /></BloomThemeProvider>);
    const root = resolvedStyle(tree.getByTestId('geometry').props.style);
    expect(root.width).toBe(lane + 14 + border);
    const row = resolvedStyle(tree.getByTestId('sidebar-item-home').props.style);
    const rowWidth = lane - Number(row.marginLeft) - Number(row.marginRight);
    expect(rowWidth).toBe(metrics.row.square);
    expect(row.height).toBe(rowWidth);
    expect(Number(row.marginLeft) + Number(row.paddingLeft) + metrics.row.icon / 2).toBe(lane / 2);
    expect(resolvedStyle(tree.getByTestId('sidebar-header-control').props.style).width).toBe(lane);
    expect(resolvedStyle(tree.getByTestId('sidebar-logo-icon').props.style).width).toBe(lane);
    const search = resolvedStyle(tree.getByTestId('sidebar-search').props.style);
    expect(lane - Number(search.marginLeft) - Number(search.marginRight)).toBe(search.height);
    expect(Number(search.marginLeft) + Number(search.paddingLeft) + metrics.row.icon / 2).toBe(lane / 2);
    if (action) {
      const fab = resolvedStyle(tree.getByTestId('geometry-primary-action').props.style);
      expect(fab.height).toBe(50);
      expect(fab.minWidth).toBe(50);
    }
  });
}
