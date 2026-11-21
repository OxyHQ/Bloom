import { NOTIFICATION_CASES, NOTIFICATION_CASES_TIMED } from './notification.cases';
import { describeWebParity } from './support/web';

describeWebParity('Notifications', [...NOTIFICATION_CASES, ...NOTIFICATION_CASES_TIMED]);
