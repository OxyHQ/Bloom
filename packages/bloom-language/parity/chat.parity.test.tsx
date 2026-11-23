import { CHAT_CASES, CHAT_CASES_MOVING } from './chat.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Chat', [...CHAT_CASES, ...CHAT_CASES_MOVING]);
