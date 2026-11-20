# Bloom language compiler: study and proof of concept

Status: spike, 2026-11-20. Branch `spike/bloom-language-compiler`, from `origin/main` at `b4cb97cdc`.
Nothing here is published or wired into an app.

## Recommendation in one paragraph

Write the compiler as one Rust core on Oxc's parser, AST and code generator, built as a Node addon
with napi-rs. Run it as a **pre-pass in front of each host's own transformer**, not as a plugin
inside one. On Metro (Expo native and Expo web), that means a `transformerPath` wrapper around
Expo's transform worker. On Jest, it means a transformer around `babel-jest`, and on Vite/Rolldown a
`transform` hook. Web CSS extraction would be a PostCSS plugin. The pass reads the source text and
returns code and a source map, so every adapter is about 30 lines of JS around the same binary.
Placing it in front keeps the app's Babel config at Expo's default. That keeps Expo's native
transformer (Noxcturnal) and the React Compiler running, and the React Compiler sees the compiled
module. An SWC Wasm plugin targets a host Oxy does not use, and its ABI churns. Oxc has no plugin
API, but it is a good library. A Babel plugin would send every file back to Babel. Plain Babel is
the fallback, not the plan.

## 1. Where the compiler plugs in

### What Oxy apps run today (local evidence)

- **Native and web are both Metro.** Mention's `packages/frontend` (on `origin/main`) builds web with
  `expo export --platform web` and serves it with `expo start --web`. There is no Vite config.
  `metro.config.js` is `createOxyMetroConfig` from `@oxy.so/app-preset` 6.7.3, which wraps Expo's
  `getDefaultConfig` and NativeWind.
- Across `~/Oxy`, every product app (Alia, Allo, Homiio, Mercaria, Peable, Syra and others) has a
  `metro.config.js` plus `app.config`. Vite appears only on web-only surfaces: tnp `apps/web`, oxy
  `packages/auth`, Astro dashboards, the website, and Bloom's own Storybook (`@storybook/react-vite`).
- **Jest** uses `jest-expo` 58 (`babel-jest`) in Mention. Bloom uses `jest` 30 with
  `babel-jest` 30.5.2.
- **Versions in the lockfiles:** Expo SDK 58 (`expo` 58.0.23), React Native 0.88.1, Metro 0.87.1,
  `@expo/metro-config` 58.0.21, `@babel/core` 7.29.7, React 19.3, and `babel-plugin-react-compiler`
  `19.1.0-rc.1-rc-af1b7da-20250421`. That last one is an RC, not the 1.0.0 stable line.
  Mention sets `experiments.reactCompiler: true`.
