import { Screen, ScreenScrollView } from '../screen/index.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { createSettings } from './SettingsModalBase';

export const { SettingsModal } = createSettings({ Screen, ScreenScrollView }, ScrollArea, null);
