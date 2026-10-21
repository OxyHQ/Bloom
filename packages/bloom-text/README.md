# @oxy.so/bloom-text

A rich text input on each platform's own text engine — native views on iOS and
Android, the browser's editing surface on web — driven by one value type,
`Segment[]`. No WebView.

The input is [`react-native-enriched-html`](https://github.com/software-mansion/react-native-enriched-html)
(Software Mansion, MIT). This package owns the contract around it, so apps
never depend on the input's HTML dialect or its uncontrolled model.

## Install

```bash
bun add @oxy.so/bloom-text react-native-enriched-html
```

`react-native-enriched-html` is a peer because it ships native code, and native
autolinking only links an app's direct dependencies. It needs the New
Architecture and a development build (not Expo Go).

## Use

```tsx
import { RichTextInput, type Segment } from '@oxy.so/bloom-text';

const [value, setValue] = useState<Segment[]>([{ text: 'Hello ' }, { text: 'world', bold: true }]);

<RichTextInput
  value={value}
  onChange={({ segments, edit }) => setValue(segments)}
  onSubmit={() => createNextBlock()}
/>;
```

- **One input per block.** Block structure (headings, lists, toggles) belongs to
  the block editor; the input's own block shortcuts are disabled.
- **`value` is reconciled, not re-rendered.** The input owns its content while
  the user types. A `value` that differs from the one it last reported (a
  collaborator's edit, an undo) replaces the content and keeps the caret where
  the same text still is. What the person types while such a value is on its
  way to the input (it lands after their keystroke) is merged into the value
  and given back to the input, never lost (`InputSync`).
- **`edit`** on every change is the single text edit that produced it
  (`{ index, deleteCount, insert }`), ready to apply to a CRDT.
- **Marks the input cannot show survive.** The input renders bold, italic,
  underline, strike, inline code, links and mentions. `color` and `background`
  live only in the value and are carried across every keystroke
  (`reconcileInputValue`), including a colour set from outside while the
  input shows the same text.
- **Pasting.** `onPasteImages` receives pasted images (`blob:` URLs on web,
  file URIs on native) for the app to upload. On web, `onPaste` sees the
  clipboard's HTML and plain text before the input pastes, and may claim it
  (a block editor turning HTML into blocks).

## Suggestion accessibility

`aria-controls`, `aria-activedescendant`, `aria-expanded` and
`aria-autocomplete` are forwarded to the actual web editing surface, along
with `accessibilityLabel`. They describe a caller-owned suggestion list without
moving focus from the caret. When `aria-expanded` is supplied, the input uses
combobox semantics; otherwise it remains a textbox. Dismissal removes the
relationships without replacing the input or its content. The adapter also
applies these attributes if the underlying editing engine remounts its surface.
Native receives the input label and expanded accessibility state; DOM option
relationships are web-only. `editable={false}` disables command, submit and
paste handlers as well as the native editing control.

## Measuring the text (web)

`ref.measureRanges([{ start, end }, …])` returns, for each range, the boxes
it occupies relative to the input's top-left corner — one per line it is
drawn on, or one of no width where a collapsed range (a caret) is — for
drawing marks over the input while it is edited (a collaborator's selection,
a commented passage). It reads the editing surface's own text nodes
(`Range.getClientRects()`), counting offsets as the input does (one `\n`
between paragraphs), and measures only when the surface shows the current
`value` exactly: otherwise, and always on native, it returns null.
`react-native-enriched-html` exposes no text layout on iOS or Android (no
caret or range rectangles), so there is nothing true to return there.

## The model, without React Native

`@oxy.so/bloom-text/model` exports the pure half — segments, edits, the HTML
wire format (a whitelist tokenizer that drops unknown tags, scripts and unsafe
links) and reconciliation — for servers and tests.

## Known gaps

- The input reports whole values, not edits; edits are recovered with a
  prefix/suffix diff, which is exact for one input event.
- A remote change replaces the whole content (`setValue`), then restores the
  transformed selection. A keystroke that crossed it disappears for the moment
  it takes to give the merged value back.
- No text geometry on native: `measureRanges` is null on iOS and Android
  until the input reports where it draws its characters.
- No per-selection text colour in the input itself: `react-native-enriched-html`
  is adding foreground and background colours (software-mansion/react-native-enriched-html#817);
  once released, the input shows `color` and `background` instead of only
  carrying them.

Closing these needs native changes in the input (an edit event, an
`applyEdits` that preserves selection, colour marks); they are tracked for
upstream contribution.

## Develop

```bash
bun install
bun run test        # jest, the platform-free model
bun run typescript
bun run build       # bob → lib/
```
