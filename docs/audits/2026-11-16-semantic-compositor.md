---
title: Semantic compositor rollout ledger
description: Acceptance criteria and evidence for the coordinated Bloom and five-application migration.
---

# Semantic compositor rollout ledger

Date: 2026-11-16. This ledger is a release gate, not a declaration that every row
is complete. Source baseline: Bloom `bd26dc99`, package `21.7.1`. The current
implementation starts at `8ee6fa87`, resolution corrections at `9ad05da1`, and
panel session/stable surface ownership at `20c2a45f`. The final deterministic
CSS-first focus correction is `d900c43d`, integrated as `ee6608ae` in
[release PR #832](https://github.com/OxyHQ/Bloom/pull/832), targeting `21.8.0`
(cherry-picked commit hashes
can differ on the release branch). The package version in generated catalogs
identifies the containing artifact; it does not prove registry publication.

## Six-phase acceptance

| Phase | Exit criterion | Evidence / remaining work |
| --- | --- | --- |
| 1. Model and ownership | Family, presentation, roles and body intent are independent; all five applications mapped; no second layout engine | Implemented in shared resolver, route scope and Screen APIs; semantic guide records responsibilities. |
| 2. Resolution and explainability | Defaults, explicit constraints, local isolation and continuous framing resolve consistently; inspectable reasons | Resolver and semantic tests; `explainAppShellComposition`. This is a pure diagnostic API, not a visual inspector. Browser geometry verification is a separate gate. |
| 3. Presentation and interaction | Shared navigation, scroll/edge ownership, inspector dismissal, stable styling transitions and registered state/focus | Final browser checks pass: 36 real-click family/presentation transitions and ten registered draft/focus/selection transitions. Android remains separately recorded below. Arbitrary native view/media continuity is outside the delivered contract. |
| 4. Consumer migration | All five apps declare their actual structures; redundant geometry removed; product behavior preserved | Source migrations prepared for Nilo, Mention, Inbox, Mercaria and Homiio. Per-app tests, installed version and deployment acceptance tracked below. |
| 5. Documentation and compatibility | Architecture, examples, task routing, explicit limitations and deprecation exits updated | Semantic guide plus architecture/composition/layout guides updated. Legacy variants remain supported compatibility inputs. Removal requires the criteria in the semantic guide, not this source merge alone. |
| 6. Release and rollout | Required gates pass on final commits; CI publishes; consumers install exact registry release; main/deploy evidence recorded | Candidate version `21.8.0`, PR #832. Final main commits, CI publication receipt, registry install and production deployments remain pending. Do not mark complete from a built source mirror. |

## Application acceptance

| Application | Composition and removed ownership duplication | Local evidence | Registry/runtime/deploy exit |
| --- | --- | --- | --- |
| Nilo | Continuous workspace, semantic document body; comments inspector registers drafts/mention ranges/filter/replies and focus | Semantic migration `b8f86a1`; comment integration `6c68047`, explicit seeded lifetime fix `1d98558`. Twelve composer tests cover mention ranges, in-flight mutation lock, cancel/reopen and save/reopen; app typecheck and full lint pass. | Exact released Bloom pin, full app tests/lint/typecheck, browser document/comments flow, Android coverage and deployment pending. |
| Mention | Feed and document-scrolled deck retain distinct navigation and surface behavior | Migration owned by consumer integration branch; source tests alone are not acceptance. | Registry pin, relevant gates, browser feed/deck/resize/scroll, native checks and deployment pending. |
| Inbox | Collection/detail family with collection and detail roles; navigation remains application-controlled | Migration owned by consumer integration branch. | Registry pin, relevant gates, browser selection/compact/back flow, native checks and deployment pending. |
| Mercaria | Catalog storefront; framed workspace dashboard/POS with explicit existing product constraints; storefront viewport gutter calculation removed | Source migration `d7a10719`; candidate production export passed. Actual browser renders eight shelves/96 cards at five widths; Cart navigation and browser Back restore document scroll Y=690 at 1440 and 390. | Exact registry pin and final registry-installed gates; CI-gated Cloudflare deployment pending. Candidate public navigation/document scroll verified. |
| Homiio | Catalog shell and route-owned map-browser structure; results use ScreenScrollView pagination; Screen owns bottom clearance and centered alone-only action | Source migrations `bc1ec4c1`, `884883f1`, `4a488259`; docs check passed. Production candidate renders 32 fixtures, loads page 2 exactly once on real wheel input, and preserves the list/map query ID. Four compact widths pass actual Map/List clicks; the wide split has no action footprint. | Exact registry pin and final installed repeat, native behavior and CI-gated frontend deployment pending. Candidate pagination/resize/toggle browser checks verified. |

Product-specific widths, query state, map data, editor permissions, pagination
fetches and mutation callbacks remain product responsibilities. Their presence
is not a migration defect. Repeated viewport calculations compensating for
shared frames, safe areas or action clearances are defects to remove.

## Runtime and release receipts

| Check | Status and required receipt |
| --- | --- |
| Browser geometry | Verified on integrated `ee6608ae`: Windows Chrome, 36 root/route × family/presentation transitions retain the main instance/draft with real header/input clicks. Wide and narrow body container geometry checked independently. Earlier state-loss captures remain regression evidence. |
| Inspector web focus | Verified independently in Linux Chrome: five fresh contexts × 1440→800→1440 preserve `[0,5]`, focused input and exact draft; typing X replaces the selected prefix. Seven focused tests include incoming initial selection, modal autofocus, CSS-before-React presentation, close, user-choice cancellation and the native TextInput selection command. Reproduce with `scripts/verify-panel-session-focus.mjs`. |
| Android | Final emulator verification is in progress. The user’s intended physical device is Pixel 8a, currently off/charging and awaiting availability. Earlier exploratory Pixel 10 Pro evidence is not final physical acceptance: draft/focus/Back/reopen passed, caret restoration failed before the final fix. `PanelSessionLab.tsx` and its source-hash receipt exercise the exact inspector. Do not mark final native caret verification complete until replacement is demonstrated. |
| iOS | No device identified. Not verified; Android or web evidence must not be presented as iOS acceptance. No new native teleport/Fabric capability is claimed. |
| Package | Before the final native selection-command correction, candidate local gates passed: 1,036 suites / 15,789 tests, TypeScript plus consumer typecheck, lint, build, packed exports/freshness and task catalog. The command correction passes seven focused tests; its final full rerun remains pending. Candidate `21.8.0` publication is still pending; local gates are not CI/registry evidence. |
| Registry | CI publication receipt and exact registry tarball/install checks pending. Local publication prohibited. |
| Main/deployments | Final Bloom and five consumer main commits, CI/deploy URLs and successful deployed-route checks pending. |

The final integration owner must replace pending entries with concrete results
or leave them explicitly pending. A waived platform check is a limitation, not
a successful test. Legacy removal, claims of full native identity retention,
and claims of full rollout are prohibited while their corresponding evidence
is missing.

## Runtime receipts retained by the integration session

All routes use synthetic data; no customer data or real mutations are involved.
Candidate receipts are distinct from the required final registry-installed rerun.

- Windows composition: `/home/nate/Oxy/Nilo/.local/root/semantic-20261116/bloom-windows.log`.
- Independent inspector selection: `/home/nate/Oxy/Nilo/.local/root/semantic-20261116/focus-proof-independent.log`; shared reproducible runner is `scripts/verify-panel-session-focus.mjs`.
- Mercaria production candidate: `/home/nate/Oxy/Nilo/.local/root/semantic-20261116/mercaria/results.json` and `interactions.json`.
- Homiio production candidate: `/home/nate/Oxy/Nilo/.local/docs_keeper/semantic-20261116/homiio/results.json`, five widths plus compact map screenshots; runner `consumer-runtime.cjs` in that session directory.
- Homiio pagination uses actual mouse wheel input. React Native Web’s host `scrollTo` uses `{y}`; calling it with DOM `{top}` left the offset at zero and was an invalid test, not an application pagination defect.
