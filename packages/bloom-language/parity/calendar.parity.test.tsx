import { CALENDAR_CASES, CALENDAR_CASES_MOVING } from './calendar.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Calendar', [...CALENDAR_CASES, ...CALENDAR_CASES_MOVING]);
