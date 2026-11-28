// A list of records whose items differ in their keys is typed as TS types it: every key, optional
// where an item leaves it out. A function's `ReactNode` parameter takes nothing too (`View?`), and a
// string handed to it is its text node.
import type { ReactNode } from 'react';
import { Embed, HStack, Text, VStack, view } from '@oxy.so/bloom-language';

const LINKS = [
  { key: 'about', url: 'https://oxy.so/mention' },
  { key: 'oxy', url: 'https://oxy.so/', label: 'Oxy' },
] as const;

function row(key: string, meta: ReactNode) {
  return HStack(Text(key), Embed(meta)).id(key);
}

export const Footer = view(function Footer({ count }: { count: number }) {
  return VStack(
    Text(LINKS.map((link) => link.label ?? link.url).join(' · ')),
    row('count', `${count} links`),
    row('none', undefined),
  );
});
