import type { ComponentProps } from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import type { BloomIconComponent } from '../icons';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { IconCircle } from '../icon-circle';

const seen: Array<ComponentProps<BloomIconComponent>> = [];
const Icon: BloomIconComponent = (props) => {
  seen.push(props);
  return <View testID="glyph" style={{ width: props.width, height: props.height }} />;
};

function Subject({
  scope,
  nestedScope,
  size,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  size?: 'lg' | 'xl';
}) {
  const content = <IconCircle icon={Icon} size={size} />;
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

function dimensions(screen: ReturnType<typeof render>) {
  const glyph = screen.getByTestId('glyph');
  const circle = glyph.parent?.parent?.parent;
  if (!circle) throw new Error('IconCircle fixture did not render its disc');
  const disc = resolvedStyle(circle.props.style);
  const icon = resolvedStyle(glyph.props.style);
  return [disc.width, disc.height, icon.width, icon.height];
}

it('keeps its icon-token geometry independent from Bloom control scopes', () => {
  seen.length = 0;
  const screen = render(<Subject />);
  const baseline = dimensions(screen);
  expect(baseline).toEqual([64, 64, 28, 28]);
  expect(seen.at(-1)).toMatchObject({ width: 28, height: 28 });

  screen.rerender(<Subject scope="xs" />);
  expect(dimensions(screen)).toEqual(baseline);
  screen.rerender(<Subject scope="lg" />);
  expect(dimensions(screen)).toEqual(baseline);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(dimensions(screen)).toEqual(baseline);

  screen.rerender(<Subject scope="lg" size="lg" />);
  expect(dimensions(screen)).toEqual([52, 52, 24, 24]);
});
