/**
 * `@oxy.so/bloom/window/layouts`: the zoom control's layouts (`WindowLayouts`, a Mac's green
 * button's menu), registered for `WindowControls` as it is imported. A platform's adapter that
 * reports `window-layout` imports it (OxyOS's does); nothing else links it.
 */
import { registerWindowLayouts } from './layouts-registry';
import { WindowLayouts, WINDOW_LAYOUTS_OPEN_DELAY } from './WindowLayouts';

registerWindowLayouts(WindowLayouts);

export { WindowLayouts, WINDOW_LAYOUTS_OPEN_DELAY };
export type { WindowLayoutsProps } from './types';
