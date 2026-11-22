import { AGENT_EDITOR_CASES, AGENT_EDITOR_CASES_MOVING } from './agent-editor.cases';
import { describeWebParity } from './support/web';

describeWebParity('Agent editor, identity and profile', [
  ...AGENT_EDITOR_CASES,
  ...AGENT_EDITOR_CASES_MOVING,
]);
