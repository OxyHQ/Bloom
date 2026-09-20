import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';

import { Button } from '../button';
import { ComposerLoader } from '../composer-loader';

import {
  ComposerAttachments,
  ComposerPanel,
  ComposerPanelStatusTab,
  ComposerPill,
  ComposerStatusBar,
  ModelPicker,
  type ComposerPanelAttachment,
  type ModelPickerModel,
  type ModelPickerProvider,
} from './index';

const meta: Meta<typeof ComposerPanel> = {
  argTypes: {
    "value": { control: 'text' },
    "defaultValue": { control: 'text' },
    "disabled": { control: 'boolean' },
    "placeholder": { control: 'text' },
    "permission": { control: 'text' },
    "defaultPermission": { control: 'text' },
    "model": { control: 'text' },
    "defaultModel": { control: 'text' },
    "effort": { control: 'number' },
    "defaultEffort": { control: 'number' },
    "listening": { control: 'boolean' },
    "defaultListening": { control: 'boolean' }
  },
  title: 'Blocks/Composer Panel',
  component: ComposerPanel,
};

export default meta;

type Story = StoryObj<typeof ComposerPanel>;

/** A demo catalogue (a slice of `MODEL_PROVIDERS`): long enough that every list scrolls. */
const PROVIDERS: ModelPickerProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logoSize: 18,
    models: [
      { id: 'openai/gpt-5.6-mini', name: 'GPT-5.6 Mini' },
      { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra' },
      { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol' },
      { id: 'openai/gpt-5.5', name: 'GPT-5.5' },
      { id: 'openai/gpt-5.5-mini', name: 'GPT-5.5 Mini' },
      { id: 'openai/gpt-5.4', name: 'GPT-5.4' },
      { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4 Mini' },
      { id: 'openai/gpt-5.4-nano', name: 'GPT-5.4 Nano' },
      { id: 'openai/o5', name: 'o5' },
      { id: 'openai/o5-mini', name: 'o5 Mini' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logoSize: 18,
    models: [
      { id: 'anthropic/fable-5.1', name: 'Fable 5.1' },
      { id: 'anthropic/fable-5', name: 'Fable 5' },
      { id: 'anthropic/opus-5', name: 'Opus 5' },
      { id: 'anthropic/sonnet-5', name: 'Sonnet 5' },
      { id: 'anthropic/haiku-4.5', name: 'Haiku 4.5' },
      { id: 'anthropic/opus-4.1', name: 'Opus 4.1' },
      { id: 'anthropic/sonnet-4.5', name: 'Sonnet 4.5' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    models: [
      { id: 'perplexity/sonar-pro', name: 'Sonar Pro' },
      { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
      { id: 'perplexity/sonar-deep-research', name: 'Sonar Deep Research' },
      { id: 'perplexity/sonar', name: 'Sonar' },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    models: [
      { id: 'cursor/composer-2.5', name: 'Composer 2.5' },
      { id: 'cursor/composer-2', name: 'Composer 2' },
      { id: 'cursor/tab-3', name: 'Tab 3' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'openrouter/auto-router', name: 'Auto Router' },
      { id: 'openrouter/llama-4-maverick', name: 'Llama 4 Maverick' },
      { id: 'openrouter/kimi-k2.5', name: 'Kimi K2.5' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek/deepseek-v4', name: 'DeepSeek V4' },
      { id: 'deepseek/deepseek-r2', name: 'DeepSeek R2' },
    ],
  },
  { id: 'jina', name: 'Jina', models: [{ id: 'jina/embeddings-v4', name: 'Embeddings v4' }] },
  { id: 'ollama', name: 'Ollama', models: [{ id: 'ollama/gemma-4', name: 'Gemma 4' }] },
  { id: 'google', name: 'Google', models: [{ id: 'google/gemini-3.5-pro', name: 'Gemini 3.5 Pro' }] },
  { id: 'mistral', name: 'Mistral', models: [{ id: 'mistral/mistral-large-3', name: 'Mistral Large 3' }] },
];

const PHOTO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMTIiIGhlaWdodD0iMTEyIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNTllMGIiLz48c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iI2VmNDQ0NCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzYzNjZmMSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMTIiIGhlaWdodD0iMTEyIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iNzgiIGN5PSIzNCIgcj0iMTQiIGZpbGw9IiNmZGU2OGEiLz48cGF0aCBkPSJNMCA5MCBMNDAgNTggTDcwIDgwIEwxMTIgNTAgTDExMiAxMTIgTDAgMTEyIFoiIGZpbGw9IiMxZTI5M2IiIG9wYWNpdHk9IjAuNyIvPjwvc3ZnPg==';

const STATUS = <ComposerPanelStatusTab branch="Main" project="project-sea" context={57} />;

function Frame({ children, width = 640 }: { children: React.ReactNode; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, paddingTop: 380 }}>
      <View style={{ width, maxWidth: '100%' }}>{children}</View>
    </View>
  );
}

/** The new composer with permissions dropdown: status tab, add, permissions, model, mic, send. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Frame>
        <ComposerPanel
          testID="composer"
          value={value}
          onValueChange={setValue}
          onSubmit={() => setValue('')}
          providers={PROVIDERS}
          status={STATUS}
          onLearnMore={() => {}}
        />
      </Frame>
    );
  },
};

/** Every tile state: landed image, landed documents, and rings at 0 / 35 / 100. */
export const Attachments: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [files, setFiles] = useState<ComposerPanelAttachment[]>([
      { id: 'photo', name: 'sunset.png', kind: 'image', src: PHOTO },
      { id: 'brief', name: 'Brief.docx', kind: 'document' },
      { id: 'sheet', name: 'Q3 numbers.xlsx', kind: 'spreadsheet' },
      { id: 'deck', name: 'Pitch.key', kind: 'presentation', progress: 35 },
      { id: 'code', name: 'index.ts', kind: 'code', progress: 100 },
      { id: 'photo-2', name: 'upload.png', kind: 'image', src: PHOTO, progress: 62 },
      { id: 'video', name: 'demo.mp4', kind: 'video', progress: 0 },
    ]);
    return (
      <Frame>
        <ComposerPanel
          testID="composer"
          providers={PROVIDERS}
          status={STATUS}
          attachments={files}
          onRemoveAttachment={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        />
      </Frame>
    );
  },
};

/** The new composer with attachments: files land one after another with the simulated queue. */
export const UploadQueue: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [files, setFiles] = useState<ComposerPanelAttachment[]>([
      { id: 'photo', name: 'sunset.png', kind: 'image', src: PHOTO, progress: 0 },
      { id: 'brief', name: 'Brief.docx', kind: 'document', progress: 0 },
      { id: 'sheet', name: 'Q3 numbers.xlsx', kind: 'spreadsheet', progress: 0 },
    ]);
    return (
      <Frame>
        <ComposerAttachments
          testID="composer"
          providers={PROVIDERS}
          status={STATUS}
          attachments={files}
          onAttachmentsChange={setFiles}
        />
      </Frame>
    );
  },
};

/** A turn in flight: send greyed out, the mic listening. */
export const Disabled: Story = {
  args: { disabled: true, defaultListening: true, defaultValue: "Summarise the Q3 numbers and draft the board update.", defaultModel: "anthropic/opus-5", defaultPermission: "plan" },
  parameters: { controls: { include: ["disabled","defaultListening","defaultValue","defaultModel","defaultPermission","value","placeholder","permission","model","effort","defaultEffort","listening"] } },
  render: (args) => (
    <Frame>
      <ComposerPanel {...args}
        testID="composer"



        providers={PROVIDERS}


        status={STATUS}
      />
    </Frame>
  ),
};

/** No status tab, no model catalogue, no add menu: just the prompt, permissions, mic and send. */
export const Minimal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={480}>
      <ComposerPanel testID="composer" addMenu={[]} />
    </Frame>
  ),
};

/** The model picker on its own. */
export const Picker: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [model, setModel] = useState('openai/gpt-5.6-mini');
    const [effort, setEffort] = useState(1);
    return (
      <View style={{ paddingTop: 320, paddingLeft: 24, alignItems: 'flex-start' }}>
        <ModelPicker
          testID="picker"
          providers={PROVIDERS}
          value={model}
          onValueChange={setModel}
          effort={effort}
          onEffortChange={setEffort}
        />
      </View>
    );
  },
};

