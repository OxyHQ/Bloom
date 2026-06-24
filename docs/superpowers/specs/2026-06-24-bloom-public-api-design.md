# Bloom Pro — Phase 1: Public API consistency (design)

**Date:** 2026-06-24
**Status:** Approved design, pending spec review
**Scope:** Phase 1 of the "Bloom Pro" professionalization roadmap (6 phases). This
spec covers ONLY the public module/export surface and the "easy root import that
performs" machinery. Internal folder reorg (Phase 2), tokens (Phase 3), a11y/tests
(Phase 4) and docs/release (Phase 5) are out of scope here.

---

## 1. Context & problem

`@oxyhq/bloom` is a single React Native + Web component library consumed across the
whole Oxy ecosystem (Mention, Allo, Homiio, and the Oxy apps: accounts, console,
inbox, auth, os…). It exposes ~58 subpath entries plus a root barrel (`src/index.ts`),
with a generator script (`scripts/generate-platform-exports.mjs`) keeping the
`exports` map and the web barrel (`src/index.web.ts`) in lockstep.

The public surface is **inconsistent**, which is the first thing an adopter notices:

- The root barrel mixes two export styles for similar things:
  - `Card` is **flat**: `import { Card, CardHeader, CardBody } from '@oxyhq/bloom'`.
  - `Tabs` is a **namespace**: `Tabs.TabsBar`, `Tabs.Tab` — redundant and ugly.
  - `Accordion` exports flat parts inside its folder but the root barrel **re-wraps**
    it as `export * as Accordion`, so consumers write `Accordion.AccordionItem`
    (double layer).
- So three structurally-similar compound components (Card / Tabs / Accordion) are
  used three different ways.
- Namespace exports (`export * as X`) tree-shake worse (you can't drop individual
  parts) and give weaker TypeScript auto-import suggestions.

## 2. Goals

1. **One install, everything available, easy but pro.** The headline, officially-taught
   import is the simple root import:
   ```tsx
   import { Button, Dialog, Tabs, TabsTrigger } from '@oxyhq/bloom'
   ```
   …and it must NOT cost extra bundle size, especially on React Native / Metro (whose
   tree-shaking is weak/unreliable).
2. **One consistent rule** for how compound components are exposed.
3. **Subpaths stay** as the power-user / guaranteed-tree-shaking path
   (`@oxyhq/bloom/button`).
4. **Clean cut, no shims** (per AGENTS.md and the 0.16.x precedent): remove the old
   namespace exports outright, document in `MIGRATION.md`, and migrate every consuming
   app in the same rollout.

## 3. Non-goals (deferred to later phases)

- Renaming/normalizing **prop names** across components (`open`/`visible`,
  `value`/`onChange`) → Phase 0 "rulebook" / Phase 4.
- Moving source folders into categories (`primitives/forms/overlays/…`) → Phase 2.
- Docs site, CHANGELOG automation → Phase 5.

---

## 4. Decision A — package model

**Single package `@oxyhq/bloom`** (NOT a multi-package split à la Radix/MUI-icons).
This matches the user's mental model ("install one thing, get everything", like
`@mui/material`) and means **zero import migration for the package boundary** — the
ecosystem already consumes `@oxyhq/bloom`.

Both import forms are first-class:

| Form | Example | Audience |
|------|---------|----------|
| Root barrel (easy, official) | `import { Button } from '@oxyhq/bloom'` | everyone |
| Subpath (pro, max tree-shaking) | `import { Button } from '@oxyhq/bloom/button'` | power users / perf-critical |

## 5. Decision B — compound component convention: **flat with prefix**

