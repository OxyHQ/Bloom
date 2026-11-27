# Changelog

## 1.8.0

### Compatibility

- A `.bloom` module with an `@Observable` model needs `@oxy.so/bloom-language` 2.1.0 or newer, which has `Observable` and `useObserved`.

### Breaking

- The standard library's BloomData `Action` is now `Mutation` (`Mutation.make(name, optimistic:) { … }`, `run(input)`), so BloomUI's `Action` node in an `ActionBar` is no longer shadowed. The standard library's `HTTPError` gains `response` and `static func cast(_:)`, which also reads an Axios error.

### Added

- Bloom 2.0's surface (ADR 0002, phase A): views written as Swift writes them, `switch`, `guard`, `throw`, `try` and `do`/`catch`, typed errors, `@Observable` models whose views subscribe only to the fields they read (decided at compile time), protocols and extensions with static dispatch, constrained generics and `any P`, `@Binding` reads and writes, and `x!` (a trap on `none` in a dev build).
- The Bloom toolchain: directory modules and `Package.bloom`, `extern` binding modules generated from a `.d.ts` (`bloom bind`), `test("…") { #expect(…) }` on the test runtime, and the `bloom` command line (`new`, `check`, `fmt`, `build`/`run` for web and Android, `test`, `add`, `bind`; `bloomc` is its alias). `bloom new` pins the Bloom, language and compiler versions this release ships with. `bloom check` caches each file on the interfaces of the files it reads.
- The standard library (phase B), implicit in every package file: Core (`String`, `Array`, `Dictionary`, `Set`, `Optional`, `Result`, `Error`), `URL`, `Time`, localized strings checked against the catalogs, BloomData as `@Model`, `@Query`, `Source`, `Action` and `Realtime`, `async let` and actors, and `Ref<T>`.
- Bloom 2.0, from the Mention corpus: an unannotated TS hook's result is read from its body, and `ReturnType<typeof useX>` resolves through it (for a `.bloom` hook too); a TS optional parameter takes `T?`; a conditional ending in `none` is the optional of its branches, at any depth and as a list item; `.id()` works on every node; a TS type named through re-exports is its declaration, so a callback alias types a closure's parameters; `catch let e as T` tests the error and `e as? T` casts it, through `T`'s `static func cast`; TS object types fit structurally; a record indexed by a union of its keys is the type of those fields; react-i18next's `t` gives a `String`; and a Bloom view where TS takes a React element is emitted as `toElement(view)`.

### Changed

- An array's subscript `xs[i]` is a `T`, as in Swift: a dev build traps out of range (`RangeError` naming the index and the count), a release build reads it as is; `xs.at(i)`, `first` and `last` are the optional reads. A dictionary's `d[k]` stays `V?`.
- The Mention corpus' compiler gaps (M1–M9): platform files (`X.native.bloom`, `X.web.bloom`) are one module's alternatives, imported by their base name; a class of another file is imported with its `init`; a reference is a class in `@State`, and a host view's instance a `ViewRef<T>()`.

### Fixed

