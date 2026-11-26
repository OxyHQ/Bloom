// What the codemod refuses, with reasons: a node's options object, spread
// children and an effect.
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
