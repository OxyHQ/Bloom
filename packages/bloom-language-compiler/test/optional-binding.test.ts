/**
 * A binding whose getter may be `none` (no row chosen): the section's selection is the value or
 * `undefined`, and choosing a row hands its value to the setter.
 */

interface Node {
  readonly kind: string;
  readonly props: { body: (props: object) => unknown; props: object };
}
interface Selected {
  readonly modifiers?: unknown;
}

// Required, not imported: see bloom.cost.test.tsx.
const { Rows } = require('./bloom/optional-binding.bloom') as {
  Rows: (props: { anyone: boolean; nobody: boolean; onChange: (value: string[]) => void }) => Node;
};

/** The `[value, set]` pair a node's `.selection` was given, wherever the node keeps it. */
function selectionOf(node: unknown): [unknown, (value: string) => void] | undefined {
  const seen = new Set<unknown>();
  const walk = (value: unknown): [unknown, (value: string) => void] | undefined => {
    if (value === null || typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'function') {
      return value as [unknown, (value: string) => void];
    }
    for (const inner of Object.values(value as Selected)) {
      const found = walk(inner);
      if (found) return found;
    }
    return undefined;
  };
  return walk(node);
}

it('selects no row when the getter is none, and sets the chosen one', () => {
  const chosen: string[][] = [];
  const none = Rows({ anyone: false, nobody: false, onChange: (v) => chosen.push(v) });
  const rows = none.props.body(none.props.props);
  const selection = selectionOf(rows);
  expect(selection?.[0]).toBeUndefined();
  selection?.[1]('nobody');
  expect(chosen).toEqual([['nobody']]);
  const anyone = Rows({ anyone: true, nobody: false, onChange: () => {} });
  expect(selectionOf(anyone.props.body(anyone.props.props))?.[0]).toBe('anyone');
});
