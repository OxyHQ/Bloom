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

it('presents an opted-in auxiliary sheet when bounded split minimums cannot fit', () => {
  const layout: AppShellPanelLayout = {
    axis: 'vertical',
    panels: [
      { id: 'main', minHeight: 160 },
      {
        id: 'likes',
        minHeight: 160,
        floating: {
          below: 700,
          open: true,
          onOpenChange: () => {},
          label: 'Likes',
          whenConstrained: true,
        },
      },
    ],
  };
  expect(resolvePanelFlex(layout, 300, 1000, 8)[1]).toMatchObject({
    visible: false,
    floating: true,
  });
  expect(resolvePanelFlex(layout, 328, 1000, 8)[1]).toMatchObject({
    visible: true,
    floating: false,
  });
  const css = panelLayoutCss('group', layout, 8);
  expect(css).toContain('@container group-group (height < 328px)');
  expect(css).toContain('[data-bloom-panel-index="1"]{--bloom-panel-floating:1}');
});

it('keeps vertical exits full width and split-to-deck width limits interpolable', () => {
  const vertical = panelLayoutCss(
    'group',
    {
      axis: 'vertical',
      panels: [{ id: 'main' }, { id: 'likes', visible: false }],
    },
    8,
  );
  expect(vertical).toContain('display:none!important;width:100%!important;height:auto!important');
  const split = panelLayoutCss('group', { panels: [{ id: 'main', width: 620 }] }, 8);
  expect(split).toContain('min-width:0px!important;max-width:100%!important');
});

it('lets a sole split pane reclaim all space after a divider committed a fractional span', () => {
  const layout: AppShellPanelLayout = {
    axis: 'vertical',
    panels: [
      { id: 'main', span: 0.3, minHeight: 160 },
      { id: 'likes', span: 1.7, minHeight: 160, visible: false },
    ],
  };
  expect(resolvePanelFlex(layout, 800, 1000, 8)[0]).toMatchObject({ grow: 1, basis: 0 });
  expect(panelLayoutCss('group', layout, 8)).toContain(
    'flex:var(--group-panel-grow-0, 1) 1 var(--group-panel-size-0, 100%)',
  );
});

it('keeps reading-envelope widths steady while local fixed-basis splits can share spare space', () => {
  const layout: AppShellPanelLayout = {
    panels: [
      { id: 'main', width: 620 },
      { id: 'context', width: 350 },
    ],
  };
  const root = panelLayoutCss('group', layout, 8, {}, {}, false, 'group', true);
  const local = panelLayoutCss('group', layout, 8);
  expect(root).toContain('flex:var(--group-panel-grow-0, 0)');
  expect(local).toContain('flex:var(--group-panel-grow-0, 1)');
});

it('switches intrinsic document height atomically after bounded exit motion', () => {
  const css = panelLayoutCss(
    'group',
    {
      axis: 'vertical',
      flow: 'document',
      panels: [{ id: 'main', minHeight: 160 }],
    },
    8,
  );
  expect(css).toContain(
    'interpolate-size:numeric-only;transition-property:width,min-width,max-width,margin-inline-start,margin-top,opacity,scale,display',
  );
});
