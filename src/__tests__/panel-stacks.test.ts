import { groupPanelStacks } from '../app-shell/panel-stacks';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';

const layout = (panels: AppShellPanelLayout['panels']): AppShellPanelLayout => ({ panels });

describe('groupPanelStacks', () => {
  it('hands back the layout itself when nothing is stacked', () => {
    const input = layout([{ id: 'a' }, { id: 'b' }]);
    const { layout: out, members } = groupPanelStacks(input);
    expect(out).toBe(input);
    expect(members.size).toBe(0);
  });

  it('makes one slot of the panels that share a stack, where the first of them is', () => {
    const { layout: out, members } = groupPanelStacks(
      layout([{ id: 'a' }, { id: 'main', stack: 's' }, { id: 'b' }, { id: 'pane', stack: 's' }]),
    );
    expect(out.panels.map((panel) => panel.id)).toEqual(['a', 'main', 'b']);
    expect(members.get('main')?.map((panel) => panel.id)).toEqual(['main', 'pane']);
    expect(members.has('a')).toBe(false);
  });

  it('keeps each stack in its own slot, in array order', () => {
    const { layout: out, members } = groupPanelStacks(
      layout([
        { id: 'x1', stack: 'x' },
        { id: 'y1', stack: 'y' },
        { id: 'x2', stack: 'x' },
        { id: 'y2', stack: 'y' },
        { id: 'x3', stack: 'x' },
      ]),
    );
    expect(out.panels.map((panel) => panel.id)).toEqual(['x1', 'y1']);
    expect(members.get('x1')?.map((panel) => panel.id)).toEqual(['x1', 'x2', 'x3']);
    expect(members.get('y1')?.map((panel) => panel.id)).toEqual(['y1', 'y2']);
  });

  it('treats a stack of one as that panel alone', () => {
    const { layout: out, members } = groupPanelStacks(
      layout([{ id: 'a', stack: 's' }, { id: 'b' }]),
    );
    expect(out.panels.map((panel) => panel.id)).toEqual(['a', 'b']);
    expect(members.size).toBe(0);
  });

  it('shows the slot while any member is shown and hides it when none is', () => {
    const open = groupPanelStacks(
      layout([
        { id: 'main', stack: 's' },
        { id: 'pane', stack: 's', visible: false },
      ]),
    );
    expect(open.layout.panels[0]?.visible).toBe(true);
    const shut = groupPanelStacks(
      layout([
        { id: 'main', stack: 's', visible: false },
        { id: 'pane', stack: 's', visible: false },
      ]),
    );
    expect(shut.layout.panels[0]?.visible).toBe(false);
  });

  it('sizes the slot from its first panel, never under the widest minimum of a member', () => {
    const { layout: out } = groupPanelStacks(
      layout([
        { id: 'main', stack: 's', width: 620, minWidth: 300 },
        { id: 'pane', stack: 's', minWidth: 360 },
      ]),
    );
    expect(out.panels[0]).toMatchObject({ id: 'main', width: 620, minWidth: 360 });
  });

  it('leaves the other layout settings alone', () => {
    const input: AppShellPanelLayout = {
      mode: 'deck',
      gap: 7,
      panels: [
        { id: 'a', stack: 's' },
        { id: 'b', stack: 's' },
      ],
    };
    expect(groupPanelStacks(input).layout).toMatchObject({ mode: 'deck', gap: 7 });
  });
});
