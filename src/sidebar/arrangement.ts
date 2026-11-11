/**
 * Where the parts of a sidebar sit in its column.
 *
 * Every sidebar has three regions: a pinned top (the controls: collapse, mode
 * toggle), a pinned bottom (the `footer`: an account control), and the room
 * between them. The destinations always live in that room. A part that is
 * `group` joins them there, as one block centred in the room; a part that is
 * pinned stays in its region.
 */

/** Where the logo (or account) row sits. */
export type SidebarLogoPlacement = 'top' | 'group';
/** Where the persistent primary action sits. */
export type SidebarPrimaryActionPlacement = 'bottom' | 'group';

export interface SidebarArrangement {
  /** `top` (default) pins the logo with the controls; `group` centres it with the destinations. */
  logo?: SidebarLogoPlacement;
  /** `bottom` (default) pins the action above the footer; `group` centres it with the destinations. */
  primaryAction?: SidebarPrimaryActionPlacement;
}

export interface ResolvedSidebarArrangement {
  logo: SidebarLogoPlacement;
  primaryAction: SidebarPrimaryActionPlacement;
  /** Anything is grouped, so the destinations are centred in the room too. */
  centred: boolean;
}

/**
 * The arrangement a sidebar draws: each part's own placement, else the one
 * `contentAlignment` implies (`center` is the preset that groups every part),
 * else its default. A part that is given always wins over the preset.
 */
export function resolveSidebarArrangement(
  contentAlignment: 'start' | 'center' | undefined,
  arrangement: SidebarArrangement | undefined,
): ResolvedSidebarArrangement {
  const preset = contentAlignment === 'center';
  const logo = arrangement?.logo ?? (preset ? 'group' : 'top');
  const primaryAction = arrangement?.primaryAction ?? (preset ? 'group' : 'bottom');
  return {
    logo,
    primaryAction,
    centred: preset || logo === 'group' || primaryAction === 'group',
  };
}
