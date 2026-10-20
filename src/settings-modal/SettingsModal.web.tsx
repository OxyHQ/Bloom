import { Screen, ScreenScrollView } from '../screen/index.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { createSettingsModal } from './SettingsModalBase';

export const SettingsModal = createSettingsModal({ Screen, ScreenScrollView }, ScrollArea);
