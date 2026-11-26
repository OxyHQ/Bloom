// Module forms: a TS hook is a hook function, `lazy(() => import(…))` a lazy
// component, `memo(Named, compare)` the view with its `equal`, an `export { … }`
// list `pub`, a rest parameter `..xs`, and JSX children of a local view its prop.
import React, { lazy, useMemo } from 'react';
import { Text, VStack, toElement } from '@oxy.so/bloom-language';

const Panel = lazy(() => import('./card'));

interface Row {
  id: string;
  title?: string;
}

function useTitles(rows: Row[]): string[] {
  return useMemo(() => rows.map((r) => r.title ?? r.id), [rows]);
}

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
