import { MESSAGE_BUBBLE_CASES, MESSAGE_BUBBLE_CASES_MOVING } from './message-bubble.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Message bubbles', [...MESSAGE_BUBBLE_CASES, ...MESSAGE_BUBBLE_CASES_MOVING]);
