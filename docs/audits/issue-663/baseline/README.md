# Issue 663 — consumer browser observations

Observed 2026-11-08. These are development browser baselines of unmodified consumer source with synthetic local data, not production screenshots or completed adoption. Browser requests outside Metro are fulfilled from explicit fixtures or aborted; no production writes. Native execution is not covered here. Distributed binary versions remain unknown.

## Mention

Source `f64e2e9105844c0692649b30b07c20e235c3b398`; installed published Bloom `17.19.3`. See [report](mention/report.json) for timestamps, routes, measured regions and checks, and its eleven adjacent viewport PNG files. Chromium, light, en-US, DPR 1. Anonymous account with 40 synthetic variable-height posts; the sign-in callout is part of this state.

The same mounted shell survived widths 1440 → 1024 → 768 → 390 → 320 → 1440. Document width equalled each viewport in normal feed. Keyboard navigation to a post and browser return restored scrollY 1488 and the anchor post. Deck intentionally had horizontal width 1852 with three configured 390-wide columns plus the current main panel. Detail/back worked; resizing Deck to tablet redirected to the normal route. No browser errors or unexpected external fixture requests were recorded. This does not verify authenticated actions, realtime data, dark theme, touch devices, or release performance.

Reproduce after starting the app's normal Metro web server on 8127 with its public API origins:

```sh
MENTION_ROOT=/absolute/path/to/clean/Mention CHROME_PATH=/path/to/chrome node scripts/capture-mention-baseline.mjs
```

The worktree used here is `Mention/.worktrees/issue-663-baseline`; no source mirror was installed. Per-frame viewport, URL, scroll, region bounds, padding, radii and overflow remain in the report; raster captures are full viewport before any crop.

## Nilo — concrete dev transformer failure

See [browser failure](nilo/report.json), [screenshot](nilo/failure.png), and [minimal transformer report](nilo/transformer/report.json). The database route fails while constructing TanStack QueriesObserver, before a usable database baseline. The synthetic fixture does not establish page/document or empty/populated acceptance. `capture-nilo-baseline.mjs` remains a diagnostic harness and requires completion after the shared tooling repair.

Installed app-preset 6.5.0 enables Expo's experimental Noxcturnal transform in development by default; production uses Babel. Expo metro-config 58.0.21 with Noxcturnal 0.1.11 lowers a derived class containing private methods and `#result` into code where the constructor return temporary `var _result` shadows the outer private-field key `_result`. Access during the constructor consequently throws `attempted to use private field on non-instance`. The source runs successfully. The minimal reproduction invokes the installed Expo full transformer with the same web development profile, without ReactCompiler, API data or React. Inline helpers make the generated file self-contained; the app's runtime-helper variant exhibits the same collision. Resolved package realpaths and versions are recorded; no node_modules package was patched.

```sh
NILO_ROOT=/absolute/path/to/clean/Nilo node scripts/reproduce-nilo-transformer.mjs
```

Correction belongs to the shared app-preset default/experimental opt-in policy and upstream transform, preserving explicit opt-in. Do not add consumer layout workarounds. Baselines must be rerun after that repair and the normal published dependency update.

## Concrete comparison references

Downloaded 2026-11-08 from official Notion documentation. These establish the comparison regions; natural image pixels are not CSS pixels because the original viewport/DPR is unknown. They are reference imagery, not evidence of Nilo parity.

- [Views, filters and sorts](https://www.notion.com/help/views-filters-and-sorts): [database views reference](references/database-views.png), [database tabs reference](references/database-tabs.png). Compare title region, single tabs/tools/New band, table edge and content density.
- [Layouts](https://www.notion.com/help/layouts): [database page layout reference](references/database-page-layout.png). Compare title/properties/content hierarchy and details panel.

Exact asset URLs and SHA-256 for every raster are in [artifact manifest](artifacts.json). No Nilo comparison measurements are claimed before usable app rendering.
