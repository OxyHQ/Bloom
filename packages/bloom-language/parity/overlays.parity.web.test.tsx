import { OVERLAY_CASES, OVERLAY_CASES_TOASTS } from './overlays.cases';
import { describeWebParity } from './support/web';

describeWebParity('AlertDialog, Dialog, Popover and ConnectionStatus', [
  ...OVERLAY_CASES,
  ...OVERLAY_CASES_TOASTS,
]);
