import { defineMessages, type MessageCatalog } from '../locale/messages';

/** Fixed strings the layout family announces. Each has a prop that still wins. */
export interface LayoutMessages {
  /** `AutoHideBar`'s collapsed strip, which brings the bar back. */
  showToolbar: string;
}

export const LAYOUT_MESSAGES: MessageCatalog<LayoutMessages> = defineMessages<LayoutMessages>(
  'LAYOUT_MESSAGES',
  {
    showToolbar: 'Show toolbar',
  },
);
