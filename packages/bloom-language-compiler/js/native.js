// The Rust compiler, as a Node addon built by `scripts/build-addon.sh`.
// A published package would ship one prebuilt binary per platform (napi-rs
// layout) plus a wasm32-wasip1 fallback.
module.exports = require('../bloom-language-compiler.node');
