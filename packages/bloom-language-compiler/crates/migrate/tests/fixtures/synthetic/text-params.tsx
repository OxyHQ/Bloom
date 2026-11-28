// A local function's `ReactNode` parameter that only goes to a TS component's prop, every call
// giving it text (a string, a fragment of text, nothing), is `String?`: the component draws the
// same text the TS gave it, with no nested `Text`.
import type { ReactNode } from 'react';
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { MetaCard } from './meta-card';

export const Rows = view(function Rows({ name }: { name: string }) {
  const row = (key: string, meta: ReactNode) => <MetaCard key={key} title={key} meta={meta} />;
  return VStack(Text('people'), row(name, <>{name}{' · '}{'seen'}</>), row('none', null));
});
