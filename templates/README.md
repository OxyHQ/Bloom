# Templates

Full-screen templates, built from Bloom's components as Storybook
stories (`Templates/*`). Not published: this directory is outside `src` and out of
`package.json#files`. Anything reusable a template needs is built as a real Bloom
family under `src/` and only composed here.

`shared/dashboard.tsx` is the one place the dashboard-family templates (home,
HR, finance, marketing, medical, AI profile) share template-only code: the demo
sidebar, notifications and photo avatars, the seeded PRNG, the `DashboardShell`
frame, the responsive chart rows and a few demo cells. Table chips, in-row
selects, filters, search and row actions are Bloom API (`Chip hue`,
`DataTableSelect`, `DataTableFilter`, `DataTableSearch`, `DataTableRowActions`).

Typecheck: `bunx tsc --noEmit -p templates`.

## Shared social example

`social/SocialTemplate.tsx` owns the real AppShell composition used by both
Templates/Social and Foundations/Color System Playground. `SocialContent.tsx`
provides local demo posts, widgets and the Mention mark using Bloom controls
and theme/surface hooks. The playground changes Storybook's theme globals; it
does not maintain a separate app mockup or manually paint a second palette.
The posts and widgets preserve the original playground content; the composer
opens a Bloom dialog with a local draft.
