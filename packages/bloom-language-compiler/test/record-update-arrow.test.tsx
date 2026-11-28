/**
 * `draft = { ..draft, enabled: !draft.enabled }` on a `@State` of a TS interface type is React's
 * functional update returning the object (`(draft) => ({ … })`). Unparenthesised, the module did
 * not parse ("Missing semicolon").
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Settings } = require('./bloom/record-update-arrow.bloom') as {
  Settings: (props: {
    value: { enabled: boolean; countries: readonly string[]; message: string };
  }) => Parameters<typeof toElement>[0];
};

it('updates a TS interface state with a record copy', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      toElement(Settings({ value: { enabled: false, countries: ['ES'], message: 'Pay later' } })),
    );
  });
  const label = () =>
    r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
    )[0]?.props.children;
  const press = () => {
    const pressable = r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
    )[0];
    act(() => pressable?.props.onPress());
  };
  expect(label()).toBe('Off');
  press();
  expect(label()).toBe('On');
  press();
  expect(label()).toBe('Off');
});
