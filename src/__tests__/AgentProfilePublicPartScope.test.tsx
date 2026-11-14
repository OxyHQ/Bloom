import { render } from '@testing-library/react-native';
import { AgentProfile, type AgentReplyAgent } from '../agent-reply';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const agents: AgentReplyAgent[] = [
  { id: 'one', name: 'One', avatar: { preset: 'blue_beret' } },
  { id: 'two', name: 'Two', avatar: { preset: 'blue_beret' } },
];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const profile = <AgentProfile agents={agents} onPress={() => undefined} />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{profile}</BloomScope> : profile}
    </BloomThemeProvider>
  );
}

it('keeps the fixed avatar canvas geometry independent from BloomScope', () => {
  const screen = render(<Subject />);
  const canvas = () =>
    screen.UNSAFE_root.findAll((node) => {
      const style = resolvedStyle(node.props.style);
      return style.width === 56 && style.height === 56;
    }).length;
  const assertSize = () => expect(canvas()).toBeGreaterThan(0);
  assertSize();
  screen.rerender(<Subject size="xs" />);
  assertSize();
  screen.rerender(<Subject size="lg" />);
  assertSize();
});
