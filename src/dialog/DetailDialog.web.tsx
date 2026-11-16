import { Button } from '../button/index.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
import { Dialog } from './Dialog.web';
import { createDetailDialog } from './DetailDialogBase';
import { DetailDialogMotion } from './DetailDialogMotion.web';

export const DetailDialog = createDetailDialog({
  Dialog,
  Button,
  Screen,
  ScreenScrollView,
  Motion: DetailDialogMotion,
});
