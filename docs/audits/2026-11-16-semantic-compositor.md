---
title: Semantic compositor rollout ledger
description: Published package, consumer deployment and runtime evidence for the shared compositor migration.
---

# Semantic compositor rollout ledger

Date: 2026-11-16. Published-package and application deployment receipts are consolidated below; platform and production verification limits remain explicit.

Bloom 22.1.0 is published from `aa50c7dc`, merged through [PR #832](https://github.com/OxyHQ/Bloom/pull/832). Its Git tree matches reviewed `f9d75225`. The initial 21.8.0 candidate was never published: the change was rebased onto concurrent Bloom 22 releases, preserving their canonical controls and list owners.

Use the [semantic composition guide](../semantic-composition.mdx) for the current API contract. This dated ledger records the named sources, packages and deployments; later releases do not automatically inherit its runtime acceptance.

## Delivered contract

| Phase | Result |
| --- | --- |
| Model and ownership | Six semantic families, independent presentation, region roles, container-aware Screen bodies and local composition scopes resolve through the existing renderer. |
| Resolution and diagnostics | Defaults, explicit constraints, continuous framing and local isolation have shared precedence. `explainAppShellComposition` is a declared-policy diagnostic, not a live visual inspector. |
| Presentation and interaction | Styling/family changes preserve the main mounted content. Registered panel draft/focus state crosses inline/modal hosts. Arbitrary native view, media and React component identity do not survive host replacement automatically. |
| Consumer migration | Nilo, Inbox, Mention, Mercaria and Homiio use semantic composition and shared ownership; actual deployment evidence is recorded separately below. |
| Documentation and compatibility | Architecture, composition, body, safe-area, detail/card reuse and task guides are updated. Legacy variants remain supported until the documented deprecation exit criteria are met. |
| Release and rollout | Shared packages are published and independently verified. App deployment and protected-route limitations remain explicit. |

Product widths, editor permissions, data, pagination requests and mutation callbacks remain product responsibilities. Shared frames, body insets, actions, scrolling and keyboard ownership remain in Bloom. Nilo's ProjectBoard/card and record detail reuse the shared owners; domain property editors remain Nilo content slots.

## Published packages

| Package | Source and release | Independent registry verification |
| --- | --- | --- |
| Bloom 22.1.0 | `aa50c7dc`; [main CI](https://github.com/OxyHQ/Bloom/actions/runs/43894790852), [release](https://github.com/OxyHQ/Bloom/actions/runs/43894791038) | Registry integrity verified; 4,184 source files and 27,560 build files match review; all 19 final native receipt hashes match; all 1,635 literal and 10 pattern export targets present. |
| Bloom 22.1.3 (Inbox followup) | `57f01eac`; [main CI](https://github.com/OxyHQ/Bloom/actions/runs/43913556789), [release](https://github.com/OxyHQ/Bloom/actions/runs/43913557446) | Registry integrity verified; all 4,185 source and 27,568 build files match reviewed `2545d357`, with no reviewed files missing. Separate browser/package acceptance is recorded below. |
| Oxy Services 14.22.0 | `8fec80abb`, [PR #2300](https://github.com/OxyHQ/oxy/pull/2300) | All 407 source files match main; final Bloom types and actual shared Item pointer interactions at 1440/390 pass. |
| Gemies SDK 9.1.0 | `479f597d`; [main CI](https://github.com/OxyHQ/Gemies/actions/runs/43894822201), [release](https://github.com/OxyHQ/Gemies/actions/runs/43894823036) | All 255 source files match reviewed source. |

Registry tarball SHA-256:

- Bloom 22.1.0: `f91266faf6e6167959036416e28db3ab4b7bf2b3f3c958398d4b590e62109378`.
- Services: `fb4dcb5920038e339e998859bcd5e3fc0311c66c97286a5816230e474e2d188c`.
- Gemies SDK: `66469d20475be6646c2a5b8f93a155087b6ca6430ab09995b9e4a27075b56443`.

Bloom's published Bun archive contains 33 more reviewed tracked helper/fixture files than the local npm pack preview; all shared source/build bytes match. Its packaged freshness check passes 21,056 values and 8,010 types across 3,107 modules, including three negative controls.

## Shared runtime acceptance

- Reviewed Bloom 22.1.0 source `f9d75225`: 1,049 suites, 15,875 tests and 9 snapshots; TypeScript plus 4,138 consumer source files; lint, build, package/freshness and task examples pass. Protected PR and merge-queue CI also pass on the actual merged tree.
- Real browser: 36 family/presentation transitions with pointer interactions preserve main content; eight shared-detail scenarios cover body input, scroll, fixed header/footer, motion and reopen; ten registered focus/selection transitions preserve drafts and replacement typing.
- Android 30 emulator: two runs in each inspector transfer direction and two detail/keyboard runs pass on the same final APK. Actual selection gestures and typed replacement are retained; close/reopen preserves value without stealing focus.
- Generic native panel acceptance passes on combined `2adc5190` before the two bounded focus/reveal event-order fixes. Those fixes wait for native focus before restoring selection and delegate keyboard reveal to the controller's existing synchronization. Twenty focused tests pass; reverting those two owners causes six regression failures.

Final native receipt: `f82bca7e4754a6e57d258aaaabd4be0c0d2f2aca854fd9bb66a85ab1342aed5f`.
APK SHA-256: `069f1463374fd4eab02568501b4e1a64ee99c02743b419aaa47117a6acb35da3`.
All 19 declared production hashes match published Bloom 22.1.0. Later patch receipts are recorded separately below; this native receipt does not automatically cover changed source. The lower input ends at y=1294 and the footer begins at y=1292, within one native layout point (3 physical pixels at density 2.625); the true IME begins at y=1533. Excess scrolling is also asserted. The fixture uses a lower-panel trigger to verify full-window modal/inset ownership.

Evidence: integration session `android22-fixed-artifact/`, `android22-fixed-session-{1,2}/results.json`, `android22-fixed-detail-{1,2}/results.json`, and `android22-generic/native-report.json`. The session harness only omits intermediate captures to fit a real gesture inside its arming window; range, focus and typing assertions remain. This is shared-source emulator evidence, not physical Pixel, iOS or all five production native-app acceptance.

Reproduction entrypoints: [registered web focus runner](../../scripts/verify-panel-session-focus.mjs) and [native fixture instructions](../../scripts/panel-groups-native/README.md). Their current source and local environment must be identified separately from the archived receipts above.

## Application rollout

### Nilo

Continuous workspace with semantic document bodies and registered comments inspectors; shared ProjectBoard/card and DetailDialog owners contain Nilo domain editors.

Main: `5ce6d6cdf92cb0858af347e5e9e4932dfe6d941d`. [Migration PR #223](https://github.com/OxyHQ/Nilo/pull/223).

PASS: served frontend board title/property/move/drag with four synthetic PATCHes; 650px body scroll and shared header/footer; five widths; second comment draft focus/range [0,6] across 800/1440/390 and unfocused reopen; zero overflow/errors/unexpected requests

Web deployment `43903776912`, API deployment `43905384395`, main CI `43903776879` and OTA `43903784739` succeed for the same main. Production API health is HTTP 200 with healthy PostgreSQL after rollout. Android workflow `43903778092` succeeds on retry by retaining the existing `android-v1.1.0` release; no new official binary was replaced. Native dependency/autolinking audit is retained separately. Contracts 0.4.1 are published with provenance from `43903778183`; SHA-256 `a168bcbc751aca2bb35faed6aec2b2c30db7829cd200ef210d90d9030e93acae`. Final app suite has 972 tests.

### Mercaria

Catalog storefront and framed workspace dashboard/POS retain their existing product constraints while Bloom owns shared frame and scrolling geometry.

Main: `579e5ee190b932a0642b70102ae4623ad567e3a1`. [Migration PR #1250](https://github.com/OxyHQ/Mercaria/pull/1250).

PASS actual production catalog at five widths and Cart/Back scroll restoration at 690px at 1440/390; anonymous dashboard/POS at 1440/390. No real mutations.

Storefront `43907683340`, dashboard `43907683896`, POS `43907683467`, API `43907683494`, main CI `43904516565`, OTA `43904517187` and Android `43904517989` succeed. Reviewed source `9d349797` has the same tree as merged main.

### Homiio

Catalog navigation hosts a route-owned map-browser group; Screen owns results scrolling, pagination geometry and the compact map/list action.

Main: `a0695245c0978144cc07fe820303018ef4f78c0f`. [Migration PR #845](https://github.com/OxyHQ/Homiio/pull/845).

Production layout/state acceptance passes in a new anonymous context in the existing Chrome process: five widths (1440/1024/768/390/320), 32 synthetic properties, shared list/map query identity, real-wheel pages [1,2] exactly once, compact Map/List actions, and no uncaught page errors, layout overflow or application mutations. The map worker separately returns HTTP 403 and emits a console worker-load error, as detailed below. Property/prefetch fixtures intercept application reads and application mutations remain blocked; no source injection or protection bypass is used.

Frontend `43904909730` and main CI/API `43901530189` succeed for exact main. Production API health is HTTP 200, status ok, database healthy. The earlier isolated headless browser stopped at Cloudflare verification; that historical environment limitation is superseded by this successful ordinary-browser acceptance. Receipt: `homiio-production-verified/results.json` in the root integration session. This proves layout, list/map state and pagination, not actual map rendering: visual review shows a Map unavailable/style-load fallback at 1440px. Diagnosis identifies the same-origin MapLibre worker returning a Cloudflare 403 challenge; WebGL is available and map style/sprite/tile metadata return 200. Production map rendering remains unverified in this automated browser because the managed firewall challenges its worker request. Read-only Cloudflare events confirm the managed rule; worker/configuration bytes are unchanged from baseline. This does not establish that ordinary users are affected. No security protection was altered or bypassed. The diagnostic receipt is `homiio-map-diagnostic/diagnostic.json` in the root integration session.

### Inbox

Framed collection/detail composition keeps selection and destinations in the application while shared retained panels own geometry and reading-position restoration.

Main: `7b8eef61fe31fd89c4ec48b9566bc6ad8d767c70`, after [migration PR #257](https://github.com/OxyHQ/Inbox/pull/257) and [registry patch adoption #258](https://github.com/OxyHQ/Inbox/pull/258). Reviewed `0b6acf3` and merged main have identical tree `036bd0d5b21f1a3497a403119423f9f504d4c151`; both manifests pin actual Bloom 22.1.3.

[Main CI](https://github.com/OxyHQ/Inbox/actions/runs/43918221005), [web deployment](https://github.com/OxyHQ/Inbox/actions/runs/43918455458) and [Android workflow](https://github.com/OxyHQ/Inbox/actions/runs/43918222229) succeed. The live `https://inbo.sh/release.txt` returns the exact merged SHA. [OTA publication](https://github.com/OxyHQ/Inbox/actions/runs/43918221332) succeeds with 100% production rollout at 17:33:39 UTC: iOS `aeb6cab4-7e7f-4395-a6d8-313b2105408e`, Android `1bb1d9bd-7a2d-4069-aca8-7e49cdb229ae`. Publication is not a new iOS/physical-device runtime test or a new native binary receipt.

Actual production acceptance passes the original strict pointer flow at five widths, restores scroll 550 → 550 → 550, and has no layout overflow, uncaught JavaScript errors or unmocked writes. A separate compact-screen proof clicks Compose into the rich composer, returns, and clicks Forward into its inline composer. At 320px, Compose spans x176–308 and Forward x134–170. Mail/account APIs use intercepted synthetic fixtures; no messages are actually sent.

Receipts: root `inbox-production-final/results.json`, plus docs-keeper `inbox-actions-production/{deployment-receipt,results}.json`. Normal exact-registry installation, production export, types, lint, 121 suites / 1,156 tests, worker tests and native autolinking comparison pass.

### Mention

Feed and document-scrolled Deck share the semantic shell while each Deck column keeps its own existing panel router and engagement state.

Main: `52f607c8c2b516548559d42cbc1d7377d3aedf8e`, following [migration #1984](https://github.com/OxyHQ/Mention/pull/1984), [Deck scope correction #1985](https://github.com/OxyHQ/Mention/pull/1985) and [Explore scoring correction #1986](https://github.com/OxyHQ/Mention/pull/1986). Reviewed `63035520287110d961ad7a18a04fbc1533add8f8` and merged main have identical tree `05f7b2c1f0eca1a03583084eceb687b8294dbb27`.

The original `50c9e3c9` rollout passed main CI/API/MCP/OTA; its frontend promotion stopped correctly on the two-host Deck Insights visibility gate. PostEngagementProvider sat outside DeckColumn’s existing PanelRouterProvider, captured global `/deck`, and a delayed redirect closed the first inspector. PR #1985 moves that provider inside the existing panel router. The immutable prior deployment fails the deterministic browser negative control; 505 suites / 4,059 tests and 17 affected browser checks pass on the fix. Its [protected merge queue](https://github.com/OxyHQ/Mention/actions/runs/43919752087) passes all gates, including 215 browser tests and one existing skip. Reviewed `8642a6616` and merged `4cc7622d` share tree `16b74dbb581a41af695f3ae0fd48320160707ae3`.

The next frontend gate passed that Deck regression but exposed an existing Explore backend timeout: a PostgreSQL scoring query reached the unchanged 15-second statement limit and returned HTTP 503, with zero Oxy calls. Read-only diagnostics isolated numeric `power` evaluation; changing only its operands to double precision completed the representative full query in 1.249 seconds. That isolated measurement used different cache conditions and is not an endpoint latency guarantee or speedup ratio. PR #1986 retains the score formula, safety/language filters, query shape and existing timeout, with ranking revision 4 invalidating earlier score cursors, sessions and anonymous cached pages. It changes no schema, index or infrastructure settings and weakens no deployment gate. See the [exact diagnosis and regression coverage](https://github.com/OxyHQ/Mention/blob/52f607c8c2b516548559d42cbc1d7377d3aedf8e/docs/audits/2026-11-16-explore-decay.md).

[Main CI](https://github.com/OxyHQ/Mention/actions/runs/43934373427) and [backend deployment](https://github.com/OxyHQ/Mention/actions/runs/43934373388) succeed for exact `52f607c8`. Task definition 945 is healthy at 19:05:36 UTC, running image digest `296a2985ea91847de0dc9b7bd52dca085afb478bd1d2d406f032dd5f6eef0909`. An independent live Explore probe at 19:06:52 UTC returns HTTP 200, 20 items, in 4.372 seconds; this is one measured request, not a latency service level. Anonymous `/health` returns HTTP 401, so that protected endpoint is not used as evidence of service failure. Receipt: root `mention-production-api-final.json`.

[Final frontend deployment](https://github.com/OxyHQ/Mention/actions/runs/43934373443) succeeds for exact `52f607c8`, promoting immutable candidate `8dd72f15` through Worker version `81ec2b51-5f8e-44fa-b229-5fd81c1e716c` at 19:13:22 UTC. Actual public-domain assets pass five widths (1440/1024/768/390/320), retain the post through Feed/Deck changes and resizing, and have no uncaught JavaScript errors or horizontal overflow. Real pointer checks verify avatar/name navigation and Follow at 1440/390; the independent two-host Insights case passes even with the delayed global redirect. These browser checks use deterministic data/auth fixtures and intercepted writes; the live API probe above is separate. Receipt: Mention's integration session `production-release.json`, with `production-screen/results.json`, `production-avatar.log` and `production-deck.log`.

The final deployment gate has 214 first-pass tests, one route-chunks test passing on retry, and one existing skipped test. Its first live Explore request at 19:08:35.855 UTC, after healthy backend rollout, aborted at the client's 15-second deadline; the test-level retry passed. Gates and timeouts were not weakened. This receipt establishes deployed functional behavior, not zero-flake execution or elimination of Explore tail latency.

Post-rollout database logs also retain posts SELECT timeouts of 15,002.33 ms at 19:08:50.915 UTC and 15,002.21 ms at 19:09:06.554 UTC, matching the browser-aborted intervals. This is temporal alignment, not exact request-ID correlation: the aborted browser requests have no response ID. Residual production SQL latency therefore remains observed after the arithmetic fix and successful live probe. The browser evidence is retained in `production-gate-43934373443/explore-network-summary.json`, with the sanitized root `mention-explore-diagnostic/post-rollout-database-summary.json`; these failures must not be discarded in favor of the successful retry. Both followups are consumer navigation/backend changes, not another Bloom patch.

## Inbox measurement followup

Actual deployed Inbox exposed three shared measurement defects: retained row observations during hidden/expanding panel geometry shifted restored offsets from 550 to 558/566; a hidden BottomBar action fed its measured zero width back into its own intrinsic measurer; reply labels used the body border box instead of available inset content width.

[PR #837](https://github.com/OxyHQ/Bloom/pull/837), candidate 22.1.3 at `2545d357`, preserves main's 22.1.2 DetailDialog backing. Full checkpoint `6d9f2ded` passes 1,051 suites / 15,887 tests / 9 snapshots; the rebased combined source passes 8 affected suites / 107 tests, types, lint, build/package and task catalog. Reverting only the three fixed owners makes all three new regressions fail. Exact candidate SHA-256 is `2cae34b7995142a388496f9f585f9de03e74a84289d17dd9d1038703af31ff16`.

Independent uninstrumented Inbox candidate acceptance passes the original pointer flow at five widths, scroll 550 → 550 → 550, Compose and Forward bounds at 320px, and zero errors/overflow. App gates pass 121 suites / 1,156 tests, worker tests, types, lint and production export. PR #837 is merged at `57f01eac`, with an identical reviewed Git tree and successful protected/main CI. [Release 43913557446](https://github.com/OxyHQ/Bloom/actions/runs/43913557446) reports npm acceptance at 17:03:59 UTC. The actual registry version became available around 17:17 UTC and is independently verified: SHA-256 `5ce5a2b2fa04bbcd5971ec12938a5f4d1179661b629d692e38102c1ff81873a0`; all 4,185 source and 27,568 build files match reviewed `2545d357` / merged `57f01eac`; public manifest maps/peers match and no reviewed files are missing. Inbox exact registry pin and production web deployment are complete through PR #258, as recorded above; its OTA publication also succeeds. Browser diagnostic injections that isolated the problem are negative controls, not product acceptance.

## Historical receipts

The [pre-publication ledger at aa50c7dc](https://github.com/OxyHQ/Bloom/blob/aa50c7dc3279cfe175aa0156654f4363d9b52fd6/docs/audits/2026-11-16-semantic-compositor.md) retains the complete chronology and intermediate source/APK receipts. Earlier 21.8 candidate, `5c8e0b00`, `b344e077`, failed `797c6913` detail, and passing `86e58f5b` artifacts are historical evidence, not alternative final release receipts.

The generic fixture initially omitted its safe-area contract: raw Yoga allocations were equal, while UIAutomator clipped the lower panel by Android's 48 dp system-navigation inset. Untouched baseline and integrated source reproduced the same result; correcting fixture ownership preserved all assertions. The historical native detail failure exposed a panel-scoped modal and missing viewport distance; shared portal, inset and keyboard ownership corrections resolved it. Repeated Bloom 22 tests later found event-order races, corrected and accepted by final `f82bca7e` above.

No physical-device or iOS success is claimed. Legacy removal, arbitrary native identity continuity and unverified production interactions remain outside the accepted scope.
