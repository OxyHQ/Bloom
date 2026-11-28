/** A list or record literal is typed from its context: each element and branch on its own. */

type Modifier = { kind: string; value: unknown };
type Built = { modifiers: readonly Modifier[] };

// Required, not imported: see bloom.cost.test.tsx.
const { tags, discard, progress } = require('./bloom/record-context.bloom') as {
  tags: (wide: boolean) => { id: string; label?: string; count?: number }[];
  discard: (onDiscard: () => void) => Built;
  progress: (percent: number | undefined) => Built;
};

const valueOf = (node: Built, kind: string) => node.modifiers.find((m) => m.kind === kind)?.value;

it('types each branch and element from the annotation', () => {
  expect(tags(true)).toEqual([
    { id: 'w', label: 'Wide' },
    { id: 'b', count: 2 },
  ]);
  expect(tags(false)).toEqual([
    { id: 'n', count: 1 },
    { id: 'b', count: 2 },
  ]);
});

it('gives the dialog its buttons, the second without onPress', () => {
  let discarded = 0;
  const buttons = valueOf(
    discard(() => {
      discarded += 1;
    }),
    'buttons',
  ) as { label: string; color?: string; onPress?: () => void }[];
  expect(buttons.map((b) => [b.label, b.color, typeof b.onPress])).toEqual([
    ['Discard', 'destructive', 'function'],
    ['Keep editing', 'cancel', 'undefined'],
  ]);
  buttons[0].onPress?.();
  expect(discarded).toBe(1);
});

it('gives the accessibility value whichever branch is taken', () => {
  expect(valueOf(progress(undefined), 'accessibilityValue')).toEqual({ text: 'waiting' });
  expect(valueOf(progress(40), 'accessibilityValue')).toEqual({ min: 0, max: 100, now: 40 });
});
