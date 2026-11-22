import { CALL_UI_CASES, CALL_UI_CASES_MOVING } from './call-ui.cases';
import { describeWebParity } from './support/web';

describeWebParity('Call screens', [...CALL_UI_CASES, ...CALL_UI_CASES_MOVING]);
