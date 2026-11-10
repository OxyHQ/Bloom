# Versioned task catalog checkpoint

The package carries a short `docs/AGENTS.md`, generated `docs/task-catalog.mdx` and `docs/task-catalog.json`, and six complete exported component examples. Curated selection/ownership metadata stays in `scripts/task-catalog/tasks.json`; public imports and condition maps come from the examples and package exports. Existing family guides remain canonical. No Storybook section, group ID or export has been renamed.

The initial tasks are workspace, canvas, conversation, master-detail, discovery and dashboard/tools. The canvas entry deliberately does not claim the pending occupied-region/persistent-map-panel contract. Examples assume the existing application provider and a bounded host; document-flow scaffold validation remains separate. Package version identifies the containing artifact, not a registry receipt or compatibility promise for older releases.

## Checks

- `generate-task-catalog.mjs --check` rejects missing guide/example targets, missing public subpaths, stale story source references and stale generated metadata.
- Story IDs and their exported names were read from the running Storybook `http://localhost:6135/index.json` on 2026-11-08. The six sections remain Foundations, Composition, Components, Patterns, Templates and Labs.
- `verify-package.mjs` requires the short guide, structured catalog and all six examples in the package.
- `verify-task-catalog.mjs` packs with scripts disabled, extracts an isolated copy and compiles examples with browser and react-native conditions. Every Bloom import must resolve to that tarball's declaration tree. No source mirror, tsconfig paths or package-cache mutation is used.
- The strict per-import check caught TypeScript package self-reference resolving the repository build from a scratch folder without its own manifest. The consumer now has a distinct package name/boundary; the check continues to reject repository declarations as well as source for every requested import.
- A missing-export control must produce TS2305. Mutating the extracted native Screen types export to packaged source must fail resolution validation. Both repository and packaged Bloom source are forbidden in the consumer program.

## Local results

All three build targets completed, and the package/export gate plus build-freshness gate passed. The final isolated tarball verification compiled all six examples under browser and react-native conditions; the missing-export and native source-export controls both failed as required (`packed-examples.txt`). Six live Storybook index entries matched their recorded source/export (`story-index.json`).

The first catalog verification exposed the default child-process output buffer limit on the npm pack file list. The verifier now uses the same 64 MB bound as the existing package gate and accepts both npm 11 array and npm 12 object result shapes. Only the affected catalog step was rerun after that fix and the consumer package-boundary fix. No runtime UI pass is inferred.

## Acceptance status

The clean published-package discovery exercise is recorded in
[`clean-discovery-18.2.1`](./clean-discovery-18.2.1/README.md). It uses the
18.2.1 registry tarball, published guide and examples, selects workspace, canvas
and conversation, and checks their real browser interactions after typecheck and
production build. The same-tree resize preserves the two workspace input nodes
and their values. This is a fixture-level discovery result; it does not establish
product route adoption or native runtime behavior.

The full per-component catalog expansion, product route adoption and
document/bounded scaffold exercise remain separate work. This checkpoint does
not close R10 or global #663.
