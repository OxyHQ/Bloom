// A Bloom list method on a TS value Bloom could not type (B0601) types the value's binding:
// `[String]` for `joined`, `[Foreign]` otherwise. `x || undefined`
// of a member is JS's falsy `none`, and `Boolean(x)` of a TS value stays its truthiness where it is
// a value (`enabled:`), not where it is tested (`if`).
import { RawText, Text, VStack, view } from '@oxy.so/bloom-language';
import { thing } from './untyped';

export function names(): string {
  const x = thing();
  const picked = x.items.map((i: { name: string }) => i.name);
  return picked.join(', ');
}

export const Rows = view(function Rows() {
  const x = thing();
  const enabled = Boolean(x.id);
  if (Boolean(x.ready)) thing();
  const rows = x.rows.slice(0, 3);
  return VStack(
    Text(x.uri || undefined),
    Text(enabled ? 'on' : 'off'),
    ...rows.map((row: { title: string }, index: number) => RawText(`${index} ${row.title}`)),
  );
});
