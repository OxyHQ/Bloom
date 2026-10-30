import { Screen, ScreenScrollView } from '../screen/index.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { createSettings } from './SettingsModalBase';

export const { SettingsModal, SettingsLayout } = createSettings(
  { Screen, ScreenScrollView },
  ScrollArea,
);
