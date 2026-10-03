# Bloom 6.2.1 maintenance candidate

Exact six-file backport of the accepted native dismissal fix onto the published 6.2.0 tag. The backport preserves 6.x APIs, including the dot-grid-meter export absent in 7.x. Root selected this path for final Oxy adoption. PR #258 remains the independent 7.x fix.

The focused package test command runs BottomSheet, BottomSheetGesture, DialogBottomSheet, surface-store, surface-prompts and DialogKeyboard.web: 6 suites / 79 PASS. `bun run typescript` passes its isolated consumer control. `bun run build && bun pm pack` passed with CJS/ESM/types and package/freshness gates. The pack command invokes its normal prepack build; full output is retained. The changed runtime source files in the pack match the reviewed worktree. Jest does not prove device touch geometry.

`proof.json` pins source, logs and the local candidate. No publication or device candidate acceptance is claimed. The baseline Android evidence separately confirms X/Back completion omission. Root will operate the candidate before final acceptance. The unrelated touch observation remains open.

Registry preflight found only 6.2.0 in the 6.2 line. Publication must recheck availability, use fresh same-command build/pack/publish and explicit `--tag maintenance-6`, preserve the current 7.x latest tag, then verify registry integrity and consumer bytes. Root coordinates merge/publication; no production UI or auth state was changed here.
