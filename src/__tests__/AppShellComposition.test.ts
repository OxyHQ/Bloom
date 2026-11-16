import {
  resolveAppShellComposition,
  resolvePanelComposition,
  explainAppShellComposition,
} from '../app-shell/composition';
import type { AppShellProps } from '../app-shell/types';

describe('semantic composition', () => {
  it('leaves legacy configurations and content identity untouched', () => {
    const props: AppShellProps = { variant: 'feed', gutter: 7 };
    expect(resolveAppShellComposition(props)).toBe(props);
  });

  it('resolves continuous workspace framing independently from navigation capacity', () => {
    const resolved = resolveAppShellComposition({
      layout: 'workspace',
      presentation: 'continuous',
      sidebar: { items: [] },
    });
    expect(resolved).toMatchObject({
      variant: 'dashboard',
      gutter: 0,
      navigationGap: 0,
      navFrom: 'md',
      contentMaxWidth: 'none',
      sidebar: { surface: 'docked' },
    });
    expect(resolved.framedFrom).toBeUndefined();
  });

  it.each(['gutter', 'navigationGap', 'framedFrom'] as const)(
    'rejects contradictory continuous %s rather than silently changing the frame',
    (key) => {
      expect(() =>
        resolveAppShellComposition({ layout: 'workspace', presentation: 'continuous', [key]: 12 }),
      ).toThrow('continuous composition');
    },
  );

  it('rejects incompatible surface and viewport declarations', () => {
    for (const override of [
      { frameInset: { top: 4 } },
      { variant: 'canvas' as const },
      { sidebar: { surface: 'card' as const } },
    ]) {
      expect(() =>
        resolveAppShellComposition({
          layout: 'workspace',
          presentation: 'continuous',
          ...override,
        }),
      ).toThrow('continuous composition');
    }
  });

  it('undefined defers at every scope, and explicit supported values win', () => {
    const resolved = resolveAppShellComposition({
      layout: 'catalog',
      gutter: undefined,
      navFrom: 976,
      sidebar: { surface: undefined },
      panelLayout: {
        mode: undefined,
        panels: [{ id: 'list', role: 'collection', width: undefined }],
      },
    });
    expect(resolved).toMatchObject({
      gutter: 8,
      navigationGap: 4,
      navFrom: 976,
      sidebar: { surface: 'plain' },
      panelLayout: { mode: 'split', panels: [{ width: 380 }] },
    });
  });

  it('inspector open controls both inline and floating visibility', () => {
    const onOpenChange = jest.fn();
    const resolve = (open: boolean) =>
      resolvePanelComposition(
        {
          panels: [
            {
              id: 'comments',
              role: 'inspector',
              open,
              onOpenChange,
              label: 'Comments',
              visible: undefined,
            },
          ],
        },
        { family: 'workspace', presentation: 'continuous' },
      );
    expect(resolve(false)).toMatchObject({
      appearance: 'joined',
      panels: [{ visible: false, floating: { open: false, whenConstrained: true } }],
    });
    const opened = resolve(true).panels[0]!;
    expect(opened.visible).toBe(true);
    opened.floating!.onOpenChange(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(() =>
      resolvePanelComposition({
        panels: [
          {
            id: 'comments',
            role: 'inspector',
            open: false,
            visible: true,
            onOpenChange,
            label: 'Comments',
          },
        ],
      }),
    ).toThrow('open and visible');
  });

  it('allows a local presentation and preserves group/leaf identities', () => {
    const content = { type: 'editor' };
    const root = resolvePanelComposition(
      {
        panels: [
          {
            id: 'local',
            group: {
              presentation: 'framed',
              panels: [{ id: 'main', role: 'main', content: content as never }],
            },
          },
        ],
      },
      { family: 'workspace', presentation: 'continuous' },
    );
    expect(root.appearance).toBe('joined');
    expect(root.panels[0]!.group!.appearance).toBe('separated');
    expect(root.panels[0]!.group!.panels[0]!.content).toBe(content);
  });

  it('does not constrain the cross axis of a vertical role group', () => {
    const layout = resolvePanelComposition(
      {
        axis: 'vertical',
        panels: [
          { id: 'main', role: 'main' },
          { id: 'comments', role: 'inspector' },
        ],
      },
      { family: 'workspace' },
    );
    expect(layout.panels[1]!.minWidth).toBeUndefined();
    expect(layout.panels[1]!.maxWidth).toBeUndefined();
  });

  it('exposes declared ownership without pretending to measure a viewport', () => {
    expect(
      explainAppShellComposition({ layout: 'workspace', presentation: 'continuous' }),
    ).toMatchObject({
      family: 'workspace',
      presentation: 'continuous',
      frame: { gutter: 0, source: 'presentation' },
      owners: { frame: 'AppShell', scroll: 'Screen', state: 'application' },
    });
  });
});
