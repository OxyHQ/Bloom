// What the codemod refuses, with reasons: a `switch` (a `match` in `.bloom`)
// and a `throw`; the rest of the module (an effect, a JS global) would migrate.
import { useEffect } from 'react';
import { Action, VStack, view } from '@oxy.so/bloom-language';
import { LikeIcon } from './icons';

export const Rows = view(function Rows(props: { rows: string[]; liked: boolean }) {
  useEffect(() => {
    console.log('mounted');
  }, []);
  return VStack(
    Action(LikeIcon, 'Like', { pop: true }).active(props.liked),
    ...props.rows.map((row) => Action(LikeIcon, row)),
  );
});

export function rank(kind: string): number {
  switch (kind) {
    case 'top':
      return 0;
    default:
      throw new Error(kind);
  }
}
