// `useEffect` is an `effect` member: one dep is its id, `[]` runs once, and the
// returned cleanup is a `defer`. In 2.0 a `.task(id: topic)` with a cleanup ends with
// `await Task.cancellation`, so its `defer` runs on unmount or a new topic, as React's cleanup
// did, not when the body returns (repros/mention15/task-defer-runs-at-once). (A debounce, a
// `setTimeout` its cleanup clears, is a cancellable `sleep(for:)`: the stdlib is seen only in a
// package, so that form is checked on Mention's corpus, not here.)
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
