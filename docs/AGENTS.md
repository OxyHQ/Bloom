# Use the installed Bloom package

1. Read `task-catalog.mdx`, or search `task-catalog.json` by task/synonym. Its package version must equal the adjacent `../package.json`. Do not assume main's APIs are installed.
2. Follow that task's canonical guides and public imports. `examples/*.tsx` are bounded-host components under the application's existing BloomProvider; pass domain content/actions. Read `getting-started.mdx` for CSS, fonts and native roots.
3. Keep md as the normal control size. AppShell/panels own region geometry/material, Screen owns its scroll/chrome, and shared overlays own stacking/focus. Keep domain data, navigation and persistence in the application. Do not nest a second owner to compensate for an incorrect host.
4. Read the task's limitations before adapting it. A canvas example is not a completed persistent map-panel contract. Source/type/export validation does not prove browser/device behavior or registry publication.
5. Consult `ui-architecture.mdx`, `composition.mdx` and `verification.mdx` for detailed rules and measured hazards. Family guides retain platform-specific constraints. These documents complement the consumer repository's own AGENTS.md; they do not authorize publishing or merging.
