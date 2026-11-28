// A local function's `ReactNode` parameter is a `View?` (TS's may be given nothing), and a string
// handed to it is its text (`RawText`).
import type React from 'react';
import { useCallback } from 'react';
import { HStack, Text, VStack, view } from '@oxy.so/bloom-language';

export const Rows = view(function Rows({ names, when }: { names: string[]; when: string }) {
  const row = useCallback(
    (name: string, meta: React.ReactNode) => HStack(Text(name), meta ? Text('·') : null),
    [],
  );
  return VStack(row(names[0] ?? '', when), row(names[1] ?? '', undefined));
});