- **Expo has a native transformer.** SDK 58 ships **Noxcturnal** (`noxcturnal` 0.1.11, from
  `github.com/expo/noxcturnal`), "a native-backed JavaScript transformation library" with "a typed,
  Babel-like visitor API in TypeScript" and Rust parsing, traversal and source maps. It is opt-in
  (`experiments.noxcturnalTransformWorker`) and runs Expo's own plugins and a native React Compiler
  phase. Its README says the API "may change before the first stable release".
  - In `@expo/metro-config/build/transform-worker/noxcturnal/noxcturnal-transformer.js`,
    `getEarlyFallbackReason` sends a file back to Babel on `custom-babel-transformer` or
    `non-default-babel-config`.
  - `@oxy.so/app-preset/babel` documents the consequence: "one extra plugin or preset option sends
    every file back to Babel". Its Metro factory says the same for a custom Babel transformer.
  - Production web builds stay on Babel regardless ("Noxcturnal keeps the requires of dead platform
    branches").
  - Expo exposes no plugin slot for app code.

That last point decides the integration. A Bloom compiler that is a Babel plugin, or a custom
`babelTransformerPath`, turns Noxcturnal off for the whole app. A pre-pass in front of Expo's
worker does not: it changes the module's text and nothing else.

### The options

Versions were checked on npm and crates.io on 2026-11-20, with a 7-day quarantine; "usable" means
the newest version at least 7 days old.

| Option | Current state | Serves Metro / Expo web / Jest / Vite? | Verdict |
|---|---|---|---|
| **SWC Wasm plugin** | `@swc/core` 1.16.22. `swc_core` 85.0.0 came out today; 84.0.3 is usable, and the major moved 84.0.1 → 85.0.0 in 15 days. Since `@swc/core` 1.15 the plugin AST travels as CBOR and is only "to some extent" compatible across hosts (field changes still break). `@swc/jest` 0.2.39 exists. | Metro and Expo do not run SWC. The only route is community `@react-native-swc/core` 0.2.0, which replaces Metro's worker and runs no Babel plugins (no React Compiler, no worklets). | No. Wrong host for Oxy, and the plugin ABI couples us to the host's `swc_core`. |
| **Oxc** | `oxc` crates 0.158.0 usable (0.159.0 too new); `oxc-transform`/`oxc-parser` npm 0.158.0. The transformer has no plugin API. `oxc_traverse` is public; JS plugins exist only in oxlint (alpha). Rolldown/Vite 8 run on it. A React Compiler port runs in `oxc-transform-react` (experimental). | As a transformer plugin: none. As a library linked into our own binary: everything, because the binary is ours. | **Yes, as the library.** The spike uses `oxc_parser`, `oxc_ast`, `oxc_ast_visit` and `oxc_codegen` (with source maps). |
| **Rust core via napi** | `napi` 3.16.2 (3.16.1 used), `napi-derive` 3.7.1 (3.7.0 used), `@napi-rs/cli` 3.10.12. napi-rs builds `wasm32-wasip1(-threads)` fallbacks loaded through `@napi-rs/wasm-runtime`. | Yes, through a thin JS adapter per host. The adapter is the integration, so it can sit in front of the host's transformer instead of inside it. | **Yes: this is the delivery.** Do not make the adapter a Babel plugin; see below. |
| **Babel plugin calling the Rust core** | | Metro (via Babel), Jest, and Vite with the Babel plugin. | No. It makes the Babel config non-default (Noxcturnal off app-wide). The plugin sees Babel's AST, so the core would print code, cross napi, and be parsed again. |
| **Plain Babel in JS** | `@babel/core` 8.1.2 is usable (Babel 8 shipped 2026-06-16; apps are on 7.29). | Everywhere Babel runs. | Fallback only. 1.48 ms per module against 19 µs for the Rust pass (measured below), Noxcturnal off, and tied to Babel's AST. |

**One Rust implementation serves all three hosts**, plus Vite:

```
source.tsx ──► bloom compiler (Rust, napi) ──► code + map ──► host transformer (unchanged)
                     ▲                                             │
   Metro worker wrapper (native + Expo web)  ── Expo's worker ─────┤ Babel or Noxcturnal,
   Jest transformer wrapper                  ── babel-jest ────────┤ React Compiler,
   Vite/Rolldown plugin (web-only surfaces)  ── Oxc/esbuild ───────┘ JSX, TS, worklets
   PostCSS plugin (web CSS extraction, same core over the sources)
```

The pass is skipped for any file whose text does not contain `@oxy.so/bloom-language`, so the
native call happens only for language modules.

**The compiler is an optimisation, never a requirement.** The runtime interprets every chain. The
compiler folds only what it can prove, and leaves everything else untouched for the runtime. An
app that turns the pass off, a host without an adapter (Bloom's Vite Storybook today), and Jest
without the wrapper all stay correct.

## 2. What compiling outputs

### Folding rules (all implemented in the spike)

1. **A static chain becomes a hoisted element.** When every modifier argument is a literal token
   and every child is static, the module gets a `const _bloomTreeN = jsx(…)` and the call site
   returns it. React sees the same element object on every render and skips the subtree.
2. **Styles are hoisted and shared.** Each node's resolved style is a module-level object,
   de-duplicated across the file (`_bloomStyleN`). Lengths and type fold to numbers.
3. **Runtime values stay as the original AST nodes.** A dynamic child (`post.text`,
   `post.pinned && …`) is moved into the compiled element unchanged, and nested chains inside it
   are compiled too. Conditional children keep their array position, so structural identity is
   stable (the SwiftUI lesson below).
4. **A runtime token becomes a table lookup, not runtime resolution.** Values are always tokens,
   and a token set is closed, so `.spacing(gap)` compiles to `[_bloomStyle0, _bloomTable_spacing[gap]]`.
   The table holds the precomputed style for every token. On web it would hold the class names for
   every token, so the CSS is still complete at build time. This is the "minimal runtime call": one
   property read.
5. **Order is kept honest.** A table applies after the static style. A fixed-token modifier that
   follows a runtime one writing the same property (`.weight(w).font('body')`) is a compile error
   with the fix ("move .font() before .weight()"), not a silent reorder.
6. **Anything else falls back.** A spread argument or a runtime colour (in the spike) leaves that
   chain to the runtime. Its children are still folded, and its own prefix is never folded on its
   own: that was a bug the spike hit and fixed (`HStack(…).padding('md')` folded, then
   `.spacing(gap)` called on an element).
7. **Colours are never values.** On native, a colour becomes a role map (`{ color: 'foreground' }`)
   that a theme-aware host resolves. On web, it becomes a class whose rule is
   `color: var(--foreground)`. See section 3.

### Web output: atomic CSS with theme variables

The web emitter writes react-native-web `$$css` style objects (property → class) plus rules:

```js
const _bloomStyle1 = { $$css: true, fontSize: "bjsw0f2", lineHeight: "b4ayu9p", fontWeight: "boy7q1x", color: "bxpevj5" };
/* .bjsw0f2{font-size:15px} .b4ayu9p{line-height:22px} .boy7q1x{font-weight:400} .bxpevj5{color:var(--foreground)} */
```

react-native-web merges `$$css` entries per property through styleq, which comes from the same
lineage as StyleX, so later modifiers win per property as they do on native. Class names are FNV-1a
hashes of the declaration, so they are stable across files and builds.

How the CSS reaches the page is not built. The right shape is a **PostCSS plugin** that runs the same
core over the app's sources and emits the rules into the app's `global.css` pipeline. That is
StyleX's and Tailwind's pattern, and Oxy apps already run PostCSS for NativeWind. An open problem
is cascade order against react-native-web's own atomic classes (both are single-class
specificity), which needs a layer or an ordering rule; see "Risks".

### Prior art: what to copy, what to avoid

- **Tamagui's optimizing compiler.**
  - Copy: partial evaluation with a clean bail-out to runtime, flattening to host `View`/`Text` on
    native, atomic CSS plus theme variables on web.
  - Avoid: evaluating user modules at build time to find values (a sandboxed `require`; slow and
    fragile). Bloom chains need no evaluation because arguments are literal tokens or runtime
    values, never computed config. Also avoid a compiler whose output differs semantically from the
    runtime.
- **StyleX** (`@stylexjs/babel-plugin` 0.19.2; Rust port `@stylexswc/rs-compiler` 0.20.0).
  - Copy: deterministic hashed atomic classes, `defineVars` as CSS variables for themes, compile-time
    errors for non-static styles, and CSS collection outside the JS bundle (its PostCSS plugin).
  - Avoid: a bundler-specific plugin for CSS collection in each bundler.
- **react-strict-dom** (0.0.55). Same authoring for web and native. It extracts CSS on web with
  StyleX, while its Babel preset "should not be used for native builds", so native resolves at
  runtime.
  - Copy: one authoring model with a resolver per platform.
  - Learn: Meta did not compile native styles. The native win here is real but smaller (measured
    below), and it must not fork semantics.
- **Compiled / Linaria / wyw-in-js.**
  - Copy: zero-runtime extraction on web.
  - Avoid: build-time module evaluation (wyw evaluates code to get values) and web-only designs.
- **React Compiler.** A complement, not a competitor. It memoizes what our compiler cannot fold
  (runtime values). It treats our hoisted constants as module globals and spends no cache slots on
  them; measured, `PostRow`'s cache keys are exactly `post.author.name`, `post.pinned`, `post.text`
  and the table lookup.
  - Copy nothing; cooperate. Do not reimplement memoization.
- **Jetpack Compose compiler.**
  - Copy the idea that the compiler knows stability: static content is skipped and only changed
    inputs recompute. Strong skipping has been on by default since Kotlin 2.0.20.
  - Lesson in what to avoid: Compose's compiler is version-locked to Kotlin, the same coupling SWC
    plugins have. Shipping our own binary avoids it.
- **SwiftUI.** No build-time style extraction. Views are value types diffed by structural identity,
  with modifiers as wrappers and an environment that carries `.font`/`.foregroundStyle` down.
  - Copy: stable structural positions (conditionals keep a slot), modifier order as layering (the
    runtime already does this with "layers"), and the environment.
  - Avoid: assuming the build can see the environment across view boundaries; it cannot (section 6).

### How it works alongside the React Compiler

Measured in `e2e/` (Expo `export:embed`, Android, React Compiler on):

1. **Ordering is solved by placement.** React's docs say the React Compiler must run first *in the
   Babel pipeline*. Our pass is not in the Babel pipeline; it runs before Babel or Noxcturnal ever
   see the file, so the React Compiler sees compiled output, as it should.
2. **Components must opt in, because Expo runs the React Compiler in `infer` mode.** Infer mode finds
   components by JSX syntax or hook calls. A body that returns chains has neither, and neither does
   compiled output (`jsx()` calls). Checked with Bloom's installed `babel-plugin-react-compiler`:

   | Body | React Compiler |
   |---|---|
   | `function PostRow(post) { return HStack(Text(post.text)…) }` | not compiled |
   | `view(function PostRow(post) { … })` | not compiled |
   | the same with `'use memo'` | memoized |
   | a body with JSX | memoized |

   So the compiler inserts `"use memo"` into components that hold a compiled element with runtime
   values. Components are function declarations with a capitalised name, `const Upper = () => …`,
   and arrows passed to `view(…)`; an expression-bodied arrow becomes a block body. Plain helper
   functions are left alone: a memo cache in a non-component would break the rules of hooks.

   With the directive, `PostRow` compiles to a `c(5)` cache on Babel, and to `c(6)` with a
   source-hash reset on Noxcturnal in development.

   **This contradicts the runtime's current doc comment** (`packages/bloom-language/src/view.ts`:
   "Name the body function … and the React Compiler compiles it"). Naming alone does not do it.
