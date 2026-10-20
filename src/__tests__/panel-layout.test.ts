import { panelEnvelope, resolvePanelTracks, resizePanelPair } from '../app-shell/panel-layout';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
const feed: AppShellPanelLayout = {
  gap: 0,
  panels: [
    { id: 'main', width: 620 },
    { id: 'context', width: 350, hideBelow: 990 },
  ],
};
describe('modular panel tracks', () => {
  it('fills spare deck room only for opted-in spans and preserves overflow and width limits', () => {
    const layout: AppShellPanelLayout = {
      mode: 'deck',
      panels: [
        { id: 'fixed', width: 300 },
        { id: 'first', width: 273, minWidth: 273, maxWidth: 350, span: 1 },
        { id: 'second', width: 273, minWidth: 273, span: 2 },
      ],
    };
    const expanded = resolvePanelTracks(layout, 1200, 1200, 8);
    expect(expanded[0]?.width).toBe(300);
    expect(expanded[1]?.width).toBe(350);
    expect(expanded[2]?.width).toBeCloseTo(534);
    expect(resolvePanelTracks(layout, 700, 700, 8).map((track) => track.width)).toEqual([
      300, 273, 273,
    ]);
    expect(
      resolvePanelTracks(
        { ...layout, panels: layout.panels.map((panel) => ({ ...panel, span: 0 })) },
        1200,
        1200,
        8,
      ).map((track) => track.width),
    ).toEqual([300, 273, 273]);
  });
  it('keeps the envelope while expanding and checks eligibility against the shell', () => {
    expect(panelEnvelope(feed, 1200, 0)).toBe(970);
    expect(panelEnvelope({ ...feed, expandedPanel: 'main' }, 1200, 0)).toBe(970);
    expect(resolvePanelTracks(feed, 970, 1200, 0).map((t) => t.width)).toEqual([620, 350]);
    expect(
      resolvePanelTracks({ ...feed, expandedPanel: 'main' }, 970, 1200, 0).map((t) => [
        t.width,
        t.visible,
      ]),
    ).toEqual([
      [970, true],
      [0, false],
    ]);
    expect(panelEnvelope(feed, 989, 0)).toBe(620);
  });
  it('weights flexible spans, including fractions, and redistributes max-clamped space', () => {
    const layout: AppShellPanelLayout = {
      panels: [
        { id: 'a', span: 0.5 },
        { id: 'b', span: 1.5, maxWidth: 500 },
      ],
    };
    expect(resolvePanelTracks(layout, 800, 1000, 0).map((t) => t.width)).toEqual([300, 500]);
  });
  it('collapses to the requested panel before violating split minima', () => {
    const layout: AppShellPanelLayout = {
      activePanel: 'b',
      panels: [
        { id: 'a', minWidth: 300 },
        { id: 'b', minWidth: 400, maxWidth: 500 },
      ],
    };
    expect(
      resolvePanelTracks(layout, 600, 1000, 8).map((t) => [t.width, t.visible, t.gap]),
    ).toEqual([
      [0, false, 0],
      [600, true, 0],
    ]);
  });
  it('keeps deck widths beyond the viewport and expands a deck panel to the viewport', () => {
    const layout: AppShellPanelLayout = {
      mode: 'deck',
      panels: [
        { id: 'a', width: 400 },
        { id: 'b', width: 400 },
      ],
    };
    expect(resolvePanelTracks(layout, 500, 500, 12).map((t) => t.width)).toEqual([400, 400]);
    expect(
      resolvePanelTracks({ ...layout, expandedPanel: 'b' }, 500, 500, 12).map((t) => t.width),
    ).toEqual([0, 500]);
  });
  it('resizes a pair within both bounds, preserving its total', () => {
    const a = { id: 'a', minWidth: 200, maxWidth: 600 },
      b = { id: 'b', minWidth: 300, maxWidth: 500 };
    expect(resizePanelPair(a, b, 400, 400, 900)).toEqual({ a: 500, b: 300 });
    expect(resizePanelPair(a, b, 400, 400, 0)).toEqual({ a: 300, b: 500 });
  });
  it('uses controlled widths and excludes hidden gaps', () => {
    const layout: AppShellPanelLayout = {
      panels: [
        { id: 'hidden', hideBelow: 1000 },
        { id: 'a', width: 300 },
        { id: 'b', width: 400 },
      ],
    };
    expect(resolvePanelTracks(layout, 708, 900, 8, { a: 350, b: 350 })).toEqual([
      { id: 'hidden', width: 0, visible: false, gap: 0 },
      { id: 'a', width: 350, visible: true, gap: 0 },
      { id: 'b', width: 350, visible: true, gap: 8 },
    ]);
  });
  it('rejects ambiguous ids', () => {
    expect(() => panelEnvelope({ panels: [{ id: 'same' }, { id: 'same' }] }, 1000, 8)).toThrow(
      'unique',
    );
    expect(() => panelEnvelope({ panels: [{ id: '' }] }, 1000, 8)).toThrow('nonempty');
  });
});

describe('vertical and responsive panel tracks', () => {
  it('resolves axis from the shell width and reserves only the widest stacked width', () => {
    const layout: AppShellPanelLayout = {
      axis: { base: 'vertical', lg: 'horizontal' },
      panels: [
        { id: 'a', width: 620, height: 200 },
        { id: 'b', width: 350, height: 300 },
      ],
    };
    expect(panelEnvelope(layout, 900, 8)).toBe(620);
    expect(panelEnvelope(layout, 1100, 8)).toBe(978);
    expect(
      panelEnvelope(
        { ...layout, panels: layout.panels.map((panel) => ({ ...panel, height: 900 })) },
        900,
        8,
      ),
    ).toBe(620);
    expect(resolvePanelTracks(layout, 600, 900, 8).map((track) => track.width)).toEqual([246, 346]);
  });
  it('distributes vertical spans and accepts controlled heights', () => {
    const layout: AppShellPanelLayout = {
      axis: 'vertical',
      panels: [
        { id: 'a', span: 1, minHeight: 100 },
        { id: 'b', span: 2, minHeight: 100 },
      ],
    };
    expect(resolvePanelTracks(layout, 800, 1200, 0).map((track) => track.width)).toEqual([
      300, 500,
    ]);
    expect(
      resolvePanelTracks(layout, 800, 1200, 0, { a: 350, b: 450 }).map((track) => track.width),
    ).toEqual([350, 450]);
  });
  it('keeps document stacks natural without viewport filling or automatic minimum collapse', () => {
    const layout: AppShellPanelLayout = {
      axis: 'vertical',
      flow: 'document',
      panels: [{ id: 'a' }, { id: 'b', height: 1200, minHeight: 900 }],
    };
    expect(
      resolvePanelTracks(layout, 600, 1200, 8).map((track) => [track.width, track.visible]),
    ).toEqual([
      [0, true],
      [1200, true],
    ]);
  });
});
