import { ENGAGEMENT_CASES, ENGAGEMENT_CASES_MOVING } from './engagement.cases';
import { describeWebParity } from './support/web';

describeWebParity('Engagement', [...ENGAGEMENT_CASES, ...ENGAGEMENT_CASES_MOVING]);
