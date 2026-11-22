import { AGENT_EDITOR_CASES, AGENT_EDITOR_CASES_MOVING } from './agent-editor.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Agent editor, identity and profile', [
  ...AGENT_EDITOR_CASES,
  ...AGENT_EDITOR_CASES_MOVING,
]);