const PILL_MODELS = ['Composer 2.5', 'GPT-5.6 Sol', 'Fable 5', 'Sonnet 5'];
/** The same lineup on the identity contract: keyed and reported by id. */
const PILL_MODELS_BY_ID: ReadonlyArray<ModelPickerModel> = [
  { id: 'vibl/composer-2.5', name: 'Composer 2.5' },
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol' },
  { id: 'oxy/fable-5', name: 'Fable 5' },
  { id: 'anthropic/sonnet-5', name: 'Sonnet 5' },
];
const FOLDERS = [
  { prefix: 'users/maya/', name: 'project-sea' },
  { prefix: 'users/desktop/', name: 'vibl' },
  { prefix: 'users/documents/', name: 'bloom' },
];

/**
 * The AI chat's pill composer and its status bar: add menu, field, model menu
 * (Models + Effort), mic and send; below, the branch, the folder menu, the
 * agent mode and the context meter.
 */
export const Pill: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', paddingTop: 380, width: 700, gap: 10 }}>
      <ComposerPill testID="pill" models={PILL_MODELS} defaultModel="Fable 5" />
      <View style={{ paddingLeft: 6, paddingRight: 6 }}>
        <ComposerStatusBar branch="Main" folders={FOLDERS} mode="Agent" context={57} testID="status" />
      </View>
    </View>
  ),
};

