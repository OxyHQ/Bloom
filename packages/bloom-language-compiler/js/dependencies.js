const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

/**
 * What a `.bloom` module's compile read (its imported `.bloom` modules and the
 * TS declarations it imports, `compileBloom(…).dependencies`), each file with
 * the SHA-1 of its content: a transform cached with it is current while every
 * file still has that content. A file that is gone has the empty digest.
 *
 * @param {readonly string[]} files
 * @returns {Array<{ file: string, sha1: string }>}
 */
function manifest(files) {
  return [...new Set(files.map((file) => path.resolve(file)))]
    .sort()
    .map((file) => ({ file, sha1: sha1Of(file) }));
}

function sha1Of(file) {
  let content;
  try {
    content = fs.readFileSync(file);
  } catch {
    return '';
  }
  return crypto.createHash('sha1').update(content).digest('hex');
}

/** Whether every file of a manifest still has the content it was read with. */
function isCurrent(entries) {
  return entries.every(({ file, sha1 }) => sha1Of(file) === sha1);
}

/** One string for a cache key: every file and its content's digest. */
function digestOf(files) {
  return manifest(files)
    .map(({ file, sha1 }) => `${file}\0${sha1}`)
    .join('\n');
}

module.exports = { manifest, isCurrent, digestOf };
