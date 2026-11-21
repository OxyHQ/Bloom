import {
  COMPOSER_PANEL_ADD_MENU,
  COMPOSER_PANEL_PERMISSIONS,
  ComposerPanel,
  ComposerPanelStatusTab,
  ComposerPill,
} from '@oxy.so/bloom/composer-panel';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const PROVIDERS = [
  {
    id: 'oxy',
    name: 'Oxy',
    models: [
      { id: 'fast', name: 'Fast' },
      { id: 'deep', name: 'Deep' },
    ],
  },
];
const ATTACHMENTS = [
  { id: 'a', name: 'plan.pdf', kind: 'document' as const, progress: 0.5 },
  { id: 'b', name: 'data.csv', kind: 'spreadsheet' as const, error: 'Too large' },
];
const VOICE = ['idle', 'recording', 'transcribing'] as const;

const panels: ParityCase[] = [
  {
    name: 'ComposerPanel',
    language: () => toElement(L.ComposerPanel(['', set])),
    bloom: () => <ComposerPanel value="" onValueChange={set} />,
  },
  {
    name: 'ComposerPanel with a prompt, menus and models',
    language: () =>
      toElement(
        L.ComposerPanel(['Plan the trip', set], {
          onSubmit: set,
          placeholder: 'Ask anything',
          permissions: COMPOSER_PANEL_PERMISSIONS,
          addMenu: COMPOSER_PANEL_ADD_MENU,
          providers: PROVIDERS,
          model: 'deep',
          effort: 2,
          showVoice: true,
        }),
      ),
    bloom: () => (
      <ComposerPanel
        value="Plan the trip"
        onValueChange={set}
        onSubmit={set}
        placeholder="Ask anything"
        permissions={COMPOSER_PANEL_PERMISSIONS}
        addMenu={COMPOSER_PANEL_ADD_MENU}
        providers={PROVIDERS}
        model="deep"
        effort={2}
        showVoice
      />
    ),
  },
  {
    name: 'ComposerPanel busy, with attachments and a status',
    language: () =>
      toElement(
        L.ComposerPanel(['', set], {
          busy: true,
          onStop: set,
          attachments: ATTACHMENTS,
          onRemoveAttachment: set,
          status: L.Text('Working…'),
        }),
      ),
    bloom: () => (
      <ComposerPanel
        value=""
        onValueChange={set}
        busy
        onStop={set}
        attachments={ATTACHMENTS}
        onRemoveAttachment={set}
        status={<Text>Working…</Text>}
      />
    ),
  },
  {
    name: 'ComposerPanel disabled',
    language: () => toElement(L.ComposerPanel(['', set]).disabled()),
    bloom: () => <ComposerPanel value="" onValueChange={set} disabled />,
  },
  ...VOICE.map((voiceState) => ({
    name: `ComposerPanel voice ${voiceState}`,
    language: () => toElement(L.ComposerPanel(['', set], { showVoice: true, voiceState })),
    bloom: () => <ComposerPanel value="" onValueChange={set} showVoice voiceState={voiceState} />,
  })),
];

const pills: ParityCase[] = [
  {
    name: 'ComposerPill',
    language: () => toElement(L.ComposerPill(['', set])),
    bloom: () => <ComposerPill value="" onValueChange={set} />,
  },
  {
    name: 'ComposerPill with a prompt, models and an error',
    language: () =>
      toElement(
        L.ComposerPill(['Summarise', set], {
          onSubmit: set,
          models: ['Fast', 'Deep'],
          model: 'Fast',
          permissions: COMPOSER_PANEL_PERMISSIONS,
          error: 'Could not send',
          maxLines: 4,
        }),
      ),
    bloom: () => (
      <ComposerPill
        value="Summarise"
        onValueChange={set}
        onSubmit={set}
        models={['Fast', 'Deep']}
        model="Fast"
        permissions={COMPOSER_PANEL_PERMISSIONS}
        error="Could not send"
        maxLines={4}
      />
    ),
  },
  {
    name: 'ComposerPill without its surface, frosted, disabled',
    language: () =>
      toElement(L.ComposerPill(['', set], { frosted: true }).surface(false).disabled()),
    bloom: () => <ComposerPill value="" onValueChange={set} frosted surface={false} disabled />,
  },
  ...VOICE.map((voiceState) => ({
    name: `ComposerPill voice ${voiceState}, busy`,
    language: () =>
      toElement(L.ComposerPill(['', set], { showVoice: true, voiceState, busy: true })),
    bloom: () => (
      <ComposerPill value="" onValueChange={set} showVoice voiceState={voiceState} busy />
    ),
  })),
  {
    name: 'ComposerPanelStatusTab',
    language: () =>
      toElement(L.ComposerPanelStatusTab({ branch: 'main', project: 'bloom', context: 42 })),
    bloom: () => <ComposerPanelStatusTab branch="main" project="bloom" context={42} />,
  },
];

export const COMPOSER_PANEL_CASES: ParityCase[] = [...panels, ...pills];
