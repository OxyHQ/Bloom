import { stackCells } from '../app-shell/panel-stack-cells';

const main = { id: 'main', span: 1.2, minHeight: 240 };
const pane = { id: 'pane', sticky: true, minHeight: 220, maxHeight: 640 };
const options = { shellWidth: 1280, document: false, gap: 8 };

describe('stackCells in a bounded column', () => {
  it('is not split while one panel is shown, so it keeps the flow it has alone', () => {
    const cells = stackCells([main, { ...pane, visible: false }], options);
    expect(cells.split).toBe(false);
    // Alone in a bounded column the panel fills it: it is the column.
    expect(cells.style('main')).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 0,
      minWidth: 0,
    });
  });

  it('divides the column by span for a panel with no height, and gives a height as a definite size', () => {
    const cells = stackCells([main, { ...pane, height: 380 }], options);
    expect(cells.split).toBe(true);
    expect(cells.style('main')).toEqual({
      minHeight: 240,
      minWidth: 0,
      flexGrow: 1.2,
      flexShrink: 1,
      flexBasis: 0,
    });
    expect(cells.style('pane')).toEqual({
      minHeight: 220,
      maxHeight: 640,
      minWidth: 0,
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
      height: 380,
    });
  });

  it('shares the column between two panels with no height, and takes a dragged height over a declared one', () => {
    const both = stackCells([main, { id: 'b' }], options);
    expect(both.style('b').flexGrow).toBe(1);
    const dragged = stackCells([main, { ...pane, height: 380 }], {
      ...options,
      heights: { pane: 500 },
    });
    expect(dragged.style('pane').height).toBe(500);
  });

  it('lets the last panel flex when every panel has a height, so the column still fills', () => {
    const cells = stackCells(
      [
        { ...main, height: 300 },
        { ...pane, height: 380 },
      ],
      options,
    );
    expect(cells.style('pane')).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0 });
  });

  it('docks nothing: there is no window edge to dock to', () => {
    const cells = stackCells([main, pane], options);
    expect(cells.docked.size).toBe(0);
    expect(cells.dockRoom).toBeNull();
  });

  it('keeps a closed panel in the column with no room, so opening it is a transition', () => {
    const closed = stackCells([main, { ...pane, height: 380, visible: false }], options);
    expect(closed.style('pane')).toMatchObject({
      flexGrow: 0,
      flexBasis: 0,
      height: 0,
      opacity: 0,
    });
  });
});

describe('stackCells in a page that scrolls as a document', () => {
  const document = { ...options, document: true };

  it('leaves the panels that are not docked at their own height, so the page scrolls', () => {
    expect(stackCells([main, pane], document).style('main')).toEqual({});
  });

  it('docks a sticky panel at the window edge, with a height that follows the window', () => {
    const cells = stackCells([main, pane], { ...document, bottomInset: 8 });
    expect(cells.docked.has('pane')).toBe(true);
    expect(cells.style('pane')).toMatchObject({
      position: 'sticky',
      bottom: 8,
      flexShrink: 0,
      height: 'clamp(220px, 45dvh, 640px)',
    });
  });

  it('declares the room the docked panels take as one CSS length, gap included', () => {
    expect(stackCells([main, pane], document).dockRoom).toBe(
      'calc(clamp(220px, 45dvh, 640px) + 8px)',
    );
    expect(stackCells([main, { ...pane, height: 380 }], document).dockRoom).toBe(
      'calc(380px + 8px)',
    );
    expect(stackCells([main, pane], { ...document, heights: { pane: 500 } }).dockRoom).toBe(
      'calc(500px + 8px)',
    );
  });

  it('keeps a closed panel in the column with no height', () => {
    expect(stackCells([main, { ...pane, visible: false }], document).style('pane')).toMatchObject({
      height: 0,
      opacity: 0,
    });
  });

  it('leaves a panel alone at the height of its content, so the page scrolls', () => {
    expect(stackCells([main, { ...pane, visible: false }], document).style('main')).toEqual({});
  });

  it('docks nothing while only one panel is shown', () => {
    const cells = stackCells([main, { ...pane, visible: false }], document);
    expect(cells.docked.size).toBe(0);
    // The column can dock, so it declares no room: the frames above follow it as it opens.
    expect(cells.dockRoom).toBe('0px');
  });
});

describe('stackCells and floating panels', () => {
  it('leaves the column a panel that is floating at this width, and keeps it for a sheet', () => {
    const sheet = {
      ...pane,
      floating: { below: 'md' as const, open: true, onOpenChange() {}, label: 'x' },
    };
    const narrow = stackCells([main, sheet], { ...options, shellWidth: 500 });
    expect(narrow.floating.has('pane')).toBe(true);
    expect(narrow.shown.map((panel) => panel.id)).toEqual(['main']);
    expect(narrow.split).toBe(false);
    expect(narrow.style('pane')).toEqual({ display: 'none' });
    const wide = stackCells([main, sheet], { ...options, shellWidth: 1280 });
    expect(wide.floating.size).toBe(0);
    expect(wide.split).toBe(true);
  });
});
