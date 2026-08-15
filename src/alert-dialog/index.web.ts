import { Dialog } from '../dialog/index.web';
import { createAlertDialog } from './AlertDialog';

/** Web variant of the `./alert-dialog` barrel — see `./index.ts`. */
export const AlertDialog = createAlertDialog(Dialog);

export type { AlertDialogProps, AlertDialogActionStyle } from './types';
