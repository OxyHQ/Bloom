import { CHAT_CASES, CHAT_CASES_MOVING } from './chat.cases';
import { describeWebParity } from './support/web';

describeWebParity('Chat', [...CHAT_CASES, ...CHAT_CASES_MOVING]);
