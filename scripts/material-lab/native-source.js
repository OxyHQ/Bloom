const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
module.exports = function nativeSource() {
  const template = readFileSync(path.join(__dirname, 'native/BloomLightProbe.kt'), 'utf8');
  const marker = '__BLOOM_LIGHT_SOURCE_SHA__';
  assert.equal(template.split(marker).length, 2, 'Native source receipt marker must occur once');
  const sourceSha256 = createHash('sha256').update(template).digest('hex');
  const source = template.replace(marker, sourceSha256);
  return { source, sourceSha256, outputSha256: createHash('sha256').update(source).digest('hex') };
};
