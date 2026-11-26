# ADR 0001: Bloom's own language (`.bloom`)

- **Status:** proposed (phase 0: design, prototype, measurements). Not adopted; the owner reviews first.
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
| Expo Router / Metro / Noxcturnal changes | medium | bloomc runs in front of the host's worker, like the embedded pass; route files need a `require.context` extension that may need upstream support. |
| Source maps through three stages lose precision on Hermes | medium | Compose maps in the adapters; a gate throws from a `.bloom` handler and asserts the `.bloom` line. |
| Two languages during migration | medium | `.bloom` compiles to the embedded language, so one runtime and one set of gates; the codemod keeps them aligned. |
| Performance claims don't hold on device | medium | Every claim is gated (cost gates in Jest; render time and bundle size measured per migrated screen); the device check is a separate agent's job. |
| React Compiler and `react/compiler-runtime` API drift | low | The cache is a tiny surface (`c(n)`); bloomc's output can switch to a local equivalent in one place. |

## Prototype (phase 0)

Branches (draft PRs, nothing merged or published):

- `feat/bloom-lang-design`: this ADR and the spec.
- `feat/bloom-lang-core`: `crates/lang` — lexer, recovering parser, resolver, type checker
  (subset), emitter, `.d.bloom.ts`.
- `feat/bloom-lang-tooling`: `crates/fmt`, `crates/bloomc` (CLI), napi `compileBloom`, Metro and
  Jest adapters for `.bloom`, `packages/bloom-vscode` (TextMate grammar), benchmarks, `.bloom`
  cost gates.
- Mention `feat/bloom-lang-proof`: Settings → Notifications ported to `.bloom`, logic included,
  with measurements against the TS version.

## Measurements

_To be filled from the prototype's runs (Jest cost harness, render timing, web export, bloomc
bench)._

## Roadmap to 100%

_To be filled with the prototype's findings._

## State and next steps

_Kept current while phase 0 runs._
