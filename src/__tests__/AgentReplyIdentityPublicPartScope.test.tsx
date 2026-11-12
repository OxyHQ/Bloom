import { render } from '@testing-library/react-native';
import { AgentReplyIdentity } from '../agent-reply';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const identity = <AgentReplyIdentity character={{ preset: 'blue_beret' }} name="One" />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{identity}</BloomScope> : identity}
    </BloomThemeProvider>
  );
}

it('keeps its authored avatar geometry independent from BloomScope', () => {
  const screen = render(<Subject />);
  const dimensions = () =>
    screen.UNSAFE_root.findAll((node) => {
      const style = resolvedStyle(node.props.style);
      return style.width === 20 || style.width === 32;
    }).map((node) => resolvedStyle(node.props.style).width);
  const initial = dimensions();
  expect(initial).toEqual(expect.arrayContaining([20, 32]));
  screen.rerender(<Subject size="xs" />);
  expect(dimensions()).toEqual(initial);
  screen.rerender(<Subject size="lg" />);
  expect(dimensions()).toEqual(initial);
});