3. **Static trees need no memoization at all.** `Hello()` compiles to `return _bloomTree0;`, so the
   React Compiler has nothing to do.

## 3. Theme switching with compiled styles

Bloom's colours are runtime values. There are presets × light/dark, custom seeds through the
colour engine (`build-theme-from-seed`), explicit secondary/tertiary accents, and increased
contrast. They cannot all be precomputed, so **compiled output carries colour role names, never
colours, on every platform.** Lengths, radii and type are theme-invariant and fold to numbers.

- **Web: zero React renders.** Compiled classes say `var(--foreground)`, which is already Bloom's
  canonical contract: base tokens are written as full `rgb(…)` values on the document, the same
  variables NativeWind/Tailwind use. A preset or light/dark switch rewrites the variables and the
  browser repaints. No component renders.
- **Native: only the coloured leaves update.** Compiled elements reference small theme-aware hosts
  (`BloomText`, `BloomView` in `runtime/compiled.mjs`). Each subscribes to the palette with
  `useSyncExternalStore` and pairs its hoisted role map with that palette's style object, which is
  built once per palette and kept in a WeakMap. The hoisted element stays valid because the leaf, not
  its parent, reads the theme. Measured with 100 rows under one root:

  | Theme switch, 100 compiled rows | Count |
  |---|---|
  | app root renders | 0 |
  | row component renders | 0 |
  | text hosts updated to the new colour | 100 |

