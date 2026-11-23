import { TASK_LIST_CASES, TASK_LIST_CASES_MOVING } from './task-list.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Task list', [...TASK_LIST_CASES, ...TASK_LIST_CASES_MOVING]);
