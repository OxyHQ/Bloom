import { render } from '@testing-library/react-native';
import { AgentReplyBubble } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const bubble = (
    <AgentReplyBubble>
      <Button testID="action">
        <Text>Reply action</Text>
      </Button>
    </AgentReplyBubble>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{bubble}</BloomScope> : bubble}
    </BloomThemeProvider>
  );
}

it('keeps its balanced text padding and delegates child control sizing', () => {
  const screen = render(<Subject />);
  const bubble = () => {
    const node = screen.root.findAll((instance) =>
      String(instance.props.className ?? '').includes('rounded-[var(--radius-2-5xl)]'),
    )[0];
    if (!node) throw new Error('AgentReplyBubble was not found');
    return node;
  };
  const padding = () => resolvedStyle(bubble().props.style).paddingVertical;
  const height = () => resolvedStyle(screen.getByTestId('action').props.style).height;
  expect(padding()).toBe(9);
  const md = height();
  screen.rerender(<Subject size="xs" />);
  expect(padding()).toBe(9);
  const xs = height();
  expect(xs).not.toBe(md);
  screen.rerender(<Subject size="lg" />);
  expect(padding()).toBe(9);
  expect(height()).not.toBe(xs);
});
