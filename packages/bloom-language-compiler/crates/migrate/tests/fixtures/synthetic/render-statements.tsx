// What a view did while drawing, done after the render instead: a call under a test runs when the
// test turns true (a ref kept to the render's value is set the same way; `Ref` needs a package). A closure
// typed by its declaration (`const f: F`, `useCallback<F>`) takes its parameters' types from it.
import { useCallback } from 'react';
import { Text, view } from '@oxy.so/bloom-language';
import { logger, type OnUpdated, type Reporter, report } from './reporter';

export const Band = view(function Band({ trends, failed }: { trends: string[]; failed: boolean }) {
  if (failed) {
    logger.warn('Band: trends failed');
  }
  const onEvent: Reporter = (event, position) => {
    report(event, position + trends.length);
  };
  const onCard = useCallback<Reporter>((event, position) => {
    if (event !== 'impression') return;
    onEvent(event, position);
  }, []);
  const onUpdated = useCallback<OnUpdated>((id, { cleared }) => {
    if (cleared) logger.warn(id);
  }, []);
  return Text(`${trends.length}`).onPress(() => {
    onCard('press', 0);
    onUpdated('x', { cleared: true });
  });
});
