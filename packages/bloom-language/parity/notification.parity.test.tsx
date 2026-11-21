import { NOTIFICATION_CASES, NOTIFICATION_CASES_TIMED } from './notification.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Notifications', [...NOTIFICATION_CASES, ...NOTIFICATION_CASES_TIMED]);
