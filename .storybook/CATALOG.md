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

## Composing examples

Stories and templates are consumers of Bloom. Use the existing Button, List,
PageHeader, Card, Screen and other complete components for surrounding UI.
Keep business fixtures and local interaction state in the story; do not duplicate
component paint, control sizing, selection, search or navigation behavior there.

An ordinary screen example must use the whole canvas as its app viewport, with
AppShell composing navigation and panels and Screen owning its header, scrolling
content and footer. A framed message area is not a complete app example. For an
unconstrained workspace, use `contentMaxWidth="none"` and an explicit flexible
panel `span: 1`; do not reproduce the shell with fixed preview dimensions,
background layers, manual safe areas or footer clearance. Keep standalone
measurement fixtures clearly documented under Labs when their host itself is
the regression subject.

Use the Storybook viewport and global theme/material/preset toolbar. Ordinary
examples must not add their own Narrow/Wide or Light/Dark controls, duplicate
stories solely by width/theme, force a phone frame, or compensate canvas padding
with negative margins. Use Controls for actual component options. A bounded
container regression may keep a measured host when its behavior differs from
window resizing; document that purpose and keep its browser verification.

Show one responsive example per distinct behavior. Optional actions without an
implementation should be omitted. Integrated examples should update local state;
isolated callback demonstrations should use named Storybook action spies. Raw
primitives remain appropriate when the primitive, adapter, content illustration,
or measurement contract is the subject itself. They are not a shortcut around an
existing Bloom control. Preserve those regression subjects when simplifying UI.

When consolidating redundant examples, update references in browser verifiers and
docs to the canonical story and exercise themes and widths through the harness.
`scripts/verify-storybook-catalog.mjs` renders the indexed catalogue and records
runtime failures and overflow for review; rendering alone does not verify every
interaction or establish native-device behavior.

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

## Composition audit (2026-11-15)

The [file-by-file record](../docs/audits/storybook-cleanup-2026-11-15.json)
covers all 305 CSF files, including workspace packages and template helpers.
The index went from 1,667 to 1,589 stories: redundant theme/width copies were
consolidated while distinct interaction and regression scenarios were retained.
The record distinguishes code review, catalogue rendering, real interactions and
physical-platform limits. Its 2026-11-16 follow-up records missed full-app
composition in footer and media examples and the targeted corrections; the
earlier audit does not prove every screen layout is correct. Use the current
index for links after consolidation.

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

The accompanying SelectionCard examples add one group and two stories: the final
index contains **275 groups and 1,580 stories**. All 1,578 original IDs remain
present with the same import path and exported story name.
