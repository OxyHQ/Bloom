/** Offline report: exact native suppression; candidate models are not runtime controllers. */
import { readFile, writeFile } from 'node:fs/promises';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const presets = [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const report = {
  schema: 'bloom.native-reaction-input-observation',
  version: 1,
  presets: {},
};
for (const preset of presets) {
  const root = `.local/avatar-eye-activities/${preset}`;
  const a = await read(`${root}/reaction-gaze-raw.json`),
    b = await read(`${root}/reaction-baseline-raw.json`);
  const equal = a.map(
    (f, k) =>
      JSON.stringify(f.draws.map((d) => d.blocks)) ===
      JSON.stringify(b[k].draws.map((d) => d.blocks)),
  );
  const ranges = [];
  for (let i = 0; i < equal.length; i++) {
    if (!equal[i]) continue;
    let end = i;
    while (equal[end + 1]) end++;
    if (end > i) ranges.push([a[i].time, a[end].time, end - i + 1]);
    i = end;
  }
  report.presets[preset] = {
    sampleRate: 30,
    command: a.flatMap((f) => f.events).find((e) => e.kind === 'reaction'),
    exactFullBlockRanges: ranges,
  };
}
await writeFile(
  '.local/avatar-eye-activities/reaction-input-report.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
