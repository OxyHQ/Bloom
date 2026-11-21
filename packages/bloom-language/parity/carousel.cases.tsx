import { Carousel, CarouselDots, CarouselItem } from '@oxy.so/bloom/carousel';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const dot = (slide: number) => `Photo ${slide}`;

const slides = () => [
  L.CarouselItem(L.Text('One')).label('First'),
  L.CarouselItem(L.Text('Two')),
  L.CarouselItem(L.Text('Three')).width('256'),
];
const bloomSlides = () => [
  <CarouselItem key="1" accessibilityLabel="First">
    <Text>One</Text>
  </CarouselItem>,
  <CarouselItem key="2">
    <Text>Two</Text>
  </CarouselItem>,
  <CarouselItem key="3" width={256}>
    <Text>Three</Text>
  </CarouselItem>,
];

const carousels: ParityCase[] = [
  {
    name: 'a carousel',
    language: () => toElement(L.Carousel(...slides()).label('Photos')),
    bloom: () => <Carousel accessibilityLabel="Photos">{bloomSlides()}</Carousel>,
  },
  ...ENUMS.arrowsPlacement.map((placement) => ({
    name: `arrows in the ${placement}`,
    language: () =>
      toElement(
        L.Carousel(...slides())
          .arrows(placement)
          .headerContent(L.Text('Popular'))
          .footerContent(L.Text('3 places'))
          .label('Places'),
      ),
    bloom: () => (
      <Carousel
        accessibilityLabel="Places"
        arrowsPlacement={placement}
        header={<Text>Popular</Text>}
        footer={<Text>3 places</Text>}
      >
        {bloomSlides()}
      </Carousel>
    ),
  })),
  ...ENUMS.arrowsVisibility.map((visibility) => ({
    name: `arrows ${visibility}, inset, hidden when unavailable`,
    language: () =>
      toElement(
        L.Carousel(...slides())
          .arrowsVisibility(visibility)
          .arrowsInset('sm')
          .hidesUnavailableArrows()
          .label('Places'),
      ),
    bloom: () => (
      <Carousel
        accessibilityLabel="Places"
        arrowsVisibility={visibility}
        arrowsInset={8}
        hideUnavailableArrows
      >
        {bloomSlides()}
      </Carousel>
    ),
  })),
  ...ENUMS.carouselAlign.map((align) => ({
    name: `slides snapping to the ${align}, looping in groups, dots, no arrows`,
    language: () =>
      toElement(
        L.Carousel(...slides())
          .align(align)
          .loop()
          .groupSize(2)
          .dots()
          .arrows(false)
          .spacing('md')
          .contentInset('lg')
          .label('Places'),
      ),
    bloom: () => (
      <Carousel
        accessibilityLabel="Places"
        align={align}
        loop
        slidesPerGroup={2}
        showDots
        showArrows={false}
        gap={12}
        inset={16}
      >
        {bloomSlides()}
      </Carousel>
    ),
  })),
  {
    name: 'a controlled carousel with words of its own',
    language: () =>
      toElement(
        L.Carousel(...slides())
          .page([1, set])
          .labels({ previous: 'Back', next: 'On', dot })
          .dots()
          .label('Places')
          .testID('places'),
      ),
    bloom: () => (
      <Carousel
        accessibilityLabel="Places"
        index={1}
        onIndexChange={set}
        previousLabel="Back"
        nextLabel="On"
        dotLabel={dot}
        showDots
        testID="places"
      >
        {bloomSlides()}
      </Carousel>
    ),
  },
];

const dots: ParityCase[] = [
  {
    name: 'dots',
    language: () => toElement(L.CarouselDots(5, [2, set])),
    bloom: () => <CarouselDots count={5} index={2} onIndexChange={set} />,
  },
  ...ENUMS.dotsShape.flatMap((shape) =>
    ENUMS.dotsStyle.map((style) => ({
      name: `${shape} dots, ${style}`,
      language: () => toElement(L.CarouselDots(4, [0, set]).shape(shape).style(style)),
      bloom: () => (
        <CarouselDots count={4} index={0} onIndexChange={set} shape={shape} appearance={style} />
      ),
    })),
  ),
  {
    name: 'many dots, capped, named',
    language: () => toElement(L.CarouselDots(12, [6, set]).max(5).labels({ dot })),
    bloom: () => (
      <CarouselDots count={12} index={6} onIndexChange={set} maxDots={5} dotLabel={dot} />
    ),
  },
];

export const CAROUSEL_CASES: readonly ParityCase[] = [...carousels, ...dots];
