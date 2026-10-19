# @oxy.so/bloom-editor

A Notion-style block editor for React Native and the web, from one code path:
pages made of blocks — paragraphs, headings, lists, to-dos, toggles, quotes,
callouts, code, dividers, and whatever an app renders itself — each block's
text in a native rich text input ([`@oxy.so/bloom-text`](../bloom-text)). No
WebView.

Two halves:

- `@oxy.so/bloom-editor/model` — the document, commands, undo, Markdown
  and paste. Platform-free: runs on a server and in tests.
- `@oxy.so/bloom-editor/yjs` — the document in a `Y.Doc` and a binding that
  keeps an editor store and a `Y.Doc` the same. Platform-free; `yjs` is a peer.
- `@oxy.so/bloom-editor` — the React editor over it.

## Use

```tsx
import { BlockEditor, EditorToolbar, useEditorController } from '@oxy.so/bloom-editor';
import { documentFromSnapshot, EditorStore } from '@oxy.so/bloom-editor/model';

const store = useMemo(
  () => new EditorStore({ document: documentFromSnapshot(blocks, newId), newId }),
  [],
);
const controller = useEditorController(store);

<BlockEditor
  store={store}
  controller={controller}
  slashItems={slashItems}          // the "/" menu and "Turn into", localized by the app
  mentions={{ indicators: ['@'], search: findPeopleAndPages }}
  onOpenMention={(mention) => openPage(mention.attributes.id)}
  renderers={{ image: ImageBlock }} // block types the app draws
  decorations={collaboratorCarets}  // per-block marks that change often
  onCopyBlockLink={(id) => copy(blockUrl(id))}            // "Copy link to block" in the block menu
  onPasteImages={(images, afterId) => upload(images, afterId)} // pasted screenshots and pictures
  codeLanguages={[{ id: 'ts', label: 'TypeScript' }]}     // a code block's language menu
  highlightCode={(code, language) => tokenLines(code, language)} // lines of { text, color }
  inlineEquations={{ indicator: '@' }}                   // `$$x^2$$` makes an equation mention
  theme={theme}
  labels={labels}
/>
// On touch devices, above the keyboard:
<EditorToolbar controller={controller} theme={theme} labels={labels} mentionIndicator="@" />
```

Every edit is a transaction on the store (`store.run(command)`,
`store.dispatch(tx)`); listen with `store.onTransaction` to persist.

To lay the blocks out yourself — notes on a canvas, panes side by side —
use `EditorSurface` (the editor without a layout: its context, keyboard,
clipboard and block menu) and place a `BlockList` of whichever ids wherever
you like; it is all one store, one undo history. `appendChild` adds a block at
the end of a container, an empty one included.

## What it does

- **Blocks**: Return splits and continues lists; Backspace at the start
  reverts, outdents, then merges; Tab / Shift-Tab nest; `⌘⇧↑/↓` move.
- **Selecting blocks** (web): Escape selects the block being edited;
  Shift-click (a block or its handle) and Shift-↑/↓ extend the selection,
  ↑/↓ move it, and dragging out of one block's text into another selects the
  blocks between (`blockRange`: whole blocks of one list, each end taken up
  to the other's level). Selected blocks delete, duplicate (`⌘D`), copy and
  cut as Markdown, nest and un-nest together (`indentBlocks`,
  `outdentBlocks`), and the block menu's colours, turn into, duplicate and
  delete act on all of them.
- **Toggles**: toggles and toggle headings (`toggleable` on a heading) fold
  what is under them; Return at the end of an open one writes inside.
- **Markdown**: typed (`# `, `- `, `1. `, `[] `, `> `, `**bold**`…) and pasted —
  several lines pasted become blocks, prefixes included, code fences one code
  block; selected blocks copy as Markdown.
- **Pasting HTML** (web): a page, Google Docs, Word or another editor pastes
  as blocks — headings, nested lists, to-dos (checkboxes, `[x]`), quotes,
  code with its language, dividers, tables (when the schema has them),
  `<details>` toggles, images as `image` blocks — with bold, italic,
  underline, strike, code and safe links (`htmlToSnapshot`, a DOM-free
  parser, then `pasteSnapshot`). A paste that holds only plain text is left
  to the Markdown lines. Pasted image files go to `onPasteImages`, on every
  platform.
- **Formatting**: a bubble over a selection on the web, `EditorToolbar` on
  touch (marks, link, text colour and highlight, block menu, mention, indent,
  undo, redo); `⌘K` opens the link field for the selection or the link at
  the caret; links and mentions under the caret get a popover to open them.
- **Colours the input cannot draw**: the native input shows no per-run
  colour yet (see `@oxy.so/bloom-text`), so a block whose text has `color`
  or `background` marks is drawn with them while it is not being edited —
  over its input, which stays in place and takes the press. While the block
  is being edited the colours are kept but not shown.
- **Code**: `codeLanguages` gives a code block a language button and menu
  (`props.language`); `highlightCode(code, language)` returns lines of
  `{ text, color }` tokens, drawn the same way while the block is not being
  edited — tokens that do not spell the code exactly are not drawn.
- **Inline equations**: with `inlineEquations`, typing `$$…$$` makes a
  mention `{ kind: 'equation', latex }` (`INLINE_EQUATION_KIND`) under the
  indicator given — one of `mentions.indicators`, so each platform's input
  styles it as a mention. The app shows and edits it from `onOpenMention`;
  its own slash item can put one in with `controller.insertMention`.
- **Mentions**: `mentions.search` answers what an indicator finds; the
  mention is stored on the text (`mention.attributes`).
- **Undo** groups typing into words and takes back only your own change,
  even when others edited the same block since.

## Collaboration (`@oxy.so/bloom-editor/yjs`)

`new YjsBinding(store, ydoc)` writes every local edit, undo and redo into the
`Y.Doc`, and applies every change the `Y.Doc` takes from elsewhere (a
collaborator, work saved on the device, a server) to the store as a remote
transaction: outside the undo history, the selection kept. How the `Y.Doc`
travels (a socket, storage) is the app's.

The layout (`layout.ts`): one `blocks` map from id to the block's own `Y.Map`
with `type`, `parent`, `index` (a fractional key), `props` (a `Y.Map`) and
`text` (a `Y.Text`, marks as attributes). There are no children arrays: a
block's place is written on the block alone, so a block moved by two people
at once ends up in one place. Reading the document (`materialize`) settles
the rest the same way on every device: siblings by key then id, a block
whose parent was removed goes with it, and a cycle made by two moves is
broken at its smallest id. Text edits are minimal (`updateSegments`): a mark
change reformats instead of rewriting, so text typed into that stretch at the
same time is kept. `writeDocument` stores an existing document once.

## Schema

`DEFAULT_SCHEMA` describes the built-in types; `extendSchema` adds an app's.
A spec says whether a type has text, may hold children (`canHaveChildren`, or
`childrenWhen` a prop is true), lays its children out itself (`isContainer`),
what Return continues as, and its default props.

## Develop

```bash
npx jest                      # model and React unit tests
npx tsc --noEmit -p .
bun run storybook             # Editor/BlockEditor stories
node scripts/verify-editor.mjs  # browser checks against a built Storybook
```
