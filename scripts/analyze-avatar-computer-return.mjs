/** Offline full semantic-block comparison. No nearest pose is accepted as return proof. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const presets = process.env.AVATAR_PRESET?.split(',') || [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const read = async (f) => JSON.parse(await readFile(f, 'utf8'));
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const report = [];
function frames(raw) {
  const identities = new Map(raw.vertexBuffers.map((b) => [b.id, b.sha256]));
  return raw.frames.map((frame) => {
    const parts = frame.draws
      .map((draw) => ({
        id: identities.get(
          draw.vertexAttributes.find((a) => a.name === 'position').bufferId,
        ),
        method: draw.method,
        defines: draw.defines,
        blocks: draw.blocks,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return { time: frame.renderTime, parts, key: hash(parts) };
  });
}
for (const preset of presets) {
  const work = await read(
    process.env.AVATAR_RETURN_WORK ||
      `.local/avatar-computer-source/${preset}/work-raw.json`,
  );
  const idlePath =
    process.env.AVATAR_RETURN_IDLE ||
    (preset === 'blue_beret'
      ? '.local/avatar-runtime-motion-review/blue_beret/idle-raw.json'
      : `.local/avatar-runtime-motion-actions/${preset}/idle-raw.json`);
  const idle = await read(idlePath),
    w = frames(work),
    i = frames(idle),
    lookup = new Map();
  for (const frame of i) {
    const times = lookup.get(frame.key) || [];
    times.push(frame.time);
    lookup.set(frame.key, times);
  }
  const matches = w.map((frame) => ({
    workTime: frame.time,
    idleTimes: lookup.get(frame.key) || [],
  }));
  const start = work.calls.find(
    (c) => c.method === 'applyActivity' && c.args[0].command === 1,
  ).renderTime;
  const post = matches.filter((m) => m.workTime > start + 2.3),
    matched = post.filter((m) => m.idleTimes.length);
  // Quantify failures without throwing material fields away or calling a nearest match equivalent.
  const last = w.at(-1);
  let closest = { error: Infinity };
  for (const candidate of i) {
    if (
      last.parts.length !== candidate.parts.length ||
      last.parts.some((p, k) => p.id !== candidate.parts[k].id)
    )
      continue;
    let error = 0,
      worst;
    for (let p = 0; p < last.parts.length; p++)
      for (const name of ['DrawBlock', 'FrameBlock', 'SkinBlock']) {
        const a = last.parts[p].blocks[name],
          b = candidate.parts[p].blocks[name];
        for (let k = 0; k < a.length; k++) {
          const diff = Math.abs(a[k] - b[k]);
          if (diff > error) {
            error = diff;
            worst = {
              part: last.parts[p].id,
              block: name,
              index: k,
              work: a[k],
              idle: b[k],
            };
          }
        }
      }
    if (error < closest.error)
      closest = { error, idleTime: candidate.time, worst };
  }
  const result = {
    preset,
    idlePath,
    start,
    end: w.at(-1).time,
    initialExact: matches[0].idleTimes,
    postMatches: matched,
    endpointExact: matches.at(-1).idleTimes,
    nearestEndpointDiagnosticOnly: closest,
  };
  report.push(result);
  console.log(
    JSON.stringify({
      preset,
      initialExactCount: result.initialExact.length,
      postMatches: matched.length,
      firstPost: matched[0]?.workTime,
      lastPost: matched.at(-1)?.workTime,
      endpointExactCount: result.endpointExact.length,
      nearest: closest,
    }),
  );
}
await writeFile(
  process.env.AVATAR_RETURN_REPORT ||
    '.local/avatar-computer-return-analysis.json',
  JSON.stringify(report, null, 2),
);
