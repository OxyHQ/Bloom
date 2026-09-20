import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SankeyChartCard } from '../chart-cards/SankeyChartCard';
import type { SankeyLinkDatum, SankeyNodeDatum } from '../chart-cards/SankeyChartCard';
import { hitTestSankey, layoutSankey, placeSankeyLabels, sankeyLinkPath, sankeyRibbonPath, sankeyNodePath } from '../chart-cards/sankey-layout';

// Demo week. Every expected pixel was read off recharts 3.10's SVG for that
// card at 480 wide (448 × 344 plot).
const NAMES = ['Focus', 'Meetings', 'Breaks', 'Admin', 'Learning', 'Browsing', 'Writing', 'Messaging', 'Productivity', 'Email', 'Video calls', 'Everything else'];
const NODES: SankeyNodeDatum[] = NAMES.map((name, i) => (i < 5 ? { name, hue: ([7, 5, 8, 6, 3] as const)[i] } : { name, color: 'neutral' }));
const RAW: [string, string, number][] = [
  ['Focus', 'Browsing', 10.4], ['Focus', 'Writing', 8.2], ['Focus', 'Messaging', 6.1], ['Focus', 'Productivity', 5.0], ['Focus', 'Email', 2.3],
  ['Meetings', 'Video calls', 9.6], ['Meetings', 'Everything else', 3.8], ['Meetings', 'Writing', 3.0], ['Meetings', 'Email', 1.6],
  ['Breaks', 'Everything else', 5.6], ['Breaks', 'Browsing', 3.6], ['Breaks', 'Video calls', 2.8],
  ['Admin', 'Productivity', 5.2], ['Admin', 'Writing', 4.0], ['Admin', 'Messaging', 3.2], ['Admin', 'Everything else', 1.6],
  ['Learning', 'Browsing', 4.6], ['Learning', 'Email', 3.4], ['Learning', 'Messaging', 2.0],
];
const LINKS: SankeyLinkDatum[] = RAW.map(([source, target, value]) => ({ source, target, value }));
const INDEXED = RAW.map(([s, t, value]) => ({ source: NAMES.indexOf(s), target: NAMES.indexOf(t), value }));
const OPTIONS = { width: 448, height: 344, margin: { top: 2, bottom: 2, left: 88, right: 150 }, nodeWidth: 12, nodePadding: 14, linkCurvature: 0.55, iterations: 32, sort: false };

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown) {
  act(() => {
    fireEvent(getByTestId('sankey-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 448, height: 344 } } });
  });
}

describe('sankey layout matches recharts', () => {
  const layout = layoutSankey(12, INDEXED, OPTIONS);

  it('draws the ribbons exactly as recharts', () => {
    expect(sankeyLinkPath(layout.links[0]!)).toBe('M100,45.47906976744184 C202.3,45.47906976744184 183.7,17.479069767441846 286,17.479069767441846');
    expect(layout.links[0]!.width).toBeCloseTo(30.95813953488372, 9);
    expect(sankeyLinkPath(layout.links[5]!)).toBe('M100,167.2372093023256 C202.3,167.2372093023256 183.7,272.6325581395349 286,272.6325581395349');
    expect(sankeyLinkPath(layout.links[18]!)).toBe('M100,328.90232558139536 C202.3,328.90232558139536 183.7,161.27441860465117 286,161.27441860465117');
  });

  it('places the nodes and rounds only their outward side', () => {
    const focus = layout.nodes[0]!;
    expect(sankeyNodePath(focus.x, focus.y, focus.width, focus.height, true, false)).toBe(
      'M93,29.999999999999986 H100  V125.25581395348836  H93 A5,5 0 0 1 88,120.25581395348836 V34.999999999999986 A5,5 0 0 1 93,29.999999999999986 Z',
    );
    const last = layout.nodes[11]!;
    expect(sankeyNodePath(last.x, last.y, last.width, last.height, false, true)).toBe(
      'M286,309.25581395348837 H293 A5,5 0 0 1 298,314.25581395348837 V337 A5,5 0 0 1 293,342 H286  V309.25581395348837  Z',
    );
  });

  it('hit-tests nodes first, then the topmost ribbon', () => {
    expect(hitTestSankey(layout, 94, 165)).toEqual({ type: 'node', index: 1 });
    expect(hitTestSankey(layout, 193, 220)).toEqual({ type: 'link', index: 5 });
    expect(hitTestSankey(layout, 20, 20)).toBeNull();
  });
});

describe('SankeyChartCard', () => {
  it('keeps the 480-tall card and headlines the hours out of the sources', () => {
    const { getByTestId, getByText } = renderCard(
      <SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} axisLabels={['Category', 'App']} range="This week" />,
    );
    expect(resolvedStyle(getByTestId('sankey').props.style)).toMatchObject({ height: 480, borderRadius: 16, paddingBottom: 12 });
    expect(getByTestId('sankey-headline').props.children).toBe('86h');
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('App')).toBeTruthy();
  });

  it('labels sources with their value and sinks with their share', () => {
    const { getByTestId, getByText } = renderCard(<SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} />);
    layoutPlot(getByTestId);
    expect(getByText('32h')).toBeTruthy();
    expect(getByText(' · 22%')).toBeTruthy();
    // "Focus" baseline at node middle − 2 (77.63 + 2 − 2 margin-free): Text top = baseline − 13.73.
    expect(resolvedStyle(getByTestId('sankey-label-0').props.style).top).toBeCloseTo(75.628 - 13.729, 2);
    expect(resolvedStyle(getByTestId('sankey-label-0').props.style).right).toBe(448 - 80);
  });

  it('swaps the header to a hovered node or link and fades the rest', () => {
    const onActiveItemChange = jest.fn();
    const { getByTestId, getByText, getAllByText } = renderCard(
      <SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} delta={0.1} onActiveItemChange={onActiveItemChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('sankey-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toContain('Tracked time flow diagram: Focus, Meetings');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 94, offsetY: 165 } });
    });
    expect(onActiveItemChange).toHaveBeenLastCalledWith({ type: 'node', index: 1 });
    expect(getAllByText('Meetings')).toHaveLength(2);
    expect(getByTestId('sankey-headline').props.children).toBe('18h');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 193, offsetY: 220 } });
    });
    expect(getByText('Meetings → Video calls')).toBeTruthy();
    expect(getByTestId('sankey-headline').props.children).toBe('9.6h');
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveItemChange).toHaveBeenLastCalledWith(null);
  });

  it('dims links to 0.08 and unconnected nodes to 35% for a controlled node', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(
      <SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} activeItem={{ type: 'node', index: 1 }} />,
    );
    layoutPlot(getByTestId);
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as { props: Record<string, unknown> }[];
    const ribbons = paths.filter((p) => p.props.fillOpacity !== undefined);
    expect(ribbons[5]!.props.fillOpacity).toBe(0.7);
    expect(ribbons[0]!.props.fillOpacity).toBe(0.08);
    const groups = UNSAFE_getAllByType('G' as never) as unknown as { props: Record<string, unknown> }[];
    const opacities = groups.map((g) => g.props.opacity).filter((o) => o !== undefined);
    expect(opacities.slice(0, 5)).toEqual([0.35, 1, 0.35, 0.35, 0.35]);
  });

  it('reads a range: its links override the props', () => {
    const { getByTestId } = renderCard(
      <SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} ranges={[{ id: 'a', label: 'Half', links: LINKS.map((l) => ({ ...l, value: l.value / 2 })) }]} />,
    );
    expect(getByTestId('sankey-headline').props.children).toBe('43h');
  });
});


