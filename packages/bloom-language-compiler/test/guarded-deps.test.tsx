/**
 * A handler that reads `job.id` only after its own guard is cached on `job?.id`: the cache's test
 * runs at every render, so `job.id` threw "Cannot read properties of undefined" while the query
 * had no job yet (mention13 memo-dep-guarded-read, Mention's jobs/[id]).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Detail } = require('./bloom/guarded-deps.bloom') as {
  Detail: (props: { data: unknown }) => Parameters<typeof toElement>[0];
};
const { recorded } = require('./bloom/jobs-service') as { recorded: string[] };

it('renders while the TS value is absent, and runs once it is there', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Detail({ data: undefined })));
  });
  act(() => {
    r.update(toElement(Detail({ data: { job: { id: 'j1', externalApplyUrl: 'https://x' } } })));
  });
  const button = r.root.findAll(
    (n) => typeof n.type === 'string' && typeof n.props.onPress === 'function',
  )[0];
  act(() => button?.props.onPress());
  expect(recorded).toEqual(['j1 external_apply_click']);
});
