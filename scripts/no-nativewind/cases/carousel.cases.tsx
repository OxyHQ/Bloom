import { Text } from 'react-native';
import { Carousel, CarouselItem } from '@bloom/carousel';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Carousel with arrows': () => (
    <Carousel accessibilityLabel="Gallery" arrowButtonProps={{ material: 'flat', iconSize: 20 }}>
      <CarouselItem>
        <Text>One</Text>
      </CarouselItem>
      <CarouselItem>
        <Text>Two</Text>
      </CarouselItem>
    </Carousel>
  ),
};