- **Compared with the runtime as written today.** Every `view()` host calls `useThemePaint()`, so a
  theme switch re-runs every view body. The styles come from a per-palette cache, so nothing is
  recomputed, but every body re-runs and every tree is rebuilt. Compiled output moves that to the
  leaves.
- **The native renderers later.** When iOS draws through SwiftUI and Android/OxyOS through native
  views and the glass engine, the role names go to native, and native resolves them (dynamic
  colours, theme attributes). A switch then costs no JS at all. The compiled output does not change;
  only the host that reads the role map does.
- **Production binding.** The spike keeps its palette in `runtime/compiled.mjs`. In Bloom, that
  palette is the one Bloom's theme already resolves (`getResolvedTokens` / `useThemePaint`), not a
  second store.

## 4. Debuggability

- **Source maps (implemented, verified).** The compiler emits a map: every generated node points
  at the chain that produced it, and runtime values keep their own positions. The Metro adapter
  composes it into the map Metro's worker produces, handling both of Metro 0.87's forms (segment
  tuples and VLQ). Probes against the minified Android release bundle and its map:

  | Bundle snippet | Maps to |
  |---|---|
  | hoisted HStack style `padding:12` | `fixtures/hello.tsx:4:10` (the `HStack(` of the chain) |
  | hoisted Text element `children:"x"` | `fixtures/hello.tsx:4:10` |
  | runtime value `author.name` in the compiled tree | `fixtures/post-row.tsx:8:12` (its own position) |
  | runtime-token table `gap:8` | `fixtures/post-row.tsx:6:10` (the chain) |

  Three gaps remain:
  - Oxc's code generator writes a shared original position once, so a hoisted style's later lines
    carry no mapping. The composer uses the nearest preceding mapping, which is the same position.
  - Generated identifiers get the chain's source text as their map name. The composer keeps
    Metro's names only; the production fix is to write those mappings without names.
  - Metro's `functionMap` for a compiled module is dropped, not remapped.
