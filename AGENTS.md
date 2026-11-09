# Bloom (`@oxy.so/bloom`)

This is the short entry point for Bloom work. Read `~/AGENTS.md` and `~/Oxy/AGENTS.md` first. The complete current Bloom rules, including measured hazards, remain in [`AGENTS.rules.md`](AGENTS.rules.md); do not treat this index as a replacement for those rules. Task-to-guide routing is in [`docs/agent-task-index.mdx`](docs/agent-task-index.mdx). Historical investigations and raw evidence live in `docs/audits/` and are not current product contracts unless a guide says so.

## Always

- Read `docs/ui-architecture.mdx` before UI, sizing, layout, or consumer work.
- Extend Bloom's existing components and owners. Surface owns material; the container owns scroll; Screen owns its scroll and chrome; the consumer owns business data and actions.
- Keep normal app scale at `md`; size, domain density, and content width are separate decisions.
- Verify the actual platform and package boundary. Jest mocks, source imports, and a web capture do not establish native behavior or published-package adoption.
- Keep generated files generated. Run the owning generator, then inspect its output.
- Never remove a measured hazard without preserving its evidence and protection.

## Commands

```bash
bun run build
bun run typescript
bun run lint
bun run verify:package
```

Read `docs/verification.mdx` before tests or local installs. Release and publication gates are documented in `~/Oxy/docs/npm-releases.md`.