Compound widgets export each part as a top-level prefixed name (shadcn / MUI / Radix
style), NOT as a namespace object:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@oxyhq/bloom'
<Tabs><TabsList><TabsTrigger/></TabsList><TabsContent/></Tabs>
```

### Exception — collections & generic/colliding names stay namespaced

Flat is NOT applied blindly. A family **stays a namespace** when it is a *collection*
or its parts have *generic names that would collide* at the top level (e.g. `Text`
collides with React Native's `Text`; `Row`/`Col` are too generic):

| Stays namespace | Why |
|-----------------|-----|
| `Icons` (155) | collection — 155 top-level names would pollute everything |
| `Typography` | parts are `Text` (collides with RN `Text`), `Span`, `H1…H6`, `P` |
| `Skeleton` | parts are `Text` (collides), `Box`, `Circle`, `Pill`, `Row`, `Col` |
| `Grid` | parts are `Row`, `Col` — too generic, collide |
| `Code` | small collection; `Code.Pre` reads better than top-level `Pre` |
| `Fonts` | utility namespace (`fontFamilies`, `applyFontFaces`, `FontLoader`) |

**The rule, stated once:** *Expose a family flat-with-prefix unless it is a collection
or its part names are generic enough to collide — then keep it a namespace.*

## 6. Decision table — every namespaced family

Current root-barrel namespaces and their fate:

| Family | Today | Decision | New top-level names |
|--------|-------|----------|---------------------|
| `Icons` | `export * as Icons` | **keep namespace** | `Icons.*` (unchanged) |
| `Typography` | `export * as Typography` | **keep namespace** | `Typography.*` (unchanged) |
| `Skeleton` | `export * as Skeleton` | **keep namespace** | `Skeleton.*` (unchanged) |
| `Grid` | `export * as Grid` | **keep namespace** | `Grid.*` (unchanged) |
| `Code` | `export * as Code` | **keep namespace** | `Code.*` (unchanged) |
| `Fonts` | `export * as Fonts` | **keep namespace** | `Fonts.*` (unchanged) |
| `Tabs` | `export * as Tabs` | **→ flat** | see §7 |
| `Accordion` | `export * as Accordion` | **→ flat** (un-wrap) | `Accordion, AccordionItem, AccordionTrigger, AccordionContent` |
| `Select` | `export * as Select` | **→ flat** | see §7 |
| `Menu` | `export * as Menu` | **→ flat** | see §7 |
| `ContextMenu` | `export * as ContextMenu` | **→ flat** | see §7 |
| `Popover` | `export * as Popover` | **→ flat** | see §7 |
| `Tooltip` | `export * as Tooltip` | **→ flat** | see §7 |
| `SegmentedControl` | `export * as SegmentedControl` | **→ flat** | see §7 |
| `TextField` | `export * as TextField` | **→ flat** | see §7 |
| `PromptInput` | `export * as PromptInput` | **→ flat** (un-wrap; already prefixed) | `PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAttachments, PromptInputSubmitButton` |
| `Admonition` | `export * as Admonition` | **→ flat** | see §7 |

Already-flat families (`Button`, `Card`, `Badge`, `Chip`, `Checkbox`, `Dialog`,
`AlertDialog`, `Command`, `Switch`, `Avatar`, `AvatarGroup`, `SettingsList`,
`Divider`, `Collapsible`, `Slider`, `Combobox`, `Field`, `Label`, `InputGroup`,
`SearchInput`, `Item`, `Kbd`, `BottomSheet`, `Fab`, `GroupedButtons`, `Toast`,
`Loading`, `Portal`, `ErrorBoundary`, `Fill`, `IconCircle`, `UserHoverCard`,
`RadioIndicator`) — already follow the convention; only audited for prefix
consistency, no breaking change.

## 7. Rename / vocabulary table (flat conversions)

Each family adopts a documented part vocabulary. Where current names are already
clear they are kept; generic part names get the family prefix.

**Tabs** (`src/tabs`):
| Current | New |
|---------|-----|
| `TabsBar` | `Tabs` |
| `Tab` | `TabsTrigger` |
| `TabPanel` | `TabsContent` |

**Select** (`src/select`):
| Current | New |
|---------|-----|
| `Root` | `Select` |
| `Trigger` | `SelectTrigger` |
| `ValueText` | `SelectValue` |
| `Icon` | `SelectIcon` |
| `Content` | `SelectContent` |
| `Item` | `SelectItem` |
| `ItemText` | `SelectItemText` |
| `ItemIndicator` | `SelectItemIndicator` |
| `Separator` | `SelectSeparator` |
| `useItemContext` | `useSelectItemContext` |

**Menu** (`src/menu`):
| Current | New |
|---------|-----|
| `Root` | `Menu` |
| `Trigger` | `MenuTrigger` |
| `Outer` | `MenuContent` |
| `Item` | `MenuItem` |
| `ItemText` | `MenuItemText` |
| `ItemIcon` | `MenuItemIcon` |
| `Group` | `MenuGroup` |
| `Divider` | `MenuDivider` |
| `useMenuControl` / `useMenuContext` / `MenuControlProps` | kept (already prefixed) |

**ContextMenu** (`src/context-menu`): same shape as Menu →
`ContextMenu, ContextMenuTrigger, ContextMenuContent` (from `Outer`),
`ContextMenuItem, ContextMenuItemText, ContextMenuItemIcon, ContextMenuGroup,
ContextMenuDivider`.

**Popover** (`src/popover`):
| Current | New |
|---------|-----|
| `Root` | `Popover` |
| `Trigger` | `PopoverTrigger` |
| `Content` | `PopoverContent` |
| `usePopoverControl` / `usePopoverContext` | kept |

**Tooltip** (`src/tooltip`):
| Current | New |
|---------|-----|
| `Outer` | `Tooltip` |
| `Target` | `TooltipTrigger` |
| `Content` | `TooltipContent` |
| `TextBubble` | `TooltipTextBubble` |
| `SheetCompatProvider` | kept (provider; prefix → `TooltipSheetCompatProvider`) |

**SegmentedControl** (`src/segmented-control`):
| Current | New |
|---------|-----|
| `Root` | `SegmentedControl` |
| `Item` | `SegmentedControlItem` |
| `ItemText` | `SegmentedControlItemText` |

**TextField** (`src/text-field`):
| Current | New |
|---------|-----|
| `Root` | `TextField` |
| `Input` | `TextFieldInput` |
| `LabelText` | `TextFieldLabel` |
| `Icon` | `TextFieldIcon` |
| `SuffixText` | `TextFieldSuffix` |
| `GhostText` | `TextFieldGhost` |
| `useSharedInputStyles` | kept |

**Admonition** (`src/admonition`):
| Current | New |
|---------|-----|
| `Admonition` | `Admonition` |
| `Outer` | `AdmonitionRoot` |
| `Icon` | `AdmonitionIcon` |
| `Content` | `AdmonitionContent` |
| `Text` | `AdmonitionText` |
| `Button` | `AdmonitionButton` |
| `Row` | `AdmonitionRow` |

**Accordion / PromptInput**: no part renames — only remove the root-barrel namespace
wrapper so the already-prefixed parts become top-level.

> The exact final vocabulary per family is confirmed when writing the implementation
> plan; this table is the proposed default. The folder-internal source remains the
> source of truth; the root barrel re-exports the renamed flat names.

## 8. Decision C — easy root import that performs (no bundle penalty)

Three pieces make `import { Button } from '@oxyhq/bloom'` cost the same as the subpath
import:

1. **`sideEffects` audit (correctness gate).** `package.json` already declares
   `"sideEffects": false`. Verify it is *true in practice*: no module does work at
   import time (no global registration, no top-level side-effecting calls). If any
   module has real side effects, either refactor it to be pure or list that specific
   file in a `sideEffects` array. A dishonest `sideEffects:false` ships subtle bugs;
   an honest one lets every bundler drop unused exports safely.
2. **Clean, re-export-only barrel.** `src/index.ts` and `src/index.web.ts` contain
   ONLY `export … from './x'` lines (no logic, no instantiation), so a bundler can
   statically analyze and drop unused branches.
3. **Babel transform for the weak bundlers (Metro/RN).** Ship and document a Babel
   plugin config that rewrites a root named import into the matching subpath import at
   build time:
   ```
   import { Button } from '@oxyhq/bloom'  →  import { Button } from '@oxyhq/bloom/button'
   ```
   This is the MUI approach (`babel-plugin-import`-style). It requires a **name → subpath
   map**, which we already have as the single source of truth in
   `scripts/generate-platform-exports.mjs`. The script will additionally emit this map
   (a generated `name→subpath` table) so the transform never drifts from the real
   export surface. Namespaced families (`Icons`, `Typography`, …) map their namespace
   name to their subpath; flat families map each part name to the family subpath.

   The transform is **optional, documented opt-in** — never magic-by-default. The
   baseline guarantee for every consumer is pieces 1+2 (honest `sideEffects` + clean
   barrel) plus the always-available subpaths. Strong web bundlers (Vite/webpack)
   already tree-shake the clean barrel with nothing extra. Expo/RN apps (whose Metro
   tree-shaking is weak) opt into the transform via documented Babel config to get the
   same result. It is a standard, widely-used optimization (MUI/Ant/lodash ship the
   same kind), not a hack or workaround — and it is delivered as documented config,
   not as a forced dependency.

## 9. `exports` map & generator changes

- Every component keeps exactly one subpath entry; conditions (`react-native` /
  `browser` / `import` / `require` + their `types`) stay consistent and generated.
- The generator (`scripts/generate-platform-exports.mjs`) is extended to ALSO emit the
  `name → subpath` map consumed by the Babel transform, from the same `SUBPATHS`
  source of truth. Generated output stays committed for reviewable diffs.
- No subpath is removed in this phase (the `responsive-sheet`/`centered-dialog`
  removals already happened in 0.16.x). Subpaths for the converted families keep their
  paths (`@oxyhq/bloom/tabs`, `/select`, …); only their *exported names* change.

## 10. Versioning, migration & downstream rollout

- **Breaking → minor-major per the repo's convention** (0.x line; this is a breaking
  public-API change, treat as a notable bump, e.g. `0.17.0`). Decided at publish time
  via the `publish` skill.
- **`MIGRATION.md`** gets a new "0.x — Public API: namespace → flat" section with a
  full before/after table (namespace call-site → flat call-site) generated from §6/§7.
- **No deprecated aliases.** Old namespaces are removed in the same release.
- **Downstream migration in the same rollout** (Fix-Upstream workflow): after Bloom
  builds + tests green and is published, spawn per-app agents (mention-frontend,
  allo, homiio, oxy-frontend, oxy-services, …) to:
  1. bump `@oxyhq/bloom`,
  2. codemod `Tabs.TabsBar` → `Tabs`, `Menu.Item` → `MenuItem`, etc. (mechanical,
     driven by the §6/§7 mapping),
  3. run each app's `typescript` + build,
  4. push via test-build → git-ops.

## 11. Testing & verification

- **Bloom:** `bun run typescript` (zero errors), `bun run test` (Jest), `bun run build`
  (bob) all green. Add/extend a barrel test that asserts the root export set matches the
  expected flat names and that no `export * as` namespace remains except the six allowed
  collections.
- **Tree-shaking proof:** a tiny fixture app importing a single component from the root
  barrel, bundled, asserting unrelated components are absent from output (guards the
  `sideEffects` + transform contract). At minimum, document the manual check; automate
  if cheap.
- **Downstream:** each migrated app's own `typescript` + build is the acceptance gate.

## 12. Risks

- **Blast radius:** every app using a namespaced family breaks at once. Mitigated by
  the mechanical codemod map and same-rollout app migration. Nothing ships half-migrated.
- **Babel transform correctness:** a wrong name→subpath entry routes an import to the
  wrong file. Mitigated by generating the map from the same source as `exports`.
- **`sideEffects:false` already false-positive somewhere:** if a module relied on
  import-time side effects, dropping it changes behavior. The audit in §8.1 must find
  these before the transform is recommended.

## 13. Resolved decisions

1. **Vocabulary (§7): adopt the Radix/shadcn standard as written.** `TabsBar`→`Tabs`,
   `Tab`→`TabsTrigger`, `TabPanel`→`TabsContent`; the popup surface is `*Content`
   (not `*List` — `List` implies `<ul>` semantics, `Content` is the standard term for
   the floating surface). This is the most widely-recognized vocabulary, which is the
   professional default.
2. **Babel transform ships in this phase, as documented opt-in (not default).** The
   namespace→flat change plus the honest-barrel + subpath baseline (§8.1, §8.2) is the
   non-optional core. The transform (§8.3) is included and documented in the same phase
   but is opt-in per consumer — nothing is hidden or magic-by-default. No tricky
   indirection: it is a standard, well-known build optimization, applied explicitly.
