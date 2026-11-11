# Bloom (`@oxy.so/bloom`)

Bloom is the React Native and web UI kit every Oxy app composes; a change here reaches every app.

## Commands

```bash
bun install                 # per worktree: node_modules is not shared
bun run build               # bob build to lib/; runs generators, verify:package, task-catalog check
bun run typescript          # tsc plus the consumer typecheck
bun run test                # jest; run one file with: bun run test <path>
bun run lint                # biome check .   (lint:fix / format to apply)
bun run verify:package      # packed exports must match package.json
bun run storybook           # component playground on :6006
```

## Map

- [`AGENTS.rules.md`](AGENTS.rules.md): the complete current Bloom rules and measured hazards, by topic. Read the sections for the area you change.
- [`docs/agent-task-index.mdx`](docs/agent-task-index.mdx): task to guide routing. [`docs/ui-architecture.mdx`](docs/ui-architecture.mdx): read before UI, sizing, layout or consumer work.
- [`docs/app-conventions.mdx`](docs/app-conventions.mdx): the Bloom-first rules every consuming app follows, plus the CSS-token and Expo Router contracts.
- [`docs/verification.mdx`](docs/verification.mdx): Node/Jest, native-resolution and consumer-install hazards. `docs/audits/` is dated evidence, not a current contract.
- Entry points: `src/<family>/` (one folder per component family), `scripts/` (generators and verifiers), `package.json#exports`.

## Conventions

- Extend the existing Bloom component or owner; the consumer owns business data and actions. Why: a workaround in one place forks every other app.
- Keep normal app scale at `md`; size, density and content width are separate decisions. Why: shrinking to `xs` hides inconsistent components.
- Generated files (`package.json#exports`, `#typesVersions`, `design-tokens/tokens.json`, the adoption matrix, the task catalog) are edited only by their generator (`generate:*` scripts). Why: `prebuild` overwrites hand edits.
- Edit in a `.worktrees/<name>` worktree, not the shared checkout; the pre-commit hook in `scripts/git-hooks` blocks shared-checkout commits (`git config core.hooksPath "$PWD/scripts/git-hooks"`). Why: `git add -A` captured other people's work.
- Cross-cutting Oxy rules (Bloom-first, lint, gates, traps) are linked below; this repo owns [Bloom-first](docs/app-conventions.mdx).

## Boundaries

Never:
- Remove a measured hazard from `AGENTS.rules.md` without keeping its evidence and its protection (test or gate). Why: each one was a silent failure.
- Declare adoption from Jest mocks, source imports or a web capture. Why: they do not prove native behavior or a published package.
- Publish to npm from a laptop. Why: releases go through CI.

Ask first before changing a published subpath, a peer dependency range or the `exports` map. Why: consumers break at install time.

## Testing

- Run `bun run lint`, `bun run typescript` and `bun run test` for source changes; add `bun run build` (it runs `verify:package`) for anything touching exports, packaging or generated files.
- For UI changes, verify on the real platform; read `docs/verification.mdx` first. Compare crashes against main.
- Done means: gates green, generators re-run with their output inspected, and a consumer check when behavior changes.

## PR and commits

- One topic per PR, branched from `main`. Merging a version bump to `main` publishes the package once CI passes on that commit ([npm releases](https://github.com/OxyHQ/oxy/blob/main/docs/npm-releases.md)).
- Lint and format with Biome ([lint and format](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/lint-and-format.md)).

## Secrets

Bloom needs none to build or test. Never print or commit tokens; CI holds the release credentials.

## Oxy-wide docs

[Standards](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/standards.md), [build and runtime traps](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/build-and-runtime-traps.md) (Reanimated web failure modes A to C), [gate writing](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/gate-writing.md), [agent team](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/agent-team-workflow.md).

Owner: Oxy platform. Last reviewed 2026-11-11.
