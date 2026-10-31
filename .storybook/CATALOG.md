# Storybook catalogue

The sidebar follows how a consumer assembles an application. The order is declared
in `preview.tsx`; each CSF file owns its title and stable `meta.id`.

| Section | Contains | Examples |
| --- | --- | --- |
| Foundations | Design vocabulary and tokens | Color roles, typography, surface levels, motion |
| Composition | Contracts shared by multiple families | Provider, BloomScope, Field, AppShell, Screen, navigation, scroll restoration, overlays |
| Components | Reusable UI grouped by purpose | Actions, inputs, feedback, media, chat messages, agent parts, charts |
| Patterns | Complete workflows grouped by domain | Account settings, chat screens, agent editors, payments, housing, music |
| Templates | Full application examples from `templates/` | AI Chat, Housing, Workspace |
| Labs | Development diagnostics | Avatar runtime review |

## Choosing a location

Classify what the story teaches, rather than its source directory, visual size or
package. A large chart is still a component. A small Field demonstrates a shared
composition contract. Components used by agent workflows stay in their reusable
category: Markdown is under Data Display, Voice under Media, and the composers
under Inputs. Agent conversations and editors are patterns. Workspace packages
use the same taxonomy as the main package.

Keep display names readable: `Rich Text Input`, `Contact Profile Card`, `Payment
Method`. Keep exported component and story names intact. A story's title is its
catalogue location, not a package export or a suggested replacement API.

Use the existing subgroups before creating another root. New siblings sort
alphabetically; the curated order only brings shared contracts and common
controls to the front. Add a new subgroup to `storySort` when its position matters.

## Stable links

Existing CSF groups have an explicit `id` when their title was moved. Preserve that
ID when moving or renaming a title. Also preserve story export names: together
they form the public story URL. A new CSF group can choose a durable explicit ID
from its component or workflow name, independently of its sidebar location.

For example, these existing deep links still identify the same stories:

- Composition overview: `?path=/story/foundations-composition--connected`
- AppShell: `?path=/story/blocks-app-shell--default`
- Button: `?path=/story/base-button--basic`
- AI Chat template: `?path=/story/templates-ai-chat--default`

When checking links, read `/index.json` from the running Storybook. Do not derive
an old story ID from its new title. Browser verification scripts, bookmarks and
published documentation may still use the historical ID.

## Catalogue audit (2026-10-19)

The running Storybook indexed **274 CSF groups and 1,578 stories** before this
reorganization. Its ten roots mixed composition contracts into `Foundations`,
`Base` and `Blocks`; `Commerce`, `Data`, `Editor` and `Navigation` had no explicit
sort order. Reusable agent parts, generic composers and complete chat screens
shared one `Agents` category.

The reorganization changes titles for 253 groups and retains every existing story
ID and export. The title migration preserves render functions and fixtures. The accompanying
composition migration updates panel implementations and gives the music-library
and chat-screen preview hosts explicit widths for bounded CSS viewports.

| Section | CSF groups | Stories |
| --- | ---: | ---: |
| Foundations | 10 | 29 |
| Composition | 36 | 159 |
| Components | 128 | 728 |
| Patterns | 84 | 595 |
| Templates | 15 | 65 |
| Labs | 1 | 2 |
| Total | 274 | 1,578 |

Storybook continues to use the real web animation packages, platform resolution,
CSS pipeline and provider harness. Catalogue organization must not change those
runtime contracts or replace them with mocks.

## Runtime examples

The global decorator mounts `BloomProvider`, plus the explicit safe-area,
surface and portal hosts. Keep universal composition state in that public
provider instead of rebuilding a partial stack in the preview. Stories comparing
palettes use `BloomColorScope`; additional root theme providers compete for the
document's theme. Preset samples inherit the toolbar mode. Component comparison
matrices use web color scopes with `display: contents` so their existing flex
geometry stays intact. The provider contract stories alone opt into
`bloomProvider: 'theme-only'`: their negative example must exercise the real
missing scroll/minimize contexts rather than inherit them from the preview.

Foundations / Color groups Modes and Presets, Roles in Context and Explorer.
The first compares local modes and the official recipe catalogue; the second
shows identity/support/action on real composed UI; Explorer filters recipes
and previews the social application. All three retain their existing story IDs.

Application examples use `AppShell`, `Screen` and the real navigation components.
The Sidebar Playground (`composition-app-shell-sidebar-playground--playground`)
compares panel/rail, surfaces, sizes and collapse within the same compositor,
with or without a window capability. Its Adaptive story exercises the shell-owned
Screen and measured navigation clearance, including RTL. Color Roles uses that composition contract
too; its cards demonstrate accent roles rather than a separate layout engine.

Verify the server's source before trusting a browser result: another worktree
can own port 6006. `scripts/verify-storybook-theme.mjs <url>` checks local mode
isolation and toolbar preset behavior; `scripts/verify-color-scope.mjs <url>`
checks nested scopes and overlays. These scripts use `@playwright/test` (or the
module supplied by `BLOOM_PLAYWRIGHT_MODULE`).

The accompanying SelectionCard examples add one group and two stories: the final
index contains **275 groups and 1,580 stories**. All 1,578 original IDs remain
present with the same import path and exported story name.

## Interactive composition examples

Keep Storybook hooks (`useArgs`) in the story render and React state/hooks in a
child component. Mixing them in the same render broke navigation after the first
React state update in the sidebar playground.

Give complex descriptor examples an authored `docs.source.code` with
`type: 'code'`. Dynamic JSX serialization after an args update traversed React's
owner tree inside panel `content`: the CPU profile stayed in Storybook's
`prettyPrint2`, freezing the canvas. Disabling CSS transitions did not fix it;
the authored public recipe did. The real render and interaction remain intact.
`scripts/verify-sidebar-window-room.mjs <url>` exercises collapse/expand and
route selection, plus surfaces, RTL and window-host combinations.
