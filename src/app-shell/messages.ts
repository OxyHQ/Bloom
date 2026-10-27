import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the app-shell family announces, in each Bloom language.
 * Each has a prop (`drawerOpenLabel`, `menuLabel`, `resizeLabel`, …) that
 * still wins over its entry here.
 */
export interface AppShellMessages {
  /** The hamburger that opens the drawer. */
  openNavigation: string;
  /** The backdrop and veil that close the drawer. */
  closeNavigation: string;
  /** A resizable panel's draggable divider (`AppShellPanel resizable`). */
  resizePanes: string;
  reorderPanel: (label: string) => string;
  reorderHint: string;
  movePanelBefore: string;
  movePanelAfter: string;
  panelMoved: (label: string, position: number, total: number) => string;
  /** A panel's drop target on its left edge (the start in LTR, the end in RTL). */
  addSplitLeft: string;
  addSplitRight: string;
  addSplitTop: string;
  addSplitBottom: string;
  /** `NotificationBell`'s trigger and popover. */
  notifications: string;
  /** `ProOfferCard`'s region. */
  proOffer: string;
}

export const APP_SHELL_MESSAGES: MessageCatalog<AppShellMessages> =
  defineMessages<AppShellMessages>('APP_SHELL_MESSAGES', {
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    resizePanes: 'Resize panes',
    reorderPanel: (label) => `Reorder ${label}`,
    reorderHint:
      'Drag to reorder, or use arrow keys. Home and End move to the first and last position.',
    movePanelBefore: 'Move before',
    movePanelAfter: 'Move after',
    panelMoved: (label, position, total) => `${label}, position ${position} of ${total}`,
    addSplitLeft: 'Add left split',
    addSplitRight: 'Add right split',
    addSplitTop: 'Add top split',
    addSplitBottom: 'Add bottom split',

    notifications: 'Notifications',
    proOffer: 'Pro offer',
  });
