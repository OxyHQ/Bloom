/** A handler's last `if … else` or `switch` runs as statements: each branch's line runs. */

type Built = { modifiers: readonly { kind: string; value: unknown }[] };

// Required, not imported: see bloom.cost.test.tsx.
const { pressIf, pressSwitch } = require('./bloom/handler-tail-if.bloom') as {
  pressIf: (id: string | undefined, log: (s: string) => void) => Built;
  pressSwitch: (mode: 'on' | 'off', log: (s: string) => void) => Built;
};

const press = (node: Built) =>
  (node.modifiers.find((m) => m.kind === 'onPress')?.value as () => void)();

it('runs the branch taken', () => {
  const seen: string[] = [];
  const log = (s: string) => {
    seen.push(s);
  };
  press(pressIf('42', log));
  press(pressIf(undefined, log));
  press(pressSwitch('on', log));
  press(pressSwitch('off', log));
  expect(seen).toEqual(['42', 'none', 'on', 'off']);
});
