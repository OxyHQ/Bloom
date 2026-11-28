# ADR 0002: A Swift-grade language and toolchain

- **Status:** accepted (2026-11-26; the owner: "todo lo que propones me encanta", adding: leave
  Expo completely). Spanish summary: [0002-resumen-es.md](0002-resumen-es.md).
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

**Deferred** (decided, not built): `any P & Q`, an existential of a protocol composition (it would carry a witness per protocol). A composition constrains a type parameter today: `<T: P & Q>`, `where T: P & Q`, and a module's `type PQ = P & Q` named in one; a composition alias imported from another module is deferred with it. There is no general intersection type: a TS intersection a props type is written as becomes a struct of all its fields (the codemod writes them).

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

#### Measured (phase C, 2026-11-26)

These are medians. The harness, the scripts and the raw runs are in the phase C PR (#1000),
under `packages/bloom-language-compiler/bench/`.

**Static Hermes against bytecode Hermes.**
- Setup:
  - Both sides use the Hermes V1 that React Native 0.88 ships. The tag is `hermes-v260318099.0.5`, built from Meta's source because no `shermes` binary is published; it is past the 7-day quarantine.
  - The device is the Android x86_64 emulator, and each side's VM is built with React Native's release flags.
  - The measured module is Mention's Notifications screen. It is bloomc's output, with React 19.3.1 production and headless stand-ins for the Bloom runtime.
- Runs: interleaved, 10 per form for the screen, 8 for JSON, 50 for cold start.

| | bytecode | native, untyped | native, typed |
|---|---|---|---|
| a Notifications tap (React and the module) | 261 µs | 181 µs (−31%) | — |
| a warm mount | 150 µs | 107 µs (−29%) | — |
| the module's own view function | 8.7 µs | 8.3 µs (−5%) | — |
| cold start: a fresh process to the first commit | 6.37 ms | 7.24 ms (+0.87 ms) | — |
| the module's code shipped | 221 KB bytecode | 1.04 MB native (4.7×) | — |
| JSON decode: 200 notifications (76 KB) into classes | 361 µs | 350 µs | 245 µs (−32%) |
| the same decode's typed walk, without `JSON.parse` | 157 µs | 131 µs | 77 µs (−51%) |

**Decision: not adopted.** There is no `Package.bloom` setting yet, because there is nothing to adopt.
- **The module does not get faster.** Compiled untyped, the module's own code is no faster: the 31% comes from React compiled natively. Typed mode cannot take bloomc's TypeScript:
  - it rejects object type literals, unions and string-literal types;
  - its typed code has no `Array.prototype.join` and no `String.length`;
  - the module's own code is under 10% of a tap, so typing it could save at most that much.
- **Compiling React natively is a platform decision (phase F).** React Native 0.88 cannot load a native unit in an app. The win also costs 4.7× the bytes and 0.9 ms of cold start.
- **Typed decoding is the one clear win (−32%).** It goes to the standard library's `JSON`/`Codable` decode, for when the runtime can load native units.
- arm64 was not measured: only the emulator is allowed.

**wasm: not adopted for JSON.**
- Hermes has no `WebAssembly`, so it is not an option on native.
- On the web (V8), the native `JSON.parse` is 80% of the decode above (143 of 180 µs). A wasm decoder would still have to build the same JS objects.
- `Regex` was not measured.

**Compile speed.**
- **One-file edit (met).** The target was under 50 ms. On the 1000-file bench tree it is 14 ms end to end, and the rebuild is now keyed by module interfaces (`bloom_lang::interface`):
  - a body edit to a model rebuilds 1 file instead of 4;
  - a signature edit still rebuilds 4.
- **Per file (not met).** The target is at most 3× the embedded pass. It is a median over 30 files.

  | | before | after | the embedded pass | after, as a multiple |
  |---|---|---|---|---|
  | models | 50.4 µs | 49.6 µs | 4.0 µs | 12.4× |
  | rows | 63.5 µs | 61.1 µs | 11.3 µs | 5.4× |
  | screens | 146.0 µs | 142.7 µs | 23.2 µs | 6.2× |

  - Where the time goes (a row): parse 13 µs, check 20, chain rules 3, emit 32, source map 4.
  - Where the memory goes (a screen): 2,290 allocations and 280 KB per compile.
  - **Parse:** it allocates about 100× the source size, because `Stmt` is 344 bytes and `Expr` is 160. Boxing their large variants is the fix, and it belongs to phase A, which owns the AST.
  - **Emit:** it builds 600 to 1,300 `String` fragments. The emit changes in #1000 save 2 to 4% only. The fix is an emitter that writes into one buffer, which means a rewrite of `emit.rs` after phase A's emit changes land.

**Emitted bytes.**
- Pipeline: Mention's release pipeline, that is babel-preset-expo with the React Compiler, then terser, then `hermesc`.
- Columns: minified / gzip / Hermes bytecode.

| | before | after | TS + React Compiler |
|---|---|---|---|
| the cost gate's four fixtures | 1868 / 1341 / 3995 | 1709 / 1251 / 3707 | 1684 / 1234 / 3804 |
| Notifications (against `original` / `cleaned`) | 4912 / 1792 / 7669 | 4598 / 1694 / 7386 | 5575 / 1360 / 8674 · 3672 / 1259 / 6652 |

- **What changed.** A `match` that reads or patches the field named like its case is now one keyed access, and a hoisted body has no cache. A string of names and a name child are no longer cached.
- **Where the fixtures stand.** The bytecode Android ships is now smaller than the TypeScript's. Minified and gzip are within 2%.
- **What stays larger in Notifications:** its 38-slot memo cache. That cache is what makes its update 18.4 ms against 45.7.

### 7. The Bloom platform without Expo

Bloom becomes one language and platform for everything. Expo leaves completely; React Native core
(Fabric, with Hermes or Static Hermes) stays underneath as the runtime for now.

- **Build.** `bloom build` generates and drives the native projects itself: the Gradle/Android Studio
  project and the Xcode project. It owns prebuild, config plugins (as Bloom manifest settings:
  permissions, entitlements, icons, splash, deep links), signing and store artifacts. This replaces
  the Expo CLI, prebuild and EAS. Native projects are generated into `.bloom/build/` and are
  reproducible from `Package.bloom`.
- **Native modules.** A Bloom native module is a Swift module (iOS) and a Kotlin module (Android)
  declared in `Package.bloom` (`.native("Haptics", swift: "Native/Haptics/ios", kotlin: "Native/Haptics/android")`).
  Its Bloom interface is written once in `.bloom` (`extern native`). The typed bridges are generated
  as TurboModules/JSI for Fabric, so they are type-checked on both sides, with no Expo Modules core.
- **Router.** Bloom's own typed navigation: `NavigationStack`, `TabView`, sheets and deep links over
  the native stack (react-native-screens), with typed routes from the module graph. This replaces
  expo-router.
- **Updates.** Over-the-air updates ship through Oxy's self-hosted update protocol (Oxy Updates),
  signed and channelled per app. This replaces expo-updates.
- **Runtime.** A later evaluation, not a promise, will decide whether a Bloom-owned renderer pays
  off over React Native's Fabric. It needs device measurements first.
- **Order.** This track runs after A (surface) and B (standard library). Mention leaves Expo module
  by module, each replacement measured and verified on the emulator (and on a device by the device
  agent), with no big bang. The first steps are `bloom build android` generating Mention's Gradle
  project, then the router, then modules by usage.

**Inventory and replacements** (every `expo*` package used by Mention, Allo and Inbox, 2026-11-26):

| Expo package(s) | Used by | Bloom replacement |
|---|---|---|
| `expo`, `expo-dev-client`, `expo-build-properties`, `expo-constants`, `@expo/metro-runtime`, `@expo/ngrok` | all | the `bloom` CLI, `Package.bloom` settings, `App.info` (version, build, platform) in `Bloom` |
| `expo-router`, `expo-linking` | all | `BloomUI` `NavigationStack`/`TabView` with typed routes; `URL` and `App.openURL`, deep links in the manifest |
| `expo-updates` | all | `Bloom.Updates` over Oxy Updates |
| `expo-splash-screen`, `expo-system-ui`, `expo-status-bar`, `expo-font`, `expo-asset` | all | manifest settings (splash, colours, fonts, assets) plus `App.statusBar`; assets as typed resources (`Resource.image("logo")`) |
| `expo-image`, `expo-image-manipulator`, `expo-image-picker`, `expo-camera` | all (camera: Mention, Allo) | `BloomUI.Image` (native cache), `ImageEditor`, `PhotoPicker`, `Camera` native modules |
| `expo-video`, `expo-audio` | all | `BloomMedia` (`VideoPlayer`, `AudioPlayer`, recording) native module |
| `expo-blur`, `expo-glass-effect`, `expo-linear-gradient`, `expo-gl` | all (gl: Mention) | `BloomUI` materials and glass (Bloom's glass engine), `LinearGradient`, `Canvas` |
| `expo-haptics`, `expo-keep-awake`, `expo-sensors` | all (sensors: Inbox) | `Bloom.Device` (`Haptics`, `Screen.keepAwake`, `Motion`) |
| `expo-file-system`, `expo-document-picker`, `expo-sharing`, `expo-share-intent`, `expo-print` | all | `Bloom.Files` (`FileStore`, `DocumentPicker`, `ShareSheet`, incoming shares, `Print`) |
| `expo-secure-store`, `expo-local-authentication`, `expo-crypto`, `@expo/app-integrity` | all | `Bloom.Security` (`SecureStore`, `Biometrics`, `Crypto`, `AppIntegrity`) |
| `expo-sqlite` | Mention, Allo | `BloomData` persistence (SQLite native module) |
| `expo-notifications` | all | `Bloom.Notifications` (permissions, tokens, local and push) |
| `expo-location`, `expo-contacts`, `expo-network` | Mention, Allo / Allo / Inbox | `Bloom.Location`, `Bloom.Contacts`, `Bloom.Network` (reachability) |
| `expo-clipboard`, `expo-web-browser` | all | `Bloom.Clipboard`, `Bloom.WebSession` (in-app browser, auth sessions) |
| `expo-symbols`, `@expo/vector-icons`, `expo-checkbox` | Allo / Mention, Inbox / Inbox | `BloomUI.Icon` (Bloom icons, SF Symbols on iOS), `Toggle(.checkbox)` |

#### Phase F, steps 1 and 2 (measured 2026-11-27)

- **`bloom build android` without Expo.** `bloom` writes and drives the Gradle project in
  `.bloom/build/android/` (`crates/bloomc/src/android/`), with no Expo prebuild, CLI, EAS or
  Expo module:
  - **Project.** Settings and the root build run over React Native's Gradle plugin, with the
    versions from React Native's own catalog.
  - **App module.** It is written from `Package.bloom`'s `app: App(id:version:build:displayName:schemes:icon:splash:splashImage:permissions:)`.
  - **Signing.** Keystores live under `~/.bloom/keystores/` (or the `BLOOM_ANDROID_KEYSTORE*`
    variables), never in the package.
  - **Libraries.** React Native core (Fabric, Hermes). The libraries come from `autolinking.json`, which `bloom`
    writes itself and which matches Expo's for the Demo, plus the Bloom native modules.
  - **Metro.** `bloom-metro.js` runs Metro over React Native's own config and Babel preset.
  - **Expo JS that remains.** expo-router stays until step 3, over shims of the small Expo
    surface it reads (`android/shims/`). Any other `expo*` request does not resolve: an
    optional `require` falls back and an import fails the build.
  - **Fallback.** `--with-expo` keeps the Expo path. `--generate` writes the project for
    Android Studio.
- **Native modules.** `extern native "Name" { … }` is a module's interface, written once. The
  compiler generates from it React Native's TurboModule spec and a lazy bridge. Gradle's codegen turns the
  spec into the Java spec class that the Kotlin module extends, so both sides are checked against
  the same interface. `.native("Name", kotlin:, swift:)` targets declare the implementations,
  and the standard library has its own `Package.bloom` declaring `.native("BloomStorage")`.
  A synchronous function without a result crosses as one returning a boolean, so a write
  blocks: TurboModules run `void` methods asynchronously.
- **`BloomStorage`.** It is in Kotlin:
  - `kv`: SQLite with compiled statements and WAL.
  - `secure`: AES-256-GCM under a key held by the Android Keystore.
  - `file`: the app's files.
  `KeyValueStore`, `SecureStore` and `FileStore` use it whenever it is linked, behind the same interface. Swift
  (SQLite and the Keychain) follows with `bloom build ios`, conforming to the protocol
  generated from the same spec.

Measured on the emulator (hangar-test-36, x86_64):

- The Demo checks passed on the release APK: tab bar taps, swipes, a `KeyValueStore` value
  surviving a relaunch, the sheet, and the `demo://post/2` deep link.
- **APK size and cold start** (release, Hermes) were measured against the Expo path's
  release APK of the same Demo.
  - Cold start is the median of 10 launches after force-stop: `am start -W` total time, and the
    time from launch to React Native running `main`.
- **Storage** was measured on debug APKs, with the same benchmark bundle served by Metro to both.
  - The stopgap is expo-sqlite, expo-secure-store and expo-file-system through `runtime.ts`.
  - Each figure is the median over 4 launches of each launch's median or p95.
  - Each launch ran a warm-up, then 1,000 `kv`, 200 `secure` and 300 `file` operations.
  - Release numbers may differ.

| | Bloom (no Expo) | Expo path |
|---|---|---|
| APK, release | **42.7 MB** (native libraries 19.6, JS 17.7, dex 4.4) | 54.2 MB (26.9, 20.8, 7.1) |
| Cold start: window / JS `main` | 256 ms / **201 ms** | 258 ms / 316 ms |
| `kv` write: median / p95 | **30 µs / 149 µs** | 1,066 µs / 2,321 µs |
| `kv` read: median / p95 | **22 µs / 49 µs** | 111 µs / 171 µs |
| `kv` first call (opens the store) | **15 ms** | 51 ms |
| `secure` write: median / p95 | **1.85 ms / 3.39 ms** | 5.31 ms / 9.45 ms |
| `secure` read: median / p95 | **0.50 ms / 1.30 ms** | 1.08 ms / 1.68 ms |
| `file` write / read (median) | **55 µs / 72 µs** | 987 µs / 571 µs |

#### Phase F, step 3: the Bloom router (measured 2026-11-27)

In a Bloom build, `NavigationStack` is Bloom's own router (`stdlib/Bloom/router.ts`, #1022),
and expo-router is gone from the build:

- **Stack.** Each route is a native screen of react-native-screens' `ScreenStack`.
- **Sheets.** `sheets:` routes are the platform's form sheet, sized to their content. Under
  expo-router on Android they were pushed screens.
- **Tabs.** `tabs:` are Bloom's swipe pager (`react-native-pager-view`) under Bloom's
  `BottomBar`, whose highlight follows the pager.
- **Back.** Android's back pops the route in front, then returns to the first tab, then
  leaves the app.
- **Deep links.** The manifest's schemes and the app's web URLs open the route their path
  names (`routeOfPath`), over the root.
- **The route table.** It is written into the entry from the app's `Routable` enum
  (`navigation::router_spec`): each case's labels and a reader that types its parameters.
  There are no file routes, and `routing.ts` names no router.
- **The Expo path.** The web and `--with-expo` keep expo-router's file routes through
  `routing-expo.ts`. Metro bundles every `require` it sees, so this split is what keeps
  expo-router out of the Bloom bundle.
- **Shims.** The shims only expo-router read are gone: `expo-linking`, `expo-constants`,
  `expo-splash-screen`, `expo/dom*`, `@expo/metro-runtime`. `KEPT` is empty. Three shims
  remain because Bloom's own components still import those packages: `expo-blur`,
  `expo-font`, and `expo` with `expo-modules-core` for the lens check. Each goes when its
  Bloom module lands.
- **Found on the way.** React Native's Gradle plugin tracked only JS and TS files in the build
  directory as the bundle's inputs. An edited `.bloom` file therefore left the release bundle
  UP-TO-DATE, and the APK shipped the old JS. The generated app module now declares the
  package's sources as inputs. The `--with-expo` project has the same gap; it is not fixed.

Measured on the emulator (hangar-test-36, x86_64), on release APKs of the same Demo built three
ways: Bloom with its router, Bloom over expo-router (#1018's compiler), and the Expo path.

- The Demo checks passed on the Bloom router's APK and on the Expo path's APK. They covered
  tab taps and swipes, a value surviving a relaunch, the sheet, and `demo://post/2` opening
  the post.
- **Cold start.** As before: the median of 10 launches after force-stop.
- **Time to content.** From the activity's start to the feed screen's `.task` running, which
  is after the feed mounted.
- **Push.** From the button's handler calling `push(Route.post(id:))` to the post screen's
  `.task`. These are 20 pushes, each followed by Android's back.

| | Bloom router | Bloom over expo-router | Expo path |
|---|---|---|---|
| APK, release | **42.0 MB** (native libraries 19.6, JS 17.0, dex 4.4) | 42.7 MB (19.6, 17.7, 4.4) | 51.4 MB (26.9, 18.0, 7.1) |
| Cold start: window / JS `main` | **239 ms** / 215 ms | 248 ms / **175 ms** | 242 ms / 286 ms |
| Time to content (median) | **377 ms** | 393 ms | 482 ms |
| Push to the pushed screen: median / p95 | **8 ms / 25 ms** | not instrumented | 15 ms / 26 ms |

Notes on the measurements:

- **JS `main` is later with the Bloom router** because the entry installs the route table
  before `AppRegistry` runs `main`. Under expo-router, that work ran inside its root, after
  `main`. Time to content is the number to compare.
- **The first version drew every tab page in the first commit.** Its time to content was
  525 ms, against 418 ms over expo-router in the same session. The router now draws the
  page in front first and the others right after.
- **Sessions.** The Bloom figures come from one emulator session, and the Expo path's from
  the next.
- **The Expo path's APK is smaller than in step 1's table** (51.4 against 54.2 MB). This build
  is the same Demo, rebuilt with this compiler.
- **Push latency.** The figure over expo-router was not measured: it needs the bench's
  logging, and #1018's compiler did not rebuild the bundle when a `.bloom` file changed
  (see above).

#### Mention's `expo*` inventory (2026-11-27)

Counted in Mention's `packages/frontend` on `feat/mention-on-language` (`ded0e84d2`):

- **Files** are the files importing the package.
- **Uses** are the uses of the names they import after the import.
- The counting script and the per-file list are under the program's artifacts
  (`native2/inventory/`).

| Package | Files | Uses | Main names | Replacement, and what it needs first |
|---|---|---|---|---|
| `expo-image` | 18 | 38 | `Image` | `BloomUI.Image`. A native view: `extern native` needs views (Fabric component codegen) first |
| `expo-router` | 12 | 34 | `Slot`, `createSeededNavigationState`, `Redirect`, `usePathname` | The Bloom router. Mention has 157 route files under `app/`, and 72 files import the language's router (`@oxy.so/bloom-language/router`). That needs the language router's `Stack`/`TabView`/`Sheet` nodes over the Bloom router, or Mention's routes as a `Routable` enum |
| `expo-video` | 17 | 25 | `VideoPlayer`, `useVideoPlayer` | `BloomMedia.VideoPlayer`. A native view and a player module |
| `expo` | 5 | 18 | `useEventListener`, `NativeModule`, `requireOptionalNativeModule` | Mention's own Expo modules (`mention-widgets`, `pip-transport`) as Bloom native modules. Their config plugin becomes `Package.bloom` settings |
| `expo-sqlite` | 4 | 13 | `SQLite` | `BloomData`'s SQLite module: `BloomStorage`'s SQLite under a SQL interface |
| `expo-constants` | 2 | 11 | `Constants` | `App.info`: build-time constants from `Package.bloom`, with no native code |
| `expo-camera` | 1 | 10 | `CameraView`, permissions | `Camera`. A native view |
| `expo-clipboard` | 5 | 8 | `Clipboard` | `Bloom.Clipboard` |
| `expo-location` | 2 | 8 | `Location` | `Bloom.Location` |
| `expo-web-browser` | 2 | 5 | `openBrowserAsync` | `Bloom.WebSession` |
| `expo-audio` | 2 | 5 | `createAudioPlayer`, `setAudioModeAsync` | `BloomMedia.AudioPlayer` |
| `expo-linear-gradient` | 2 | 3 | `LinearGradient` | `BloomUI.LinearGradient` |
| `expo-file-system` | 1 | 2 | `File` | `FileStore` (`BloomStorage`, done) |
| `expo-blur` | 1 | 2 | `BlurView` | Bloom's materials. Bloom's own components also import it |
| `expo-keep-awake` | 1 | 2 | `activateKeepAwakeAsync` | `Screen.keepAwake` |
| `expo-document-picker`, `expo-asset`, `expo-crypto`, `expo-share-intent`, `expo-notifications` | 1–3 each | 1 each | | `DocumentPicker`, typed resources, `Crypto.randomUUID`, incoming shares, `Bloom.Notifications` |

By call count, the first three are not TurboModules:

- `expo-image` and `expo-video` are native views, so `extern native` needs views first: a
  Fabric component spec from a Bloom `View` interface, with its Kotlin and Swift view classes.
  That is the next piece of this track.
- `expo-router` is Mention's route tree. The router above covers apps whose routes are a
  `Routable` enum.

The first module-shaped replacements are Mention's own Expo modules (`expo`) and `expo-sqlite`.

The iOS side of this track is designed in [`bloom build ios`](../bloom-build-ios.mdx), for the
Mac lane.

Next in this track:

1. `extern native` views, then `expo-image` and `expo-video`.
2. The language router's nodes over the Bloom router, for Mention's route tree.
3. Then the inventory above, in order.

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
| **F. Platform without Expo** (section 7; after A and B, overlapping D and E) | `bloom build` generates and drives the Gradle and Xcode projects, signing and store artifacts; Bloom native modules (Swift/Kotlin, typed TurboModule bindings); the router; Oxy Updates; every package in the inventory replaced module by module, each measured and device-verified | Mention, Allo and Inbox build and update with no `expo*` dependency |

What already merged or is in flight, and still ships, because the internals are reused: #984
(compiler 1.6.0), #979 and #980 (phase-1 internals and tooling), Mention #2046 (the proof).

## Phase D: the codemod's corpus

`bloom migrate` (embedded-language TSX to 2.0) is measured over Mention's `packages/frontend`
on `feat/mention-on-language`, tests excluded. A file counts as migrated when it meets all
three of these:

- its 2.0 text compiles with 0 errors in the migration mode (`--allow-ts-imports`, section 4)
  inside a package;
- no form 2.0 retires is left in it (B0950);
- no `// bloom: review` marker is left in it, unless the count says "with review".

The gate is **more than 80%**.

| Date | Codemod (PR) | Corpus | Migrated (+ review) |
|---|---|---|---|
| 2026-11-26 | the 0.x codemod alone, on the 2.0 stack | 324 files (fd8a4290f) | 35.5% (0.x output, not 2.0) |
| 2026-11-26 | #1007: 2.0 forms, typed tokens, SwiftUI names, effects as `.onAppear`/`.task(id:)`, `do`/`catch`, `String(localized:)`, `private` | 324 files (fd8a4290f) | 27.8% (+4.0% review) = **31.8%** |
| 2026-11-27 | #1007 on phase A + the M1–M9 compiler fixes (#1016) | 324 files (fd8a4290f) | 28.4% (+4.0% review) = 32.4% |
| 2026-11-27 | #1007: `xs.at(i)`, `x!`, narrowed reads as `x!`, `@ref` → `Ref(v)`/`ViewRef<T>()`, state-reset effects as `.onChange(of:)`, options records, React's stale reads as snapshots, JS names kept on `Foreign` | 324 files (fd8a4290f) | 29.3% (+7.7% review) = 37.0% |
| 2026-11-27 | the same, with the compiler's R2–R4 and R7 (`fix/bloom-lang-2-core2` 7b9e701f5) | 324 files (fd8a4290f) | 30.2% (+8.6% review) = 38.9% |
| 2026-11-27 | #1007: typed promises' `then`/`catch` as tasks, closures' `var` snapshots, `sort` comparators, `splice`/`unshift`, tuple arity; with the compiler's R1–R5, R7 (`fix/bloom-lang-2-core2` ea118687b) | 324 files (fd8a4290f) | 34.9% (+9.9% review) = 44.8% |
| 2026-11-27 | #1007 on main (29e83bdbd, phases A and B merged), with #1017 (R1–R7) | 324 files (fd8a4290f) | 35.5% (+10.8% review) = 46.3% (40.4% without #1017) |
| 2026-11-27 | #1007: props typed in another TS file written out as stored properties (2.0 has no `..Props`), barrels' re-exports, `then`/`catch` in place, `useMemo`/`useState` closures, `Readonly<T>`; with #1017 | 324 files (fd8a4290f) | 38.6% (+11.7% review) = 50.3% (42.9% without #1017) |
| 2026-11-27 | #1007: TS's nominal-incompatible annotations of TS call results dropped, optional strings' truthiness; with #1017 | 324 files (fd8a4290f) | 38.9% (+12.0% review) = 50.9% |
| 2026-11-27 | the same, with #1021 (on #1017: generic views, the corpus follow-ups) | 324 files (fd8a4290f) | 39.5% (+13.3% review) = 52.8% |
| 2026-11-27 | #1007 rebased on main 7742f55fe (#1017, #1019 merged); `--from 0.x` names a default export and rewrites its importers; with #1021 (1caebfbb1) | 324 files (fd8a4290f) | 39.5% (+13.3% review) = 52.8% |
| 2026-11-27 | the same, with #1026 (on #1021: none-defaulted fields optional, TS `T \| null` as `T?`, keyword field names, a `Foreign` value fits a record field) | 324 files (fd8a4290f) | 39.8% (+13.9% review) = **53.7%** |
| 2026-11-27 | #1007 on main b448b98c4 (#1021 merged): `Array.from({ length })` as a range, `xs = xs.add(x)` on a `Set` as `inserting`; with #1028 (38b9fff4f, on #1026: a TS component's trailing builder is its children, ranges, memo bytes) | 324 files (fd8a4290f) | 39.5% (+13.9% review) = **53.4%** (see below) |
| 2026-11-27 | the same, + generic arrow functions' type parameters (`T: Equatable` for `extends string \| number`) | 324 files (fd8a4290f) | 39.8% (+13.9% review) = 53.7% (KeyboardShortcutsModal won) |
| 2026-11-27 | the same, with #1033 (d9fbcfc44, on #1030 and #1028: TS lists into typed lists, `[View]` as a child, generic literals, indexed access types) | 324 files (fd8a4290f) | 41.4% (+15.1% review) = 56.5% |
| 2026-11-27 | the same, with #1035 (471ca249a, on #1033: TS values compared with numbers and strings, `a \|\| b` of optionals) | 324 files (fd8a4290f) | 42.0% (+15.4% review) = **57.4%**; 5 of the 12 render-checked files draw wrongly (below), so at most 55.9% is verified |
| 2026-11-27 | #1007: the migration mode in Jest, Metro and `bloom-lang-dts`, `xs?.[i]` on a present TS value as `xs[i]`, untyped `&&`/`\|\|` operands in a condition as `Boolean(x)`; with #1035 (9cfa4eb89: R1–R5, locale-reactive `String(localized:)`, `k_zero` for a count of 0) | 324 files (fd8a4290f) | 42.3% (+15.7% review) = **58.0%**; 11 of the 12 render-checked files draw as the TS (WelcomeScreen does not) |
| 2026-11-27 | #1007: a list's strings beside nodes (and a ternary's string branches) as `RawText`, props destructured from `props` read as fields; with #1035 (9cfa4eb89) | 324 files (fd8a4290f) | 42.3% (+16.0% review) = **58.3%** (PostCrosspostRow won); all 12 render-checked files draw as the TS |
| 2026-11-27 | #1007 round 7: bare blocks, `if let` over a state its branch writes, a `catch` beside an `error` state, type predicates as `Bool`; props a view hands on whole written out, rest props as a stored property, labelled parameters for a local function of one object; a dropped TS cast to a literal union as `as!`, `toFixed` as `formatted(fractionDigits:)`; TanStack's `useQuery` with Mention's binding module; with #1038 (14b3e6cb0, on #1035) | 324 files (fd8a4290f) | 42.3% (+17.3% review) = **59.6%** (PostItem, lists/[id], feeds/view and feeds/marketplace won) |
| 2026-11-27 | #1007 round 8: a guard the source had is never dropped (lead decision; bloomc keeps `?.`/`?[]`/`??` on a TS value, #1038 991ab35ba), a field the source guards is written `T?`; with #1038 884734dbe | 324 files (fd8a4290f) | 40.4% (+15.1% review) = 55.6%: **12 files had counted only by dropping a guard** |
| 2026-11-27 | the same, with #1038 45f0364e7 (a TS claim kept through a `let` and a view member, `{}` as a patch, wider closure parameters) and the codemod's own fallbacks dropped once narrowed | 324 files (fd8a4290f) | 42.3% (+17.3% review) = **59.6%**: all 12 back with their guards kept; each counts once a test or render passes (PostItem: 29 of 34 row tests) |
| 2026-11-28 | #1007 round 9 (a78b9b41e): inline `as const` lists as module constants and pair lists as tuples, `padStart`/`padEnd`, setters in a statement's `?:`/`&&`, exhaustive returning `switch`es, value `a && "…"`, `Boolean(x?.trim())`, `[x, onX]` bindings, `{c && xs?.map(…)}`, intersection aliases as one struct, subscript sets, record-or-string arguments split, generic components as `struct X<T>: View`, and `actions(function …)`/`menu(function …)` as `MenuActions`/`MenuContent` structs (#1046); on main 92c9f1056 + #1033..#1052 b4b73bb6e | 324 files (fd8a4290f) | 44.4% (+19.4% review) = **63.9%** (16 files won, among them PostMenu, ProfileMoreMenu, ReplySettingsMenu and AudienceMenu). PostItem passes its 34 row tests, its row cost equals the TS on every feed row kind, and it is checked on the emulator (Mention #2049) |
| 2026-11-28 | #1007 round 10 (0529d6ad3), on main 7c1f1387c + #1028..#1058 c3c4a003a. What changed:<br>• reads TS had typed (casts to `T['k']` unions, called `Record` reads, `slice(n)`, i18next defaults, narrowable member truthiness, type-guard `filter` as `compactMap`);<br>• values built by a local closure; optional closure parameters as `T?`;<br>• nested and in-place `defineModifier`s, list patterns with defaults, generic functions and views;<br>• `never` defaults; `aria-*` props; `ReadonlySet`; `Embed(<></>)`; inline intersections of object types as one record;<br>• a file-scope `private var` (#1058); `async throws` for functions that await TS | 324 files (fd8a4290f) | 45.4% (+22.8% review) = **68.2%** (21 files won, among them TopicPicker, RoomCard, ChannelInfoDialog, postMenuActions and useInfiniteCatalogSearch). PostItem and explore/trending are lost to #1057's contextual typing (repro `iife-regressions`, with lang-2-core9) |
| 2026-11-28 | #1007 round 11 (3b8517ded), on main 7c1f1387c + #1028..#1065 b65fecd3e. What changed:<br>• a private hook with an effect, used by one view, inlined (its effect `.task(id:)`); render-time ref writes and side calls as `.task(id:)`;<br>• closures typed by `const f: F`/`useCallback<F>`; record lists of varying shapes as TS's union; `ReactNode` parameters `View?`, strings there `RawText`; guarded lists optional;<br>• imported base types written out (`extends`, intersections, `Pick`/`Omit`); React components returning an element as views; JSX prop spreads field by field;<br>• FormatStyle for numbers (`toLocaleString()`, `Intl.NumberFormat`, #1065) | 324 files (fd8a4290f) | 46.9% (+25.0% review) = **71.6%** (232; 11 files won, among them PostItem and trending back, PostDetailScreen, RightBar, ProfileCommunities, jobs/[id]). An `as? HTTPError` form was reverted: its all-or-nothing `decode` is not TS's read of an Axios error (repro `http-error-shape`) |
| 2026-11-28 | #1007 round 12 (0c5e89413), on main 52a063a6a + #1066 baa3a0971. What changed:<br>• JS's `Date` is the standard library's (a JS `Date` itself, #1066): every `new Date` at once, the getters as `components()`, the calendar's `date(year:month:day:…)`, `setDate`/`setHours` where exact, and `toLocale…String`/`Intl.DateTimeFormat` as FormatStyle with ECMA-402's defaults written out (`?.formatted(…) ?? "Invalid Date"` where JS prints that);<br>• what TS's flow proved, read so bloomc narrows it (`!Array.isArray(x)` as `x == none`, tested operands, aliased tests, a TS callback's index);<br>• rest props of a local base interface; an arrow component with a hook drawn as JSX as a view | 324 files (fd8a4290f) | 48.1% (+25.6% review) = **73.8%** (239; #1066 first cost the 9 `"js"` Date files, all back, and 6 more won: EmojiPickerSheet and VideosGrid by `break`/`continue`, WeeklyRecapContent, PodcastCard, MediaGrid and feeds.tsx). Waiting on the compiler: a text run that is a view or a string (UserName), the `"js"` `Number` call, a struct passed to a TS interface |
| 2026-11-28 | #1007 round 13 (09638bf36), on main 52a063a6a + #1066 1cacbc04c. What changed:<br>• a hook function's `useState` is its hook-local `@State var` (#1066); `break`/`continue`; `T: Equatable` for `!=` on a type parameter; `f<T>()` returning `G<T>` typed `G<T>`;<br>• `{ data: xs = [] }` binds `xsOrNone` (no same-scope shadow); `--write` keeps a route's screen `<X />`, names defaults in `.bloom` importers, and mocks views in `jest.mock`;<br>• a `screen()` drawn inside the route's own wrapper (a feature gate) refused until `ViewModifier` (parity: the gated page has no header);<br>• **verification:** the round's files run against their Mention tests, and the 8 with none against a render check (Mention #2049 `__perf__/lang-proof/corpus13`) | 324 files (fd8a4290f) | measured 49.1% (+24.7% review) = **73.8%** (239; 247 before the wrapped-screen refusal). **Verified: at most 227** (70.1%): 15 of the round's files pass their tests; 12 measured files fail or are unchecked (EventEditor, postMenuActions, jobs/[id], WeeklyRecapContent, MediaGrid, VideosGrid, PodcastPickerSheet, EmojiPickerSheet, pokes, PostLocation, SuggestedUsers, MerchantInstallmentSettings), on 9 compiler repros (`repros/mention13`) sent to lang-2-core11 |
| 2026-11-28 | #1007 round 14 (f92b9d561), on main 52a063a6a + #1066 0de83e525 (lang-2-core11's three batches) and one local compiler fix (below). What changed:<br>• re-verified on core11: 8 of round 13's 12 failing or unchecked files now pass (EventEditor and postMenuActions their tests; WeeklyRecapContent, MediaGrid, VideosGrid, EmojiPickerSheet, SuggestedUsers and PostLocation the corpus13 render check, the last two with new cases);<br>• a Bloom list method on a TS value Bloom could not type (core11's B0601) types its binding (`let names: [String]`, `[Foreign]`): PostItem, PostDetailScreen and LiveRoomsWidget had drawn `enumerated is not a function`;<br>• `x \|\| undefined` is JS's falsy `none`, and `Boolean(x)` of a TS value stays its truthiness where it is a value (jobs/[id] handed React Query the id as `enabled`);<br>• `--write` names a re-exported or `lazy` default and a non-route default `screen()`; a renamed default beside a platform fork is refused (CameraPage, ProfileScreen, ProfileChromeFrame.web: their tests failed) | 324 files (fd8a4290f) | measured 49.7% (+23.5% review) = **73.1%** (237: PostHeader won; the 3 platform forks refused; 12 files depend on a local fix to core11's B0217, which flagged a narrowing as a redeclaration, `repros/mention14/narrow-guard-redeclared`). **Verified: at most 230** (71.0%): measured minus jobs/[id] (screen-group-root), PodcastPickerSheet (closure-view-to-reactelement), pokes (fragment-text-run), MerchantInstallmentSettings (record-update-arrow-body), PostHeader (element-to-view-prop), and PostDetailScreen and LiveRoomsWidget (no test or render case yet) |
| 2026-11-28 | #1007 round 15 (668c46cd7), on main 52a063a6a + #1066 66a28c5d8 and the same local compiler fix. What changed:<br>• `e instanceof Error ? e.message : fb` is `(e as? JSError)?.message ?? fb`; a TS `===` on an object holding what has no equality is Swift's `===`;<br>• a local function's `ReactNode` parameter that only goes to a TS component's prop, every call giving it text, is `String?`, so pokes draws the TS's text with no nested `Text` (render: 4 states pass);<br>• JS's `Number(s)` of a typed string is `s.trimmed().isEmpty ? 0 : (Float(s) ?? Double.nan)`, `Number.NaN` the stdlib's;<br>• found: the printer's `.task(id:) { …; defer { cleanup } }` runs React's cleanup as soon as a body that does not await returns (`repros/mention15/task-defer-runs-at-once`: 9 sites in 8 measured files) | 324 files (fd8a4290f) | measured 49.7% (+23.5% review) = **73.1%** (237, unchanged). **Verified: at most 225** (69.4%): round 14's 230, plus pokes, minus the 6 earlier-verified files the task-defer bug breaks at run time (trending, saved, CommercePickerSheet, EngagementList, TrendingTopicsInterstitial, PostArticleModal); LiveRoomsWidget and PostDetailScreen (new render cases) and the round-14 failures stay out |
| 2026-11-28 | #1007 round 15, second part (432f6c919), on main 52a063a6a + #1066 6c64fe36f (core12's B0217 fix; the local fix dropped). What changed:<br>• an effect whose `.task` cleanup would run as soon as its body returns is refused until the stdlib's `Task.cancellation` (the lead's decision: 9 files, SourcesSheet among them);<br>• TS `unknown` is `JSONValue`, a `typeof x === "object"` with `null` ruled out `x.object != none || x.array != none`;<br>• JS regexes are the stdlib `Regex` (no measured file imports JS's `RegExp`) | 324 files (fd8a4290f) | measured 48.8% (+21.9% review) = **70.7%** (229: AddToStarterPackSheet and hide-counts won, the 9 refused). **Verified: at most 221** (68.2%): measured minus jobs/[id], PodcastPickerSheet, MerchantInstallmentSettings, PostHeader (core12's repros), CommunityNoteCard and PostAttachmentExternalEmbed (their tests fail, also on the earlier codemod), and AddToStarterPackSheet and hide-counts (unchecked) |
| 2026-11-28 | #1007 round 16 (6cbe22737), on #1081 d7c2aab9e (core12/13) and 2 local compiler fixes that change no measured status (`std-loads-ui-runtime`, `memo-dep-method-name`). What changed:<br>• an effect with a cleanup is a `.task(id:)` ending in `await Task.cancellation`, a debounce `try? await sleep(for:)`: the 9 refused files are back, each checked by a test or render case that exercises its cleanup (6 pass);<br>• a string's JS `length`/`slice`/`padStart` read its `utf16` view (strings count characters now);<br>• `--write` names a `require(…).default`, rewrites a typed `jest.requireActual`, and redraws a barrel's views;<br>• jobs/[id]/apply is lost to a compiler regression (`narrowed-state-assign`). | 324 files (fd8a4290f) | **73.1%** measured (237/324); verified **at most 232** (71.6%), 230 without the local memo fix. Not verified: trending (harness), PostDetailScreen and SourcesSheet (render diffs), AddToStarterPackSheet, hide-counts |
| 2026-11-28 | #1007 round 16, step 2 (6d70922ef), the same stack and 4 local fixes (+ `imported-view-modifier`, `branch-chrome-modifiers`). What changed:<br>• a route that draws its `screen()` inside a gate is that screen with `.modifier(Gate())` on its root; the two gates are hand-ported `ViewModifier`s whose held states are `.ownScreen()` (the TS drew them with no screen);<br>• a wrapper that draws a state before its screen is a file-local `ViewModifier` (CheckoutPlayground);<br>• `x.slice(-n)` is `x.suffix(n)`, a string's on its `utf16` view. | 324 files (fd8a4290f) | **75.3%** measured (244/324); verified **at most 235** (72.5%). Not verified: trending (harness), PostDetailScreen, SourcesSheet and feeds (one state each, compiler repros), feeds/marketplace, lists/create, communities/[id]/bans (no case yet), AddToStarterPackSheet, hide-counts |
| 2026-11-28 | #1007 round 16, triage (3a8f8a549), the same stack and local fixes. What changed:<br>• render cases for the gated routes and CheckoutPlayground's held state; JS regex literals as `try! Regex("…")` with String's methods;<br>• B0205/B0201 triaged by root cause: compiler causes sent to core14 (`ts-generic-closure-param-hole`, `ts-union-alias-narrowing`, `string-contains-regex`, `runtime-node-types`); codemod causes fixed: keyed literals as dictionaries, a thrown value read as its `jsValue`, `ok && asyncFn()` as `if`, node types as `View`, padded record ternaries, lazily imported views wrapped. | 324 files (fd8a4290f) | **76.9%** measured (249/324); verified **at most 241** (74.4%) |

The rate counts a file the compiler accepts, so a miscompile can hide in it. One was found on
2026-11-27: a TS function component drawn with a trailing builder was called as a plain function,
and its builder's nodes were dropped (Mention's PostActions drew an empty bar). #1028 fixes it.
Its re-check of every migrated and review file (an emit diff) found 13 files that had been
counted while drawing wrongly: 9 had dropped nodes and 4 ran a component as a plain call.

PostActions was render-checked first (Mention #2049, PostActionsShape 4/4). The other 12 were
render-checked on 2026-11-27 in Mention's harness (`__perf__/lang-proof/corpus/`, Mention #2049).
Each file is drawn as TS and as its printed 2.0 text, with the same props and stand-ins, and
the host trees are compared (every view, its props with styles flattened, its text) over 24
states. On #1033's stack, 7 files matched and 5 were miscompiled. The compiler fixed those
(repros R1–R5 in `~/.local/share/bloom-lang/repros/mention5/`, #1035):

| Result on #1035 9cfa4eb89 | Files |
|---|---|
| Same tree in every state (24 of 24 states) | PostPodcastAttachment, RoomsListSkeleton, WriteNoteSheet, ExperienceEmployerField, NotificationSkeleton, LiveRoomsWidget, WhoToFollowWidget, Error, ProfileSkeleton, SuggestedProfileCard, VideoReplies, WelcomeScreen |

WelcomeScreen's undefined element was neither the codemod nor the compiler. The language draws
`.textStyle(.title)` with `@oxy.so/bloom/typography`'s `Title`, which Mention's Jest stand-in did
not export, so its TS form failed too. The stand-in now has `Title` and `Subtitle`.

The fixed emits were: a TS `view()` mounted as a component (R1), a conditional node, or a node
for a Bloom component's `ReactNode` prop, not converted to an element (R2, R3), a `Screen` outside
`app/` that lost its named export (R4), and a memo component with a comparator called as a view
(R5, which R1's first fix caused).

Two conditions apply to every result above:

- **Catalogs.** `bloom migrate` writes i18next's `t("k")` as `String(localized: "k")`, which
  reads the package's `Resources/Localizable` catalogs. Mention has none (its strings are
  i18next's `locales/*.json`), so without them every migrated file that had `t()` draws its keys.
  Mention now generates them from `locales/` (`scripts/bloom-catalogs.ts`: keys flattened,
  `{{x}}` as `{x}`, `k_one`/`k_other` as plural forms), and `lib/i18n.ts` registers every
  catalog i18next loads with Bloom's runtime and follows its language (Mention #2049). A test
  checks that every key of all 15 locales draws as i18next draws it, plurals included.
- **Migration mode.** The printed text compiles only inside a package (outside one a file is 0.x),
  and inside one its TS imports need the migration mode in Jest and Metro (`allowTsImports`,
  #1007).

Most refusals come from bloomc's errors on the draft. On 2026-11-26 that was 133 of 221
refused files, and the largest single cause was an indexed array read typing as `T?` where
Swift's is `T` (repro M1, since fixed). The second round of repros (R1–R7, in
`~/.local/share/bloom-lang/repros/mention2.md`) is led by these:

- the standard library's BloomData `Action`, which shadows BloomUI's `Action` node (R1, blocking
  PostItem);
- TS optional parameters (R2);
- nested conditionals (R3);
- `.id` (R4);
- `Foreign` from TS inference (R7).

The rest is a long tail of codemod gaps, with at most 10 files per reason. PR #1007's handoff
keeps the list.
