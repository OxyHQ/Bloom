import { render } from '@testing-library/react-native';
import { AgentChatActions } from '../agent-chat';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const actions = <AgentChatActions testID="actions" transcript="Transcript" />;
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{actions}</BloomScope> : actions}
    </BloomThemeProvider>
  );
}

it('delegates inherited control size to ButtonGroup on native', () => {
  const screen = render(<Subject />);
  const assertGeometry = (height: number) => {
    expect(resolvedStyle(screen.getByTestId('actions-share').props.style)).toMatchObject({
      width: height,
      height,
    });
    expect(resolvedStyle(screen.getByTestId('actions-more').props.style)).toMatchObject({
      width: height,
      height,
    });
  };
  assertGeometry(34);
  screen.rerender(<Subject size="xs" />);
  assertGeometry(24);
  screen.rerender(<Subject size="lg" />);
  assertGeometry(34);
});
