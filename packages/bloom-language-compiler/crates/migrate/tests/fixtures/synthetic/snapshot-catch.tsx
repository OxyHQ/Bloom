// A state read after its handler wrote it is React's value of the render, a snapshot. It is
// taken at the top of the handler, so a write inside a `try` can be undone by its `catch`.
import { useState } from 'react';
import { Button, Text, view } from '@oxy.so/bloom-language';
import { save } from './api';

export const Blocker = view(function Blocker({ id }: { id: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const block = async () => {
    try {
      setIds((prev) => [...prev, id]);
      await save(id);
    } catch {
      setIds((prev) => prev.filter((x) => x !== id));
    }
  };
  return Button(Text(`Block (${ids.length})`)).onPress(block);
});
