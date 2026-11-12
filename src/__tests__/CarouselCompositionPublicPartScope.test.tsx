import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Carousel, CarouselItem } from '../carousel';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

function gallery() {
  return (
    <Carousel
      accessibilityLabel="Gallery"
      testID="gallery"
      header={
        <Button testID="gallery-header">
          <Text>See all</Text>
        </Button>
      }
      footer={
        <Button testID="gallery-footer">
          <Text>More</Text>
        </Button>
      }
      renderControls={(controls) => (
        <Button testID="gallery-custom-next" {...controls.next}>
          <Text>Next</Text>
        </Button>
      )}
    >
      <CarouselItem testID="slide">
        <Button testID="slide-action">
          <Text>Open</Text>
        </Button>
      </CarouselItem>
      <CarouselItem>
        <Text>Slide two</Text>
      </CarouselItem>
    </Carousel>
  );
}

function expectControlHeight(tree: ReturnType<typeof render>, id: string, height: number) {
  const matches = tree.getAllByTestId(id);
  const control = matches.find((node) => resolvedStyle(node.props.style).height !== undefined);
  if (!control) throw new Error(`Missing sized carousel control: ${id}`);
  expect(resolvedStyle(control.props.style).height).toBe(height);
}

it.each(sizes)(
  'Carousel header, footer, controls and CarouselItem delegate at %s scope',
  (size, height) => {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{gallery()}</BloomScope> : gallery()}
      </BloomThemeProvider>,
    );
    for (const id of ['gallery-header', 'gallery-footer', 'gallery-custom-next', 'slide-action']) {
      expectControlHeight(tree, id, height);
    }
  },
);

it.each(sizes)(
  'Carousel default arrows keep explicit size and explicit override wins at %s scope',
  (size) => {
    const carousel = (
      <Carousel
        accessibilityLabel="Gallery"
        testID="gallery"
        showDots={false}
        arrowButtonProps={{ size: 'lg' }}
      >
        <CarouselItem>
          <Text>One</Text>
        </CarouselItem>
        <CarouselItem>
          <Text>Two</Text>
        </CarouselItem>
      </Carousel>
    );
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{carousel}</BloomScope> : carousel}
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(tree.getByLabelText('Next slide').props.style).height).toBe(44);
  },
);

it.each(sizes)('Carousel default non-overlay arrows stay sm under %s scope', (size) => {
  const carousel = (
    <Carousel accessibilityLabel="Gallery" showDots={false}>
      <CarouselItem>
        <Text>One</Text>
      </CarouselItem>
      <CarouselItem>
        <Text>Two</Text>
      </CarouselItem>
    </Carousel>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{carousel}</BloomScope> : carousel}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByLabelText('Next slide').props.style).height).toBe(32);
});

it('Carousel children use the nearest nested lg scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">{gallery()}</BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  for (const id of ['gallery-header', 'gallery-footer', 'gallery-custom-next', 'slide-action']) {
    expectControlHeight(tree, id, 44);
  }
});
