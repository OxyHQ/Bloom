// `useEffect` is an `effect` member: one dep is its id, `[]` runs once, and the
// returned cleanup is a `defer`. Refused in 2.0 for now: as `.task(id: topic)` the `defer`
// would run as soon as the body returns (React ran it on unmount or a new topic), so it waits
// for the stdlib's `Task.cancellation` (repros/mention15/task-defer-runs-at-once).
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
