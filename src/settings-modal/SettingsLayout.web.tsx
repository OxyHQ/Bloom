import { Screen, ScreenScrollView } from '../screen/index.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { AppShell } from '../app-shell/index.web';
import { createSettings } from './SettingsModalBase';

/** `SettingsLayout`, composed by AppShell where it is a window's content. */
export const { SettingsLayout } = createSettings(
  { Screen, ScreenScrollView },
  ScrollArea,
  AppShell,
);
