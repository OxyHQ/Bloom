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
  formatActions={[{ id: 'comment', label: 'Comment', onPress: openComposer }]} // on selected text
  onPasteText={({ text, html, blockId }) => unfurl(text, blockId)} // true: the app took it (web)
  confirmRemove={(ids) => confirmDelete(ids)}            // before whole blocks go; may be async
  domIdPrefix="bloom-block-"                             // per surface; see "DOM ids"
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
  block; selected blocks copy as Markdown. On web, a whole-block selection
  receives keyboard focus without scrolling. Copy/cut belongs to that surface;
  another editor, an external field or a field inside a custom renderer keeps
  its own clipboard behavior. A cut still obeys `confirmRemove` and undo.
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
- **Block transformations** apply the destination type and variant together.
  `turnInto(context, blockId, type, props)` determines whether the final block
  accepts children before moving any: toggle headings retain their subtree;
  an ordinary heading promotes it after the heading. Pass `{}` to select the
  ordinary variant, including when the type already matches. The three-argument
  form preserves the existing variant. Props still pass through the destination
  schema, and the change is one reversible transaction. Block and slash menus
  use this same command.
- **Whole-block clipboard on web** currently writes Markdown text, not a
  lossless block format. Copy remains a text export. Cut first verifies that
  the existing paste parser reconstructs the whole snapshot (including props,
  marks and children) and that the clipboard accepts the text. Otherwise it
  cancels the operation, retains content and selection, and calls
  `onClipboardError('unsupported-cut' | 'write-failed' | 'changed-cut')`; applications should
  show localized feedback. Checks are bounded to 2,000 blocks, 64 nesting levels
  and one million characters of text/snapshot JSON; larger selections stay put.
  Attachments, unsupported formatting and structures cannot be cut through a
  lossy text format. Ordinary reversible paragraphs can still be cut and undone.
  A delayed removal confirmation rechecks content, descendant IDs and positions;
  collaborative changes or moves cancel the removal with `changed-cut` feedback.
  The native platform text clipboard is unchanged; it does not provide the
  web whole-block interception contract.
- **Undo** groups typing into words and takes back only your own change,
  even when others edited the same block since.

## Marking text (`BlockDecoration.ranges`)

`decorations` (a `BlockDecorations` store, set as often as carets move)
gives each block an optional coloured edge (`color`, with `label` for
assistive technology) and marks on stretches of its text:

```ts
decorations.set(new Map([[blockId, {
  ranges: [
    { start: 6, end: 11, background: 'rgba(255, 212, 0, 0.35)' },               // a commented passage
    { start: 20, end: 14, background: tint, caret: { color, label: 'Ana' } },   // Ana's selection, made backwards
  ],
}]]));
```

Offsets are the block's plain-text offsets (its selection's). `background`
is drawn behind `start`–`end`; `caret` is a thin bar at `end` (a backwards
selection has `end` before `start`) with a flag naming `label`. Where ranges
overlap, the last one's colour shows. Offsets past the text are clamped.

- **Not being edited** (every platform): drawn into the text the editor
  draws over the block (`RunsText`, the same drawing as colours the input
  cannot show), so they sit exactly on the characters.
- **Being edited, web**: measured on the input (`RichTextInputHandle.measureRanges`
  — `Range.getClientRects()` on the editing surface's own text nodes) and
  drawn over it: highlights under the text, carets over it. Measured again
  when the text, the ranges or the block's size change.
- **Being edited, native**: not drawn. `react-native-enriched-html` tells
  nothing of where its characters are (no caret or range rectangles, only the
  whole view's size), and a position guessed from the font would be wrong
  wherever a line wraps, a mention or code run is wider, or the font
  differs. They show again as soon as the block is left.

On web the drawn text uses the input's own font when the theme names none
(`fontFamily: inherit`): a react-native-web `Text` otherwise sets a system
font of its own, and the text drawn over the input, with every mark in it,
was wider or narrower than the text under it.

## Actions, paste and removal

- **`formatActions`**: `{ id, label, icon?, onPress(selection) }[]`, shown
  after the marks in the web selection bubble and in `EditorToolbar` while
  text is selected; `onPress` gets `{ blockId, start, end }` (ordered).
  `icon({ color, size })` draws the button; without it the label does.
  `EditorToolbar` reads them from the shared controller, so pass the same
  `controller` to both.
- **`onPasteText({ text, html?, blockId })`**: called before the editor's own
  paste handling (HTML to blocks, lines to blocks); return true and the
  editor pastes nothing. Web only: native inputs paste on their own, and the
  text arrives as an ordinary edit. Pasted image files still go to
  `onPasteImages`.
- **`confirmRemove(ids)`**: asked before whole blocks are removed —
  Backspace or Delete on selected blocks, cutting them, the block menu's
  Delete — with the blocks the removal would take (children go with their
  block). Returns a boolean or a promise of one; anything but true removes
  nothing (a cut still copies). One question at a time: keys pressed while a
  promise is pending ask nothing more. Blocks gone by the time it agrees are
  skipped; the rest go in one undoable edit.

## DOM ids (web)

Every block row's DOM id is `blockDomId(id, domIdPrefix)` —
`'bloom-block-' + id` by default (`BLOCK_DOM_PREFIX`); scroll to a block with
`document.getElementById(blockDomId(id, prefix))`. A block shown by two
surfaces at once (a synced block, in the page that holds it and in a page that
references it) needs a prefix per surface, or the page has one id twice and
pointer selection, drag and drop and scrolling find the wrong one. A surface
finds its own rows by its prefix and looks through another surface's rows
nested in one of its blocks to the block they are in.

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

**Carets that survive concurrent edits.** An offset is right only for the
text it was read from. `selectionToRelative(ydoc, { blockId, start, end })`
turns a selection into Yjs relative positions in that block's `Y.Text`, as
plain JSON to broadcast (awareness, a socket); `relativeToSelection(ydoc,
relative)` reads it back as `{ blockId, start, end }` against the document as
it is now — or null when the block or its text is gone, when this document
lacks the edits the positions were made after (try again once they arrive),
or for anything malformed. Text typed at either end of a range stays outside
it; a caret moves on past text typed where it is. The offsets returned are
ordered; draw them with `BlockDecoration.ranges`.

## Schema

`DEFAULT_SCHEMA` describes the built-in types; `extendSchema` adds an app's.
A spec says whether a type has text, may hold children (`canHaveChildren`, or
`childrenWhen` a prop is true), lays its children out itself (`isContainer`),
what Return continues as, and its default props.

## Develop

```bash
npx jest                      # model and React unit tests; component suites render
                              # on react-native-web in jsdom (web forks, a stand-in input)
npx tsc --noEmit -p .
bun run storybook             # Editor/BlockEditor stories
node scripts/verify-editor.mjs  # browser checks against a built Storybook (ranges measured
                                # against the input's own text boxes, format actions, removal)
```

Pending whole-block removal confirmations recheck the mounted surface’s current editing capability before applying changes; becoming read-only or unmounting cancels the removal.
