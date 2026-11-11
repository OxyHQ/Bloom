/* biome-ignore-all lint/correctness/noReactNativeRawText: Chip renders its text children through Bloom Text. */
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Badge } from '../badge';
import type { BadgeSize } from '../badge';
import { Chip } from '../chip';
import type { ChipSize } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  scope,
  nestedScope,
  badgeSize,
  chipSize,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  badgeSize?: BadgeSize;
  chipSize?: ChipSize;
}) {
  const content = (
    <>
      <Badge content="3" size={badgeSize} testID="badge" />
      <Chip size={chipSize} testID="chip">
        Filter
      </Chip>
    </>
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('resolves Badge and Chip Bloom size aliases from the nearest scope', () => {
  const screen = render(<Subject />);
  const heights = () => [
    resolvedStyle(screen.getByTestId('badge').props.style).height,
    resolvedStyle(screen.getByTestId('chip').props.style).height,
  ];

  expect(heights()).toEqual([18, 24]);
  screen.rerender(<Subject scope="xs" />);
  expect(heights()).toEqual([14, 20]);
  screen.rerender(<Subject scope="lg" />);
  expect(heights()).toEqual([24, 28]);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(heights()).toEqual([24, 28]);
});

it('preserves explicit Bloom aliases and component-specific rungs', () => {
  const screen = render(<Subject scope="xs" badgeSize="md" chipSize="md" />);
  const heights = () => [
    resolvedStyle(screen.getByTestId('badge').props.style).height,
    resolvedStyle(screen.getByTestId('chip').props.style).height,
  ];
  expect(heights()).toEqual([18, 24]);

  screen.rerender(<Subject scope="lg" badgeSize="label-medium" chipSize="2xl" />);
  expect(heights()).toEqual([24, 44]);
});
