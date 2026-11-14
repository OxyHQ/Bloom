import { render } from '@testing-library/react-native';
import { AgentThinking, ThinkingReasoning } from '../agent-thinking';
import { BloomScope } from '../appearance';
import { space } from '../styles/tokens';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const reasonText = 'Because';
  const content = (
    <>
      <AgentThinking testID="thinking" showTimer={false} />
      <ThinkingReasoning open testID="reasoning">
        {reasonText}
      </ThinkingReasoning>
    </>
  );
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{content}</BloomScope> : content}
    </BloomThemeProvider>
  );
}

it('keeps thinking status and reasoning geometry independent from BloomScope on native', () => {
  const screen = render(<Subject />);
  const geometry = () => {
    const reasoning = screen.UNSAFE_root.findAll((node) => {
      const style = resolvedStyle(node.props.style);
      return (
        style.marginStart === space.md &&
        style.paddingStart === space.md &&
        style.paddingVertical === space.xs &&
        style.borderStartWidth === 2
      );
    })[0];
    if (!reasoning) throw new Error('ThinkingReasoning did not render its rule geometry');
    return {
      row: resolvedStyle(screen.getByTestId('thinking').props.style),
      dots: resolvedStyle(
        screen.getByTestId('agent-thinking-dots', { includeHiddenElements: true }).props.style,
      ),
      label: resolvedStyle(
        screen.getByTestId('thinking-label', { includeHiddenElements: true }).props.style,
      ),
      reasoning: resolvedStyle(reasoning.props.style),
    };
  };
  const initial = geometry();
  expect(initial.row).toMatchObject({ flexDirection: 'row', gap: 10 });
  expect(initial.dots).toMatchObject({ width: 16, rowGap: 2, columnGap: 2 });
  expect(initial.label).toMatchObject({ fontSize: 14, lineHeight: 20 });
  expect(initial.reasoning).toMatchObject({
    marginStart: space.md,
    paddingStart: space.md,
    paddingVertical: space.xs,
    borderStartWidth: 2,
  });
  screen.rerender(<Subject size="xs" />);
  expect(geometry()).toEqual(initial);
  screen.rerender(<Subject size="lg" />);
  expect(geometry()).toEqual(initial);
});
