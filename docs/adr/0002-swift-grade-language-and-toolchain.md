# ADR 0002: A Swift-grade language and toolchain

- **Status:** proposed (2026-11-26). The owner reviews the surface (this ADR and
  [its Spanish summary](0002-resumen-es.md)) before it is built out.
- **Amends:** [ADR 0001](0001-bloom-own-language.md). It keeps 0001's goals, pipeline, type
  system and compile-time reactivity. It replaces 0001's *surface* (TS-flavoured syntax, string-path
  imports, npm in app code) and adds a toolchain and a standard library.

## Context

Phase 0 and the first half of phase 1 built a working compiler. It has a recovering parser, a checker, an emitter with
compile-time memoisation, an LSP, `check --tsc` and the `migrate` codemod. It also has an Android build
in which `.bloom` renders faster than the TS it replaced. To reach a high codemod rate on Mention,
the surface grew TS escape hatches:

- `import … from "react-native"` and `import … from "js"`;
- npm packages imported by path;
- `Foreign<"T">`, `..p: Props`, `memo`, `lazy`, `@ref` and `effect`.

The owner rejects that surface ("cutre"). App code should read like Swift. It should have Swift's way of
programming, and Rust and Kotlin's quality and speed. JS, npm and React should be implementation
details that app developers never see.

## Decision

Bloom becomes a **language with its own modules, toolchain and standard library**. JS, npm, Metro,
Expo, Babel and React Native stay *underneath* as the runtime and build substrate. Nothing of them
appears in app code or app configuration.

### 1. Modules, not paths

- A **module is a directory** of `.bloom` files: `Sources/Posts/*.bloom` is module `Posts`.
  An app is a set of modules plus an app target, like a Swift package or a Cargo workspace.
- **Imports name modules:** `import Bloom`, `import BloomData`, `import Mention.Posts`. There are no
  string paths, and no `"js"` or `"react-native"`, in app code.
- **Visibility** is `public` (other modules), `internal` (the default, the whole module) and
  `private` (the file). `pub` goes away.
