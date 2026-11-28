// Object literals are records, inline object types record types, and
// string-literal unions stay unions.
import { Text, view } from '@oxy.so/bloom-language';

type Size = 'sm' | 'lg';

function describe(item: { name: string; size?: Size }): { label: string; wide: boolean } {
  const base = { label: item.name, wide: false };
  return { ...base, wide: item.size === 'lg' };
}

export const Item = view(function Item({ name, size }: { name: string; size: 'sm' | 'lg' }) {
  return Text(describe({ name, size }).label);
});

export function submitNote(
  onSubmit: (data: { text: string; url: string }) => void,
  text: string,
): void {
  onSubmit({ text: text.trim(), url: text });
}

// A list of records where some lack a key (TS's element type has it optional): those say
// `label: none`, and `'label' in link` reads it.
const LINKS = [
  { key: 'about', url: 'https://oxy.so/mention' },
  { key: 'oxy', url: 'https://oxy.so/', label: 'Oxy' },
] as const;

export function linkLabels(t: (key: string) => string): string[] {
  return LINKS.map((link) => ('label' in link ? link.label : t(link.key)));
}
