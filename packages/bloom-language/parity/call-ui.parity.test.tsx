import { CALL_UI_CASES, CALL_UI_CASES_MOVING } from './call-ui.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Call screens', [...CALL_UI_CASES, ...CALL_UI_CASES_MOVING]);
