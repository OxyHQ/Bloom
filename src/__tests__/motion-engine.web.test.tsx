import React, { useRef } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { usePlay } from '../motion/motion-host.web';
import { defineKeyframes } from '../motion/keyframes';
import { timingOf } from '../motion/timing';
import { MOTION } from '../motion/tokens';
import type { Play } from '../motion/play';
import { surfaceMaterialCss } from '../surface/web-material';

/**
 * Bloom's motion engine on the web: keyframes are `element.animate()`, each
 * frame carrying its stretch's curve (as a CSS animation applies its timing
 * function per stretch). A box that holds a material host never fades: the
 * material's own layers and the content on it fade instead.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
surfaceMaterialCss('.test-material', 'red');

interface Recorded {
  target: string;
  frames: unknown;
  options: Record<string, unknown>;
}
const played: Recorded[] = [];
function element(name: string, children: FakeElement[] = [], material = false): FakeElement {
  const self: FakeElement = {
    name,
    children,
    matches: (selector: string) => material && selector.includes('.test-material'),
    contains: (node: FakeElement) =>
      node === self || children.some((child) => child.contains(node)),
    querySelector: (selector: string) => self.querySelectorAll(selector)[0] ?? null,
    querySelectorAll: (selector: string) =>
      children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []),
        ...child.querySelectorAll(selector),
      ]),
    animate(frames: unknown, options: Record<string, unknown>) {
      played.push({
        target: options.pseudoElement ? `${name}${String(options.pseudoElement)}` : name,
        frames,
        options,
      });
      return { onfinish: null, cancel: () => {} };
    },
  };
  return self;
}
interface FakeElement {
  name: string;
  children: FakeElement[];
  matches: (selector: string) => boolean;
  contains: (node: FakeElement) => boolean;
  querySelector: (selector: string) => FakeElement | null;
  querySelectorAll: (selector: string) => FakeElement[];
  animate: (frames: unknown, options: Record<string, unknown>) => unknown;
}

function Box({ play, node }: { play: Play; node: FakeElement }) {
  const ref = useRef<unknown>(node);
  usePlay(ref, play);
  return null;
}

const enter = defineKeyframes(
  [
    { at: 0, opacity: 0, translateY: 50 },
    { at: 0.4, opacity: 0.8, translateY: 10, easing: 'linear' },
    { at: 1, opacity: 1, translateY: 0 },
  ],
  'enter',
);
const play = (material: boolean): Play => ({
  id: 1,
  keyframes: enter,
  timing: timingOf(MOTION.enter),
  fill: 'none',
  material,
  onEnd: undefined,
});
const QUART = 'cubic-bezier(0.165,0.84,0.44,1)';

beforeEach(() => {
  played.length = 0;
});

it('plays keyframes with element.animate(), each stretch on its own curve, the whole linearly', () => {
  act(() => {
    TestRenderer.create(<Box play={play(false)} node={element('box')} />);
  });
  expect(played).toEqual([
    {
      target: 'box',
      frames: [
        { offset: 0, easing: QUART, opacity: 0, transform: 'translateY(50px)' },
        {
          offset: 0.4,
          easing: 'cubic-bezier(0,0,1,1)',
          opacity: 0.8,
          transform: 'translateY(10px)',
        },
        { offset: 1, easing: QUART, opacity: 1, transform: 'translateY(0px)' },
      ],
      options: { duration: 300, fill: 'none' },
    },
  ]);
});

it('a box that holds a material only moves; the material’s layers and the content on it fade', () => {
  const content = element('content');
  const material = element('material', [content], true);
  act(() => {
    TestRenderer.create(<Box play={play(true)} node={element('box', [material])} />);
  });
  expect(played.map((animation) => animation.target)).toEqual([
    'box',
    'material::before',
    'material::after',
    'content',
  ]);
  const [box, layer] = played;
  expect(box?.frames).toEqual([
    { offset: 0, easing: QUART, transform: 'translateY(50px)' },
    { offset: 0.4, easing: 'cubic-bezier(0,0,1,1)', transform: 'translateY(10px)' },
    { offset: 1, easing: QUART, transform: 'translateY(0px)' },
  ]);
  expect(layer?.frames).toEqual([
    { offset: 0, easing: QUART, opacity: 0 },
    { offset: 0.4, easing: 'cubic-bezier(0,0,1,1)', opacity: 0.8 },
    { offset: 1, easing: QUART, opacity: 1 },
  ]);
});
