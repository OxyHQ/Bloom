import { Screen, ScreenScrollView } from '../screen/index.web';
import { Button } from '../button/index.web';
import { createQueuePanel } from './QueuePanelBase';

export const QueuePanel = createQueuePanel({
  Screen,
  ScreenScrollView,
  Button,
});
