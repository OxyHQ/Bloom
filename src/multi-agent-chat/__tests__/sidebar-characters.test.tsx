import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import type { AvatarGroupProps } from '../../avatar-group/types';
import { parseAvatarCharacter } from '../../agent-avatar';
import type { ConversationSidebarProps } from '../../conversation-sidebar/types';
import { ChatSidebar } from '../ChatSidebar';
import { agentCharacter, INITIAL_WORKSPACE } from '../data';

const mockSidebar = jest.fn((_props: ConversationSidebarProps) => null);
jest.mock('../context', () => ({
  useChatComponents: () => ({ ConversationSidebar: mockSidebar }),
}));

it('paints stored agent parts before passing them to sidebar and picker avatar groups', () => {
  const callback = jest.fn();
  render(
    <ChatSidebar
      agents={INITIAL_WORKSPACE.agents}
      chats={INITIAL_WORKSPACE.chats}
      activeId={INITIAL_WORKSPACE.activeId}
      pending={{}}
      query=""
      searchOpen={false}
      onQuery={callback}
      onSearch={callback}
      onSelect={callback}
      onCreate={callback}
      onPicker={callback}
      onMarketplace={callback}
      onSettings={callback}
      onSupport={callback}
      onAction={callback}
    />,
  );
  const props = mockSidebar.mock.calls[0]![0];
  for (const conversation of props.conversations) {
    for (const agent of conversation.agents) {
      const saved = INITIAL_WORKSPACE.agents.find((entry) => entry.id === agent.id)!;
      expect(agent.avatar).toEqual(agentCharacter(saved));
      expect(() => parseAvatarCharacter(agent.avatar)).not.toThrow();
    }
  }
  const picker = props.createOptions?.find((option) => option.key === 'picker');
  const avatars = picker?.leading as ReactElement<AvatarGroupProps>;
  for (const item of avatars.props.items) {
    if (item.kind !== 'bot') throw new Error('Expected bot avatar');
    const saved = INITIAL_WORKSPACE.agents.find((entry) => entry.id === item.id)!;
    expect(item.character).toEqual(agentCharacter(saved));
    expect(() => parseAvatarCharacter(item.character)).not.toThrow();
  }
});
