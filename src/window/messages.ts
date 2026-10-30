import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The window controls' names, in each Bloom language. `WindowControls`' label
 * props still win over these.
 */
export interface WindowMessages {
  close: string;
  minimize: string;
  /** Maximize, or restore the window's frame. */
  zoom: string;
}

export const WINDOW_MESSAGES: MessageCatalog<WindowMessages> = defineMessages<WindowMessages>(
  'WINDOW_MESSAGES',
  {
    close: 'Close',
    minimize: 'Minimize',
    zoom: 'Zoom',
  },
);
