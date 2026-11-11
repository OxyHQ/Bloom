import { panelEnvelope, resolvePanelFlex, resizePanelPair } from '../app-shell/panel-layout';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
const feed: AppShellPanelLayout = {
  gap: 0,
  panels: [
    { id: 'main', width: 620 },
    { id: 'context', width: 350, hideBelow: 990 },
  ],
};
// Pixel distribution is tested against actual Yoga and browser flex layouts;
// these helpers own only envelope preferences, eligibility and gesture bounds.
it('keeps the reading envelope while expanding and checks eligibility against the shell', () => {
  expect(panelEnvelope(feed, 1200, 0)).toBe(970);
  expect(panelEnvelope({ ...feed, expandedPanel: 'main' }, 1200, 0)).toBe(970);
  expect(panelEnvelope(feed, 989, 0)).toBe(620);
  expect(
    resolvePanelFlex({ ...feed, expandedPanel: 'main' }, 970, 1200, 0).map(
      (track) => track.visible,
    ),
  ).toEqual([true, false]);
});
it('collapses before violating split minimums and retains a constrained floating destination', () => {
  const layout: AppShellPanelLayout = {
    panels: [
      { id: 'main', minWidth: 300 },
      {
        id: 'likes',
        minWidth: 400,
        floating: {
          below: 'md',
          whenConstrained: true,
          open: true,
          onOpenChange() {},
          label: 'Likes',
        },
      },
    ],
  };
  const tracks = resolvePanelFlex(layout, 600, 1200, 8);
  expect(tracks[0]?.visible).toBe(true);
  expect(tracks[1]).toMatchObject({ visible: false, floating: true });
});
it('resizes a pair within both bounds while preserving its total', () => {
  const a = { id: 'a', minWidth: 200, maxWidth: 600 };
  const b = { id: 'b', minWidth: 300, maxWidth: 500 };
  expect(resizePanelPair(a, b, 400, 400, 900)).toEqual({ a: 500, b: 300 });
  expect(resizePanelPair(a, b, 400, 400, 0)).toEqual({ a: 300, b: 500 });
});
it('rejects ambiguous ids', () => {
  expect(() => panelEnvelope({ panels: [{ id: 'same' }, { id: 'same' }] }, 1000, 8)).toThrow(
    'unique',
  );
  expect(() => panelEnvelope({ panels: [{ id: '' }] }, 1000, 8)).toThrow('nonempty');
});
it('resolves a responsive axis and reserves only the widest stacked width', () => {
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
});
