import { render } from '@testing-library/react-native';
import { AgentChatMessage } from '../agent-chat';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const messages = (
    <>
      {/* biome-ignore lint/a11y/useValidAriaRole: role is AgentChatMessage's domain enum, not a host ARIA role. */}
      <AgentChatMessage role="user" text="Question" testID="user-message" />
      {/* biome-ignore lint/a11y/useValidAriaRole: role is AgentChatMessage's domain enum, not a host ARIA role. */}
      <AgentChatMessage
        role="assistant"
        text="Answer"
        testID="assistant-message"
        onCopy={() => undefined}
      />
    </>
  );
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{messages}</BloomScope> : messages}
    </BloomThemeProvider>
  );
}

it('keeps authored bubble insets and fixed reply actions independent from BloomScope on native', () => {
  const screen = render(<Subject />);
  const geometry = () => ({
    bubble: resolvedStyle(screen.getByTestId('user-message').props.style),
    action: resolvedStyle(screen.getByLabelText('Copy message').props.style),
  });
  const initial = geometry();
  expect(initial.bubble).toMatchObject({
    maxWidth: '75%',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 11,
    paddingBottom: 11,
  });
  expect(initial.action).toMatchObject({ width: 28, height: 28 });
  screen.rerender(<Subject size="xs" />);
  expect(geometry()).toEqual(initial);
  screen.rerender(<Subject size="lg" />);
  expect(geometry()).toEqual(initial);
});
