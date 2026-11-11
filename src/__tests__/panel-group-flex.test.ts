import { panelLayoutCss } from '../app-shell/panel-layout-css';
import { panelLayoutWidthThresholds, resolvePanelFlex } from '../app-shell/panel-layout';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';

it('leaves natural vertical flow heights to content on both renderers', () => {
  const layout: AppShellPanelLayout = {
    mode: 'flow',
    axis: 'vertical',
    panels: [{ id: 'one' }, { id: 'two', height: 200 }],
  };
  const tracks = resolvePanelFlex(layout, 300, 1000, 8);
  expect(tracks[0]).toMatchObject({ basisAuto: true, grow: 0, shrink: 0 });
  expect(tracks[1]).toMatchObject({ basis: 200, grow: 0, shrink: 0 });
  const css = panelLayoutCss('group', layout, 8);
  expect(css).toContain(' 0 var(--group-panel-size-0, auto)');
  expect(css).toContain(' 0 var(--group-panel-size-1, 200px)');
});

it('hands split weights and limits to Yoga unchanged as room changes', () => {
  const layout: AppShellPanelLayout = {
    panels: [
      { id: 'one', span: 1, minWidth: 80 },
      { id: 'two', span: 2, minWidth: 120, maxWidth: 600 },
    ],
  };
  const small = resolvePanelFlex(layout, 500, 1000, 8);
  const large = resolvePanelFlex(layout, 900, 1000, 8);
  expect(small).toEqual(large);
  expect(small[0]).toMatchObject({ grow: 1, basis: 0, min: 80 });
  expect(small[1]).toMatchObject({ grow: 2, basis: 0, min: 120, max: 600 });
});

it('collects nested presentation thresholds while keeping independent CSS owner scopes', () => {
  const layout: AppShellPanelLayout = {
    panels: [
      {
        id: 'group',
        group: {
          panels: [
            {
              id: 'likes',
              floating: { below: 700, open: true, onOpenChange: () => {}, label: 'Likes' },
            },
          ],
        },
      },
    ],
  };
  expect(panelLayoutWidthThresholds(layout)).toContain(700);
  expect(
    panelLayoutCss('child', { panels: [{ id: 'leaf' }] }, 8, {}, {}, false, 'shell'),
  ).toContain('@container shell');
});
