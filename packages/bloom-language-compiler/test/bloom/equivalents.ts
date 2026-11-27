/**
 * The hand-written embedded-language equivalents of the `.bloom` fixtures:
 * what a careful author writes in TypeScript, for the cost gate to compare.
 */
import { useCallback, useMemo, useState } from 'react';
import { Button, type ComposedView, HStack, Text, VStack, view } from '@oxy.so/bloom-language';

export const Counter = view(function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  const label = `Count ${count}`;
  const add = () => setCount((current) => current + step);
  return VStack(Text(label), Button(Text('Add')).onPress(add)).spacing('md');
});

export const Row = view(function Row({
  title,
  pinned = false,
}: {
  title: string;
  pinned?: boolean;
}) {
  return HStack(Text(title).font('headline'), pinned ? Text('Pinned').foreground('muted') : null)
    .spacing('sm')
    .padding('md');
});

export const Banner = view(function Banner() {
  return VStack(Text('Welcome').font('title-3'), Text('Nothing to do yet').foreground('muted'))
    .spacing('sm')
    .padding('lg');
});

export const Titled = view(function Titled({ titles }: { titles: readonly string[] }) {
  return VStack(
    Text('Titles').font('headline'),
    ...titles.map((title) => Text(title).id(title)),
  ).spacing('sm');
});

export interface Entry {
  readonly id: string;
  readonly label: string;
}

export const Grid = view(function Grid<T extends Entry>({ entries }: { entries: readonly T[] }) {
  return VStack(...entries.map((entry) => Text(entry.label).id(entry.id))).spacing('sm');
}) as <T extends Entry>(props: { entries: readonly T[] }) => ComposedView;

/** A custom hook as a careful author writes it in TypeScript, the React Compiler aside. */
function useTagged(title: string, tags: readonly string[], onOpen: (title: string) => void) {
  const label = useMemo(() => `${title} (${tags.length})`, [title, tags]);
  const summary = useMemo(() => tags.join(', '), [tags]);
  const open = useCallback(() => onOpen(title), [onOpen, title]);
  return { label, summary, open };
}

export const Tagged = view(function Tagged({
  title,
  tags,
  onOpen,
}: {
  title: string;
  tags: readonly string[];
  onOpen: (title: string) => void;
}) {
  const row = useTagged(title, tags, onOpen);
  return VStack(Button(Text(row.label)).onPress(row.open), Text(row.summary)).spacing('sm');
});
