import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { CarouselDots } from '../carousel';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../styles/pointer', () => {
  const actual = jest.requireActual('../styles/pointer');
  return { ...actual, useTouchInput: () => true };
});

const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)('CarouselDots provides 44px touch targets under %s scope', (size) => {
  const dots = (
    <CarouselDots testID="dots" count={3} index={1} onIndexChange={() => {}} duration={0} />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{dots}</BloomScope> : dots}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('dots').props.style).minHeight).toBe(44);
  const targets = [1, 2, 3].map((slide) => tree.getByLabelText(`Go to slide ${slide}`));
  for (const target of targets) {
    expect(resolvedStyle(target.props.style)).toMatchObject({ width: 44, height: 44 });
    expect(target.props.hitSlop).toBeUndefined();
  }
});

it('decorative dots remain a 6px visual indicator without interactive targets', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <CarouselDots testID="dots" count={3} index={1} duration={0} />
    </BloomThemeProvider>,
  );
  expect(
    resolvedStyle(tree.getByTestId('dots', { includeHiddenElements: true }).props.style).minHeight,
  ).toBe(6);
  expect(tree.queryAllByLabelText(/^Go to slide/)).toHaveLength(0);
});

it('nested lg scope keeps CarouselDots touch targets at 44px', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <CarouselDots testID="dots" count={3} index={1} onIndexChange={() => {}} duration={0} />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('dots').props.style).minHeight).toBe(44);
  expect(resolvedStyle(tree.getByLabelText('Go to slide 2').props.style)).toMatchObject({
    width: 44,
    height: 44,
  });
});
