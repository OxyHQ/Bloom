/** Lightweight context readers for lists and route screens; no shell renderer dependency. */
export {
  useAppShell,
  useOptionalAppShell,
  useAppShellPanel,
  usePanelScrollContainer,
} from '../context';
export type { AppShellContextValue, AppShellPanelValue } from '../context';
export { usePanelNavigation, useOptionalPanelNavigation } from '../PanelNavigation';

export { usePanelSessionState, usePanelSessionFocus } from '../panel-session';
export type { PanelSessionFocusTarget } from '../panel-session';

// A shell-level action that is not the shell's own (a bottom bar's FAB the app
// draws) steps aside while the screen in front shows its own.
export { useScreenActionClaimed } from '../screen-action';
