import { Screen, ScreenScrollView } from '../screen/index';
import { ScrollArea } from '../layout/ScrollArea';
import { AppShell } from '../app-shell/index';
import { createSettings } from './SettingsModalBase';

/** `SettingsLayout`, composed by AppShell where it is a window's content. */
export const { SettingsLayout } = createSettings(
  { Screen, ScreenScrollView },
  ScrollArea,
  AppShell,
);
