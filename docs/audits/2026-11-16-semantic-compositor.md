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
| 3. Presentation and interaction | Shared navigation, scroll/edge ownership, inspector dismissal, stable styling transitions and registered state/focus | Browser checks pass: 36 real-click family/presentation transitions and ten registered draft/focus/selection transitions. Android registered selection, the complete generic panel suite, and the expanded detail/keyboard flow pass on the same final source artifact `86e58f5b` below. Arbitrary native view/media continuity is outside the delivered contract. |
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
| Android | Owned Android 30 emulator `emulator-5580`: final artifact `86e58f5b` passes registered selection in both directions, the complete generic panel suite, and shared detail opened from a lower panel, including real IME/footer interaction. This is shared-source fixture acceptance, not five production native-app deployments. Intended physical Pixel 8a is not yet connected; no final physical-device or iOS acceptance is claimed. |
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


## Native intermediate receipts and expanded detail gate

These are exact, archived intermediate artifacts, not the final integrated or
published package. Embedded Metro receipts distinguish the selected Bloom
checkout from the local fixture actually compiled.

| Check | Exact source and fixture | Receipt / APK SHA-256 | Result |
| --- | --- | --- | --- |
| Registered inspector selection | Continuity source `41f2b883`, production selection command `7e9141ed`, trace fixture `647e2fb1`, receipt correction `41f2b883` | Receipt `5c8e0b00bc18c5b18002db46aae15f564d77243710e32424170636a36907f425`; APK `4d1bdd58568a39dc741e3223642d15f68d2b4bd0f7f61925576145dbe01be5f3` | Real long-press negative control replaces text. Inline `[0,11]` becomes floating `[0,11]` and typing replaces the selected word; floating `[0,12]` becomes inline `[0,12]` with the same replacement proof. Back closes the inspector; reopening preserves the draft with the actual EditText unfocused. |
| Generic native panel suite | Integrated runtime `2730d131`; local fixture `aa374aaa` declares its documented bounded safe-area contract | Receipt `b344e077844da212eb51165440fb3374d79d7f208a39c8c90bf96b16659cf8ff`; APK `bf60b3026691432098d6028401bd6ea7541e775842046685dd73bcbe957855cf` | All original assertions pass: equal visible split (1022/1021 px), resize minimums, independent scrolling, reading position, inline/sheet exit completion, nonduplicated header inset, Back dismissal, 90% sheet ceiling, flow additions and content resize cap. |
| Shared task detail | Integrated runtime `2730d131`; keyboard-enabled fixture `68626521` | Receipt `797c6913f84ff23a3cb8b3450c83eb7b09a46bddaec0a08cb445654d0470347c`; APK `d3407535471215b9da5951ead00dd2874bd7cf60954496898142bd3c250a7b69` | First-field real tap/typing succeeds and the actual IME is shown. The native custom/side Dialog remains bounded by its triggering panel, so its keyboard-following footer moves over the header. This historical failure is resolved and retested on final artifact `86e58f5b` below; it is not itself a passing receipt. |

The generic fixture initially omitted `safeArea`. Raw `Screen.onLayout` values
proved equal Yoga allocations while UIAutomator clipped the lower panel by the
48 dp Android navigation inset. Untouched baseline `bd26dc99` (receipt
`08e60ccf`) and integrated `31599aa4` (`2be13dbf`) reproduced exactly the same
visible bounds. Declaring the existing bounded shell contract corrected the
fixture without weakening any geometry assertion. Capture tooling also now
rejects stale XML after UIAutomator reports a null root during app startup.

The user's expanded board/task-detail scope adds shared `DetailDialog`,
`DetailDialogSection`, `DetailDialogSectionGroup` and board-card composition to
the release acceptance. Consumer adoption, exact reference comparison, real
first-field interaction, body scroll, keyboard/footer ownership and native
dismiss/reopen behavior must be recorded on the final shared source. Existing
compositor passes do not automatically satisfy these new checks.

Session evidence is retained in
`/home/nate/Oxy/Nilo/.local/docs_keeper/semantic-20261116/android-trace`;
the complete generic report is in `android-safearea-generic/native-report.json`.
Sibling `android-artifact`, `android-safearea-artifact` and
`android-keyboard-artifact` directories retain embedded receipts, source hashes
and APKs. The intermediate detail failure is retained in `android-detail-proof.log`;
final screenshots and results use the receipt-specific directories below.


## Final shared-source native acceptance

The combined native source is verification commit `b147b8c4`, equal to integrated
`43103c47` plus keyboard-clearance correction `b5bba209` (integrated upstream as
`bc78a61a`). It includes the native window portal, preserved physical insets,
semantic consumed-edge ownership, and the measured keyboard viewport distance.
The local fixture includes lower-panel trigger `39e13d3e`; receipt tooling now
hashes the Screen/keyboard/safe-area sources as well as panels and Dialog.

- Embedded receipt: `86e58f5b5444734d0e1cbb63e5f064631723a598c9950c142b6e47cec5c7c9cb`.
- APK SHA-256: `a0b028313b18c85a9b18bfed2aec6635e0e2b9dd27a35530226bcdb610cfc7a2`.
- Seventeen declared source-file hashes were checked against the actual packaged Metro source. The archive also retains all 1,663 bundled Bloom source hashes.
- Generic native panel suite: all original assertions pass, including split, resize, independent scrolling, reading position, Back/exit completion, safe-area/header ownership and flow/content limits.
- Inspector session: same real long-press control and both presentation directions preserve the observed noncollapsed range, focus and value; typing replaces the selected word.
- Shared detail: actual taps edit both the first and lower fields; opening from the lower inspector still uses the full physical window and clears system bars. The footer action works with the IME visible. Back dismisses; reopening retains the form value with the actual input unfocused.

For the focused lower input, the measured bounds are `[84,1200,996,1294]`;
the footer is `[21,1292,1059,1386]`. Their 2 physical-pixel boundary difference
is within one native layout point on the 2.625-density emulator (3 px tolerance).
The assertion also bounds excess clearance, so over-scrolling cannot pass.
The actual `ITYPE_IME` frame starts at y=1533; the footer clears it. The previous
147 px missing viewport distance has been removed without a fixed dialog or
system-bar constant. The shared footer footprint and existing content padding
remain distinct; tests also cover a full-window viewport with no extra distance.

All final evidence is under
`/home/nate/Oxy/Nilo/.local/docs_keeper/semantic-20261116/`:
`android-86e58f5b-artifact/`, `android-86e58f5b-generic/native-report.json`,
`android-86e58f5b-session/results.json`, and `android-detail-86e58f5b/results.json`.
Registry installation, main merge and deployment remain separate pending gates
until their CI receipts are added. No further native runtime source change is
covered by this receipt automatically.
