import { render } from '@testing-library/react-native';
import { AgentReply } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const reply = (
    <AgentReply>
      <Button testID="action">
        <Text>Reply action</Text>
      </Button>
    </AgentReply>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{reply}</BloomScope> : reply}
    </BloomThemeProvider>
  );
}

it('passes caller content size through while keeping reply layout owned', () => {
  const screen = render(<Subject />);
  const actionHeight = () => resolvedStyle(screen.getByTestId('action').props.style).height;
  const wrapper = () => {
    const node = screen.root.findAll((instance) =>
      String(instance.props.className ?? '').includes('group/reply'),
    )[0];
    if (!node) throw new Error('AgentReply layout wrapper was not found');
    return node;
  };
  const md = actionHeight();
  expect(resolvedStyle(wrapper()?.props.style).marginTop).toBe(12);
  screen.rerender(<Subject size="xs" />);
  const xs = actionHeight();
  expect(xs).not.toBe(md);
  expect(resolvedStyle(wrapper()?.props.style).marginTop).toBe(12);
  screen.rerender(<Subject size="lg" />);
  expect(actionHeight()).not.toBe(xs);
  expect(resolvedStyle(wrapper()?.props.style).marginTop).toBe(12);
});
