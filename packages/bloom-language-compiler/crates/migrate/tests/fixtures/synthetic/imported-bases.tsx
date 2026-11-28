// Types built on another file's types: 2.0 has no spread members and no general intersection,
// so an imported base's fields are written out (its first, then the type's own; a field the
// type declares again is its own), in an interface, an inline intersection and `Pick`/`Omit`.
import { Text, VStack, toElement, view } from '@oxy.so/bloom-language';
import type { CellProps, GridEntry } from './grid.types';

interface MediaEntry extends GridEntry {
  uri: string;
  mediaIndex: number;
}

export function firstUri(entries: MediaEntry[]): string {
  return entries[0]?.uri ?? '';
}

export function describe(entry: GridEntry & { label: string }): string {
  return `${entry.label} ${entry.postId}`;
}

export const Cell = view(function Cell({
  title,
  count,
}: Pick<CellProps, 'title'> & { count: number }) {
  return VStack(Text(title), Text(`${count}`));
});

export const Quiet = view(function Quiet({ title, tone }: Omit<CellProps, 'onOpen' | 'subtitle'> & { tone: string }) {
  return Text(`${title} ${tone}`);
});
