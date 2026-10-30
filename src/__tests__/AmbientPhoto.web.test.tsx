/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AmbientPhoto } from '../ambient-photo/AmbientPhoto.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Each photo's decode, resolved or rejected by the test. */
const decodes = new Map<string, { resolve: () => void; reject: () => void }>();
const animations: { keyframes: Keyframe[]; cancel: jest.Mock }[] = [];

let reducedMotion = false;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  decodes.clear();
  animations.length = 0;
  reducedMotion = false;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value(this: HTMLImageElement) {
      return new Promise<void>((resolve, reject) => {
        decodes.set(this.src, { resolve, reject });
      });
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value(keyframes: Keyframe[]) {
      const animation = { keyframes, cancel: jest.fn() };
      animations.push(animation);
      return animation;
    },
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

const layers = () =>
  Array.from(container.querySelectorAll('[data-testid="photo"] > div')) as HTMLDivElement[];

async function decode(uri: string, outcome: 'resolve' | 'reject' = 'resolve') {
  await act(async () => {
    decodes.get(`https://cdn.example/${uri}`)?.[outcome]();
  });
}

function show(source: string, props: Partial<React.ComponentProps<typeof AmbientPhoto>> = {}) {
  act(() =>
    root.render(
      <AmbientPhoto testID="photo" source={`https://cdn.example/${source}`} {...props} />,
    ),
  );
}

it('fades a photo in only once it is decoded, and starts its drift', async () => {
  const onShown = jest.fn();
  show('a.jpg', { onShown });
  expect(layers().map((layer) => layer.style.opacity)).toEqual(['0', '0']);
  expect(onShown).not.toHaveBeenCalled();

  await decode('a.jpg');
  const [first, second] = layers();
  expect(second?.style.backgroundImage).toBe('url("https://cdn.example/a.jpg")');
  expect(second?.style.opacity).toBe('1');
  expect(first?.style.opacity).toBe('0');
  expect(second?.style.transition).toBe('opacity 2500ms ease-in-out');
  expect(animations[0]?.keyframes).toEqual([
    { transform: 'scale(1)' },
    { transform: 'scale(1.04)' },
  ]);
  expect(onShown).toHaveBeenCalledWith('https://cdn.example/a.jpg');
});

it('cross-fades to the next photo and lets the one that left go of its image', async () => {
  show('a.jpg');
  await decode('a.jpg');
  show('b.jpg');
  await decode('b.jpg');

  const [first, second] = layers();
  expect(first?.style.backgroundImage).toBe('url("https://cdn.example/b.jpg")');
  expect(first?.style.opacity).toBe('1');
  expect(second?.style.opacity).toBe('0');
  // Promoted only while the fade runs.
  expect(first?.style.willChange).toBe('opacity, transform');

  act(() => jest.advanceTimersByTime(2600));
  expect(second?.style.backgroundImage).toBe('none');
  expect(first?.style.willChange).toBe('');
  expect(second?.style.willChange).toBe('');
  expect(animations[0]?.cancel).toHaveBeenCalled();
});

it('shows only the newest of photos asked for while an earlier one decoded', async () => {
  const onShown = jest.fn();
  show('a.jpg', { onShown });
  show('b.jpg', { onShown });
  await decode('a.jpg');
  expect(onShown).not.toHaveBeenCalled();
  await decode('b.jpg');
  expect(onShown).toHaveBeenCalledTimes(1);
  expect(onShown).toHaveBeenCalledWith('https://cdn.example/b.jpg');
});

it('keeps the photo on screen when the next one cannot load', async () => {
  show('a.jpg');
  await decode('a.jpg');
  show('broken.jpg');
  await decode('broken.jpg', 'reject');
  const [, second] = layers();
  expect(second?.style.backgroundImage).toBe('url("https://cdn.example/a.jpg")');
  expect(second?.style.opacity).toBe('1');
});

it('does not drift when asked not to', async () => {
  show('a.jpg', { drift: false });
  await decode('a.jpg');
  expect(animations).toHaveLength(0);
});

it('stops the drift, not the fade, when the system reduces motion', async () => {
  reducedMotion = true;
  show('a.jpg');
  await decode('a.jpg');
  expect(animations).toHaveLength(0);
  expect(layers()[1]?.style.opacity).toBe('1');
});

it('is decorative: hidden from assistive technology and from the pointer', () => {
  show('a.jpg');
  const host = container.querySelector('[data-testid="photo"]') as HTMLElement;
  expect(host.getAttribute('aria-hidden')).toBe('true');
  expect(getComputedStyle(host).pointerEvents).toBe('none');
});
