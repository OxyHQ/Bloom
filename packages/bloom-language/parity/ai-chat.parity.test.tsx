import { AI_CHAT_CASES, AI_CHAT_CASES_MOVING } from './ai-chat.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('AI chat', [...AI_CHAT_CASES, ...AI_CHAT_CASES_MOVING]);
