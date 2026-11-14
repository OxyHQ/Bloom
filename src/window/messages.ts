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
  /** The zoom control's layouts (hover or long press), as a Mac's green button shows them. */
  layouts: string;
  moveAndResize: string;
  fillAndArrange: string;
  fill: string;
  center: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  leftRight: string;
  rightLeft: string;
  topBottom: string;
  bottomTop: string;
  quarters: string;
  returnToPrevious: string;
  /** "Move to Desktop 2", desktops numbered from 1 as the person counts them. */
  moveToDesktop: (desktop: number) => string;
}

export const WINDOW_MESSAGES: MessageCatalog<WindowMessages> = defineMessages<WindowMessages>(
  'WINDOW_MESSAGES',
  {
    close: 'Close',
    minimize: 'Minimize',
    zoom: 'Zoom',
    layouts: 'Window layouts',
    moveAndResize: 'Move & Resize',
    fillAndArrange: 'Fill & Arrange',
    fill: 'Fill',
    center: 'Center',
    left: 'Left',
    right: 'Right',
    top: 'Top',
    bottom: 'Bottom',
    topLeft: 'Top Left',
    topRight: 'Top Right',
    bottomLeft: 'Bottom Left',
    bottomRight: 'Bottom Right',
    leftRight: 'Left & Right',
    rightLeft: 'Right & Left',
    topBottom: 'Top & Bottom',
    bottomTop: 'Bottom & Top',
    quarters: 'Quarters',
    returnToPrevious: 'Return to Previous Size',
    moveToDesktop: (desktop) => `Move to Desktop ${desktop}`,
  },
);
