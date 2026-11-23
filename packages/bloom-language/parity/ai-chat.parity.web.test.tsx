import { AI_CHAT_CASES, AI_CHAT_CASES_MOVING } from './ai-chat.cases';
import { describeWebParity } from './support/web';

describeWebParity('AI chat', [...AI_CHAT_CASES, ...AI_CHAT_CASES_MOVING]);
