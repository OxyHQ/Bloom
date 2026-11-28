/**
 * `@Transparent` structs are their one field at run time (`UserID` is a string, Codable as one),
 * and `@State private var id = UniqueID()` is React's `useId()`: one identity per view instance,
 * the same on every render, shared by the nodes that read `id.string`.
 */
import { HStack, toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = Parameters<typeof toElement>[0];

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/Transparent.bloom') as {
  userID: (raw: string) => unknown;
  rawOf: (id: unknown) => string;
  rawOfOptional: (id: unknown) => string | undefined;
  sameUser: (a: unknown, b: unknown) => boolean;
  sameUsers: (a: unknown[], b: unknown[]) => boolean;
  guests: (ids: unknown[]) => number;
  encodedUser: (id: unknown) => string;
  decodedUser: (text: string) => unknown;
  LabeledField: (props: { label: string }) => Node;
  Player: () => Node;
};

it('is its field at run time, compared and coded as it', () => {
  const id = m.userID('u1');
  expect(id).toBe('u1');
  expect(m.rawOf(id)).toBe('u1');
  expect(m.rawOfOptional(undefined)).toBeUndefined();
  expect(m.sameUser(m.userID('a'), m.userID('a'))).toBe(true);
  expect(m.sameUser(m.userID('a'), m.userID('b'))).toBe(false);
  expect(m.sameUsers(['a', 'b'], ['a', 'b'])).toBe(true);
  expect(m.sameUsers(['a', 'b'], ['a', 'c'])).toBe(false);
  expect(m.guests(['guest-1', 'u2', 'guest-3'])).toBe(2);
  expect(m.encodedUser(id)).toBe('"u1"');
  expect(m.decodedUser('"u2"')).toBe('u2');
  expect(m.decodedUser('{"raw":"u2"}')).toBeUndefined();
});

it('gives each view one identity for its life', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      toElement(
        HStack(m.LabeledField({ label: 'Card' }), m.LabeledField({ label: 'Name' }), m.Player()),
      ),
    );
  });
  const ids = () =>
    r.root
      .findAll((node) => typeof node.type === 'string' && typeof node.props.testID === 'string')
      .map((node) => node.props.testID as string);
  const first = ids();
  expect(first).toHaveLength(4);
  // A view's label and its button share one id; the two views' ids differ.
  expect(first[0]).toBe(first[1]);
  expect(first[2]).toBe(first[3]);
  expect(first[0]).not.toBe(first[2]);
  const press = r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
  );
  act(() => press[0]?.props.onPress());
  // A render keeps it.
  expect(ids()).toEqual(first);
  const player = r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
  );
  expect(player.some((node) => String(node.props.children).startsWith('player-'))).toBe(true);
});
