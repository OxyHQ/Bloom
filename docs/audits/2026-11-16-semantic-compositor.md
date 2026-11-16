---
title: Semantic compositor rollout ledger
description: Acceptance criteria and evidence for the coordinated Bloom and five-application migration.
---

# Semantic compositor rollout ledger

Date: 2026-11-16. This ledger is a release gate, not a declaration that every row
is complete. Source baseline: Bloom `bd26dc99`, package `21.7.1`. The current
implementation starts at `8ee6fa87`, resolution corrections at `9ad05da1`, and
panel session/stable surface ownership at `20c2a45f` (cherry-picked commit hashes
can differ on the release branch). The package version in generated catalogs
identifies the containing artifact; it does not prove registry publication.

## Six-phase acceptance

| Phase | Exit criterion | Evidence / remaining work |
| --- | --- | --- |
| 1. Model and ownership | Family, presentation, roles and body intent are independent; all five applications mapped; no second layout engine | Implemented in shared resolver, route scope and Screen APIs; semantic guide records responsibilities. |
| 2. Resolution and explainability | Defaults, explicit constraints, local isolation and continuous framing resolve consistently; inspectable reasons | Resolver and semantic tests; `explainAppShellComposition`. This is a pure diagnostic API, not a visual inspector. Browser geometry verification is a separate gate. |
| 3. Presentation and interaction | Shared navigation, scroll/edge ownership, inspector dismissal, stable styling transitions and registered state/focus | Targeted panel tests pass, including raw local-state style changes, registered drafts and real Dialog focus boundary. Android and browser runtime checks remain separately recorded below. Arbitrary native view/media continuity is outside the delivered contract. |
| 4. Consumer migration | All five apps declare their actual structures; redundant geometry removed; product behavior preserved | Source migrations prepared for Nilo, Mention, Inbox, Mercaria and Homiio. Per-app tests, installed version and deployment acceptance tracked below. |
| 5. Documentation and compatibility | Architecture, examples, task routing, explicit limitations and deprecation exits updated | Semantic guide plus architecture/composition/layout guides updated. Legacy variants remain supported compatibility inputs. Removal requires the criteria in the semantic guide, not this source merge alone. |
| 6. Release and rollout | Required gates pass on final commits; CI publishes; consumers install exact registry release; main/deploy evidence recorded | Pending final version, main commits, CI publication receipt, registry install and production deployments. Do not mark complete from a built source mirror. |

## Application acceptance

| Application | Composition and removed ownership duplication | Local evidence | Registry/runtime/deploy exit |
| --- | --- | --- | --- |
| Nilo | Continuous workspace, semantic document body; comments inspector registers drafts/mention ranges/filter/replies and focus | Semantic migration `b8f86a1`; comment integration tracked in its followup. Comment suite includes state remount and in-flight submission checks. | Exact released Bloom pin, full app tests/lint/typecheck, browser document/comments flow, Android coverage and deployment pending. |
| Mention | Feed and document-scrolled deck retain distinct navigation and surface behavior | Migration owned by consumer integration branch; source tests alone are not acceptance. | Registry pin, relevant gates, browser feed/deck/resize/scroll, native checks and deployment pending. |
| Inbox | Collection/detail family with collection and detail roles; navigation remains application-controlled | Migration owned by consumer integration branch. | Registry pin, relevant gates, browser selection/compact/back flow, native checks and deployment pending. |
| Mercaria | Catalog storefront; framed workspace dashboard/POS with explicit existing product constraints; storefront viewport gutter calculation removed | Source migration `d7a10719`; changed-file Biome passed. | Registry pin and UI/frontend/dashboard/POS gates; public navigation/document scroll and CI-gated Cloudflare deployment pending. |
| Homiio | Catalog shell and local map-browser structure; results use ScreenScrollView pagination; Screen owns bottom clearance and centered alone-only action | Source migrations `bc1ec4c1`, `884883f1`, `4a488259`; docs check passed. Shared pagination behavioral replacement and full gates owned by consumer integration. | Registry pin, pagination/resize/toggle browser evidence, native behavior and CI-gated frontend deployment pending. |

Product-specific widths, query state, map data, editor permissions, pagination
fetches and mutation callbacks remain product responsibilities. Their presence
is not a migration defect. Repeated viewport calculations compensating for
shared frames, safe areas or action clearances are defects to remove.

## Runtime and release receipts

| Check | Status and required receipt |
| --- | --- |
| Browser geometry | Root integration uses actual Chrome and semantic fixture, including route/root descriptors and narrow/wide layout. Record final source identity and result after all wrapper fixes; earlier state-loss captures are regression evidence, not a pass. |
| Inspector web focus | Real Dialog test passes with a first button preceding the editor; registered draft and focused editor survive both directions. Browser interaction verification remains separate from jsdom. |
| Android | Pixel 10 Pro available. `scripts/panel-groups-native/PanelSessionLab.tsx` exercises inline/sheet draft, focus and selection, closed/reopened draft, Android Back and dismissal. Build receipt includes session and fixture source hashes. Root runs actual device; record final receipt, screenshots and result before marking verified. |
| iOS | No device identified. Not verified; Android or web evidence must not be presented as iOS acceptance. No new native teleport/Fabric capability is claimed. |
| Package | Built-package export/freshness checks run locally on source snapshot. Final release version and CI run pending. |
| Registry | CI publication receipt and exact registry tarball/install checks pending. Local publication prohibited. |
| Main/deployments | Final Bloom and five consumer main commits, CI/deploy URLs and successful deployed-route checks pending. |

The final integration owner must replace pending entries with concrete results
or leave them explicitly pending. A waived platform check is a limitation, not
a successful test. Legacy removal, claims of full native identity retention,
and claims of full rollout are prohibited while their corresponding evidence
is missing.
