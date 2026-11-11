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

## Writing a story

The preview decorator (`preview.tsx`) owns the providers, the theme and the canvas
host. A story supplies content and nothing else. These rules come from a visual and
geometric audit of every story in light and dark (2026-11-11).

### The host

`parameters.layout` chooses the host:

- `padded` (the default) pads the canvas and **shrink-wraps** the story
  (`align-items: flex-start`). A component that fills its parent's width or needs a
  bounded height collapses there: Panel Routing rendered 0px wide and Project Board had
  no height. Give the story an explicit `width`, or use `fullscreen`.
- `fullscreen` has no padding, stretches the story to the canvas width and gives it a
  bounded viewport (`100dvh`). Use it for screens, shells and boards. A story that
  demonstrates document scrolling adds `bloomScroll: 'document'` (see
  `docs/screen.mdx`).
- A component that bleeds past its edge with a negative margin (`ListingCardGrid`'s
  gutters, `DeliverySlot`'s focus clearance) needs a host that pads: use `padded`.
  `fullscreen` makes it overflow the page sideways.
- Never cancel the canvas padding with a negative margin: `fullscreen` has none, so the
  margin clips the story's own edge (the Tab Bar story lost its left edge that way).

### Theme and colour

The toolbar owns the theme, the colour preset and the material. Every story must follow
it.

- A story that is meant for one mode sets `globals: { theme: 'dark' }`. The toolbar
  still changes it afterwards. Do **not** wrap it in `<BloomThemeProvider mode>`: the
  canvas keeps the toolbar's mode, so the content and the page disagree and the text
  becomes unreadable. Do not paint a fixed page background (`#000`) either.
- Panes that show both modes side by side are the exception: each pane carries its own
  background, so it can keep a provider or a `BloomColorScope mode`.
- Use Bloom's `Text`. React Native Web paints its own `Text` black whatever the page
  colour, so it vanishes in dark.
- Read colour from `useTheme()`, not from hex literals. A fixture that a script measures
  at fixed colours (`Foundations/Shapes`) is the only reason to keep them, and its
  comment says so.
- To see every preset and role at once, open **Foundations / Color / Palette**: presets
  as columns, roles as rows, in the toolbar's mode.

### Controls

Use `args` and `argTypes` so the Controls panel is the way to change a story. Do not
draw a second picker for the same arguments. A fixture that a browser verification
script drives by `testid` (the width buttons in `HeaderActions`, the size group in
`Composition`) may keep its own controls; its comment says which script depends on it.

### Workspace packages

Stories under `packages/*` import Bloom by its published name
(`@oxy.so/bloom/button`). `main.ts` resolves that name to this checkout's source through
the `exports` map of `package.json`, so a story never renders against the older copy in
`node_modules` (a second theme store, and exports this checkout added later). Do not alias
individual subpaths.

### Checking a story

- Open it in light and dark and switch the toolbar while it is open.
- Wait for the story before capturing it: `document.body` gets `sb-show-main` and
  `#storybook-root` has children. A capture after a fixed delay can show Storybook's own
  spinner and read as a blank story.
- To change globals from a script, emit `updateGlobals` on
  `window.__STORYBOOK_ADDONS_CHANNEL__`, the channel the toolbar uses.

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

The accompanying SelectionCard examples add one group and two stories: the final
index contains **275 groups and 1,580 stories**. All 1,578 original IDs remain
present with the same import path and exported story name.
