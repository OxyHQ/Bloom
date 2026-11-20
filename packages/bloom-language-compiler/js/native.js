const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// The Rust compiler, as a Node addon built by `scripts/build-addon.sh`. A
// published package would ship one prebuilt binary per platform (napi-rs
// layout) plus a wasm32-wasip1 fallback; see STUDY.md, "Distribution".
const addonPath = path.join(__dirname, '..', 'bloom-language-compiler.node');

/** The addon's digest: a cache key part, so a new compiler invalidates cached transforms. */
const digest = crypto.createHash('sha1').update(fs.readFileSync(addonPath)).digest('hex');

module.exports = { ...require(addonPath), digest };
