import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { documentFromSnapshot, type SlashItem } from '../model';
import { EditorStore } from '../model/store';
import { BlockEditor } from './BlockEditor';
import type { MentionSource } from './context';
import { useEditorController } from './controller';
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
            { type: 'divider' },
            { type: 'paragraph', text: [] },
          ],
          newId,
        ),
      }),
    [],
  );
  // Exposed for the browser verification scripts.
  (globalThis as { __bloomEditorStore?: EditorStore }).__bloomEditorStore = store;
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
          />
        </View>
      </ScrollView>
      {toolbar ? <EditorToolbar controller={controller} mentionIndicator="@" /> : null}
    </View>
  );
}

const meta: Meta<typeof EditorDemo> = {
  title: 'Editor/BlockEditor',
  component: EditorDemo,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Playground: StoryObj<typeof EditorDemo> = {};

/** With the touch toolbar docked under the page, as an app places it above the keyboard. */
export const WithToolbar: StoryObj<typeof EditorDemo> = { args: { toolbar: true } };
