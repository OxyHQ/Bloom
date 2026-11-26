# ADR 0001: Bloom's own language (`.bloom`)

- **Status:** accepted (2026-11-26; the owner: "si, haz todas las fases!"). Phase 0 complete; phases 1–3 in progress (see "State and next steps").
- **Date:** 2026-11-26
- **Spec:** [Bloom language specification, draft 0](../bloom-lang-spec.mdx)
- **Supersedes:** nothing. Builds on the embedded language ([design](../bloom-language.mdx)) and its compiler (`packages/bloom-language-compiler/STUDY.md`).

## Context

Bloom's UI is already a language: SwiftUI-style chains of nodes and modifiers embedded in
TypeScript (`@oxy.so/bloom-language`, "the embedded language"), checked and optimised by a Rust
pre-pass on Oxc (`packages/bloom-language-compiler`), with its data layer in `@oxy.so/bloom-data`.
Cost gates hold every node to the fibers, hooks and context reads of the JSX it stands for.
Mention's UI is about 97% embedded language on `feat/mention-on-language`.

What the embedded language cannot fix, because it lives inside TypeScript:

- **Logic is still React + TypeScript**: `useState`, `useCallback`, `useEffect`, try/catch, `null`
  and `undefined`, `any` at the edges, hand-written dependency arrays. That is where Mention's bugs
  and its React Compiler bail-outs are.
- **TypeScript is unsound by design** (bivariance, `any`, unchecked index access, exceptions
  invisible in types), so the compiler cannot rely on types to optimise.
- **The syntax is a compromise**: chains as nested calls, `toElement`/`Embed(<>…</>)` boundaries,
  bindings as tuples, styles as strings inside JS.

The owner's direction: `.bloom` files, Swift-like, UI and logic, 100% ours, "super eficiente y
bueno, como Rust y otros lenguajes top".

## Decision

1. **A new statically typed language, `.bloom`, for both UI and logic**, specified in
   [the spec](../bloom-lang-spec.mdx): Swift-like surface (views, builders, modifiers, `@state`,
   `$binding`, trailing closures), an ML-family core (structs, enums with payloads, exhaustive
   `match`, `Option`/`Result` with `?`, generics, immutability by default), and compile-time
   reactivity.
2. **One compiler, `bloomc`, in Rust**, in the existing compiler workspace
   (`packages/bloom-language-compiler/crates/{lang,fmt,bloomc}`, plus the existing napi addon),
   shipped through the same prebuilt-binary pipeline. The pipeline:

   ```
   .bloom ─► lexer ─► parser (recovering, lossless comments) ─► name resolution ─► type checker
         ─► reactivity analysis (dependency graph per view) ─► emitter (typed TS)
         ─► embedded-language pass (existing: hoist static chains, check spec) ─► host transformer
            (Metro worker / Noxcturnal or Babel / babel-jest / Vite) ─► composed source map ─► .bloom
   ```

3. **bloomc owns the type checker and emits typed TypeScript** (not JS + `.d.ts`) in phases 0–2.
   See "Emit TS or JS" below.
4. **It compiles to the embedded language**, not past it: views become `view()` bodies, nodes and
   modifiers become chains, data becomes bloom-data calls. One resolver for tokens and one renderer
   per platform stay true, and every existing gate keeps applying.
5. **bloomc writes the memoisation itself** with exact, compile-time dependencies, using the React
   Compiler's own runtime cache (`react/compiler-runtime`), and marks bodies `"use no memo"`; the
   React Compiler keeps compiling the app's `.tsx` files.
6. **Adoption is gradual and reversible**: `.bloom` and `.tsx` import each other; a file moves when
   it is ready; the codemod can go both ways for the UI part.

## Goals

- Sound static types with strong local inference; no `any`, no implicit null, errors as values.
- Errors as good as Rust's and Elm's: code, span, a clear sentence, the fix, a docs link.
- Output at least as fast as the best hand-written React Native: no runtime interpreter, no
  proxies, no extra fibers, hooks or context reads; static work done at build time.
- One canonical formatter, a fast incremental compiler, an LSP, a VS Code extension, source maps to
  `.bloom` lines on device and in Jest.
- Seamless interop with TS/npm and React components, file-by-file adoption, Metro/Expo (native and
  web), Jest, Vite, Expo Router, React Compiler coexistence.
- Small, regular grammar that an AI agent writes correctly from a one-page cheat sheet.

## Non-goals

