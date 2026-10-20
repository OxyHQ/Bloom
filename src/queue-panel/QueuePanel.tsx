import { Screen, ScreenScrollView } from '../screen/index';
import { Button } from '../button/index';
import { createQueuePanel } from './QueuePanelBase';

export const QueuePanel = createQueuePanel({
  Screen,
  ScreenScrollView,
  Button,
});
