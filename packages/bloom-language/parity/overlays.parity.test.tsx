import { OVERLAY_CASES, OVERLAY_CASES_TOASTS } from './overlays.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('AlertDialog, Dialog, Popover and ConnectionStatus', [
  ...OVERLAY_CASES,
  ...OVERLAY_CASES_TOASTS,
]);
