import { CALENDAR_CASES, CALENDAR_CASES_MOVING } from './calendar.cases';
import { describeWebParity } from './support/web';

describeWebParity('Calendar', [...CALENDAR_CASES, ...CALENDAR_CASES_MOVING]);
