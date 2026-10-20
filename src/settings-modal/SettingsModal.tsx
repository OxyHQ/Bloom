import { Screen, ScreenScrollView } from '../screen/index';
import { ScrollArea } from '../layout/ScrollArea';
import { createSettingsModal } from './SettingsModalBase';

export const SettingsModal = createSettingsModal({ Screen, ScreenScrollView }, ScrollArea);
