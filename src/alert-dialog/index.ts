import { Dialog } from '../dialog/index';
import { createAlertDialog } from './AlertDialog';

/**
 * The declarative, CONTROLLED confirm dialog. The imperative counterpart is
 * `confirm()` from `@oxyhq/bloom/surfaces`, which presents onto the shared
 * surface stack — this family owns no queue and no host of its own.
 */
export const AlertDialog = createAlertDialog(Dialog);

export type { AlertDialogProps, AlertDialogActionStyle } from './types';
