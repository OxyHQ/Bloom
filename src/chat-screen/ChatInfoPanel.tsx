import { Screen, ScreenScrollView } from '../screen/index';
import { Button } from '../button/index';
import { createChatInfoPanel } from './ChatInfoPanelBase';

export const ChatInfoPanel = createChatInfoPanel({
  Screen,
  ScreenScrollView,
  Button,
});
