import type { AppShellPanelDefinition, AppShellPanelLayout } from './panel-layout-types';

/**
 * Panels that share a `stack` id are stacked in ONE slot of the layout, along
 * the other axis, in their array order. The compositor (CSS compiler, tracks,
 * resize, reorder, drop) lays out slots, so it is handed a layout with one panel
 * per slot: the first member stands for its stack. Only the host that paints a
 * slot knows its members, and lays them out as a nested layout of their own, so
 * each member is a panel (its own surface, scroll and header) and a sibling of
 * the others, never nested in a surface.
 */
export interface PanelSlots {
  /** The layout to lay out: one panel per slot. The input itself when nothing is stacked. */
  layout: AppShellPanelLayout;
  /** A stacked slot's panels in layout order, by the id of the panel that stands for it. */
  members: ReadonlyMap<string, readonly AppShellPanelDefinition[]>;
}

const NO_MEMBERS: ReadonlyMap<string, readonly AppShellPanelDefinition[]> = new Map();

export function groupPanelStacks(layout: AppShellPanelLayout): PanelSlots {
  if (!layout.panels.some((panel) => panel.stack)) return { layout, members: NO_MEMBERS };
  const members = new Map<string, AppShellPanelDefinition[]>();
  const standing = new Map<string, AppShellPanelDefinition>();
  const slots: AppShellPanelDefinition[] = [];
  for (const panel of layout.panels) {
    if (!panel.stack) {
      slots.push(panel);
      continue;
    }
    const lead = standing.get(panel.stack);
    if (lead) {
      members.get(lead.id)!.push(panel);
      continue;
    }
    standing.set(panel.stack, panel);
    members.set(panel.id, [panel]);
    slots.push(panel);
  }
  const grouped = slots.map((panel) => {
    const own = members.get(panel.id);
    if (!own || own.length < 2) {
      // A stack of one is that panel alone.
      members.delete(panel.id);
      return panel;
    }
    // The slot takes its size from the panel that stands for it, but is never narrower than any
    // member needs, and is shown while any member is.
    return {
      ...panel,
      stack: undefined,
      visible: own.some((member) => member.visible !== false),
      minWidth: Math.max(0, ...own.map((member) => member.minWidth ?? 0)) || panel.minWidth,
    };
  });
  return { layout: { ...layout, panels: grouped }, members };
}
