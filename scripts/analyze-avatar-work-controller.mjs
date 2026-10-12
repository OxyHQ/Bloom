/** Analyze original Work timelines. Exact signatures retain geometry multiplicity,
 * shader variants and every native Draw/Frame/Skin channel; no fitted crossfade. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { semanticFrames, proveReturn } from './build-avatar-return-assets.mjs';
const preset = process.env.AVATAR_PRESET || 'alfred';
const root = process.env.AVATAR_WORK_CONTROLLER_OUTPUT || `.local/avatar-work-controller/${preset}`;
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const baselinePath = `.local/avatar-computer-source/${preset}/work-raw.json`;
const idlePath =
  preset === 'blue_beret'
    ? '.local/avatar-return-source/blue_beret/idle-raw.json'
    : `.local/avatar-runtime-motion-actions/${preset}/idle-raw.json`;
const idle = await read(idlePath),
  baseline = await read(baselinePath);
const provenance = (await read(`.local/avatar-computer-source/${preset}/report.json`)).provenance;
const originalHashes = new Set(baseline.vertexBuffers.map((buffer) => buffer.sha256));
const report = {
  preset,
  provenance,
  sourceBoundary:
    'Original renderer observed offline. Alternate Stops alter only scheduling of the app timeout callback, never the native Stop payload or animation. Equality includes all channels, no nearest-fit inference.',
  cases: [],
  comparisons: [],
};
const cases = new Map();
for (const name of [
  'cycles1',
  ...(process.env.AVATAR_WORK_CASES?.split(',') || [
    'cycles2',
    'stop0_5',
    'stop1_2',
    'stop3_4',
    'interrupt1_2',
  ]),
]) {
  const path = name === 'cycles1' ? baselinePath : `${root}/${name}/work-raw.json`;
  let raw;
  try {
    raw = name === 'cycles1' ? baseline : await read(path);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (name !== 'cycles1')
    assert.deepEqual(
      (await read(`${root}/${name}/report.json`)).provenance,
      provenance,
      'Same original engine build required',
    );
  const calls = raw.calls.filter(
    (c) => c.method === 'applyActivity' && [1, 2].includes(c.args[0].command),
  );
  assert.equal(calls.length, 2);
  assert(calls.every((c) => c.result === 0));
  const start = calls.find((c) => c.args[0].command === 1).renderTime,
    stop = calls.find((c) => c.args[0].command === 2).renderTime;
  const frames = semanticFrames(raw),
    proof = proveReturn(raw, idle);
  const entry = {
    name,
    path,
    sha256: createHash('sha256')
      .update(await readFile(path))
      .digest('hex'),
    start,
    stop,
    stopAfter: stop - start,
    frames: frames.length,
    newGeometry: raw.vertexBuffers.filter((buffer) => !originalHashes.has(buffer.sha256)),
    reactionCommands: raw.calls.filter((call) => call.method === 'playReaction'),
    return: proof,
    workTimerEvidence: raw.workTimerEvidence || null,
    diagnostic: raw.diagnostic,
  };
  cases.set(name, { raw, frames, entry });
  report.cases.push(entry);
}
function compare(a, b, shift = 0, lower = -Infinity, upper = Infinity) {
  const reference = new Map(b.frames.map((f) => [f.time.toFixed(9), f.signature]));
  const samples = a.frames
    .filter((f) => f.time >= lower && f.time <= upper)
    .map((f) => ({
      time: f.time,
      equal: reference.get((f.time + shift).toFixed(9)) === f.signature,
      paired: reference.has((f.time + shift).toFixed(9)),
    }));
  const paired = samples.filter((s) => s.paired),
    different = paired.filter((s) => !s.equal);
  const runs = [];
  let run;
  for (const s of paired) {
    if (s.equal) {
      if (!run) run = { start: s.time, end: s.time, frames: 0 };
      run.end = s.time;
      run.frames++;
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return {
    shift,
    paired: paired.length,
    exact: paired.length - different.length,
    firstDifference: different[0]?.time ?? null,
    lastDifference: different.at(-1)?.time ?? null,
    exactRuns: runs,
  };
}
for (const [name, item] of cases) {
  if (name === 'cycles1') continue;
  const base = cases.get('cycles1');
  const prefix = compare(
    base,
    item,
    0,
    base.entry.start,
    Math.min(base.entry.stop, item.entry.stop) - 1 / 60,
  );
  assert(
    prefix.paired > 0 && prefix.exact === prefix.paired,
    'Changes to future Stop must not alter pre-Stop motion',
  );
  report.comparisons.push({
    a: 'cycles1',
    b: name,
    kind: 'same native clock before earlier Stop',
    ...prefix,
  });
  report.comparisons.push({
    a: 'cycles1',
    b: name,
    kind: 'Stop-aligned full native state; idle phase differences retained',
    ...compare(
      base,
      item,
      item.entry.stop - base.entry.stop,
      base.entry.stop,
      base.entry.stop + 1.5,
    ),
  });
}
const long = cases.get('cycles2');
if (long) {
  const candidates = long.frames.filter(
    (f) => f.time >= long.entry.start + 1 && f.time < long.entry.stop,
  );
  const bySignature = new Map(),
    repeats = [];
  for (const frame of candidates) {
    for (const previous of bySignature.get(frame.signature) || [])
      if (frame.time - previous >= 0.15)
        repeats.push({
          first: previous,
          second: frame.time,
          period: frame.time - previous,
        });
    const previous = bySignature.get(frame.signature) || [];
    previous.push(frame.time);
    bySignature.set(frame.signature, previous);
  }
  report.steadyWork = {
    searchStart: long.entry.start + 1,
    searchEnd: long.entry.stop,
    frames: candidates.length,
    uniqueFullStates: bySignature.size,
    exactRepeats: repeats.slice(0, 30),
    repeatCount: repeats.length,
    limitation:
      'Repeated whole states do not prove a natural loop; all overlapping frames at a candidate period must be checked.',
  };
  // A possible periodic body may coexist with independent hands/blinks. Report
  // the full-state mismatch instead of silently dropping those components.
  const buffers = new Map(long.raw.vertexBuffers.map((b) => [b.id, b.sha256]));
  const rawFrames = long.raw.frames
    .filter((f) => f.renderTime >= long.entry.start + 1 && f.renderTime < long.entry.stop)
    .map((f) => ({
      time: f.renderTime,
      draws: f.draws
        .map((d) => ({
          id: buffers.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
          values: [...d.blocks.DrawBlock, ...d.blocks.FrameBlock, ...d.blocks.SkinBlock],
        }))
        .sort((a, b) => a.id.localeCompare(b.id) || a.values[12] - b.values[12]),
    }));
  const topology = (frame) => frame.draws.map((draw) => draw.id).join(':');
  const lastTopology = topology(rawFrames.at(-1));
  let stableStart = rawFrames.length - 1;
  while (stableStart > 0 && topology(rawFrames[stableStart - 1]) === lastTopology) stableStart--;
  rawFrames.splice(0, stableStart);
  report.steadyWork.stableTopologyStart = rawFrames[0].time;
  report.steadyWork.stableTopologyFrames = rawFrames.length;
  const periods = [];
  for (let step = 9; step <= 120 && step < rawFrames.length / 2; step++) {
    let max = 0,
      square = 0,
      count = 0,
      topology = true;
    for (let i = 0; i + step < rawFrames.length; i++) {
      const a = rawFrames[i].draws,
        b = rawFrames[i + step].draws;
      if (a.length !== b.length || a.some((d, k) => d.id !== b[k].id)) {
        topology = false;
        break;
      }
      for (let p = 0; p < a.length; p++)
        for (let k = 0; k < a[p].values.length; k++) {
          const d = a[p].values[k] - b[p].values[k];
          max = Math.max(max, Math.abs(d));
          square += d * d;
          count++;
        }
    }
    if (topology)
      periods.push({
        seconds: step / 60,
        frames: step,
        max,
        rms: Math.sqrt(square / count),
        comparedValues: count,
      });
  }
  report.steadyWork.candidatePeriodDiagnostics = periods.sort((a, b) => a.rms - b.rms).slice(0, 8);
}
await writeFile(`${root}/analysis.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      cases: report.cases.map((c) => ({
        name: c.name,
        start: c.start,
        stop: c.stop,
        return: c.return?.nativeReturn,
        returnAfterStop: c.return ? c.return.nativeReturn - c.stop : null,
      })),
      comparisons: report.comparisons,
      steadyWork: report.steadyWork,
    },
    null,
    2,
  ),
);
