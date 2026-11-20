#!/usr/bin/env bash
# Build the Node addon and put it where js/native.js loads it.
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build --release --locked -p bloom_language_compiler_node
cp target/release/libbloom_language_compiler_node.so bloom-language-compiler.node
