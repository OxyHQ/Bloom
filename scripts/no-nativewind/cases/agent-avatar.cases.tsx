import { AgentAvatar } from '@bloom/agent-avatar';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'AgentAvatar plain': () => <AgentAvatar character={{ preset: 'blue_beret' }} paused />,
  'AgentAvatar loaded': () => (
    <AgentAvatar
      character={{ preset: 'alfred', color: 'coral' }}
      size={96}
      label="Ember"
      style={{ margin: 8 }}
      testID="avatar"
      paused
    />
  ),
  'AgentAvatar portrait': () => (
    <AgentAvatar character={{ preset: 'blue_beret' }} portrait size={40} style={{ margin: 2 }} />
  ),
};
