import { TRACK_LIST_CASES, TRACK_LIST_CASES_MOVING } from './track-list.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Track list', [...TRACK_LIST_CASES, ...TRACK_LIST_CASES_MOVING]);
