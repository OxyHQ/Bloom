/**
 * `struct X: ViewModifier`: a stateless one is applied in place, in rows too; a stateful one keeps
 * its state in the view applying it, and its result is the screen's root, so the screen's chrome
 * is the content's (`.title("Feeds")`) or none where a gated state says `.header(false)`.
 */
import { createElement, type ComponentType } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The router's navigators, as the runtime's router tests take them (Expo Router's native
// navigators are not installed in the language tests).
jest.mock('expo-router', () => ({
  ExperimentalStack: Object.assign(() => null, { Screen: 'ExperimentalStackScreen' }),
}));
jest.mock('../../bloom-language/src/router/stack', () =>
  jest.requireActual('../../bloom-language/src/router/stack.tsx'),
);
jest.mock('../../bloom-language/src/router/tabs', () =>
  jest.requireActual('../../bloom-language/src/router/tabs.tsx'),
);
jest.mock('../../bloom-language/src/router/bar', () =>
  jest.requireActual('../../bloom-language/src/router/bar.tsx'),
);
jest.mock('../../bloom-language/src/router/screen-header', () =>
  jest.requireActual('../../bloom-language/src/router/screen-header.tsx'),
);
jest.mock('../../bloom-language/src/router/sheet-host', () =>
  jest.requireActual('../../bloom-language/src/router/sheet-host.tsx'),
);

// Required, not imported: see bloom.cost.test.tsx.
const Feeds = (
  require('./bloom/view-modifier.bloom') as { default: ComponentType<{ names: string[] }> }
).default;

const hosts = (r: TestRenderer.ReactTestRenderer, type: string) =>
  r.root.findAll((node) => node.type === type);
const texts = (r: TestRenderer.ReactTestRenderer): string[] =>
  r.root
    .findAll((node) => typeof node.type === 'string' && typeof node.props.children === 'string')
    .map((node) => node.props.children as string);

it('gates a screen: no header while gated, the content’s title once through', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(createElement(Feeds, { names: ['a', 'b'] }));
  });
  expect(texts(r)).toContain('Loading');
  expect(hosts(r, 'PageHeader')).toHaveLength(0);
  const press = r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
  )[0];
  act(() => press?.props.onPress());
  // Allowed (fewer than three names): the content, its rows drawn through `Card`, with its title.
  expect(texts(r)).toEqual(['a', 'b']);
  expect(hosts(r, 'PageHeader')[0]?.props.title).toBe('Feeds');
});

it('locks a screen, keeping the gate’s state across renders', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(createElement(Feeds, { names: ['a', 'b', 'c'] }));
  });
  const press = r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
  )[0];
  act(() => press?.props.onPress());
  // Not allowed (three names): the lock state, no header.
  expect(texts(r)).toEqual(['Unavailable']);
  expect(hosts(r, 'PageHeader')).toHaveLength(0);
  // Its state (`ready`) is kept: fewer names now draw the content at once.
  act(() => r.update(createElement(Feeds, { names: ['a'] })));
  expect(texts(r)).toEqual(['a']);
  expect(hosts(r, 'PageHeader')[0]?.props.title).toBe('Feeds');
});
