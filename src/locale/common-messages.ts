import { defineMessages, useMessages, type MessageCatalog } from './messages';

/**
 * The words every family says — a close button's name, "Loading", "Back" —
 * in each Bloom language, so each family does not keep its own English copy.
 * A family's own catalog holds only what is particular to it.
 */
export interface CommonMessages {
  close: string;
  /** Names a control that sets something aside: a banner's ✕, a backdrop, a sheet's handle. */
  dismiss: string;
  /** A navigation bar's back button. */
  back: string;
  /** The same, where it reads as an action rather than a place ("Go back"). */
  goBack: string;
  /** Names a busy region or skeleton. */
  loading: string;
  /** A compact overflow trigger ("More"). */
  more: string;
  moreOptions: string;
  moreActions: string;
  /** Names a progress bar. */
  progress: string;
  stepOf: (step: number, total: number) => string;
  /**
   * A control's name about one item: "More actions for Ana". The connector is
   * the language's, never an English "for" between translated words.
   */
  labelFor: (label: string, subject: string) => string;
  /** The hint on a sheet's drag handle. */
  tapToClose: string;
  cancel: string;
  done: string;
  save: string;
  delete: string;
  edit: string;
  remove: string;
  retry: string;
  search: string;
  showMore: string;
  showLess: string;
  next: string;
  previous: string;
  open: string;
  menu: string;
  copy: string;
  copied: string;
  send: string;
  clear: string;
  seeAll: string;
  /** The divider between two resizable panes (`AiChatResizeHandle`). */
  resizePanels: string;
}

export const COMMON_MESSAGES: MessageCatalog<CommonMessages> = defineMessages<CommonMessages>(
  'COMMON_MESSAGES',
  {
    close: 'Close',
    dismiss: 'Dismiss',
    back: 'Back',
    goBack: 'Go back',
    loading: 'Loading',
    more: 'More',
    moreOptions: 'More options',
    moreActions: 'More actions',
    progress: 'Progress',
    stepOf: (step, total) => `Step ${step} of ${total}`,
    labelFor: (label, subject) => `${label} for ${subject}`,
    tapToClose: 'Tap to close',
    cancel: 'Cancel',
    done: 'Done',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    remove: 'Remove',
    retry: 'Retry',
    search: 'Search',
    showMore: 'Show more',
    showLess: 'Show less',
    next: 'Next',
    previous: 'Previous',
    open: 'Open',
    menu: 'Menu',
    copy: 'Copy',
    copied: 'Copied',
    send: 'Send',
    clear: 'Clear',
    seeAll: 'See all',
    resizePanels: 'Resize panels',
  },
);

/** The common words in the locale in effect (prop → `LocaleProvider` → runtime). */
export function useCommonMessages(locale?: string): CommonMessages {
  return useMessages(COMMON_MESSAGES, locale).messages;
}
