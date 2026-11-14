import { render } from '@testing-library/react-native';
import { AgentLogShimmerText } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const text = (
    <Text variant="body-regular" testID="parent">
      <AgentLogShimmerText>Reading files</AgentLogShimmerText>
    </Text>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{text}</BloomScope> : text}
    </BloomThemeProvider>
  );
}

it('inherits typography from its parent Text, independently of BloomScope', () => {
  const screen = render(<Subject />);
  const parentFontSize = () => resolvedStyle(screen.getByTestId('parent').props.style).fontSize;
  const shimmerColor = () => resolvedStyle(screen.getByText('Reading files').props.style).color;

  const defaultFontSize = parentFontSize();
  expect(shimmerColor()).toBeTruthy();
  screen.rerender(<Subject size="xs" />);
  expect(parentFontSize()).toBe(defaultFontSize);
  screen.rerender(<Subject size="lg" />);
  expect(parentFontSize()).toBe(defaultFontSize);
});
