import { Button } from '../button';
import { Screen, ScreenScrollView } from '../screen';
import { Dialog } from './Dialog';
import { createDetailDialog } from './DetailDialogBase';
import { DetailDialogMotion } from './DetailDialogMotion';

export const DetailDialog = createDetailDialog({
  Dialog,
  Button,
  Screen,
  ScreenScrollView,
  Motion: DetailDialogMotion,
});
