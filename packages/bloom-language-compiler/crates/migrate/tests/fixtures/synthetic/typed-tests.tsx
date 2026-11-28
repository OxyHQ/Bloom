// Tests and reads bloomc types, written so they keep TS's answer:
// - an `as const satisfies readonly T[]` module list is the constant's own `as const`, and two
//   lists hoisted from different items get different names;
// - `const xs = ys as readonly T[]` annotates the binding `[T]`;
// - `i >= 0` on a `findIndex` result is `i != none`;
// - the truthiness of `a ?? b`, an object `a` and a string `b`: `a != none || b != none && !b.isEmpty`;
// - a function value TS typed with an optional parameter, called without it, passes `none`;
// - an `if let x = x` over a value that is now a `Bool` is `if x`.
import { Icon, Text, VStack, view } from '@oxy.so/bloom-language';
import { RiAlertLine } from '@oxy.so/bloom/icons/RiAlertLine';
import { type Draft, type Tab, rows } from './drafts';

const HIDDEN = ['likes', 'media'] as const satisfies readonly Tab[];
const ALL = ['posts', 'replies', 'likes', 'media'] as const satisfies readonly Tab[];

export function visibleTabs(): Tab[] {
  const hidden = HIDDEN as readonly Tab[];
  rows((['posts', 'replies'] as const).map((tab) => tab));
  return ALL.filter((tab) => !hidden.includes(tab));
}

export function tabIndex(drafts: Draft[], key: string): number {
  const index = drafts.findIndex((draft) => draft.key === key);
  return index >= 0 ? index : 0;
}

function label(draft: Draft, t: (key: string, options?: { count?: number }) => string): string {
  if (draft.poll ?? draft.pollId) return t('draft.poll');
  return t('draft.empty', { count: 0 });
}

export const DraftRow = view(function DraftRow({ draft }: { draft: Draft }) {
  const hasPoll = Boolean(draft.poll ?? draft.pollId);
  return VStack(Text(label(draft, (key) => key)), hasPoll ? Icon(RiAlertLine) : null);
});
