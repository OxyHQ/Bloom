import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useSyncExternalStore } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  appendChild,
  DEFAULT_SCHEMA,
  documentFromSnapshot,
  extendSchema,
  type SlashItem,
} from '../model';
import { EditorStore } from '../model/store';
import { BlockEditor, EditorSurface } from './BlockEditor';
import { BlockList } from './BlockRow';
import type { FormatAction, MentionSource } from './context';
import { useEditorController } from './controller';
import { BlockDecorations } from './decorations';
import { EditorToolbar } from './EditorToolbar';

let counter = 0;
const newId = () => `id-${Date.now().toString(36)}-${(++counter).toString(36)}`;

/** A tiny directory for the story: people and pages matched by prefix, after a delay. */
const PEOPLE = ['Ana Ruiz', 'Ben Ito', 'Carla Díaz'];
const PAGES = ['Roadmap', 'Retrospective'];
export const MENTIONS: MentionSource = {
  indicators: ['@'],
  search: async ({ text }) => {
    await new Promise((r) => setTimeout(r, 30));
    const match = (name: string) => name.toLowerCase().startsWith(text.toLowerCase());
    return [
      ...PEOPLE.filter(match).map((name) => ({
        id: name,
        label: name,
        group: 'People',
        attributes: { kind: 'user', id: name },
      })),
      ...PAGES.filter(match).map((name) => ({
        id: name,
        label: name,
        group: 'Pages',
        attributes: { kind: 'page', id: name },
      })),
    ];
  },
};

export const SLASH_ITEMS: SlashItem[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Plain text',
    group: 'basic',
    action: { kind: 'block', type: 'paragraph' },
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Big section heading',
    keywords: ['title'],
    group: 'basic',
    action: { kind: 'block', type: 'heading_1' },
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    group: 'basic',
    action: { kind: 'block', type: 'heading_2' },
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    group: 'basic',
    action: { kind: 'block', type: 'heading_3' },
  },
  {
    id: 'bullet',
    label: 'Bulleted list',
    description: 'A simple list',
    group: 'basic',
    action: { kind: 'block', type: 'bulleted_list_item' },
  },
  {
    id: 'number',
    label: 'Numbered list',
    description: 'A numbered list',
    group: 'basic',
    action: { kind: 'block', type: 'numbered_list_item' },
  },
  {
    id: 'todo',
    label: 'To-do list',
    description: 'Track tasks',
    keywords: ['check'],
    group: 'basic',
    action: { kind: 'block', type: 'todo' },
  },
  {
    id: 'toggle',
    label: 'Toggle list',
    description: 'Hide content inside',
    group: 'basic',
    action: { kind: 'block', type: 'toggle' },
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote',
    group: 'basic',
    action: { kind: 'block', type: 'quote' },
  },
  {
    id: 'callout',
    label: 'Callout',
    description: 'Make writing stand out',
    group: 'basic',
    action: { kind: 'block', type: 'callout' },
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Capture a code snippet',
    group: 'advanced',
    action: { kind: 'block', type: 'code' },
  },
  {
    id: 'toggle_heading_1',
    label: 'Toggle heading 1',
    description: 'A heading that folds what is under it',
    group: 'basic',
    action: { kind: 'block', type: 'heading_1', props: { toggleable: true, expanded: true } },
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Separate blocks',
    group: 'basic',
    action: { kind: 'block', type: 'divider' },
  },
];

/** The verification scripts read what was opened instead of leaving the page. */
function recordOpened(what: string) {
  const g = globalThis as { __bloomOpened?: string[] };
  g.__bloomOpened = [...(g.__bloomOpened ?? []), what];
}

/** An action on selected text, as an app adds one (comment on it). */
const FORMAT_ACTIONS: readonly FormatAction[] = [
  {
    id: 'comment',
    label: 'Comment',
    onPress: ({ blockId, start, end }) => recordOpened(`comment:${blockId}:${start}-${end}`),
  },
];

/** Removing blocks asks first; the verification scripts answer through `__bloomConfirm`. */
function confirmRemove(ids: readonly string[]): boolean {
  const answer = (globalThis as { __bloomConfirm?: boolean }).__bloomConfirm ?? true;
  recordOpened(`confirm:${ids.length}`);
  return answer;
}

