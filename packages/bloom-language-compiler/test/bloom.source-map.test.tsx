/**
 * A throw inside a `.bloom` handler is reported at the `.bloom` line that
 * threw: bloomc's map, inlined by the Jest transformer, composed by Babel
 * into the map Jest's stack traces read.
 */
import { toElement } from '@oxy.so/bloom-language';
import type TestRenderer from 'react-test-renderer';

import { Thrower } from './bloom/thrower.bloom';
import { measured } from './support/fibers';

/** The first host with a press handler. */
function press(renderer: TestRenderer.ReactTestRenderer): void {
  const [pressable] = renderer.root.findAll((node) => typeof node.props.onPress === 'function');
  pressable.props.onPress();
}

it('names the .bloom file and line in the stack', () => {
  let thrown: Error | undefined;
  measured(toElement(Thrower()), (renderer) => {
    try {
      press(renderer);
    } catch (error) {
      thrown = error as Error;
    }
  });
  expect(thrown?.message).toBe('from a .bloom handler');
  // explode() is called on line 9 of thrower.bloom.
  expect(thrown?.stack).toMatch(/test\/bloom\/thrower\.bloom:9:\d+/);
});
