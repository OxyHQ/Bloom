import { render } from '@testing-library/react-native';
import { AgentReplyActions } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const row = (
    <AgentReplyActions onCopy={() => {}}>
      <Button testID="extra">
        <Text>Extra action</Text>
      </Button>
    </AgentReplyActions>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{row}</BloomScope> : row}
    </BloomThemeProvider>
  );
}

it('keeps built-in actions small and delegates size scope to caller actions', () => {
  const screen = render(<Subject />);
  const fixed = () =>
    ['Helpful response', 'Unhelpful response', 'Copy response'].map(
      (label) => resolvedStyle(screen.getByLabelText(label).props.style).height,
    );
  const extraHeight = () => resolvedStyle(screen.getByTestId('extra').props.style).height;
  expect(fixed()).toEqual([32, 32, 32]);
  const md = extraHeight();
  screen.rerender(<Subject size="xs" />);
  expect(fixed()).toEqual([32, 32, 32]);
  const xs = extraHeight();
  expect(xs).not.toBe(md);
  screen.rerender(<Subject size="lg" />);
  expect(fixed()).toEqual([32, 32, 32]);
  expect(extraHeight()).not.toBe(xs);
});
