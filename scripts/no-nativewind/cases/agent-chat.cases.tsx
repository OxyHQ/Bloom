import { AgentChatActions, AgentChatHistory, AgentChatMessage } from '@bloom/agent-chat';
import type { Cases } from '../support/cases';

const noop = () => {};

export const CASES: Cases = {
  'AgentChatActions loaded': () => (
    <AgentChatActions
      transcript="Hi"
      onShare={noop}
      onExport={noop}
      onToggleUnread={noop}
      onDelete={noop}
      testID="actions"
    />
  ),
  'AgentChatHistory loaded': () => (
    <AgentChatHistory
      threads={[
        { id: 't1', title: 'First', updatedAt: 0 },
        { id: 't2', title: 'Second', updatedAt: 0 },
      ]}
      activeId="t1"
      onSelect={noop}
      onNewChat={noop}
      onDelete={noop}
      account={{ name: 'Ana' }}
      accountItems={[{ key: 'a', label: 'Settings', onPress: noop }]}
      onLogOut={noop}
      formatAge={() => '1m'}
    />
  ),
  AgentChatMessage: () => <AgentChatMessage role="assistant" text="Reply" />,
};
