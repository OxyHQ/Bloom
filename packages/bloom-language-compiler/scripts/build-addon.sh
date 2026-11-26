#!/usr/bin/env bash
# Build the Node addon and the bloomc CLI and put them where js/native.js and
# js/bloomc.js load them.
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build --release --locked -p bloom_language_compiler_node -p bloomc "$@"
release="${CARGO_TARGET_DIR:-target}/release"
cp "$release"/libbloom_language_compiler_node.so bloom-language-compiler.node
cp "$release"/bloomc bloomc