- **A new renderer or runtime.** React (Fabric on native, react-native-web on web) stays the
  renderer; the embedded language runtime stays the resolver.
- **Ownership/borrowing.** Rust's memory model buys nothing in a GC'd JS runtime; we take its
  types and errors, not its lifetimes.
- **Server, CLI or general-purpose use** in phase 0–2. The language targets Oxy apps.
- **Replacing bloom-data** or the app's backend contracts.
- **Macros, inheritance, exceptions, reflection, operator overloading, implicit conversions.**

## What we take from each language, and why

| Language | We take | We leave | Why |
|---|---|---|---|
| **Swift / SwiftUI** | `view` + `body`, result builders (one child per line, `if`/`for`/`match` children, structural identity), chained modifiers whose order is nesting, `@State`/`@Binding`/`@Environment` → `@state`/`$x`/`@env`, `if let`, `T?`, enums with associated values + leading-dot cases, trailing closures, `async`/`await`, `.task`/`.task(id:)` lifetimes, how ClangImporter types a foreign language | protocols with associated types and `some View` opacity, property-wrapper extensibility, `class`/reference semantics, argument labels as part of names | The owner's direction and the embedded language are already SwiftUI-shaped; teams and agents know it. Labels and PATs add complexity without payoff here. |
| **Rust** | `Result`/`Option` and `?`, exhaustive `match`, immutability by default, `struct` + `enum`, `pub` visibility, modules = files, the error-message format (`error[B0502]`, spans, `help:`), one formatter (rustfmt), the compiler as a product, editions for evolution | ownership, lifetimes, traits (phase 1 brings small bounds), macros, `unsafe` | Correctness without ceremony; the errors are the best teaching tool there is. Memory management is the JS engine's. |
| **Kotlin / Compose** | `T?` with `?.`/`??`, `data class` `copy` → `.with(…)`, named and default arguments, trailing lambdas, structured concurrency (scope = view), the Compose compiler's idea that the compiler knows stability and skips unchanged work | annotations-as-compiler-plugins coupled to a compiler version, `null` as a value, implicit `this` receivers | Proven ergonomics for UI code; stability inference is exactly what immutability gives us for free. |
| **Gleam** | a small language on purpose, no null, no exceptions, labelled arguments, friendly errors, compiling to JS with readable output and typed FFI at the boundary | the BEAM target, `use` sugar (phase 2 maybe) | Proof that a tiny ML compiling to JS can be pleasant and fast; its FFI discipline is our `Foreign` rule. |
| **Elm** | "no runtime exceptions" as the bar, errors that teach, enforced exhaustiveness, a single formatter, immutable data | The Elm Architecture's single store, banning JS interop, no type classes ever | Elm's errors and guarantees are the gold standard; its isolation is what we must not copy (we live inside the npm ecosystem). |
| **Svelte 5** | runes' idea: reactivity declared with a marker (`$state`, `$derived`, `$effect`) and the dependency graph built by the compiler, not at runtime | runtime signals and proxies for deep state, `.svelte` single-file style blocks, two-way binding by default | Declaration markers are explicit and agent-friendly; but proxies cost at runtime, and immutability lets us avoid them. |
| **Solid** | compile-time knowledge of what is static vs reactive, hoisting static templates, no re-running what didn't change | a second renderer (fine-grained DOM), signals as the state primitive | React Native renders through React; signals would mean a second reconciler on native. We reach the same "only what changed" with exact memo slots and hoisting. |
| **React Compiler** | its runtime cache (`c(n)` slots) as our memo target, so output looks like what React already optimises for | its inference of mutation and aliasing (we don't need it), its bail-outs | Same runtime, better information: in `.bloom`, every value is immutable and every dependency is resolved by the checker. |

## Emit TS or JS

Two options were weighed for the output of the front end:

- **(A) Emit typed `.ts` and let `tsc` check the interop boundary.**
- **(B) Own the full type checker including `.d.ts` import, emit JS plus `.d.ts`.**

**Decision: bloomc owns the type checker for all Bloom code in both cases, and emits typed TS in
phases 0–2 (A), moving to (B) only when the `.d.ts` importer covers the real dependency graph.**

- bloomc must own the checker regardless: soundness, Rust/Elm-grade errors, the reactivity
  analysis and the LSP all need Bloom's own types. `tsc` cannot express exhaustive `match`,
  `Result` propagation or "a hook only as a view member".
- **Reading arbitrary `.d.ts` faithfully is the hard part** (conditional and mapped types,
  overloads, declaration merging, module augmentation; Mention's own hooks use indexed and
  conditional types). Swift's ClangImporter took years for a smaller surface. bloomc maps the
  common subset (primitives, objects, interfaces, literal unions, functions, `Promise`, simple
  generics) and types the rest as `Foreign`, which must be annotated before Bloom code uses it.
  Emitting TS means **those annotations are checked by `tsc` against the real `.d.ts`**, with
  diagnostics mapped back to `.bloom` spans. Nothing crosses the boundary unchecked.
- **TS costs nothing at runtime**: Metro/Babel/Noxcturnal strip types; Jest and Vite already
  handle `.ts`. Emitting JS would only save the strip.
- **TS → Bloom** works either way through the emitted `Name.d.bloom.ts` (`allowArbitraryExtensions`).
- (B) becomes worthwhile when the importer covers what apps import, so `tsc` is no longer needed
  in the loop and builds skip a full TS check; it is a phase-3 item with a measurable trigger
  (≥ 95% of imported symbols in Oxy apps typed without `Foreign`).

## Emit the embedded language, or lower

The emitter targets the embedded-language runtime (chains), then the existing pass hoists static
chains. Lowering further (emitting `jsx()` of Bloom components directly) was considered:

- The cost gates already hold each node to its JSX in fibers, hooks and context reads; the
  remaining difference is node allocation and interpretation time per render, which the hoisting
  pass removes for static trees and the memo cache removes for unchanged dynamic ones.
- Lowering would duplicate the runtime's token resolution and platform paint in the compiler — the
  "second resolver" the language compiler study rejected (`STUDY.md`, "Superseded").
- **Decision:** emit chains; revisit lowering only if the measurements below show node
  interpretation as a significant share of render time on device. The emitter's IR keeps that door
  open (a lowering pass would replace one emit stage).

## Reactivity: hooks, not signals

`@state`, `@list`, `@record`, `@env` compile to the hooks a careful engineer would write
(`useState`, `useList`, `useRecord`, `useEnvironment`); `.task` to one `useEffect` with an
`AbortController`. Derived values, handlers and dynamic subtrees go into one memo cache with
dependencies computed by the checker. This keeps one fiber per view, the hook count of hand-written
code, and no subscriptions or proxies at runtime. Signals were rejected because React (Fabric,
react-native-web) is the renderer: a signal graph would either re-enter React through hooks
(costing more than plain state) or require a second reconciler.

## Migration from the embedded language

1. **Codemod, UI part (mechanical):** the existing Oxc front end reads a `.tsx` file in the embedded
   language; chains become builders and modifiers 1:1 (`VStack(a, b).spacing('lg')` →
   `VStack { a; b }.spacing("lg")`), `useState` → `@state`, `[v, set]` bindings → `$v`,
   `toElement`/`Embed(<>{toElement(x)}</>)` boundaries disappear, `useCallback`/`useMemo` are
   dropped (bloomc memoises), TS interfaces → `struct`, string-literal unions → fieldless `enum`.
   The codemod refuses (with a reason) what it cannot translate safely and leaves that file `.tsx`.
2. **Logic part (assisted):** try/catch around awaits → `match await …` on `Result`; `null` checks →
   `if let`/`??`; `useEffect` with fetches → `.task(id:)`; boolean flag clusters → an `enum` state.
   The codemod proposes these with `// bloom: review` markers; a human or agent completes them,
   and bloomc's errors guide the rest.
3. **Order:** leaf components and rows → screens → app hooks and stores (TS hooks stay imported
   until ported; bloom-data stays the data layer) → route files once Expo Router accepts `.bloom`.
4. **Gates per migrated file:** the cost gate (fibers/hooks/contexts ≤ before), pixel parity on web,
   its Jest tests unchanged, bundle bytes ≤ before.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| A language is forever: compiler, formatter, LSP, docs, upgrades | high | Small grammar; one Rust codebase reusing Oxc; editions for breaking changes; the escape hatch is the codemod back to `.tsx` (UI) plus readable emitted TS. |
| AI agents have never seen `.bloom` | high | Swift/TS-familiar surface, one way to do each thing, a one-page cheat sheet, errors that state the fix; measure agent first-compile rate on a task set before rollout. |
| `.d.ts` interop gaps (`Foreign` everywhere) | medium | `tsc` checks the boundary on emitted TS; extend the importer by what real imports need; measured coverage drives phase 3. |
| Expo Router / Metro / Noxcturnal changes | medium | bloomc runs in front of the host's worker, like the embedded pass. **Measured:** expo-router's `_ctx*` regexes and matchers are hardcoded to `[jt]sx?`, so a route cannot be a `.bloom` file today; until an upstream option exists, a route is a one-line `app/x.tsx` (`export { default } from '…/x.bloom'`). |
| Source maps through three stages lose precision on Hermes | medium | Compose maps in the adapters; a gate throws from a `.bloom` handler and asserts the `.bloom` line. |
| Two languages during migration | medium | `.bloom` compiles to the embedded language, so one runtime and one set of gates; the codemod keeps them aligned. |
| Performance claims don't hold on device | medium | Every claim is gated (cost gates in Jest; render time and bundle size measured per migrated screen); the device check is a separate agent's job. |
| React Compiler and `react/compiler-runtime` API drift | low | The cache is a tiny surface (`c(n)`); bloomc's output can switch to a local equivalent in one place. |

## Prototype (phase 0)

Draft PRs, nothing merged or published:

| PR | Branch | What |
|---|---|---|
| [Bloom #963](https://github.com/OxyHQ/Bloom/pull/963) | `feat/bloom-lang-design` | this ADR and the spec (draft 0.2) |
| [Bloom #967](https://github.com/OxyHQ/Bloom/pull/967) | `feat/bloom-lang-core` | `crates/lang` (`bloom_lang`): lexer, recovering parser with a comment table, resolver, type checker, `.d.ts` reader for the boundary, emitter with its own memo scopes, source maps, `.d.bloom.ts`; goldens and a `tsc` check of every emitted file |
| [Bloom #964](https://github.com/OxyHQ/Bloom/pull/964) (stacked on #967) | `feat/bloom-lang-tooling` | `crates/fmt` (the formatter), `crates/bloomc` (`check`, `fmt`, `build` with an incremental cache, `lsp` with diagnostics, hover and formatting), napi `compileBloom`/`checkBloom`/`formatBloom`, Metro and Jest adapters, `bloom-lang-dts`, `packages/bloom-vscode` (TextMate grammar, LSP client), the `.bloom` cost gate, the 1000-file benchmark |
| [Mention #2046](https://github.com/OxyHQ/Mention/pull/2046) | `feat/bloom-lang-proof` | Settings → Notifications in `.bloom`, logic included, running in Mention's web build and Jest, with the measurement harness |

What the subset covers: primitives, lists, string-keyed maps, tuples, structs (defaults, `.with`,
`S.patch`, per-field spread), enums with payloads, `T?`, `Result` with `?`, exhaustive `match`,
generics by unification, closures with trailing-closure syntax, `async`/`await`, `task`, `defer`,
views and screens with `@state`, derived `let`s and handler `fn`s, builders, modifiers and tokens
checked from `spec/language.json`, `$` bindings, the state-write and hook rules, and the
`Foreign` boundary. Not yet: `.onChange`, `all`/`race`, typed `@list`/`@record`/`@env` (they emit
the hooks, typed `Foreign`), structural `==`, key paths, node-argument checking (left to `tsc`).

## Measurements

The real proof is Mention's Settings → Notifications (auth gating, `useViewerSettingsSection`
load and update, `saving` state, the async save with error toast, seven toggles, a navigation
button), measured in three forms: **original** (the TS screen on `feat/mention-on-language`),
**cleaned** (the best hand-written embedded-language TS: no `Embed(<>{toElement()}</>)` wrappers,
a row helper, React Compiler on, as Mention runs it) and **`.bloom`**. Jest: i9-14900K, Node 24,
jest-expo, development React, 200 runs after 30 warm-up, the three forms interleaved in rotating
order. The machine was shared (load average 7–11), so timings are indicative; React-cost counts
and bytes are exact.

**Pixels.** 0 differing pixels between all three forms, in all four branches, at 1x and 2x (16
diffs, production web export, Chrome), and equal to the captures taken before the port.

**React cost** (fibers / hooks / context reads under the screen):

| Branch | original | cleaned | `.bloom` |
|---|---|---|---|
| loaded | 413 / 535 / 273 | 396 / 534 / 257 | 396 / 534 / 257 |
| saving | 434 / 556 / 279 | 417 / 555 / 263 | 417 / 555 / 263 |
| pending, loading | 110 / 355 / 54 | 109 / 354 / 54 | 109 / 354 / 54 |
| signed out | 17 / 19 / 3 | 16 / 18 / 3 | 16 / 18 / 3 |

`.bloom` costs exactly what the best hand-written form costs, in every branch. The synthetic
`.bloom` cost gate (a view with state, derived value and handler; five list rows; a static view)
is likewise equal to its hand-written equivalent (8/1/3, 36/0/15, 8/0/3).

**Render time** (wall, median / p95, ms):

| | original | cleaned | `.bloom` |
|---|---|---|---|
| mount | 25.92 / 37.13 | 24.43 / 43.39 | 23.54 / 35.06 |
| toggle press (`saving` on) | 9.17 / 15.82 | 8.68 / 16.09 | 7.81 / 12.47 |
| save settles (`saving` off) | 17.80 / 28.39 | 17.49 / 29.87 | **10.84 / 18.57** |
| whole update | 27.26 / 40.89 | 26.66 / 42.48 | **19.38 / 30.38** |

The React Profiler's time for the settle render is 6 / 6 / 0 ms. The cause is structural: **the
React Compiler bails out of both TS forms** (it does not compile `try`/`finally`), so neither is
memoised, in Jest or in the production bundle. The `.bloom` form has no `try`: the save is a
`match` on a `Result` with `defer`, and bloomc memoises it with per-child scopes on member-path
dependencies, so a `saving` change rebuilds only the spinner slot. Mount is within noise.

**Bundle** (production web export, tree shaking; bytes min / gzip / brotli):

| | screen module | its chunk | entry | all JS (gzip) |
|---|---|---|---|---|
| original | 5,320 / 1,282 / 1,061 | 148,065 / 38,278 / 30,510 | 9,856,928 | 30,605,602 (11,421,462) |
| cleaned | 3,404 / 1,173 / 984 | 146,213 / 38,229 / 30,592 | 9,857,649 | 30,604,471 (11,421,602) |
| `.bloom` | 4,711 / 1,745 / 1,468 | 147,524 / 38,827 / 30,961 | 9,857,649 | 30,605,782 (11,422,196) |

`.bloom` is +572 B gzip over cleaned for the module (+1.5% of its chunk): the memo cache (38
slots), the `$settle` helper for awaited promises, and the per-field patch spread. Both `view()`
forms add 721 B to the entry (tree shaking now keeps `view`). Phase 1 lowers `$settle` to an
inline `try`/`catch` around the await only.

**Compile time** (release build, 32 cores):

| | time |
|---|---|
| bloomc, the Notifications file | 0.94 ms median (p95 1.44) |
| bloomc, per file, synthetic models / rows / screens | 94 / 193 / 381 µs (embedded pass on equivalent TSX: 4.6 / 12.6 / 26.6 µs) |
| `bloomc build`, 1000 files, cold, 1 thread / 32 threads | 355 ms / 73 ms |
| `bloomc build`, 1000 files, warm / one file changed | 23 ms / 22 ms |
| whole per-file pipeline with Babel (Expo preset + React Compiler) | original 25.5 ms, cleaned 12.7 ms, `.bloom` 15.4 ms (bloomc 1.3 of it) |
| Node pipeline over the 1000 files, `.bloom` → Babel vs TSX → embedded pass → Babel | 1,993 ms vs 1,028 ms |

Babel dominates every pipeline. bloomc does far more per file than the embedded pass (parse,
check, read declarations, emit, then the embedded pass), and is 10–20x its cost; a profile and the
known fixes (one dependency walk instead of one per nesting level, no token clones, a declaration
cache shared across files) are phase 1, with a target of ≤ 3x.

**Source maps.** A throw inside a `.bloom` handler under Jest reports the `.bloom` file and line;
Metro composes the same maps. On-device (Hermes) stack traces are not yet verified.

**Interop.** The emitted TS of the port type-checks with 0 errors against Mention's real types;
every `Foreign` crossing is a `satisfies` that `tsc` verifies (a planted error is caught).

**Not measured:** native render time and an Android build (device work belongs to another agent;
the phones were not touched).

## Roadmap to 100%

| Phase | What | Effort (agent-weeks, rough) | Exit criterion |
|---|---|---|---|
| **1. Language complete for app logic** | key paths; structural `==`; `.onChange`, `all`/`race`; bloom-data typed natively (`@list`/`@record`/`@env` not `Foreign`); node constructor signatures in `language.json`; `$settle` → inline try/catch; builder IIFEs removed; `bloomc check --tsc`; adapter cache keys that include imports; compile-time profile (≤ 3x the embedded pass); LSP go-to-definition and completion; prebuilt binaries for the six platforms through the existing CI; Mention's i18n, logger and coverage gates read `.bloom`; device check of the proof screen | 4–6 | the proof screen ships behind a flag on all platforms; every gate green |
| **2. Mention migration** | the UI codemod (embedded TSX → `.bloom`) and the assisted logic port; typed routes from `app/`; generated route shims until expo-router accepts `.bloom`; screens in order: rows (`PostItem`), lists (notifications), compose, settings; Hermes stack traces verified; an agent first-compile-rate eval on a task set | 6–10 | ≥ 90% of Mention's UI and view logic in `.bloom`, each screen at or under its old cost, bytes and pixels |
| **3. Fleet and maturity** | other apps (Alia, Allo, Homiio, …); app hooks and stores in `.bloom`; emit JS + `.d.ts` once the `.d.ts` importer types ≥ 95% of imported symbols; lowering experiments past the embedded runtime if device profiles show interpretation cost; editions for breaking changes | open | the owner's "100%": UI and logic in `.bloom` across the apps |

Main risks to the roadmap: agent fluency in a new language (mitigated by the cheat sheet and
errors, measured in phase 2), `.d.ts` coverage, and the per-file compile cost.

## State and next steps

Kept current as the phases run (last update 2026-11-26).

| Phase | Item | State |
|---|---|---|
| 0 | design, prototype, proof | merged: #963 (this ADR, spec), #964 (core and tooling combined; #967 closed into it) |
| 0 | publish | release PR #984: compiler 1.6.0, its six platform packages, `bloom-vscode` 0.1.0 as a CI `.vsix` artifact |
| 0 | Mention proof on the published compiler | #2046, onto the language line `feat/mention-on-language` after #984 publishes |
| 1 | language | #979: key paths, structural `==`, `.onChange`, `all`/`race`, the await helper removed (inline `try`), builder IIFEs removed, typed routes (B0701/B0702), node constructor signatures for all 441 nodes, the shared chain-rule module (`crates/compiler/src/rules.rs`, fed by both compilers; bloomc no longer re-runs the embedded pass), record literals, inline record types, string-literal unions. In progress: `?.()` and argument spread, `effect`, `defineTokens`, typed bloom-data, emitted bytes |
| 1 | tooling | #980: `bloomc check --tsc` (B0620), LSP (definition, references, completion, hover, incremental sync), import-aware Jest/Metro/`bloomc build` caches, `bloomc` for six platforms with an `npx` shim |
| 1 | compile cost | per file 47 / 60 / 136 µs (models / rows / screens) from 94 / 193 / 381; the embedded pass on the same TSX is 3.9 / 11.3 / 23.5 µs (12x / 5.3x / 5.8x). The ≤ 3x target is not met; emit (allocation and copying) is half of a screen's time |
| 2 | codemod | #983 `bloomc migrate`; Mention #2049 (four PostItem rows in `.bloom`: one fiber fewer each, pixels equal, +56 B gzip) |
| 2 | corpus (Mention `packages/frontend`, 324 files) | 2.8% clean at the start; tracked below |

**Language gaps the corpus found, and the decision for each:**

| Gap (files) | Decision |
|---|---|
| object literals (≈200), inline object types (45) | the language: record literals `{ k: v, ..s }` and structural record types |
| inline string-literal unions (49) | the language: literal union types |
| optional calls, argument spread | the language: `x?.m()`, `f(..xs)` |
| `useEffect` (32) | the language: an `effect { … defer { } }` member with inferred dependencies; async stays `.task` |
| `defineTokens` | the language: a compile-time intrinsic |
| node options objects | the language: constructor signatures plus record literals |
| JSX (121), `toElement` outside `Embed` (76), `memo()` (63) | the codemod: reuses the JSX → embedded mapping; views are already memoised |
| explicit type arguments, `as` | the codemod: annotations, marked "needs review" (`bloomc check --tsc` verifies them) |
| spread children | the codemod: `for` or a `[View]` child |

**Corpus history** (clean / needs review / refused):

| Date | Compiler | Result |
|---|---|---|
| 2026-11-26 | #979 before record literals | 2.8% / 0% / 97.2% |

**Next:** #984 publishes; #2046 merges on the language line; #979 and #980 land after Bloom #971
(per-family language entries) and go out in the next release together with the language bump that
ships those entries; the corpus passes 80% before phase 2's screen-by-screen migration; then
phase 3 starts with Allo (OxyHQ/Allo#332).
