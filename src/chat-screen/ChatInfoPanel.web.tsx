import { ListItem } from '../list/index.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
import { Button } from '../button/index.web';
import { createChatInfoPanel } from './ChatInfoPanelBase';

export const ChatInfoPanel = createChatInfoPanel({
  Screen,
  ScreenScrollView,
  Button,
  ListItem,
});
