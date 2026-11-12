import { render } from '@testing-library/react-native';
import { AgentChatHistory, type AgentChatThread } from '../agent-chat';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const threads: AgentChatThread[] = [{ id: 'one', title: 'One thread', updatedAt: 1 }];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const history = <AgentChatHistory testID="history" threads={threads} formatAge={() => 'now'} />;
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{history}</BloomScope> : history}
    </BloomThemeProvider>
  );
}

it('keeps its rail, thread row and trailing slot geometry independent from BloomScope on native', () => {
  const screen = render(<Subject />);
  const geometry = () => ({
    rail: resolvedStyle(screen.getByTestId('history').props.style).width,
    selection: resolvedStyle(screen.getByTestId('history-thread-one-select').props.style),
    slots: screen.UNSAFE_root.findAll((node) => {
      const style = resolvedStyle(node.props.style);
      return style.width === 28 && style.height === 28;
    }).length,
  });
  const initial = geometry();
  expect(initial.rail).toBe(260);
  expect(initial.selection).toMatchObject({ paddingTop: 6, paddingBottom: 6, paddingLeft: 8 });
  expect(initial.slots).toBeGreaterThan(0);
  screen.rerender(<Subject size="xs" />);
  expect(geometry()).toEqual(initial);
  screen.rerender(<Subject size="lg" />);
  expect(geometry()).toEqual(initial);
});
