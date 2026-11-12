import { render } from '@testing-library/react-native';
import { AgentStack, type AgentReplyAgent } from '../agent-reply';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const agents: AgentReplyAgent[] = [
  { id: 'one', name: 'One', avatar: { preset: 'blue_beret' } },
  { id: 'two', name: 'Two', avatar: { preset: 'blue_beret' } },
];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const stack = <AgentStack agents={agents} size={48} />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{stack}</BloomScope> : stack}
    </BloomThemeProvider>
  );
}

it('keeps its numeric avatar canvas size independent from BloomScope', () => {
  const screen = render(<Subject />);
  const style = () => resolvedStyle(screen.getByLabelText('One, Two').props.style);
  const assertSize = () => expect(style()).toMatchObject({ width: 48, height: 48 });
  assertSize();
  screen.rerender(<Subject size="xs" />);
  assertSize();
  screen.rerender(<Subject size="lg" />);
  assertSize();
});
