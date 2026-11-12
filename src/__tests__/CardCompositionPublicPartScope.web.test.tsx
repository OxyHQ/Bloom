/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SelectionCard,
} from '../card';
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

function sample() {
  return (
    <>
      <Card testID="card">
        <Button testID="card-child">
          <Text>Card</Text>
        </Button>
      </Card>
      <CardHeader>
        <Button testID="header-child">
          <Text>Header</Text>
        </Button>
      </CardHeader>
      <CardBody>
        <Button testID="body-child">
          <Text>Body</Text>
        </Button>
      </CardBody>
      <CardFooter>
        <Button testID="footer-child">
          <Text>Footer</Text>
        </Button>
      </CardFooter>
      <SelectionCard
        selection="single"
        selected={false}
        onPress={() => {}}
        title="Plan"
        testID="selection"
      >
        <Button testID="selection-child">
          <Text>Details action</Text>
        </Button>
      </SelectionCard>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardTitle renders string children in Bloom Text. */}
      <CardTitle>Title</CardTitle>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardDescription renders string children in Bloom Text. */}
      <CardDescription>Description</CardDescription>
    </>
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
  if (!element) throw new Error(`Missing Card child control: ${id}`);
  return element;
}

it.each(sizes)(
  'Card surfaces and slots delegate child controls under %s scope on web',
  (size, height) => {
    const mounted = mount(size, sample());
    try {
      for (const id of [
        'card-child',
        'header-child',
        'body-child',
        'footer-child',
        'selection-child',
      ]) {
        expect(getComputedStyle(required(mounted.host, id)).height).toBe(height);
      }
    } finally {
      act(() => mounted.root.unmount());
      mounted.host.remove();
    }
  },
);

it.each(sizes)(
  'CardTitle and CardDescription keep semantic typography under %s scope on web',
  (size) => {
    const mounted = mount(
      size,
      <>
        {/* biome-ignore lint/correctness/noReactNativeRawText: CardTitle renders string children in Bloom Text. */}
        <CardTitle>Title</CardTitle>
        {/* biome-ignore lint/correctness/noReactNativeRawText: CardDescription renders string children in Bloom Text. */}
        <CardDescription>Description</CardDescription>
      </>,
    );
    try {
      const title = Array.from(mounted.host.querySelectorAll<HTMLElement>('[dir="auto"]')).find(
        (node) => node.textContent === 'Title',
      );
      const description = Array.from(
        mounted.host.querySelectorAll<HTMLElement>('[dir="auto"]'),
      ).find((node) => node.textContent === 'Description');
      if (!title || !description) throw new Error('Missing Card typography');
      expect(getComputedStyle(title).fontSize).toBe('17px');
      expect(getComputedStyle(description).fontSize).toBe('14px');
    } finally {
      act(() => mounted.root.unmount());
      mounted.host.remove();
    }
  },
);

it('Card child slots resolve the nearest nested lg scope on web', () => {
  const mounted = mount('xs', <BloomScope size="lg">{sample()}</BloomScope>);
  try {
    for (const id of [
      'card-child',
      'header-child',
      'body-child',
      'footer-child',
      'selection-child',
    ]) {
      expect(getComputedStyle(required(mounted.host, id)).height).toBe('44px');
    }
    const title = Array.from(mounted.host.querySelectorAll<HTMLElement>('[dir="auto"]')).find(
      (node) => node.textContent === 'Title',
    );
    const description = Array.from(mounted.host.querySelectorAll<HTMLElement>('[dir="auto"]')).find(
      (node) => node.textContent === 'Description',
    );
    if (!title || !description) throw new Error('Missing Card typography');
    expect(getComputedStyle(title).fontSize).toBe('17px');
    expect(getComputedStyle(description).fontSize).toBe('14px');
  } finally {
    act(() => mounted.root.unmount());
    mounted.host.remove();
  }
});