- **Errors (implemented, verified through Metro).** A wrong token or modifier fails the build with
  a rustc-style frame and a suggestion. Metro prints it as is (`e2e/wrong-token.js`):

  ```
   ERROR  ../fixtures/wrong-token.tsx: error[bloom]: Unknown spacing token 'mdd' for .padding()
   --> ../fixtures/wrong-token.tsx:4:49
    |
  4 |   return HStack(Text('x').font('body')).padding('mdd');
    |                                                 ^^^^^
    = help: did you mean 'md'? spacing tokens: none, xs, sm, md, lg, xl
  ```

  An unknown modifier lists the component's modifiers (`Text has no modifier .fnt()`, "did you
  mean 'font'?"). The thrown error carries `lineNumber`/`column`. TypeScript's token types (the
  runtime's) catch most of these in the editor first; the compiler is the backstop for JS files,
  casts and generated code.
- **Hot reload.** The development bundle keeps `$RefreshReg$(_c2, "PostRow")`. Hoisted constants
  are module-scoped, so a Fast Refresh of the module rebuilds them. On Noxcturnal, the React
  Compiler adds its source-hash cache reset. The Metro adapter's cache key includes the addon's
  digest, so a compiler change invalidates cached transforms. **Not verified**: a live edit on a
  device. Also missing: the token-table digest in the cache key, since a token change must
  recompile every language module.
- **A switch to compare.** Because the runtime is complete, an environment switch that disables
  the pass (planned, not built) gives the interpreted tree for side-by-side debugging.

## 5. Proof of concept

### What is in this package

