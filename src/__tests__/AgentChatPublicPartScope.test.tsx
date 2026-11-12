import { render } from '@testing-library/react-native';
import { AgentChat, type AgentChatMessageData } from '../agent-chat';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const messages: AgentChatMessageData[] = [{ id: 'one', role: 'user', text: 'Question' }];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const chat = <AgentChat testID="chat" messages={messages} />;
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{chat}</BloomScope> : chat}
    </BloomThemeProvider>
  );
}

it('preserves the inherited size through AppShell, Screen and PageHeader to chat actions on native', () => {
  const screen = render(<Subject />);
  const control = () => resolvedStyle(screen.getByTestId('chat-actions-share').props.style);
  expect(control()).toMatchObject({ width: 34, height: 34 });
  screen.rerender(<Subject size="xs" />);
  expect(control()).toMatchObject({ width: 24, height: 24 });
  screen.rerender(<Subject size="lg" />);
  expect(control()).toMatchObject({ width: 34, height: 34 });
});
