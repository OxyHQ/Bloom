// A generic React component (`function Shell<TItem>(…)`) is 2.0's `struct Shell<TItem>: View`,
// its members in 2.0's forms too (`@State private var`).
import { useState } from 'react';
import { Text, VStack, toElement } from '@oxy.so/bloom-language';

interface ShellProps<TItem> {
  items: readonly TItem[];
  keyOf: (item: TItem) => string;
}

export function Shell<TItem>({ items, keyOf }: ShellProps<TItem>) {
  const [chosen, setChosen] = useState('');
  return toElement(
    VStack(items.map((item) => Text(keyOf(item)).id(keyOf(item)).onPress(() => setChosen(keyOf(item))))),
  );
}
