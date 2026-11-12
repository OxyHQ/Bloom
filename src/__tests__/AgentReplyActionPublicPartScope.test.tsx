import { render } from '@testing-library/react-native';
import { AgentReplyAction } from '../agent-reply';
import { BloomScope } from '../appearance';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const action = <AgentReplyAction icon={RiCheckLine} label="Save response" onPress={() => {}} />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{action}</BloomScope> : action}
    </BloomThemeProvider>
  );
}

it('keeps its explicit small control size under external BloomScope values', () => {
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByLabelText('Save response').props.style).height;
  expect(height()).toBe(32);
  screen.rerender(<Subject size="xs" />);
  expect(height()).toBe(32);
  screen.rerender(<Subject size="lg" />);
  expect(height()).toBe(32);
});
