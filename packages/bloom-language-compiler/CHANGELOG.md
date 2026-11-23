# Changelog

## 1.0.0

First release. The build-time optimiser for `@oxy.so/bloom-language`: a Rust pass (Oxc, through a Node addon) in front of Metro's and Jest's own transformers. It is an optimisation; the runtime interprets every chain, and the pass changes only what it proves keeps its meaning.

### Added

- Hoists static chains to module scope, including the static prefix of a dynamic chain; names resolve through scope analysis.
- Adds `"use memo"` to every function passed to `view()`.
- Checks every chain against the language spec (unknown modifiers, wrong argument counts, literal tokens outside their set) and fails the build with the source line and a suggestion.
- `withBloomLanguage(config)` from `@oxy.so/bloom-language-compiler/metro`, a Jest transformer (`/jest`) and `compile` (`/compile`).
- Prebuilt addons, so installing it needs no Rust: `@oxy.so/bloom-language-compiler-linux-x64-gnu`, `-linux-arm64-gnu`, `-darwin-x64`, `-darwin-arm64` and `-win32-x64-msvc`, as optional dependencies, and the WASI build `@oxy.so/bloom-language-compiler-wasm32-wasi` for any other platform (a musl Linux, for one), which npm installs only when asked.
