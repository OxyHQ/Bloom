import { RiChat3Line } from '@oxy.so/bloom/icons';
import { VoiceControls } from '@oxy.so/bloom/voice';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { hold, type ParityCase } from './support/cases';

const set = () => {};
const end = () => {};
const type = () => {};
const handlers = { onEnd: end, onTypeInstead: type };

export const VOICE_CASES: ParityCase[] = [
  {
    name: 'VoiceControls',
    language: () => toElement(L.VoiceControls()),
    bloom: () => <VoiceControls />,
  },
  ...(['idle', 'listening', 'transcribing', 'thinking', 'speaking', 'error'] as const).map(
    (state) => ({
      name: `VoiceControls ${state}, every control`,
      language: () =>
        toElement(L.VoiceControls(state, handlers).muted([false, set]).paused([false, set])),
      bloom: () => (
        <VoiceControls
          state={state}
          {...handlers}
          muted={false}
          onMutedChange={set}
          paused={false}
          onPausedChange={set}
        />
      ),
    }),
  ),
  ...ENUMS.voiceSize.map((size) => ({
    name: `VoiceControls ${size}, muted and paused`,
    language: () =>
      toElement(
        L.VoiceControls('listening', { ...handlers })
          .muted([true, hold])
          .paused([true, hold])
          .size(size),
      ),
    bloom: () => (
      <VoiceControls
        onMutedChange={hold}
        onPausedChange={hold}
        state="listening"
        {...handlers}
        muted
        paused
        size={size}
      />
    ),
  })),
  {
    name: 'VoiceControls disabled',
    language: () => toElement(L.VoiceControls('listening', handlers).disabled()),
    bloom: () => <VoiceControls state="listening" {...handlers} disabled />,
  },
  {
    name: 'VoiceControls leading and trailing',
    language: () =>
      toElement(
        L.VoiceControls('speaking', {
          onEnd: end,
          leading: L.Icon(RiChat3Line),
          trailing: L.Text('0:42'),
        }),
      ),
    bloom: () => (
      <VoiceControls
        state="speaking"
        onEnd={end}
        leading={toElement(L.Icon(RiChat3Line))}
        trailing={<Text>0:42</Text>}
      />
    ),
  },
];
