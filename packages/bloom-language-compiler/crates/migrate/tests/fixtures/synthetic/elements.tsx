// A list's element read where TS allows `undefined` is `xs.at(i)`; TS's `x!` is `x!`; a
// callback's wider record type is kept in the loop; a member TS narrowed is read with `!`.
import { Text, VStack } from '@oxy.so/bloom-language';

interface Tab {
  id: string;
  label: string;
}

interface Author {
  name: string;
}

interface TabsProps {
  tabs: Tab[];
  author?: Author;
  note?: string;
}

const LABELS: Record<'a' | 'b', string> = { a: 'A', b: 'B' };

export const Tabs = function Tabs({ tabs, author, note }: TabsProps) {
  const first = tabs[0]?.label ?? '';
  const second = tabs[1] ?? tabs[0];
  const name = (() => {
    if (!author?.name) return '';
    return author.name;
  })();
  return VStack(
    Text(first),
    Text(second.label),
    Text(name),
    Text(note!),
    Text(LABELS['a']),
    tabs.map((tab: { id: string; label: string; count?: number }) =>
      Text(`${tab.label} ${tab.count ?? 0}`),
    ),
  );
};