/** Glass: inside a lit `ComposerLoader`, the controls sit on frosted chips over the light. */
export const PillGlass: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [working, setWorking] = useState(true);
    return (
      <View style={{ maxWidth: '100%', width: 700, gap: 16 }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button size="sm" onPress={() => setWorking((w) => !w)} appearance="outline" tone="neutral">
            {working ? 'Stop working' : 'Start working'}
          </Button>
        </View>
        <ComposerLoader active={working}>
          <ComposerPill surface={false} glass={working} models={PILL_MODELS} defaultModel="Fable 5" />
        </ComposerLoader>
      </View>
    );
  },
};

/** Listening and disabled states. */
export const PillStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 520, gap: 16 }}>
      <ComposerPill models={PILL_MODELS} defaultListening />
      <ComposerPill models={PILL_MODELS} disabled defaultValue="A long message that runs past the end of the field and fades out" />
    </View>
  ),
};

/**
 * A turn in flight: `busy` swaps send for the stop disc and `disabled` locks
 * everything else. Stop is the one control `disabled` does not reach — the
 * whole point of the pair is that cancelling stays possible while typing does
 * not.
 */
export const BusyAndStop: Story = {
  render: function Render() {
    const [busy, setBusy] = useState(true);
    return (
      <View style={{ width: 700, gap: 16 }}>
        <ComposerPanel
          busy={busy}
          disabled={busy}
          onStop={() => setBusy(false)}
          onSubmit={() => setBusy(true)}
          providers={PROVIDERS}
          defaultValue="Draft the release notes"
        />
        <ComposerLoader active={busy}>
          <ComposerPill
            surface={false}
            glass={busy}
            busy={busy}
            disabled={busy}
            onStop={() => setBusy(false)}
            onSubmit={() => setBusy(true)}
            models={PILL_MODELS_BY_ID}
            defaultModel="oxy/fable-5"
          />
        </ComposerLoader>
      </View>
    );
  },
};

/**
 * The pill's model menu on the same identity contract as `ModelPicker`:
 * `{ id, name }` entries, matched and reported by **id**, drawn by name. A
 * routing id is never a display string.
 *
 * `effortLevels={[]}` is the model with no effort axis — the menu is the model
 * rows alone, rather than an empty chip over a slider that cannot commit, and
 * `effort={null}` is a model whose effort is left to it.
 */
export const PillModelIdentity: Story = {
  render: function Render() {
    const [model, setModel] = useState('oxy/fable-5');
    return (
      <View style={{ paddingTop: 380, width: 700, gap: 16 }}>
        <ComposerPill models={PILL_MODELS_BY_ID} model={model} onModelChange={setModel} effort={null} />
        <ComposerPill models={PILL_MODELS_BY_ID} model={model} onModelChange={setModel} effortLevels={[]} />
      </View>
    );
  },
};
