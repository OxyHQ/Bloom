import { AGENT_CASES, AGENT_CASES_MOVING } from './agents.cases';
import { describeWebParity } from './support/web';

describeWebParity('Agents', [...AGENT_CASES, ...AGENT_CASES_MOVING]);
