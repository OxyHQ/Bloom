import { OVERLAY_CASES } from './overlays.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('AlertDialog, Dialog, Popover and ConnectionStatus', OVERLAY_CASES);
