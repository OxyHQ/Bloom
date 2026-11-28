// `x || ''` on a value TS types present (a type argument's record) is a guard: the codemod
// writes `x ?? ""` and, since bloomc finds nothing to fall back from, declares the record's
// field optional, so the guard stays.
import { Text, view } from '@oxy.so/bloom-language';
import { useParams } from './params';

export const Topic = view(function Topic() {
  const { name } = useParams<{ name: string }>();
  const term = name || '';
  return Text(term);
});
