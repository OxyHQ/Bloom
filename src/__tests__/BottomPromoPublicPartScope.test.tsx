import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { BottomPromo } from '../bottom-promo';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps BottomPromo action at the large recipe under %s scope',
  (size) => {
    const promo = <BottomPromo title="Find a place" actionLabel="Explore" onAction={() => {}} />;
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{promo}</BloomScope> : promo}
      </BloomThemeProvider>,
    );
    expect(
      tree.UNSAFE_root.findAll((node) => resolvedStyle(node.props.style).height === 44).length,
    ).toBeGreaterThan(0);
  },
);

it('keeps BottomPromo action at the large recipe under nested lg-over-xs', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <BottomPromo title="Find a place" actionLabel="Explore" onAction={() => {}} />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(
    tree.UNSAFE_root.findAll((node) => resolvedStyle(node.props.style).height === 44).length,
  ).toBeGreaterThan(0);
});
