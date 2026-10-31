/** Hashes were captured from the pre-optimization scalar sampler. They pin
 * every matrix and material field, including signed values and fractional time. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = await mkdtemp('.local/avatar-transform-sharing-');
await writeFile(
  `${temporary}/motion.mjs`,
  ts.transpileModule(
    await readFile(process.env.AVATAR_TRANSFORM_BASELINE || 'runtime/avatar/motion.ts', 'utf8'),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } },
  ).outputText,
);
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const expected = {
  blue_beret: 'ec6c3132fe717bf771d4fd4ed0ecf648e429adf2f3f032344ee1470ee7cc7d6a',
  alfred: '0d400f2c925eee48e06a70c5bcef1094ed3f24afa10f36b61cecc8a78f13fee4',
  purple_heart: '5eaf67baaf782cf1b15e61f7bde876bd6d61ad38e54988e9f3b6a1b1fb7e40fb',
  lime_frog: 'ad2623b217ca1a11a0cbca13eabb86054b617c2619489c36dc4e2ba87a3e442a',
  coral_monocle: '473bb2ad0c4452187cc095d0eb9cfb02f94d43191c23d057b816c0412e2b29f1',
  gus: '3f6d6dca1835fd9194667747d8298ef265c04f78a061b4b48091022449dd519d',
  blue_spectacles: 'bbe330ffc80e326bfb50646a002e1d1658247a07ceaed1c873f94716acc355f4',
  lime_headphones: '3be672ab199c4fac7a117b92adac5ebe7735be1a8b327f7bf7d529db741e3313',
};
for (const preset of [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: shared transform evaluation retains exact scalar sampler outputs`, async () => {
    const folder = 'runtime/avatar/assets';
    const motion = JSON.parse(await readFile(`${folder}/motion/${preset}.json`, 'utf8'));
    const computer = JSON.parse(await readFile(`${folder}/${preset}/computer-motion.json`, 'utf8'));
    const loop = JSON.parse(await readFile(`${folder}/${preset}/computer-loop.json`, 'utf8'));
    const hash = createHash('sha256');
    for (const clip of [motion.clips.idle, motion.clips.reaction, computer.clip, loop.clip]) {
      const sampler = new AuthoredMotionSampler(clip),
        a = sampler.createPose(),
        b = sampler.createPose();
      for (let i = 0; i <= 19; i++) {
        sampler.sample((clip.duration * i) / 17, a);
        hash.update(JSON.stringify(a));
      }
      const unchanged = JSON.stringify(a);
      sampler.sample(0.371, b);
      assert.equal(JSON.stringify(a), unchanged, 'A neighbouring avatar retains its own output');
      for (let i = 1; i < a.length; i++) {
        assert.notEqual(a[0].world, a[i].world);
        assert.notEqual(a[0].normalMatrix, a[i].normalMatrix);
      }
    }
    const actual = hash.digest('hex');
    if (process.env.AVATAR_TRANSFORM_BASELINE)
      console.log(JSON.stringify({ preset, hash: actual }));
    else assert.equal(actual, expected[preset]);
  });
}
