/** Export semantically named eye anchors/sizes already recognized by native JS adapters.
 * Runtime consumers never parse binary records or import the original engine. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const destination =
  process.env.AVATAR_EYE_PROFILE_OUTPUT || 'runtime/avatar/assets/eye-gaze-profiles.json';
const recipes = {
  lime_frog: {
    pattern: /^todd-.*integrated-eye/,
    expected: 4,
    angularGain: [0.042, 0.028],
    translationGain: [0.07, -0.042],
    blink: 'integrated',
    blinkMultiplier: 1,
  },
  blue_spectacles: {
    pattern: /^josh-.*integrated-eye/,
    expected: 4,
    angularGain: [0.042, 0.028],
    translationGain: [0.07, -0.042],
    blink: 'integrated',
    blinkMultiplier: 1,
  },
  lime_headphones: {
    pattern: /^eyelid-/,
    expected: 2,
    angularGain: [0.238, 0.112],
    translationGain: [0.252, -0.14],
    blink: 'external',
    blinkMultiplier: 1,
  },
  coral_monocle: {
    pattern: /subtle-catchlight/,
    expected: 2,
    angularGain: [0, 0],
    translationGain: [0.098, -0.035],
    blink: 'linear',
    blinkMultiplier: 6,
  },
};
const result = {
  schema: 'bloom.authored-eye-gaze-profiles',
  version: 1,
  provenance: {
    anchors:
      'geometry.pose.deformationCenter, proven by authored-parts.mjs transformAuthoredRecord',
    halfSize:
      'Eye effect local half-width/height: clippo-geometry.mjs eyePrefix; preserved separately per geometry LOD',
    gains:
      'Independent native 60Hz horizontal/vertical and 30Hz mixed hover/drag/release observations; scripts/test-avatar-eye-gaze.mjs',
    sourceGeometrySha256: {},
  },
  limitations: [
    'Headphones requires an explicit hidden blink signal; its morph [0,1] is not that signal.',
    'Neutral reactive controller observations; reaction/Computer gaze composition requires separate evidence.',
  ],
  presets: {},
};
for (const [preset, recipe] of Object.entries(recipes)) {
  const lods = {};
  for (const lod of [0, 1]) {
    const path = `runtime/avatar/assets/${preset}/geometry${lod === 0 ? '-low' : ''}.json`;
    const bytes = await readFile(path);
    result.provenance.sourceGeometrySha256[`${preset}:${lod}`] = createHash('sha256')
      .update(bytes)
      .digest('hex');
    const geometry = JSON.parse(bytes);
    assert.equal(geometry.quality, lod);
    const parts = {};
    for (const part of geometry.parts.filter((p) => recipe.pattern.test(p.material.label))) {
      const prefix = Buffer.from(part.unresolvedMaterialAndPosePrefixHex, 'hex');
      assert.equal(prefix.readUInt32LE(24), 1, 'Native material prefix');
      assert.equal(prefix.readUInt32LE(108), 0, 'Native eye attachment layout');
      const effectAt = 116 + prefix.readUInt32LE(112) + 36;
      assert.equal(prefix[effectAt], preset === 'coral_monocle' ? 3 : 5);
      const halfSize = [prefix.readFloatLE(effectAt + 2), prefix.readFloatLE(effectAt + 6)];
      assert(halfSize.every((v) => Number.isFinite(v) && v > 0));
      const anchor = [0, 1, 2].map((k) => prefix.readFloatLE(40 + 4 * k));
      assert.deepEqual(anchor, part.pose.deformationCenter);
      parts[part.id] = {
        anchor,
        halfSize,
        angularGain: recipe.angularGain,
        translationGain: recipe.translationGain,
        blink: recipe.blink,
        blinkMultiplier: recipe.blinkMultiplier,
      };
    }
    assert.equal(Object.keys(parts).length, recipe.expected, `${preset}: expected eye parts`);
    lods[lod] = parts;
  }
  result.presets[preset] = lods;
}
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    destination,
    presets: Object.keys(result.presets),
    bytes: Buffer.byteLength(JSON.stringify(result, null, 2) + '\n'),
  }),
);
