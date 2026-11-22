import { TRACK_LIST_CASES, TRACK_LIST_CASES_MOVING } from './track-list.cases';
import { describeWebParity } from './support/web';

describeWebParity('Track list', [...TRACK_LIST_CASES, ...TRACK_LIST_CASES_MOVING]);