describe('Sankey narrow cards', () => {
  it.each([288, 358])('keeps full adjacent labels and readable flow at %ipx', width => {
    const { getByTestId, getByText, queryByTestId, UNSAFE_getAllByType } = renderCard(<SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} />);
    fireEvent(getByTestId('sankey-plot'), 'layout', { nativeEvent: { layout: { width, height: 352, x: 0, y: 0 } } });
    expect(queryByTestId('sankey-legend')).toBeNull();
    for (const [index, name] of NAMES.entries()) {
      expect(getByText(name)).toBeTruthy();
      expect(getByTestId(`sankey-label-${index}`).props.numberOfLines).toBeUndefined();
      expect(resolvedStyle(getByTestId(`sankey-label-${index}`).props.style).fontSize).toBe(13);
      const labelBox = resolvedStyle(getByTestId(`sankey-label-box-${index}`).props.style);
      expect(labelBox.width).toBeGreaterThan(50);
      expect(labelBox.top).toBeGreaterThanOrEqual(0);
    }
    expect(getByText('32h')).toBeTruthy();
    const plotStyle = resolvedStyle(getByTestId('sankey-plot').props.style);
    expect(plotStyle.flex).toBeUndefined();
    expect(plotStyle.flexBasis).toBe('auto');
    expect(plotStyle.flexShrink).toBe(0);
    const paths = UNSAFE_getAllByType(require('react-native-svg').Path);
    const firstRibbon = paths.find(path => path.props.fillOpacity !== undefined)!;
    const start = Number(resolvedStyle(getByTestId('sankey-label-box-0').props.style).width) + 20;
    const end = width - Number(resolvedStyle(getByTestId('sankey-label-box-5').props.style).width) - 20;
    expect(firstRibbon.props.d).toMatch(new RegExp(`^M${start},`));
    expect(firstRibbon.props.d).toContain(` L${end},`);
    expect(firstRibbon.props.d).toMatch(/ Z$/);
    expect(end - start).toBeGreaterThan(100);
  });

  it('grows the plot for measured wrapped names and restores desktop on resize', () => {
    const { getByTestId, queryByTestId } = renderCard(<SankeyChartCard testID="sankey" nodes={NODES} links={LINKS} />);
    fireEvent(getByTestId('sankey-plot'), 'layout', { nativeEvent: { layout: { width: 288, height: 352 } } });
    for (let index = 5; index < NODES.length; index++) {
      fireEvent(getByTestId(`sankey-label-box-${index}`), 'layout', { nativeEvent: { layout: { height: 100 } } });
    }
    expect(resolvedStyle(getByTestId('sankey-plot').props.style).height).toBeGreaterThanOrEqual(7 * 108);
    layoutPlot(getByTestId);
    expect(queryByTestId('sankey-label-box-0')).toBeNull();
    expect(resolvedStyle(getByTestId('sankey').props.style).height).toBe(480);
  });

  it('packs small neighbouring nodes without overlapping full labels', () => {
    const labels = [{ index: 0, center: 6, height: 60 }, { index: 1, center: 22, height: 80 }, { index: 2, center: 198, height: 40 }];
    const tops = placeSankeyLabels(labels, 220);
    expect(tops[0]).toBeGreaterThanOrEqual(0);
    expect(tops[1]! - (tops[0]! + 60)).toBeGreaterThanOrEqual(8);
    expect(tops[2]! - (tops[1]! + 80)).toBeGreaterThanOrEqual(8);
    expect(tops[2]! + 40).toBeLessThanOrEqual(220);
  });
});


describe('Sankey filled ribbons', () => {
  const link = { index: 0, source: 0, target: 1, value: 20, sourceX: 0, targetX: 40, sourceControlX: 22, targetControlX: 18, sourceY: 30, targetY: 130, width: 60 };
  it('joins node top/bottom edges with a closed band even when thicker than its span', () => {
    expect(sankeyRibbonPath(link)).toBe('M0,0 C22,0 18,100 40,100 L40,160 C18,160 22,60 0,60 Z');
  });
  it('hit-tests the filled band, excluding the former steep stroke bulges', () => {
    const layout = { nodes: [], links: [link] };
    expect(hitTestSankey(layout, 20, 80)).toEqual({ type: 'link', index: 0 });
    expect(hitTestSankey(layout, 20, 109)).toEqual({ type: 'link', index: 0 });
    expect(hitTestSankey(layout, 20, 115)).toBeNull();
    expect(hitTestSankey(layout, -1, 30)).toBeNull();
    expect(hitTestSankey(layout, 41, 130)).toBeNull();
  });
});
