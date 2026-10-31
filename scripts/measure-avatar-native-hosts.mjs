/** Physical Android topology: one independent WebView/document/GPU context per avatar. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const debug = process.env.AVATAR_WEBVIEW_DEBUG || 'http://localhost:9340';
const output = process.env.AVATAR_NATIVE_HOST_OUTPUT || '.local/avatar-native-hosts';
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://127.0.0.1:6008';
const count = Number(process.env.AVATAR_NATIVE_HOST_COUNT || 9);
let targets = [];
for (let attempt = 0; attempt < 100; attempt++) {
  try {
    targets = (await (await fetch(`${debug}/json`)).json()).filter(
      (t) => t.type === 'page' && /native-benchmark\.html/.test(t.url),
    );
  } catch {}
  if (targets.length === count) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
assert.equal(targets.length, count, 'Only the dedicated host documents are measured');
await mkdir(output, { recursive: true });
const report = {
  conditions: {
    origin,
    count,
    topology:
      'One Android WebView per live avatar; independent documents and WebGL contexts. Physical viewport/DPR; not the React Native compositor.',
    emulation: false,
  },
  cases: [],
};
const sessions = [];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function connect(target) {
  const endpoint = new URL(target.webSocketDebuggerUrl);
  endpoint.host = new URL(debug).host;
  const socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map(),
    requests = new Map(),
    errors = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const task = pending.get(message.id);
      if (!task) return;
      pending.delete(message.id);
      clearTimeout(task.timer);
      message.error
        ? task.reject(Error(JSON.stringify(message.error)))
        : task.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails);
    else if (message.method === 'Network.responseReceived')
      requests.set(message.params.requestId, {
        url: message.params.response.url,
        mime: message.params.response.mimeType,
      });
    else if (message.method === 'Network.loadingFinished') {
      const request = requests.get(message.params.requestId);
      if (request) request.bytes = message.params.encodedDataLength;
    }
  });
  socket.addEventListener('close', () => {
    for (const task of pending.values()) {
      clearTimeout(task.timer);
      task.reject(Error('Dedicated WebView closed'));
    }
    pending.clear();
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(Error(`CDP timeout ${method}`));
      }, 120000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (fn, args) => {
    const result = await send('Runtime.evaluate', {
      expression: `(${fn})(${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Runtime.enable');
  await send('Performance.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  return { socket, send, evaluate, requests, errors };
}
const memory = async (label) => {
  if (!process.env.AVATAR_DEVICE_SERIAL) return;
  const adb = (args) =>
    execFileSync('adb', ['-s', process.env.AVATAR_DEVICE_SERIAL, ...args], { encoding: 'utf8' });
  const host = adb(['shell', 'dumpsys', 'meminfo', 'so.oxy.bloom.avatarbenchmark']);
  await writeFile(`${output}/${label}-host-meminfo.txt`, host);
  const processes = adb(['shell', 'ps', '-A', '-o', 'PID,NAME'])
    .split('\n')
    .filter((line) => line.includes('com.android.webview:sandboxed_process'));
  const child = [];
  for (const process of processes) {
    const pid = process.trim().split(/\s+/)[0];
    const value = adb(['shell', 'dumpsys', 'meminfo', pid]);
    await writeFile(`${output}/${label}-renderer-${pid}-meminfo.txt`, value);
    child.push({ pid, pssKiB: Number(value.match(/TOTAL PSS:\s+(\d+)/)?.[1]) });
  }
  return {
    hostPssKiB: Number(host.match(/TOTAL PSS:\s+(\d+)/)?.[1]),
    rendererCandidates: child,
    caveat:
      'Snapshot, not peak. Candidate renderer PID files retained; independent apps must not be attributed to this host.',
    battery: adb(['shell', 'dumpsys', 'battery'])
      .split('\n')
      .filter((x) => /temperature:|level:/.test(x)),
  };
};
try {
  for (const target of targets) sessions.push(await connect(target));
  report.initial = await Promise.all(
    sessions.map((session, index) =>
      session.evaluate(
        async ({ origin, index }) => {
          if (document.hidden) throw Error('WebView must remain physically visible');
          performance.setResourceTimingBufferSize(10000);
          document.querySelector('main').replaceChildren();
          const runtimeUrl = `${origin}/bloom-character/runtime.mjs`;
          const runtime = await import(runtimeUrl);
          const { resolveAvatarCharacter } = await import(
            `${origin}/src/agent-avatar/character.ts`
          );
          window.diag = () =>
            globalThis[Symbol.for('bloom.character.runtimes')].get(runtimeUrl).diagnostics();
          window.props = {
            character: resolveAvatarCharacter({
              preset: 'blue_beret',
              bodyColor: `#${(0x46719b + index * 10007).toString(16).padStart(6, '0')}`,
            }),
            reduced: false,
            interactive: true,
          };
          const canvas = document.createElement('canvas');
          document.querySelector('main').append(canvas);
          window.canvas = canvas;
          window.ready = false;
          const started = performance.now();
          window.controller = await runtime.createAvatar(canvas, props, {
            onReady: () => (ready = true),
            onError: () => {
              throw Error('Unavailable avatar');
            },
          });
          while (!ready && performance.now() - started < 20000)
            await new Promise((r) => setTimeout(r, 20));
          const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            ready,
            contextLost: gl.isContextLost(),
            hidden: document.hidden,
            readyMs: performance.now() - started,
            renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            width: innerWidth,
            height: innerHeight,
            dpr: devicePixelRatio,
            context: gl.getContextAttributes(),
          };
        },
        { origin, index },
      ),
    ),
  );
  report.readyMemory = await memory('ready');
  assert(
    report.initial.every((host) => host.ready && !host.contextLost),
    'Every independent host must paint; a lost WebGL context is a failure, not a slow frame',
  );
  for (const mode of ['active', 'paused']) {
    await Promise.all(
      sessions.map((s) =>
        s.evaluate((mode) => controller.update({ ...props, paused: mode === 'paused' }), mode),
      ),
    );
    await pause(5000);
    const metrics = (s) =>
      s
        .send('Performance.getMetrics')
        .then((r) => Object.fromEntries(r.metrics.map(({ name, value }) => [name, value])));
    const beforeMetrics = await Promise.all(sessions.map(metrics));
    const read = (s) =>
      s.evaluate(async () => ({
        time: performance.now(),
        stats: (await diag())[0].stats,
        hidden: document.hidden,
      }));
    const before = await Promise.all(sessions.map(read));
    if (process.env.AVATAR_CPU_PROFILE === '1' && mode === 'active') {
      await sessions[0].send('Profiler.enable');
      await sessions[0].send('Profiler.setSamplingInterval', { interval: 1000 });
      await sessions[0].send('Profiler.start');
    }
    await pause(5000);
    const after = await Promise.all(sessions.map(read));
    if (process.env.AVATAR_CPU_PROFILE === '1' && mode === 'active') {
      const { profile } = await sessions[0].send('Profiler.stop');
      await writeFile(`${output}/active.cpuprofile`, JSON.stringify(profile));
      const nodes = new Map(profile.nodes.map((n) => [n.id, n])),
        times = new Map();
      profile.samples.forEach((id, i) => {
        times.set(id, (times.get(id) || 0) + profile.timeDeltas[i]);
      });
      report.cpuProfile = {
        scope:
          'V8 sampling through first test document; shared renderer thread, not per-avatar CPU or compositor/GPU time.',
        topSelf: [...times]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([id, us]) => ({
            function: nodes.get(id).callFrame.functionName,
            url: nodes.get(id).callFrame.url,
            sampledSelfMs: us / 1000,
          })),
      };
    }
    const afterMetrics = await Promise.all(sessions.map(metrics));
    const hosts = after.map((a, i) => {
      assert.equal(a.hidden, false);
      const frames = a.stats.frames - before[i].stats.frames;
      if (mode === 'paused') assert.equal(frames, 0);
      else assert(frames > 0);
      return {
        fps: frames / ((a.time - before[i].time) / 1000),
        frames,
        elapsedMs: a.time - before[i].time,
        mainThreadMs: (afterMetrics[i].TaskDuration - beforeMetrics[i].TaskDuration) * 1000,
        stats: { ...a.stats, states: undefined },
      };
    });
    report.cases.push({ mode, hosts, memory: await memory(mode) });
    console.log(
      JSON.stringify({
        mode,
        origin,
        fps: hosts.map((h) => h.fps),
        triangles: hosts.map((h) => h.stats.triangles),
      }),
    );
    await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  }
  report.network = sessions.map((s) =>
    [...s.requests.values()].filter((r) => !/(javascript|html|css)/.test(r.mime)),
  );
  for (const session of sessions) {
    assert.deepEqual(session.errors, []);
    await session.evaluate(async () => {
      controller.dispose();
      if ((await diag()).length) throw Error('Pool leak');
    });
  }
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  for (const session of sessions) session.socket.close();
}
