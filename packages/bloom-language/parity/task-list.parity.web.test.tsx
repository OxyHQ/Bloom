import { TASK_LIST_CASES, TASK_LIST_CASES_MOVING } from './task-list.cases';
import { describeWebParity } from './support/web';

describeWebParity('Task list', [...TASK_LIST_CASES, ...TASK_LIST_CASES_MOVING]);
