import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { Sidebar, type SidebarSize, type SidebarTree } from '../sidebar';
import { SIDEBAR_METRICS } from '../sidebar/metrics';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { typeScale } from '../typography/scale';

const SIZES: SidebarSize[] = ['sm', 'md', 'lg'];

const TREE: SidebarTree[] = [
  {
    key: 'recent',
    label: 'Recently viewed',
    items: [{ key: 'loft', label: 'Loft in Gracia', meta: '2h' }],
  },
  {
    key: 'saved',
    label: 'Saved',
    folders: [
      {
        key: 'shortlist',
        label: 'Shortlist',
        defaultOpen: true,
        items: [{ key: 'flat', label: 'Two-bed flat', meta: '1d' }],
      },
    ],
  },
  { key: 'empty', label: 'Archive', emptyLabel: 'Nothing archived' },
  { key: 'busy', label: 'Syncing', loading: true },
  { key: 'broken', label: 'Failing', error: 'Could not load' },
];

const NAV = [{ key: 'home', label: 'Home', icon: RiHome4Line }];

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

describe('sidebar tree section follows the sidebar size metrics', () => {
  const priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    global.cancelAnimationFrame = jest.fn();
  });
  afterAll(() => {
    global.cancelAnimationFrame = priorCancel;
  });

  it.each(SIZES)('draws label, rows, meta, empty and status text at %s metrics', (size) => {
    const { tree, row } = SIDEBAR_METRICS[size];
    const view = render(
      <BloomThemeProvider mode="light">
        <Sidebar size={size} items={NAV} tree={TREE} showSearch={false} showThemeToggle={false} />
      </BloomThemeProvider>,
    );
    const px = (variant: Parameters<typeof typeScale>[0]) => typeScale(variant).fontSize;
    expect(fontSizeOf(view.getByText('Recently viewed'))).toBe(px(tree.label));
    expect(fontSizeOf(view.getByText('Loft in Gracia'))).toBe(px(tree.label));
    expect(fontSizeOf(view.getByText('Shortlist'))).toBe(px(tree.label));
    expect(fontSizeOf(view.getByText('Two-bed flat'))).toBe(px(tree.label));
    expect(fontSizeOf(view.getByText('2h'))).toBe(px(tree.meta));
    expect(fontSizeOf(view.getByText('1d'))).toBe(px(tree.meta));
    expect(fontSizeOf(view.getByText('Nothing archived'))).toBe(px(tree.status));
    expect(fontSizeOf(view.getByText('Loading…'))).toBe(px(tree.status));
    expect(fontSizeOf(view.getByText('Could not load'))).toBe(px(tree.status));
    // The tree is never set larger than the main rows of the same size.
    expect(px(tree.label)).toBeLessThanOrEqual(px(row.label));
    expect(tree.icon).toBeLessThanOrEqual(row.icon);
    expect(tree.padding).toBeLessThanOrEqual(row.padding);
  });

  it('steps the tree down with the size', () => {
    const px = (s: SidebarSize) => typeScale(SIDEBAR_METRICS[s].tree.label).fontSize;
    expect(px('sm')).toBeLessThan(px('md'));
    expect(px('md')).toBeLessThan(px('lg'));
    expect(SIDEBAR_METRICS.sm.tree.icon).toBeLessThan(SIDEBAR_METRICS.md.tree.icon);
    expect(SIDEBAR_METRICS.md.tree.icon).toBeLessThan(SIDEBAR_METRICS.lg.tree.icon);
  });

  it.each(SIZES)('gives a row with a description a taller leading box at %s', (size) => {
    const { tree } = SIDEBAR_METRICS[size];
    const Picture = ({ testID }: { testID: string }) => <View testID={testID} />;
    const view = render(
      <BloomThemeProvider mode="light">
        <Sidebar
          size={size}
          items={NAV}
          showSearch={false}
          showThemeToggle={false}
          tree={[
            {
              key: 'agents',
              label: 'Agents',
              items: [
                {
                  key: 'contact',
                  label: 'Nadia',
                  description: 'Hello',
                  leading: <Picture testID="with-description" />,
                },
                { key: 'plain', label: 'Chat', leading: <Picture testID="without-description" /> },
              ],
            },
          ]}
        />
      </BloomThemeProvider>,
    );
    // The width of the nearest ancestor that sets one: the leading box.
    const boxWidth = (testID: string) => {
      for (let node = view.getByTestId(testID).parent; node; node = node.parent) {
        const widths = ([] as unknown[])
          .concat(node.props.style ?? [])
          .flat(4)
          .flatMap((entry) =>
            entry && typeof entry === 'object' && 'width' in entry
              ? [(entry as { width: number }).width]
              : [],
          );
        if (widths.length > 0) return widths[0];
      }
      return undefined;
    };
    expect(boxWidth('with-description')).toBe(tree.avatar);
    expect(boxWidth('without-description')).toBe(tree.icon);
    expect(tree.avatar).toBeGreaterThan(tree.icon);
  });

  it.each(['SidebarTreeSection.tsx', 'SidebarFolder.tsx'])(
    '%s hardcodes no body-*/caption-* variant or glyph size',
    (file) => {
      const source = readFileSync(join(__dirname, '..', 'sidebar', file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(source).not.toMatch(/variant="(body|caption|headline|title)/);
      expect(source).not.toMatch(/(width|height)=\{(16|18|20|22)\}/);
    },
  );
});
