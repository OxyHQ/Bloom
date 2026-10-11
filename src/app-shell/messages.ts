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
  /** The split layout's draggable divider. */
  resizePanes: string;
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
    notifications: 'Notifications',
    proOffer: 'Pro offer',
  });
