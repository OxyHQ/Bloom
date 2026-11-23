import { MESSAGE_BUBBLE_CASES, MESSAGE_BUBBLE_CASES_MOVING } from './message-bubble.cases';
import { describeWebParity } from './support/web';

describeWebParity('Message bubbles', [...MESSAGE_BUBBLE_CASES, ...MESSAGE_BUBBLE_CASES_MOVING]);
