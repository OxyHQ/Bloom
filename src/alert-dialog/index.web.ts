import { CenteredDialog } from '../dialog/index.web';
import { createAlertDialog } from './AlertDialog';
import { createAlertDialogHost } from './AlertDialogHost';

export const AlertDialog = createAlertDialog(CenteredDialog);
export const AlertDialogHost = createAlertDialogHost(AlertDialog);

export { confirm } from './confirm-store';
export type {
  AlertDialogProps,
  AlertDialogActionStyle,
  ConfirmOptions,
} from './types';
