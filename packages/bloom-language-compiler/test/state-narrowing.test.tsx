/**
 * A `@State` optional narrows as a `let` does: present where `!= none` (or the `else` of a
 * `== none` ternary) held, and drawn again when it changes.
 */
import { type ComposedView, toElement } from '@oxy.so/bloom-language';
import * as RN from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

// Required, not imported: see bloom.cost.test.tsx.
const { Picker } = require('./bloom/state-narrowing.bloom') as { Picker: () => ComposedView };

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function drawn(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll(
      (node) => typeof node.type === 'string' && node.children.every((c) => typeof c === 'string'),
    )
    .flatMap((node) => node.children as string[]);
}

it('reads the narrowed state, and draws its new value', () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<RN.View>{toElement(Picker())}</RN.View>);
  });
  expect(drawn(renderer)).toContain('None');
  const pick = renderer.root.find((node) => node.props.testID === 'pick' && node.props.onPress);
  act(() => pick.props.onPress());
  expect(drawn(renderer)).toContain('Picked a');
  act(() => renderer.unmount());
});
