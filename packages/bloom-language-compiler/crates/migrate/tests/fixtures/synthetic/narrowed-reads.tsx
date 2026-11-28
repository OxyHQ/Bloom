// What TS's flow proved, read as Bloom's: `!Array.isArray(xs)` is `xs == none` (bloomc narrows `xs`
// after it), an operand `p?.w && …` tested is `p!.w!`, and a TS callback's `index: number` reads a
// list at `index.truncated()`.
import { Text, VStack, view } from '@oxy.so/bloom-language';

function total(xs: number[] | undefined): number {
  if (!Array.isArray(xs) || xs.length === 0) return 0;
  return sum(xs);
}

function sum(xs: number[]): number {
  return xs.length;
}

function ratio(p?: { w?: number; h?: number }): number {
  return p?.w && p?.h ? p.w / p.h : 1.5;
}

function label(names: string[], pick: (f: (i: number) => string) => string): string {
  return pick((i) => names[i]);
}

export const Totals = view(function Totals({ xs, names }: { xs?: number[]; names: string[] }) {
  return VStack(
    Text(`${total(xs)}`),
    Text(`${ratio({ w: 4, h: 3 })}`),
    Text(label(names, (f) => f(0))),
  );
});