function EditorDemo({ toolbar = false }: { toolbar?: boolean }) {
  const store = useMemo(
    () =>
      new EditorStore({
        newId,
        document: documentFromSnapshot(
          [
            { type: 'heading_1', text: [{ text: 'Project plan' }] },
            {
              type: 'paragraph',
              text: [
                { text: 'Write with ' },
                { text: 'bold', bold: true },
                { text: ', ' },
                { text: 'links', link: 'https://example.com/docs' },
                { text: ' and more. Type ' },
                { text: '/', code: true },
                { text: ' for commands.' },
              ],
            },
            { type: 'todo', text: [{ text: 'Ship the editor' }], props: { checked: true } },
            {
              type: 'todo',
              text: [{ text: 'Real-time collaboration' }],
              props: { checked: false },
            },
            {
              type: 'toggle',
              text: [{ text: 'Details' }],
              props: { expanded: true },
              children: [
                { type: 'bulleted_list_item', text: [{ text: 'Nested inside a toggle' }] },
              ],
            },
            { type: 'numbered_list_item', text: [{ text: 'First' }] },
            { type: 'numbered_list_item', text: [{ text: 'Second' }] },
            { type: 'quote', text: [{ text: 'Simple things should be simple.' }] },
            { type: 'callout', text: [{ text: 'Callouts stand out.' }], props: { icon: '💡' } },
            {
              type: 'code',
              text: [{ text: 'const answer = "42";' }],
              props: { language: 'javascript' },
            },
            { type: 'divider' },
            { type: 'paragraph', text: [] },
          ],
          newId,
        ),
      }),
    [],
  );
  // Collaborators' carets and commented passages: set by the verification scripts.
  const decorations = useMemo(() => new BlockDecorations(), []);
  // Exposed for the browser verification scripts.
  (globalThis as { __bloomEditorStore?: EditorStore }).__bloomEditorStore = store;
  (globalThis as { __bloomDecorations?: BlockDecorations }).__bloomDecorations = decorations;
  const controller = useEditorController(store);
  return (
    <View style={{ flex: 1, height: '100vh' as unknown as number }}>
      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
            paddingHorizontal: 64,
            paddingVertical: 48,
          }}
        >
          <BlockEditor
            store={store}
            slashItems={SLASH_ITEMS}
            mentions={MENTIONS}
            controller={controller}
            onOpenLink={recordOpened}
            onOpenMention={(mention) =>
              recordOpened(`${mention.attributes.kind}:${mention.attributes.id}`)
            }
            onCopyBlockLink={(id) => recordOpened(`block:${id}`)}
            codeLanguages={CODE_LANGUAGES}
            highlightCode={highlightKeywords}
            inlineEquations={{ indicator: '@' }}
            decorations={decorations}
            formatActions={FORMAT_ACTIONS}
            confirmRemove={confirmRemove}
          />
        </View>
      </ScrollView>
      {toolbar ? <EditorToolbar controller={controller} mentionIndicator="@" /> : null}
    </View>
  );
}

const CODE_LANGUAGES = [
  { id: 'plain', label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
];

/** A stand-in highlighter: keywords purple, strings green, the rest as typed. */
function highlightKeywords(code: string): { text: string; color?: string }[][] {
  const pattern = /(\b(?:const|let|function|return|if|else|import|from|def)\b)|("[^"]*"|'[^']*')/g;
  return code.split('\n').map((line) => {
    const tokens: { text: string; color?: string }[] = [];
    let at = 0;
    for (const match of line.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > at) tokens.push({ text: line.slice(at, index) });
      tokens.push({ text: match[0], color: match[1] ? 'rgb(144, 101, 176)' : 'rgb(68, 131, 97)' });
      at = index + match[0].length;
    }
    if (at < line.length) tokens.push({ text: line.slice(at) });
    return tokens;
  });
}

/** Notes the app lays out itself: containers whose blocks it places side by side. */
const NOTE_SCHEMA = extendSchema(DEFAULT_SCHEMA, [
  { type: 'note', hasText: false, canHaveChildren: true, isContainer: true },
]);

function SurfaceDemo() {
  const store = useMemo(
    () =>
      new EditorStore({
        newId,
        schema: NOTE_SCHEMA,
        document: documentFromSnapshot(
          [
            {
              type: 'note',
              children: [
                { type: 'heading_2', text: [{ text: 'Left note' }] },
                { type: 'paragraph', text: [{ text: 'One' }] },
              ],
            },
            { type: 'note', children: [{ type: 'paragraph', text: [{ text: 'Right note' }] }] },
          ],
          newId,
          NOTE_SCHEMA,
        ),
      }),
    [],
  );
  (globalThis as { __bloomEditorStore?: EditorStore }).__bloomEditorStore = store;
  const notes = useSyncExternalStore(store.subscribe, () => store.getSnapshot().doc.root);
  return (
    <EditorSurface store={store} slashItems={SLASH_ITEMS} mentions={MENTIONS}>
      <View style={{ flexDirection: 'row', gap: 32, padding: 48 }}>
        {notes.map((id, i) => (
          <NoteDemo key={id} store={store} id={id} label={`Add to note ${i + 1}`} />
        ))}
      </View>
    </EditorSurface>
  );
}

function NoteDemo({ store, id, label }: { store: EditorStore; id: string; label: string }) {
  const children = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().doc.blocks[id]?.children ?? [],
  );
  return (
    <View style={{ width: 320, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
      <BlockList ids={children} depth={0} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          store.sealHistory();
          store.run((c) => appendChild(c, id, 'paragraph'));
        }}
      >
        <Text style={{ color: '#888', paddingTop: 8 }}>+ {label}</Text>
      </Pressable>
    </View>
  );
}

const meta: Meta<typeof EditorDemo> = {
  id: 'editor-blockeditor',
  title: 'Patterns/Productivity/Block Editor',
  component: EditorDemo,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Playground: StoryObj<typeof EditorDemo> = {};

/** With the touch toolbar docked under the page, as an app places it above the keyboard. */
export const WithToolbar: StoryObj<typeof EditorDemo> = { args: { toolbar: true } };

/** `EditorSurface`: the app lays the blocks out (two notes side by side) over one store. */
export const Surface: StoryObj<typeof EditorDemo> = { render: () => <SurfaceDemo /> };
