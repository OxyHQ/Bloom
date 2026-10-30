import { Screen, ScreenScrollView } from '../screen/index';
import { ScrollArea } from '../layout/ScrollArea';
import { createSettings } from './SettingsModalBase';

export const { SettingsModal, SettingsLayout } = createSettings(
  { Screen, ScreenScrollView },
  ScrollArea,
);
