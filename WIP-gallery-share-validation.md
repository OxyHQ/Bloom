# WIP: gallery share validation (2026-11-01)

Status: investigation in progress; do not queue or merge from this branch. The image-source update is a separate unresolved design and is not part of this diff.

The final working tree has the explicit image share policy, disabled action and web focus transfer, browser and native-mock coverage, and candidate version 15.90.0. It was based on Bloom main `70c17fc7523782e8b8c0c2ed0e263d57642d4be7`. Before resuming, fetch main and verify the published version and other in-flight PRs again.

## Completed checks

- Frozen install passed with no lockfile changes.
- Final production source: `bun run build` passed, including package/freshness verification; built CommonJS and ESM declarations and both gallery subpaths were inspected. The generated root `lib/` was subsequently removed to recover disk space and can be recreated.
- Final source: `bun run typescript` and the consumer type matrix passed, as did `bun run lint` and `biome ci .`.
- Browser script passed on Chromium at 390px and 1000px, exercising the real web fork, stubbed Web Share API, keyboard navigation, disabled share, focus transfer, programmatic pager scroll, close and reopen. React Native Jest targeted suite passed with 23 tests; no physical iOS or Android device was tested.
- Workspace types/tests for bloom-text, bloom-editor, color and avatar-native passed. Avatar runtime Node tests and avatar-native package verification passed. The generated `packages/color/lib/` was subsequently removed to recover disk space.
- An earlier iteration passed all 815 root suites in three shards (14,221 tests); this was before the final pending-focus cleanup, video regression test, and version bump, so it is not an exact-final-tree result.

## Outstanding root-suite gate

The exact-final-tree three-shard run passed shards 2 and 3. Shard 1 failed with a Node/Jest worker SIGSEGV in `color-scope-exact.test.tsx`; a whole-shard retry failed with a SIGSEGV in `chart-colors.test.ts`. A subsequent `node --no-opt` run logged SIGSEGV in `seed-scope-parity.test.ts` and `PhoneInput.test.tsx` before being stopped. A run using the CI five-shard partition logged a SIGSEGV in `DeliverySlot.test.tsx` before being stopped to prevent further disk use. These are different suites and the earlier iteration's complete suite passed, but no exact-final full green run is claimed. Bloom documents this intermittent Node/Jest failure in `docs/verification.mdx`.

Logs and JSON are retained in `/home/nate/Oxy/Bloom/.worktrees/gallery-share-*20261101.*`. Re-run the CI suite once sufficient space is available, compare the completed shard union against `--listTests`, then prepare a draft PR only if the required gates pass. Independently verify CI against the exact pushed head.

A CDP touch swipe closed the viewer both in the modified checkout's existing multi-image story and the new fixture. The synthetic touch gesture was not validated, and this comparison is not a test of unmodified main. Do not claim a swipe or physical-device pass. The browser script instead exercises the pager's real scroll event in Chromium.
