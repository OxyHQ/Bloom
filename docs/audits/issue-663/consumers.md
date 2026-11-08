---
title: Consumer composition baseline
description: Source and installed-package evidence for issue 663; runtime acceptance remains separate.
---

# Consumer composition baseline

This P0 baseline supports [issue 663](https://github.com/OxyHQ/Bloom/issues/663).
It does not establish visual fidelity, route coverage, current deployment or
native compatibility. No consumer was modified or locally mirrored for this audit.

## Reproduce the census

From a Bloom worktree, run:

```sh
node scripts/audit-bloom-consumers.mjs /path/to/Oxy --fetch --output=docs/audits/issue-663/consumer-census.json
```

The [snapshot](./consumer-census.json) records the exact default-branch SHA,
fetch result (before dependency discovery), checkout SHA/dirty count, every discovered direct dependency
manifest, text-lock locators and independently resolved installed package for
that workspace. Source comes from git objects, not dirty files. Installed
versions come from the local filesystem and may therefore differ from that
source SHA. Catalog declarations are recorded separately. Lock locator sets
are evidence of packages in the lock, not a claim about a workspace's selected
resolution. Binary locks remain explicitly unresolved. Distributed binary
versions are unknown until a running build is identified.

Historical manifests under `docs/audits` are excluded from package candidates;
lock records retain their paths so archived locks cannot be mistaken for root locks.
Discovery covers immediate local git repositories, including SDK/re-export
packages. Nested, remote-only and non-literal dependencies require a separate
pass. A dependency, import, repository name or recent commit does not establish
product activity or adoption. `ownershipCandidates` are review entry points,
not a completed route matrix. The generated snapshot preserves failed fetches
and skipped repositories rather than silently declaring them current.

The 2026-11-08 snapshot contains 30 repository candidates and 74 direct
dependency manifests after excluding historical audit manifests. Fetch succeeded
for 29 candidates; `oxy` timed out and retains an explicit stale-ref warning.
Non-consumers also retain their inspected SHA and fetch status. The upstream
Expo, React Native and react-native-screens dependency checkouts are explicitly
excluded by their canonical remote, rather than treated as product apps. `Astro` and `Astro-legacy` point at the same source SHA and
must not be counted as two active products without further classification.
BloomAiIcons has source mentions but no direct Bloom dependency; its project
exclusion still needs to be applied during adoption classification.

## Pilot source ownership

Paths below are relative to each repository; use its snapshot SHA to read them
with `git show <sha>:<path>`. These are inspected source responsibilities, not
runtime passes. Every row still requires web, iOS and Android evidence for its
applicable platforms, route states and exact deployed artifact.

| App / route or pattern | Inspected owners | Required next verification |
| --- | --- | --- |
| Mention / normal feed, detail, Deck | `packages/frontend/app/(app)/_layout.tsx` renders AppShell and descriptor `panelLayout`: split/deck, separated appearance, bounded flow for Deck/native and document flow for normal web; sidebar and panel IDs remain in the existing shell | Capture approved main baseline, resize the same mounted feed/detail/Deck tree, check scroll return and panel identity; no flattening of approved framing |
| Nilo / document | `apps/app/components/shell/nilo-shell.tsx` renders AppShell with legacy `panels`; `components/page-chrome/page-chrome.tsx` renders Screen with Bloom PageHeader, and document cover content through CoverHeader | Trace route panel ownership through legacy shell; compare actual document hierarchy/measurements and editor focus against fixed reference |
| Nilo / database, table/board | `apps/app/components/database/database-header.tsx` contains two PageHeader instances, CoverHeader, Toolbar and view Tabs; `database-view.tsx` is the route view entry | Capture empty/populated data and filters before deciding which bands combine; do not infer excess height solely from component count |
| GoWay / browse, search, place, directions | `packages/frontend/features/explore/ExploreScreen.tsx` owns local `useMapPadding`, layout/snap state and chooses local `components/sheet/SidePanel.tsx` or `MapSheet.tsx`; `lib/useLayoutMode.ts` owns presentation choice | Persist map/camera across mode and detent changes; measure occupation and keyboard; arbitrate map/handle/list gestures and preserve legal attribution |
| Homiio / discovery results and map | `packages/frontend/app/_layout.tsx` renders AppShell; `app/explore/index.tsx` supplies AppShellPanel; `components/search/SearchResultsView.tsx` supplies local AppShellPanels with results/map IDs and collapse policy | Trace nested ownership and route-specific screen scroll, capture images/results/map/filter/detail, compare panel identity and no duplicate chrome |
| Alia / agent composer | `packages/alia-chat/src/components/AliaComposer.tsx` wraps ComposerPill in ComposerLoader, passing `surface={false}` and `frosted={busy}`; owns intake, paste/drop, suggestions and dictation callbacks | Isolated and real native loader capture, multiline/keyboard/Stop/error; preserve all domain state while shared paint coordinates |
| Allo / human conversation composer | `packages/frontend/components/chat/composer/Composer.tsx` uses ChatComposer while owning draft persistence, caret-related mention handling, attachments and recording | Reply/edit, mention insertion, failed-send restoration, attachment/recording and conversation switches; compare shared base to Alia without unifying domain semantics |
| Willo / dashboard and tools | `packages/frontend/app/(tabs)/_layout.tsx` renders AppShell with shared header; `layout/page-layout.tsx`, `components/screen-chrome.tsx`, `components/screen-surface.tsx` and route screens remain separate review entries | Inspect each screen's owner and native adaptation; the frame package is a separate application, not covered by frontend shell |
| Mercaria / storefront, dashboard, POS | Separate `packages/frontend`, `packages/dashboard`, `packages/pos` manifests and `(app)/_layout.tsx` roots; dashboard includes its own `components/shell/Screen.tsx` | Trace all three trees independently; a storefront pass cannot establish dashboard/POS adoption |
| Atlas / page and catalog | `packages/frontend/components/page.tsx` renders Bloom Screen/PageHeader/ScreenScrollView for page variants; `app/(app)/_layout.tsx` is shell entry | Reproduce #527 at 390×844 with short content in light/dark on the candidate; screen wrappers alone do not prove correct painted bottom area |

No row is marked complete. The remaining repositories in the JSON need route
ancestry review, justified activity/platform classification and then migration
and runtime evidence; their source candidates are deliberately retained.

## Runtime availability observed on 2026-11-08

The audit host is Linux and exposes `/dev/kvm`. Cached browser executables were
found for Playwright Chromium 1248 and 1208, WebKit 2370, and Puppeteer Chrome
146. Executable presence is not a browser test. No `xcrun` command was available;
no iOS simulator or physical iOS device was verified by this audit.

`adb devices -l` initially exceeded an eight-second observation; the original
query subsequently completed after starting its daemon and returned an empty
device list. No physical Android device or emulator was attached in that
observation. No daemon was killed or restarted by this audit. Existing APK filenames
for Alia, Mention, Accounts, Commons and Noted were found in the workspace's
`builds` directory; their Bloom contents and installed runtime are unknown.

The open Bloom PRs revalidated on this date were #577 (older native-avatar
integration), #585 (focused chart-card entries) and #586 (diagnostic packaging).
They were not integrated or used as evidence of consumer adoption.
