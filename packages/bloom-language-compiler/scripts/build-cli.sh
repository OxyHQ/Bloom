#!/usr/bin/env bash
# Build bloomc for one Rust target, named for its platform package as
# `napi build --platform` names the addon (CI: language-compiler-binaries.yml):
#
#   scripts/build-cli.sh <rust-target> <out-dir>
#
# The WASI package's bloomc is built for wasm32-wasip1 (Node's WASI has no
# threads), whichever WASI target the addon is built for.
set -euo pipefail
target="${1:?rust target}"
out="$(mkdir -p "${2:?out dir}" && cd "$2" && pwd)"
cd "$(dirname "$0")/.."
case "$target" in
  x86_64-unknown-linux-gnu) platform=linux-x64-gnu ;;
  aarch64-unknown-linux-gnu) platform=linux-arm64-gnu ;;
  x86_64-apple-darwin) platform=darwin-x64 ;;
  aarch64-apple-darwin) platform=darwin-arm64 ;;
  x86_64-pc-windows-msvc) platform=win32-x64-msvc ;;
  wasm32-wasip1 | wasm32-wasip1-threads) platform=wasm32-wasi target=wasm32-wasip1 ;;
  *)
    echo "build-cli.sh: no platform package for $target" >&2
    exit 2
    ;;
esac
cargo build --release --locked -p bloomc --target "$target"
built="${CARGO_TARGET_DIR:-target}/$target/release/bloomc"
case "$platform" in
  wasm32-wasi) cp "$built.wasm" "$out/bloomc.$platform.wasm" ;;
  win32-*) cp "$built.exe" "$out/bloomc.$platform.exe" ;;
  *) install -m 755 "$built" "$out/bloomc.$platform" ;;
esac
echo "built $out/$(cd "$out" && ls bloomc."$platform"*)"
