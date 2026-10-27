import {
  PANEL_DROP_STAGES,
  panelDropZoneEntry,
  panelDropZoneRect,
  resolvePanelDropTarget,
} from '../app-shell/panel-drop';

// A page card measured at 1499.5 × 870.5 from its window's corner (6, 38).
const CARD = { x: 6, y: 38, width: 1499.5, height: 870.5 };
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 1);

describe('drop zone geometry', () => {
  it('sizes each stage as the measured fractions of the panel, centred vertically', () => {
    const rest = panelDropZoneRect(CARD, 'start', 'rest');
    close(rest.width, 198.5);
    close(rest.height, 333.4);
    close(rest.x - CARD.x, 37.5);
    close(rest.y + rest.height / 2, CARD.y + CARD.height / 2);
    const grown = panelDropZoneRect(CARD, 'start', 'grown');
    close(grown.width, 322.4);
    close(grown.height, 531.9);
    close(grown.x - CARD.x, 30);
    const end = panelDropZoneRect(CARD, 'end', 'grown');
    close(CARD.x + CARD.width - (end.x + end.width), 30);
  });

  it('leans the active target 43% of the way to the pointer and keeps it inside the panel', () => {
    const grown = panelDropZoneRect(CARD, 'start', 'grown');
    const home = grown.x + grown.width / 2;
    const pointer = { x: home + 100, y: 400 };
    const active = panelDropZoneRect(CARD, 'start', 'active', pointer);
    close(active.width, CARD.width * PANEL_DROP_STAGES.active.width);
    close(active.x + active.width / 2, home + 43);
    const far = panelDropZoneRect(CARD, 'start', 'active', { x: -500, y: 400 });
    close(far.x, CARD.x + CARD.width * PANEL_DROP_STAGES.active.inset);
  });

  it('mirrors start and end in right-to-left', () => {
    const ltrStart = panelDropZoneRect(CARD, 'start', 'grown');
    const rtlEnd = panelDropZoneRect(CARD, 'end', 'grown', null, true);
    expect(rtlEnd).toEqual(ltrStart);
    const rtlStart = panelDropZoneRect(CARD, 'start', 'grown', null, true);
    expect(rtlStart).toEqual(panelDropZoneRect(CARD, 'end', 'grown'));
  });

  it('lays top and bottom targets along the edge', () => {
    const top = panelDropZoneRect(CARD, 'top', 'grown');
    close(top.width, CARD.width * PANEL_DROP_STAGES.grown.height);
    close(top.height, CARD.height * PANEL_DROP_STAGES.grown.width);
    close(top.y - CARD.y, CARD.height * PANEL_DROP_STAGES.grown.inset);
    const bottom = panelDropZoneRect(CARD, 'bottom', 'active', { x: 0, y: CARD.y + CARD.height });
    expect(bottom.y + bottom.height).toBeLessThanOrEqual(CARD.y + CARD.height);
  });

  it('waits just past the panel edge before sliding in', () => {
    const entry = panelDropZoneEntry(CARD, 'start');
    expect(entry.x + entry.width).toBe(CARD.x);
    expect(panelDropZoneEntry(CARD, 'start', true).x).toBe(CARD.x + CARD.width);
    expect(panelDropZoneEntry(CARD, 'bottom').y).toBe(CARD.y + CARD.height);
  });
});

describe('resolvePanelDropTarget', () => {
  const left = { x: 0, y: 0, width: 600, height: 800 };
  const right = { x: 607, y: 0, width: 600, height: 800 };
  const panels = { left, right };

  it('needs the pointer over an accepting panel', () => {
    expect(resolvePanelDropTarget({ panels, point: null })).toBeNull();
    expect(resolvePanelDropTarget({ panels, point: { x: 603, y: 400 } })).toBeNull();
    expect(resolvePanelDropTarget({ panels, point: { x: 300, y: 1000 } })).toBeNull();
  });

  it('hits the target the dragged picture overlaps, nearest centre first', () => {
    expect(resolvePanelDropTarget({ panels, point: { x: 40, y: 400 } })).toEqual({
      panelId: 'left',
      edge: 'start',
    });
    // The 209-wide picture at the seam overlaps the left panel's end and the
    // right panel's start: the nearer centre wins.
    expect(resolvePanelDropTarget({ panels, point: { x: 590, y: 400 } })).toEqual({
      panelId: 'left',
      edge: 'end',
    });
    expect(resolvePanelDropTarget({ panels, point: { x: 620, y: 400 } })).toEqual({
      panelId: 'right',
      edge: 'start',
    });
    expect(resolvePanelDropTarget({ panels, point: { x: 300, y: 400 } })).toBeNull();
  });

  it('resolves a neighbour’s target while the pointer is over the dragged item’s own panel', () => {
    const point = { x: 595, y: 400 };
    expect(resolvePanelDropTarget({ panels: { right }, point })).toBeNull();
    expect(resolvePanelDropTarget({ panels: { right }, over: panels, point })).toEqual({
      panelId: 'right',
      edge: 'start',
    });
  });

  it('tests the bare point with a 0×0 preview', () => {
    const preview = { width: 0, height: 0 };
    expect(resolvePanelDropTarget({ panels, point: { x: 150, y: 400 }, preview })).toBeNull();
    expect(resolvePanelDropTarget({ panels, point: { x: 50, y: 400 }, preview })).toEqual({
      panelId: 'left',
      edge: 'start',
    });
  });

  it('keeps the current target at its larger active size', () => {
    const preview = { width: 0, height: 0 };
    const grown = panelDropZoneRect(left, 'start', 'grown');
    const point = { x: grown.x + grown.width + 20, y: 400 };
    expect(resolvePanelDropTarget({ panels, point, preview })).toBeNull();
    expect(
      resolvePanelDropTarget({
        panels,
        point,
        preview,
        current: { panelId: 'left', edge: 'start' },
      }),
    ).toEqual({ panelId: 'left', edge: 'start' });
  });

  it('names logical edges in right-to-left', () => {
    expect(resolvePanelDropTarget({ panels, point: { x: 40, y: 400 }, rtl: true })).toEqual({
      panelId: 'left',
      edge: 'end',
    });
  });

  it('only offers the edges asked for', () => {
    expect(
      resolvePanelDropTarget({
        panels: { left },
        point: { x: 300, y: 30 },
        edges: ['top', 'bottom'],
      }),
    ).toEqual({ panelId: 'left', edge: 'top' });
    expect(
      resolvePanelDropTarget({ panels: { left }, point: { x: 40, y: 400 }, edges: ['top'] }),
    ).toBeNull();
  });
});
