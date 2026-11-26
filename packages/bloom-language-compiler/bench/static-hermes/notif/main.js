import * as React from 'react';
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';
import { NotificationSettingsScreen } from './module';
// Cold: from the script's first statement to the first committed tree.
const t0 = Date.now();
const root = TestRenderer.create(createElement(NotificationSettingsScreen), {
  unstable_isConcurrent: false,
});
const S = root._Scheduler;
S.unstable_flushAll();
const mounted = Date.now();
if (globalThis.BENCH_DUMP) print(JSON.stringify(root.toJSON()).slice(0, 400));
const N = 2000;
function switches() {
  return root.root.findAll((n) => n.type === 'RCTSwitch');
}
async function run() {
  const count = switches().length;
  // One update is one tap, as the A/B taps: saving on, the patch stored, saving off.
  const start = Date.now();
  for (let i = 0; i < N; i++) {
    const s = switches()[i % count];
    s.props.onValueChange(!s.props.value);
    S.unstable_flushAll();
    await null;
    await null;
    await null;
    S.unstable_flushAll();
  }
  const end = Date.now();
  // The same loop's lookups alone, subtracted: what remains is the update.
  const l0 = Date.now();
  for (let i = 0; i < N; i++) {
    const s = switches()[i % count];
    s.props.value;
    await null;
    await null;
    await null;
  }
  const l1 = Date.now();
  const on = switches().filter((s) => s.props.value).length;
  // Warm mounts: a fresh root each time, mounted and unmounted.
  const M = 300;
  const m0 = Date.now();
  for (let i = 0; i < M; i++) {
    const r = TestRenderer.create(createElement(NotificationSettingsScreen), {
      unstable_isConcurrent: false,
    });
    S.unstable_flushAll();
    r.unmount();
    S.unstable_flushAll();
  }
  const m1 = Date.now();
  globalThis.__warmMountUs = ((m1 - m0) * 1000) / M;
  // The module's own code per update: its view function alone under a minimal dispatcher (a memo
  // cache and state), with the stored preferences changing each call as a toggle changes them.
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const saved = internals.H;
  let cache = null;
  internals.H = {
    useMemoCache(n) {
      if (cache === null) {
        cache = new Array(n);
        for (let i = 0; i < n; i++) cache[i] = Symbol.for('react.memo_cache_sentinel');
      }
      return cache;
    },
    useState(v) {
      return [v, () => {}];
    },
  };
  const fn = globalThis.__viewFns[0];
  const a = { likes: false },
    b = { likes: true };
  const K = 20000;
  let sink = 0;
  const f0 = Date.now();
  for (let i = 0; i < K; i++) {
    globalThis.__stored = i & 1 ? a : b;
    if (fn({}) !== null) sink++;
  }
  const f1 = Date.now();
  internals.H = saved;
  globalThis.__stored = undefined;
  globalThis.__moduleUs = ((f1 - f0) * 1000) / K;
  print(
    JSON.stringify({
      moduleUs: globalThis.__moduleUs,
      mountMs: mounted - t0,
      warmMountUs: globalThis.__warmMountUs,
      updates: N,
      updateUs: ((end - start - (l1 - l0)) * 1000) / N,
      lookupUs: ((l1 - l0) * 1000) / N,
      switches: count,
      on,
    }),
  );
}
run();
