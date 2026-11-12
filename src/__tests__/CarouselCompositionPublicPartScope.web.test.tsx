/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Carousel, CarouselItem } from '../carousel';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
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

function mount(size: (typeof sizes)[number][0], children: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{children}</BloomScope> : children}
      </BloomThemeProvider>,
    ),
  );
  return { host, root };
}

function required(host: HTMLElement, id: string) {
  const element = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Missing Carousel child control: ${id}`);
  return element.matches('button')
    ? element
    : (element.querySelector<HTMLElement>('button') ?? element);
}

it.each(sizes)('Carousel slots and CarouselItem delegate at %s scope on web', (size, height) => {
  const mounted = mount(size, gallery());
  try {
    for (const id of ['gallery-header', 'gallery-footer', 'gallery-custom-next', 'slide-action']) {
      expect(getComputedStyle(required(mounted.host, id)).height).toBe(height);
    }
  } finally {
    act(() => mounted.root.unmount());
    mounted.host.remove();
  }
});

it.each(sizes)(
  'Carousel default arrows keep explicit size and explicit override wins at %s scope on web',
  (size) => {
    const carousel = (
      <Carousel accessibilityLabel="Gallery" showDots={false} arrowButtonProps={{ size: 'lg' }}>
        <CarouselItem>
          <Text>One</Text>
        </CarouselItem>
        <CarouselItem>
          <Text>Two</Text>
        </CarouselItem>
      </Carousel>
    );
    const mounted = mount(size, carousel);
    try {
      const next = mounted.host.querySelector<HTMLElement>('[aria-label="Next slide"]');
      if (!next) throw new Error('Missing Carousel next arrow');
      expect(getComputedStyle(next).height).toBe('44px');
    } finally {
      act(() => mounted.root.unmount());
      mounted.host.remove();
    }
  },
);

it.each(sizes)('Carousel default non-overlay arrows stay sm under %s scope on web', (size) => {
  const mounted = mount(
    size,
    <Carousel accessibilityLabel="Gallery" showDots={false}>
      <CarouselItem>
        <Text>One</Text>
      </CarouselItem>
      <CarouselItem>
        <Text>Two</Text>
      </CarouselItem>
    </Carousel>,
  );
  try {
    const next = mounted.host.querySelector<HTMLElement>('[aria-label="Next slide"]');
    if (!next) throw new Error('Missing Carousel next arrow');
    expect(getComputedStyle(next).height).toBe('32px');
  } finally {
    act(() => mounted.root.unmount());
    mounted.host.remove();
  }
});

it('Carousel slots and slide controls resolve the nearest nested lg scope on web', () => {
  const mounted = mount('xs', <BloomScope size="lg">{gallery()}</BloomScope>);
  try {
    for (const id of ['gallery-header', 'gallery-footer', 'gallery-custom-next', 'slide-action']) {
      expect(getComputedStyle(required(mounted.host, id)).height).toBe('44px');
    }
  } finally {
    act(() => mounted.root.unmount());
    mounted.host.remove();
  }
});