| Path | What |
|---|---|
| `crates/compiler/` | The Rust core: chain recognition and folding (`chain.rs`), token tables (`tokens.rs`), the native and web emitters (`emit.rs`), diagnostics, and the Oxc pipeline (`lib.rs`). It parses once, replaces chains with emitted JS parsed back into the same arena (spans retargeted to the chain, runtime values moved in as the original nodes), and generates code and a map. 9 tests. |
| `crates/node/` | The napi binding: `compile(source, filename, platform)`. |
| `js/` | Adapters: `compile.js` (fast skip and errors), `metro-transformer.js` + `metro.js` (`withBloomLanguage(config)`), `remap.js` (map composition). |
| `runtime/compiled.mjs` | The theme-aware native hosts that compiled output renders through. |
| `bench/` | A reference interpreter (the runtime's job without a compiler) and the benchmark. |
| `e2e/` | A minimal Expo app: `metro.config.js` is `withBloomLanguage(getDefaultConfig(__dirname))`, `verify.mjs` checks the bundle's map, `wrong-token.js` shows the error. |
| `test/adapter.test.cjs` | Adapter tests (`node --test`). |
| `scripts/` | `build-addon.sh`, and `audit-crate-ages.py` (quarantine audit for Cargo.lock). |

### Before and after

The source (`fixtures/hello.tsx`):

```ts
import { HStack, Text } from '@oxy.so/bloom-language';

export function Hello() {
  return HStack(Text('x').font('body')).padding('md');
}
```

The compiled native module:

```js
import { HStack, Text } from "@oxy.so/bloom-language";
import { jsx as _bloomJsx, jsxs as _bloomJsxs } from "react/jsx-runtime";
import { View as _BloomView } from "react-native";
import { BloomText as _BloomText } from "@oxy.so/bloom-language/compiled";
const _bloomStyle0 = { flexDirection: "row", alignItems: "center", padding: 12 };
const _bloomStyle1 = { fontSize: 15, lineHeight: 22, fontWeight: "400" };
const _bloomColors0 = { color: "foreground" };
const _bloomTree0 = _bloomJsx(_BloomView, {
	style: _bloomStyle0,
	children: _bloomJsx(_BloomText, { style: _bloomStyle1, colors: _bloomColors0, children: "x" })
});
export function Hello() {
	return _bloomTree0;
}
```

The same module in the minified Android release bundle. The minifier inlined the single-use
styles, and TypeScript's import elision removed the now-unused language import:

```js
e.Hello=function(){return l};var o=r(d[0]),t=r(d[1]),n=r(d[2]),l=(0,o.jsx)(t.View,{style:{flexDirection:"row",alignItems:"center",padding:12},children:(0,o.jsx)(n.BloomText,{style:{fontSize:15,lineHeight:22,fontWeight:"400"},colors:{color:"foreground"},children:"x"})})
```

A dynamic component (`fixtures/post-row.tsx`) after the compiler, the React Compiler and the
minifier:

```js
e.PostRow=function(y){var j,w=(0,t.c)(5),{post:_,gap:v}=y,z=c[v];w[0]!==_.author.name||w[1]!==_.pinned||w[2]!==_.text||w[3]!==z?(j=(0,n.jsx)(o.View,{style:[s,z],children:(0,n.jsxs)(o.View,{style:p,children:[(0,n.jsx)(l.BloomText,{style:x,colors:h,children:_.author.name}),(0,n.jsx)(l.BloomText,{style:f,colors:h,children:_.text}),_.pinned&&u]})}),…):j=w[4];return j}
… s={flexDirection:"row",alignItems:"center",padding:12},c={none:{gap:0},xs:{gap:4},sm:{gap:8},md:{gap:12},lg:{gap:16},xl:{gap:20}}, … u=(0,n.jsx)(l.BloomText,{…children:"Pinned"})
```

### End to end through Metro (Expo `export:embed`, the command Gradle runs for a release)

- **Android release bundle** (`--dev false`, React Compiler on): 493 modules, about 6 s. It contains
  the precomputed tree above.
- **Hermes:** `hermesc -emit-binary -O` compiles the bundle to 1,287,641 bytes of bytecode (HBC
  magic `c6 1f bc 03`), with only the usual undeclared-global warnings.
- **Source map:** the probes in section 4 map back to the right lines.
- **Noxcturnal on** (development, `BLOOM_E2E_NOXCTURNAL=1`): Expo's event log shows
  `transform:noxcturnal:full` with `status: complete` for both compiled fixtures, and no
  `non-default-babel-config` fallback. The React Compiler (Noxcturnal's native phase) memoizes
  `PostRow`.

### Runtime cost of the tree, interpreted against compiled

Run with `node bench/run.mjs`: Node 24.21.0, x64, Intel i9-14900K, `react` 19.3.0 with
`react-test-renderer` on host components, medians of repeated batches. Two runs agree within 3%.

| `NODE_ENV=production` (what release builds run) | Interpreted | Compiled | Ratio |
|---|---|---|---|
| Element production, static text (`Text('x')`) | 153 ns | 2.2 ns (hoisted tree) | about 70× |
| Element production, runtime label (`Text(label)`) | 136 ns | 15 ns | about 9× |
| React update of the parent, static text | 1.44 µs | 0.62 µs | 2.3× |
| React update of the parent, runtime label | 1.23 µs | 0.95 µs | 1.3× |

| `NODE_ENV=development` | Interpreted | Compiled |
|---|---|---|
| Element production, static text | 1,257 ns | 2.1 ns |
| Element production, runtime label | 1,265 ns | 1,021 ns |

In development, `jsx()`'s owner-stack capture dominates, so a compiled dynamic tree saves little.
Judge the gain on production numbers.

| Build cost per module (`post-row.tsx`) | |
|---|---|
| Bloom compiler, Rust through napi | 19 µs |
| Babel with `babel-preset-expo`, for scale | 1,480 µs |

The pass adds about 1.3% to a Babel transform of the same module.

**What these numbers prove and what they do not:**
- A static tree costs nothing per render once compiled, and React skips it on update.
- A dynamic tree still saves about 9× of the element work, and about a quarter of an update.
- The interpreter is the spike's own reference (`bench/interpreter.mjs`), lighter than the real
  runtime, which also resolves layers, the environment and keyed caches. The real gap in element
  production is probably larger, but that is not measured.
- Hermes has no JIT, so property-heavy interpretation likely costs relatively more there than on
  V8. No Hermes VM is available on this machine (only `hermesc`), so that is not measured either.
- Native paint is untouched by both: both hand React Native the same host tree.

### Reproduce

```bash
cd packages/bloom-language-compiler
cargo test -p bloom_language_compiler          # 9 tests
./scripts/build-addon.sh                       # release addon → bloom-language-compiler.node
node --test test/adapter.test.cjs              # 4 tests
NODE_ENV=production node bench/run.mjs
cd e2e && ../../../node_modules/.bin/expo export:embed --platform android --dev false \
  --entry-file index.js --bundle-output dist/index.android.bundle \
  --sourcemap-output dist/index.android.bundle.map --assets-dest dist/assets --reset-cache
node verify.mjs dist/index.android.bundle
cargo run --example compile -- fixtures/hello.tsx web    # see the web output and CSS
```

Requires `bun install` in the worktree. The addon, `target/` and `e2e/dist/` are gitignored.

## 6. Aligning with the runtime (`packages/bloom-language`)

The runtime appeared during this spike, uncommitted, in `.worktrees/language`. The spike's IR is
provisional and lines up with it as follows:

- **Node format.** The runtime's `Node` is `{ kind, props, children, modifiers }`, and each modifier
  carries a precomputed cache `key` (`p:all:md`). The compiler folds the same chains; it should key
  any runtime fallback tables on the same modifier keys.
- **Layers.** The runtime turns modifier order into nested views ("a padding after a background
  starts a new view"). The compiler must produce the same host tree, so the layer rules cannot be
  written twice by hand.
- **Environment.** `foreground`, `font`, `weight` and `leading` inherit down the tree through an
  interned `Env`. Within one static chain the compiler can resolve them. At a `view()` boundary the
  environment arrives at runtime, so a leaf text there compiles to a lookup keyed by the env key: a
  per-theme, per-env cached style. The spike ignores inheritance.
- **`view()`.** Bodies run in a memoized `ViewHost`. For compiled bodies, `renderBody` must accept a
  React element (or the compiler wraps it in the runtime's `Embed`). Its doc comment about the React
  Compiler needs correcting (section 2).
- **App tokens.** `defineTokens(…)` lets apps declare token scales. The compiler can fold those only
  when the call is a literal object it can read at build time; otherwise it falls back.

**Parity is the gate.** Render every fixture both interpreted and compiled, per platform, and
compare the host trees (types, props, styles after per-palette resolution). Any difference fails
CI. The token tables and modifier rules both implementations use should be generated from one
spec, just as `tokens.json` already feeds the Tailwind preset.

## 7. Risks

1. **Two resolvers drift.** The runtime (TS) and the compiler (Rust) must agree on tokens, layers
   and the environment. Mitigations: one generated spec, the parity gate above, and the fallback
   rule ("fold only what is proven").
2. **Expo and Metro internals.** The wrapper depends on Expo's worker exports (`transform`,
   `getCacheKey`), on Metro's map forms (tuples or VLQ, which changed by 0.87), and on
   `transformerPath` staying a supported option. A Metro or Expo upgrade can break it, so an
   app-preset gate should bundle a fixture on every upgrade.
3. **Noxcturnal is experimental** (0.1.x, "API may change"), and its fallback rules are Expo's to
   change. The pre-pass is independent of it, which is the point, but its benefit to dev speed
   depends on Expo.
4. **Oxc churn.** 0.x minors are weekly and break APIs: the spike hit `JSStr::as_str() -> Option`
   and `ParserReturn.diagnostics`. Oxc 0.158 also needs rustc 1.97, a recent MSRV jump. Pin exact
   versions and upgrade deliberately. Because we ship our own binary, there is no ABI coupling to a
   host (the SWC plugin problem).
5. **Reprinting.** The module is regenerated by Oxc's code generator. That covers only modules
   importing the language, and comments are kept, but a pragma comment Oxc drops would be lost. The
   alternative is splicing with a magic-string-style edit list.
6. **Folding limits.** The environment across `view()` boundaries, runtime colours, spreads, and
   app tokens that are not statically readable all fall back. That is correct, but the speed-up then
   depends on how apps write views.
7. **Web CSS.** Cascade order against react-native-web's own classes, and getting CSS into static
   exports and SSR (Expo static rendering), are both unbuilt.
8. **Distribution.**
   - Prebuilt napi binaries per platform (darwin-arm64/x64, linux gnu/musl, win32) must come from
     CI, never a laptop, plus a WASI fallback (threadless WASI cannot spawn).
   - Bloom CI would need a Rust toolchain.
   - Cargo has no stable minimum-release-age (`--publish-time` is unstable), so the 114 locked
     crates are checked by `scripts/audit-crate-ages.py`. Five crates were too new and were pinned
     back: `ctor` 1.0.13, `oxc_index` 5.0.0, `pin-project-lite` 0.2.17, `smallvec` 1.16.5, and
     `link-section` (dropped with `ctor`).
9. **Unmeasured.** Hermes runtime cost, a device, Fast Refresh on a live edit, web end to end, and
   Jest. Clippy did not run: it is not installed for the stable toolchain here, and the older
   toolchains that have it are below Oxc's MSRV.

## 8. Needs the owner's decision

1. **The pipeline.** A pre-pass in front of each host's transformer: a Metro `transformerPath`
   wrapper, a Jest wrapper and a Vite plugin, shipped as `withBloomLanguage` in `@oxy.so/app-preset`.
   The alternatives are asking Expo for an app plugin slot in Noxcturnal, or accepting Babel-only.
2. **The contract "the compiler is an optimisation".** The runtime stays complete, and the
   compiler may only fold what it proves, enforced by a parity gate in CI.
3. **One source of truth for language semantics.** Either generate the TS runtime's and the Rust
   compiler's tables from one spec (recommended), or make Rust the only resolver and run it in the
   runtime too (Wasm). That would be heavier on device, so it is not recommended.
4. **Native theming.** Compiled leaves subscribe to the palette (switch = leaf updates only), as
   opposed to the runtime's per-view `useThemePaint` (switch = every view body re-runs). Later, role
   names would resolve in the native renderers.
5. **The compiler inserting `"use memo"`** into language components, and correcting the runtime's
   doc comment. Separately: apps lock `babel-plugin-react-compiler` 19.1.0-rc.1, not 1.0.0.
6. **Web CSS delivery** through a PostCSS plugin, and the cascade rule against react-native-web.
7. **Packaging.** The package's name and place. As a workspace package it changes `bun.lock`; this
   spike deliberately has no `package.json`. It also needs a Rust toolchain in Bloom CI and a binary
   release flow.
8. **Runtime colours.** Either role-map tables (the same table trick as lengths) or a runtime
   fallback, which is the spike's choice.
