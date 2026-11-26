// `useEffect` is an `effect` member: one dep is its id, `[]` runs once, and the
// returned cleanup is a `defer`.
import { useEffect, useState } from 'react';
import { Text, view } from '@oxy.so/bloom-language';
import { subscribe } from './feed';

export const Live = view(function Live({ topic }: { topic: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const stop = subscribe(topic, () => setCount((n) => n + 1));
    return () => stop();
  }, [topic]);
  useEffect(() => {
    setCount(0);
  }, []);
  return Text(`${count}`);
});
