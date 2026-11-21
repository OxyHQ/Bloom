import type React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { defineKeyframes } from '../motion/keyframes';

/**
 * A `MotionView`'s exit on the web: the `Presence` keeps the child, the view
 * with the `exit` plays it and lets the child go when it ends. A moving view
 * inside it (the toast's enter, with no exit) is not the leaver: it must not
 * let the child go at once, which is how the toast lost its exit on the web.
 */
jest.mock('../motion/motion-host', () => jest.requireActual('../motion/motion-host.web'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Presence } = require('../motion/presence') as typeof import('../motion/presence');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MotionView } = require('../motion/MotionView') as typeof import('../motion/MotionView');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const leave = defineKeyframes(
  [
    { at: 0, opacity: 1 },
    { at: 1, opacity: 0 },
  ],
  'exit',
);
const played: Array<{ target: string; finish: () => void }> = [];
function createNodeMock(element: React.ReactElement) {
  const target = (element.props as { testID?: string }).testID ?? 'inner';
  return {
    animate() {
      const animation = { onfinish: null as null | (() => void), cancel() {} };
      played.push({ target, finish: () => animation.onfinish?.() });
      return animation;
    },
    matches: () => false,
    querySelectorAll: () => [],
  };
}

function Row({ label }: { label: string; exit?: boolean }) {
  return (
    <MotionView testID={label} exit={{ keyframes: leave, material: false }}>
      <MotionView>
        <Text>{label}</Text>
      </MotionView>
    </MotionView>
  );
}
const list = (ids: string[]) => (
  <Presence items={ids.map((id) => <Row key={id} exit label={id} />)} />
);
const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((node) => node.props.children);

describe('a MotionView exit in a web Presence', () => {
  it('keeps the child while the exit plays, whatever moves inside it', () => {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(list(['a', 'b']), { createNodeMock });
    });
    act(() => r.update(list(['b'])));
    expect(texts(r)).toEqual(['a', 'b']);
    const exit = played.find((animation) => animation.target === 'a');
    expect(exit).toBeDefined();
    act(() => exit?.finish());
    expect(texts(r)).toEqual(['b']);
  });
});