- The WASI `bloomc` (the fallback on a platform with no prebuilt one) starts in the working directory again, and on Windows, where Node's WASI cannot list a directory, `check` and `fmt` are handed the `.bloom` files under one.
- A route added within a clock tick of the last read is seen: the route table is read again for a folder modified within 2 seconds of the read, as git treats a racily clean file.
- `BLOOM_LINK` installs a linked checkout as it packs (its `pack:local` script when it has one, else `bun pm pack`), never as a copy of the directory. bun copied all of a `file:` directory, the checkout's examples and their `.bloom/build/` included, each holding the last linked copy, so every build nested one level deeper until the tree was too deep to delete. A pack that would carry a `.bloom` build is refused, and a rebuilt checkout is installed again on the next build (the tarball is named by its content), with no `.installed` stamp to delete.
- A native release bundle builds again with `withBloomLanguage`. 1.7.0 wrapped each Metro cache store with `Object.create(store)`, and Expo's `BinaryFileStore` keeps its state in private fields, so Metro's reset before a release bundle (`clear()` on the wrapper) threw "Cannot write private member #prepare to an object whose class did not declare it". The wrapper now hands every call (`get`, `set`, `clear`) to the store itself. The web export, which resets no cache, was not affected. (Mention's Android release bundle on 1.7.0.)

## 1.7.0

### Compatibility

- A `.bloom` module needs `@oxy.so/bloom-language` 2.0.0 or newer: bloomc imports each view's constructor from its family's entry. A TypeScript chain compiles against the language 1.x and 2.x alike: a view's constructor is read from the root or from any family's entry.

### Added

- `bloomc`, the `.bloom` command line (`build`, `check`, `fmt`), ships in each platform package as `bloomc.<platform>`; `npx bloomc` runs this platform's, and the `bloom-lang-check` bin checks a project's `.bloom` files.
- `.bloom`, phase 1 of ADR 0001 (`docs/bloom-lang-spec.mdx`): record literals and inline record types, string-literal unions with exhaustive `match`, key paths, structural `==`, optional calls and rest spreads, an `effect { … }` member, an `equal(old, new) { … }` member (`view()`'s comparator), props spreads, `Map` and `Set`, `@ref`, `Int` widening to `Float`, typed routes from the app's `app/` tree, `catching { … }`, and TypeScript interop with class components, `memo`, `lazy` and react-native's values.
- bloomc checks a node's arguments against its constructor's signature (the spec's `signatures`): the count, string, number and boolean arguments, and bindings.

### Changed

- A view's constructor imported from a family's entry (`import { Rating } from '@oxy.so/bloom-language/rating'`) is a language view, as one from the root is; the entries are generated from the language (`entries.generated.rs`).
- bloomc imports each view's constructor from its entry (`@oxy.so/bloom-language/inputs` for a `TextField`), from the generated table (`entries::module_of`).
- The chain rules (glass, toolbars, icon-only controls, untagged choices…) are one module that the TypeScript pass and bloomc share; bloomc checks its own tree with it instead of printing TypeScript and parsing it again. The TypeScript diagnostics are unchanged.

## 1.6.0

### Added

- `.bloom` modules: Bloom's own language (ADR 0001, spec draft 0.1), with structs, enums, `T?`, `Result`, exhaustive `match`, generics, closures, `async`/`await`, `task {}`, `defer {}`, views, screens and `@state`, compiled to typed TypeScript on `@oxy.so/bloom-language`. Each view gets its own memo cache, and structs, enums, `T?` and `Result` cost nothing at runtime. TypeScript imports are read through their declarations, resolved from the project root, and a value the compiler cannot type is `Foreign`. Source maps lead back to the `.bloom` file.
- The Metro worker and the Jest transformer compile `.bloom` modules, and `withBloomLanguage` adds `bloom` to Metro's `sourceExts`. A throw in a `.bloom` handler is reported at its `.bloom` line.
- The Node addon has `compileBloom`, `checkBloom` and `formatBloom` beside `compile`.
- The `bloom-lang-dts` bin writes `Name.d.bloom.ts` beside each `.bloom` file, so TypeScript can import `./Name.bloom` (with `allowArbitraryExtensions`).

### Changed

- Checks chains against the spec on `main`, which adds a screen's `.ownScreen()` and `.provider(Component, props)` (#972). The language release that draws them comes next: the language 1.7.0 has neither, and its types refuse them.

## 1.5.0

### Changed

- An offset's axis takes points computed at render (`.offset({ y: nudge })`) and rejects a number written out with the token to write, as a frame's lengths do; the frame length `'auto'` and the stacking level `'1000'` are tokens.
- A dynamic `toElement(chain)` whose chain is host views alone, modified only by what reads nothing (the spec's `reads`) and taking no handler or ref, stays a `toElement` call: the runtime draws it as those views, with no boundary for a `LanguageRoot` to build it in. A chain with an `.onLayout()` or a `.ref()` is still built by the boundary, so the React Compiler reads them as a JSX prop.

## 1.4.0

### Changed

- Checks chains against the language 1.6.0 spec: the new modifiers, tokens and roles are accepted (among them `.textShadow()`, `.accessibilityElement()`, `.focusable()`, `.collapsable()`, `.sticky()`, `.cursor()`, Dialog's `.control()`, `.detached()` and `.panelFrame()`, the inputs' `.inputMode()`, `.inputRef()` and `.onSelectionChange()`, and an app colour's `.opacity()`), padding takes points computed at render, and a variant under a settled condition takes what the chain takes except the spec's `variants.held.except`, so `when('native', (v) => v.accessibilityHidden())` compiles.

## 1.3.0

### Changed

- Checks chains against the language 1.5.0 spec: the CRM, music and media, and creator nodes, and the modifiers and tokens only they took, are refused, and a screen's `.replacesBottomBar()` is accepted.

## 1.2.0

### Changed

- Checks chains against the language 1.4.0 spec: `VirtualList`'s `.itemLayout()` and `.headerFitsContent()` are accepted, and the logistics nodes and modifiers the language 1.2.0 removed are refused.

## 1.1.0

### Added

- Checks the new language's chains (its modifiers, tokens and objects, a menu section's choices) against the spec, each diagnostic linked to its docs.
- A number written out where a token goes is refused with its token as the fix; a geometry parameter (a frame, a pinned edge, a stacking order) takes points computed at render.

### Performance

- Lowers `toElement(chain)` and a `view()` body's returned chain to a root that builds them, so the React Compiler no longer bails on the component; checked against `babel-plugin-react-compiler`.

## 1.0.0

First release. The build-time optimiser for `@oxy.so/bloom-language`: a Rust pass (Oxc, through a Node addon) in front of Metro's and Jest's own transformers. It is an optimisation; the runtime interprets every chain, and the pass changes only what it proves keeps its meaning.

### Added

- Hoists static chains to module scope, including the static prefix of a dynamic chain; names resolve through scope analysis.
- Adds `"use memo"` to every function passed to `view()`.
- Checks every chain against the language spec (unknown modifiers, wrong argument counts, literal tokens outside their set) and fails the build with the source line and a suggestion.
- `withBloomLanguage(config)` from `@oxy.so/bloom-language-compiler/metro`, a Jest transformer (`/jest`) and `compile` (`/compile`).
- Prebuilt addons, so installing it needs no Rust: `@oxy.so/bloom-language-compiler-linux-x64-gnu`, `-linux-arm64-gnu`, `-darwin-x64`, `-darwin-arm64` and `-win32-x64-msvc`, as optional dependencies, and the WASI build `@oxy.so/bloom-language-compiler-wasm32-wasi` for any other platform (a musl Linux, for one), which npm installs only when asked.
