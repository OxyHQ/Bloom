// `Array.from({ length })` as a range: with an index callback, with none, mapped after,
// and a `number` bound (truncated, as `Array.from` truncates it). A set added to and
// assigned back is `inserting`.
import { useState } from 'react';
import { Button, Text, VStack, view } from '@oxy.so/bloom-language';

export const Dots = view(function Dots(props: { count: number }) {
  const [seen, setSeen] = useState(new Set<string>());
  const rows = Array.from({ length: props.count }, (_, index) => Text(`Row ${index}`).id(index));
  const blanks = Array.from({ length: 3 }).map((_, i) => Text(`Blank ${i}`).id(i));
  const slots = Array.from({ length: 4 });
  const mark = (id: string) => {
    let next = new Set(seen);
    next = next.add(id);
    setSeen(next);
  };
  return VStack(
    ...rows,
    ...blanks,
    Text(`${slots.length} slots`),
    Button('Mark').onPress(() => mark('a')),
  );
});
