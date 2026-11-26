// Module forms: a TS hook is a hook function, `lazy(() => import(…))` a lazy
// component, `memo(Named, compare)` the view with its `equal`, an `export { … }`
// list `pub`, a rest parameter `..xs`, and JSX children of a local view its prop;
// React's `useState` in a hook function, a sync `try` (`catching`), rest props.
import React, { lazy, useMemo, useState } from 'react';
import { Text, VStack, toElement, view } from '@oxy.so/bloom-language';
import type { CardProps } from './card';

const Panel = lazy(() => import('./card'));

interface Row {
  id: string;
  title?: string;
}

function useTitles(rows: Row[]): string[] {
  return useMemo(() => rows.map((r) => r.title ?? r.id), [rows]);
}

function useOpenFor(id: string) {
  const [openFor, setOpenFor] = useState<string | undefined>(undefined);
  return { open: openFor === id, show: () => setOpenFor(id) };
}

function hostOf(link: string): string {
  try {
    const url = new URL(link);
    if (url.hostname === '') return link;
    return url.hostname;
  } catch {
    return link;
  }
}

export const Badge = view(function Badge({ label, ...card }: CardProps & { label: string }) {
  return Text(`${label} ${card.title}`);
});

function joinAll(...parts: string[]): string {
  let out = '';
  for (const part of parts) {
    if (part === '') continue;
    out = `${out}${part}`;
  }
  return out;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return toElement(VStack(Text(title), children));
}

function ListBody({ rows }: { rows: Row[] }) {
  const titles = useTitles(rows);
  return (
    <Section title={joinAll('Rows', ':')}>
      {toElement(Text(titles.join(', ')))}
    </Section>
  );
}

function sameRows(a: { rows: Row[] }, b: { rows: Row[] }) {
  return a.rows.length === b.rows.length;
}

const List = React.memo(ListBody, sameRows);

export { List, Panel, joinAll };