- **No cycles between modules.** The build graph is the module graph, so each module compiles
  once, in parallel and incrementally (Cargo's unit), and is lazy-loadable as a bundle split.

### 2. One CLI: `bloom`

| Command | Does |
|---|---|
| `bloom new <name> [--template app\|module]` | creates a package with `Package.bloom`, `Sources/`, `Tests/` |
| `bloom build ios\|android\|web [--release]` | builds the app; underneath it generates and drives Expo, Metro and Gradle, or the web bundler |
| `bloom run ios\|android\|web` | builds, installs and starts on a simulator, emulator or browser, with fast refresh |
| `bloom test` | runs `Tests/` (Bloom's own test framework over Jest underneath) |
| `bloom check`, `bloom fmt`, `bloom lsp` | today's `bloomc check`, `fmt` and `lsp` |
| `bloom add <package>` / `bloom bind <npm-package>` | adds a Bloom package; generates an `extern` binding module for a JS or native package (section 4) |

**The manifest is `Package.bloom`**, a declarative subset of Bloom, evaluated by the compiler with
no arbitrary code. It works like `Package.swift`:

```swift
let package = Package(
  name: "Mention",
  platforms: [.iOS(17), .android(26), .web],
  dependencies: [
    .package("Bloom", from: "24.0.0"),
    .package("BloomData", from: "2.0.0"),
  ],
  targets: [
    .app("Mention", dependencies: ["Feed", "Posts", "Settings"]),
    .module("Posts", dependencies: ["MentionAPI"]),
    .module("MentionAPI"),
    .bindings("Sentry", npm: "@sentry/react-native@6.2.0"),
    .tests("PostsTests", dependencies: ["Posts"]),
  ]
)
```

- **A generated build directory.** `bloom` writes `.bloom/build/` with the `package.json`,
  `app.config`, Metro, Babel and Jest config and the Expo prebuild. It is regenerated, never
  edited, and git-ignored.
- **Dependencies are locked.** npm tarballs are fetched into a content-addressed store and locked
  in `Package.resolved`, under the same 7-day supply-chain quarantine as today.
- **Existing apps.** An existing Expo app adopts this with `bloom init --adopt`, which keeps its
  native config as an override layer.

### 3. A standard library, so apps never need npm

These modules ship with the toolchain, typed and documented. They are written in `.bloom` over
`extern` bindings, which only the standard library sees.

| Module | Contents (Swift/Foundation analogue) |
|---|---|
| `Bloom` (core, implicit) | `Int`, `Double`, `Bool`, `String` (Unicode-correct, `Character`), `Array`, `Dictionary`, `Set`, `Optional`, `Result`, `Range`, `Error`, math, `Regex`, `print`/`Logger` |
| `Bloom` (time) | `Date`, `Duration`, `Clock`, `Calendar`, formatting (`.relative`, `.dateTime`) |
| `Bloom` (I/O) | `URL`, `JSON` with `Codable` (derived at compile time, no reflection), `HTTPClient` (`async throws`, typed decode, cancellation), `KeyValueStore`, `SecureStore`, `FileStore` |
| `Bloom` (concurrency) | `Task`, `TaskGroup`, `async let`, `sleep(for:)`, `AsyncStream`, actors (phase B) |
| `Bloom` (i18n) | `String(localized:)`, `LocalizedStringKey` literals in `Text("key")` checked against the catalogs at compile time, plural rules, `Locale` |
| `BloomUI` (re-exported by `Bloom`) | every Bloom node and modifier, `NavigationStack` with typed routes, sheets, alerts, toasts, glass |
| `BloomData` | `@Model` entities, queries, sources, optimistic actions, realtime, SQLite persistence (today's bloom-data) |

### 4. Interop is the exception: binding modules

A third-party JS or native package is used only through an **`extern` binding module**:

- `bloom bind @sentry/react-native` reads its `.d.ts` (today's boundary reader) and writes
  `Bindings/Sentry/Sentry.bloom`;
- that file is a target declared in the manifest, hand-editable after generation;
- the app writes `import Sentry` and never sees a JS name. This mirrors Swift's ObjC bridging and
  Rust's `-sys` crates.

```swift
// Bindings/Sentry/Sentry.bloom (generated, then curated)
extern module "@sentry/react-native" {
  public struct Options { public var dsn: String; public var tracesSampleRate: Double = 0 }
  public func initialize(_ options: Options)              // extern name: init
  public func capture(_ error: Error) -> String           // extern name: captureException
}
```

- **Only binding modules are typed by `tsc`.** `Foreign`, `satisfies` crossings, `"js"` imports and
  `Foreign<"T">` exist only inside binding modules, where `bloom check --tsc` verifies them. App
  modules are 100% Bloom-typed.
- **React and React Native are never written in app code.** The standard library wraps them:
  `View`, `List`, `TextField`, `Image`, gestures, `Platform` become `Bloom` APIs.
- **TS keeps importing Bloom** through the generated `.d.bloom.ts`, for gradual adoption. Bloom
  importing TS app files directly is a migration-only mode (`--allow-ts-imports`) that the codemod
  uses and a lint keeps out of finished modules.

### 5. A Swift-style surface

| Concept | Surface | Compiles to (zero-cost rules as in 0001) |
|---|---|---|
| a view | `struct PostRow: View { let post: Post; var body: some View { … } }` | one memoised `view()` fiber; stored `let`s are props |
| view state | `@State private var draft = ""`, `@Binding var isOn: Bool`, `$draft` | `useState`; a binding pair |
| environment | `@Environment(\.locale) var locale`, `.environment(\.x, v)` | one environment read |
| models | `@Observable final class FeedModel { var posts: [Post] = [] }` | a store with field-level subscriptions: a view re-renders only for the fields it read, tracked at compile time, with no proxies |
| values | `struct` with value semantics; `var p = post; p.likes += 1` copies | object literals; a mutation of a local `var` struct becomes a fresh object |
| enums | `enum Load<T> { case loading, failed(Error), ready(T) }` with `switch`, `case let`, `where` | strings or tagged objects (0001's table) |
| protocols | `protocol Identifiable { var id: String { get } }`, `extension Post: Identifiable {}`, generics with constraints `func first<T: Equatable>` | statically dispatched (structs are structural at runtime); `any P` existentials pass a witness object, written explicitly |
| errors | `func load() async throws(APIError) -> Feed`, `try`, `do`/`catch`, `try?`, `Result` | JS exceptions (free on the happy path); `try?` gives an optional |
| control flow | `guard let x else { return }`, `if let`, `switch`, `for … in`, `while`, `defer` | plain JS |
| functions | `func`, argument labels (`move(to: x)`), trailing closures, `$0` shorthand | plain functions |
| strings | `"Hello \(name)"` | template literals |
| tokens | `.padding(.md)`, `.foregroundStyle(.muted)`, `.font(.headline)`, `.background(.primary.opacity(0.1))` | the token strings (a generated Swift-name table, e.g. `2xl` → `.xxl`, `caption-1` → `.caption1`) |
| effects | `.task { }`, `.task(id:) { }`, `.onChange(of:) { old, new in }`, `.onAppear`, `.onDisappear` | one `useEffect` each, with exact dependencies |
| memoisation | none written: the compiler decides; a view that conforms to `Equatable` uses its `==` as the comparator | the memo cache of 0001 |
| code splitting | automatic per module; `LazyView(Settings.Screen.self)` for an explicit split | dynamic `import()` |

**Retired** (TS-flavoured): `view X(..p: Props)` (props are stored properties); `memo`/`equal(old, new)` (`Equatable`); `lazy` (automatic splitting, `LazyView`); `@ref` (a `class` held in `@State`, as in Swift); the `effect` member (`.task`/`.onChange`/`.onAppear`); `match` (`switch`); `fn`/`pub` (`func`/`public`); `${}` (`\()`); `Foreign` and `"js"` in app code (binding modules); string-literal tokens (typed members).

### 6. Speed

- **Kept from 0001:** compile-time reactivity, static styles, hoisting and the cost gates (a node
  costs no more than its JSX). On Android the `.bloom` Notifications screen mounts in 71 ms
  (TS: 85) and updates in 18.4 ms of React time (TS: 45.7).
- **Static Hermes, evaluated as the native backend.** bloomc already emits fully typed code, which
  is what Static Hermes needs to compile JS ahead of time to native code with Hermes as the runtime.
  Plan:
  1. emit Static-Hermes-typed JS for one module (no `Foreign`, sound types);
  2. build it with `shermes` for Android x86_64 and arm64;
  3. measure cold start, the Notifications update and a CPU-bound std routine (JSON decode,
     `Regex`) against bytecode Hermes;
  4. adopt per module if it wins, keep bytecode otherwise.
- **Web** stays JS. **wasm** is evaluated only for CPU-bound standard-library internals (JSON,
  Regex, text layout) where it measurably pays.
- **Compile speed:** per module and in parallel, with a shared declaration session and an
  incremental cache keyed by module interfaces (Swift's `.swiftmodule`, Rust's metadata). Target:
  a one-file edit rebuilds in under 50 ms.

## Consequences

- **Kept:** the lexer, parser, recovery, checker, inference, the memo emitter, source maps,
  diagnostics, the formatter, the LSP, `check --tsc` (now for binding modules), `migrate` and the
  `.d.ts` reader (now `bloom bind`).
- **Changes:** the grammar's surface (section 5), name resolution (modules by directory), the manifest
  and the CLI, and the standard library. Today's `.bloom` 0.x files get a mechanical
  `bloom migrate --from 0.x`.
- **Mention's phase-2 port waits** for the surface to settle. The codemod is retargeted: React
  components become `struct … : View`, hooks become `@State` and `@Observable` models, imports of
  npm packages become generated binding modules, and imports of app TS become module imports.
- **Risks:**
  - Owning a standard library and a build tool is large; they are thin over npm and Expo, built in
    the order apps need them.
  - Static Hermes maturity.
  - Expo/Metro changes underneath the CLI.
  - Swift familiarity helps agents: the surface is close to Swift, which models know well.

## Re-planned phases

| Phase | Scope | Exit |
|---|---|---|
| **A. Surface 2.0** | the grammar and checker for section 5; directory modules and visibility; `Package.bloom`; the `bloom` CLI (`new`, `check`, `fmt`, `build`/`run` web and Android via generated Expo config, `test`); `bloom bind`; `migrate --from 0.x`; the spec rewritten | the Spanish summary's three Mention examples compile and run in a `bloom new` app on web and the Android emulator |
| **B. Standard library** | core types, time, `URL`, `JSON`/`Codable`, `HTTPClient`, stores, `Task`/`TaskGroup`, `Regex`, `Logger`, i18n with compile-time keys, `NavigationStack` with typed routes, BloomData as `@Model` | Mention's model, network and settings layers expressible without bindings; documented reference generated from the sources |
| **C. Backends** | the Static Hermes evaluation and per-module adoption; the wasm evaluation for standard-library internals; compile-speed targets | measured, adopted where it wins |
| **D. Mention** | the codemod retargeted to 2.0 (components, hooks, models, bindings); Mention ported module by module, each screen equal or better in cost, bytes and pixels; iOS via `bloom build ios` | Mention builds with `bloom build` and has no npm in app code |
| **E. The fleet** | Allo (OxyHQ/Allo#332), then the other apps | each app on `bloom build` |

What already merged or is in flight, and still ships, because the internals are reused: #984
(compiler 1.6.0), #979 and #980 (phase-1 internals and tooling), Mention #2046 (the proof).
