import { AGENT_CASES, AGENT_CASES_MOVING } from './agents.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Agents', [...AGENT_CASES, ...AGENT_CASES_MOVING]);
