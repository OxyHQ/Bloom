import { AppShellMenuButton as BloomAppShellMenuButton } from '@oxy.so/bloom/app-shell';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** The app shell's drawer button (Bloom `app-shell`). */
export type AppShellMenuButtonKind = 'appShellMenuButton';

/** Bloom `AppShellMenuButton`: named with `.label()` (`"Open navigation"` in English by default). */
export type AppShellMenuButtonView = ViewModifiers<AppShellMenuButtonView>;

/**
 * Bloom `AppShellMenuButton`: the button that opens the app shell's drawer,
 * for a page that draws its own header (a header's `.toolbarLeading()`). It
 * hides while the sidebar is in flow, and shows a close glyph while the drawer
 * is open.
 */
export function AppShellMenuButton(): AppShellMenuButtonView {
  return new Node('appShellMenuButton', null, []);
}

export const APP_SHELL_MENU_BUTTONS: Record<AppShellMenuButtonKind, ControlRenderer> = {
  appShellMenuButton: (d) => d.component(BloomAppShellMenuButton, d.props()),
};
