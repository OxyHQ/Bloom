import { PlaybackProgress, PlayButton } from '@oxy.so/bloom/media-controls';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const seek = () => {};

export const MEDIA_CONTROL_CASES: ParityCase[] = [
  ...[false, true].map((playing) => ({
    name: `PlayButton ${playing ? 'playing' : 'paused'}`,
    language: () => toElement(L.PlayButton(playing).onPress(press)),
    bloom: () => <PlayButton playing={playing} onPress={press} />,
  })),
  ...ENUMS.playButtonSize.flatMap((size) =>
    ENUMS.playButtonStyle.map((variant) => ({
      name: `PlayButton ${size} ${variant}`,
      language: () => toElement(L.PlayButton(false).size(size).style(variant).onPress(press)),
      bloom: () => <PlayButton playing={false} size={size} variant={variant} onPress={press} />,
    })),
  ),
  {
    name: 'PlayButton loading, disabled, with a subject',
    language: () =>
      toElement(L.PlayButton(true, { subject: 'Night Drive' }).loading().disabled().onPress(press)),
    bloom: () => <PlayButton playing subject="Night Drive" loading disabled onPress={press} />,
  },
  {
    name: 'PlayButton not interactive, named',
    language: () =>
      toElement(L.PlayButton(false, { interactive: false }).label('Play the episode')),
    bloom: () => (
      <PlayButton playing={false} interactive={false} accessibilityLabel="Play the episode" />
    ),
  },
  {
    name: 'PlaybackProgress',
    language: () => toElement(L.PlaybackProgress(83, 225, { onSeek: seek })),
    bloom: () => <PlaybackProgress value={83} duration={225} onSeek={seek} />,
  },
  ...ENUMS.playbackTimes.map((timesPosition) => ({
    name: `PlaybackProgress times ${timesPosition}, buffered, remaining`,
    language: () =>
      toElement(
        L.PlaybackProgress(83, 225, { buffered: 140, showTimes: true, showRemaining: true }).style(
          timesPosition,
        ),
      ),
    bloom: () => (
      <PlaybackProgress
        value={83}
        duration={225}
        buffered={140}
        showTimes
        showRemaining
        timesPosition={timesPosition}
      />
    ),
  })),
  {
    name: 'PlaybackProgress disabled, named',
    language: () => toElement(L.PlaybackProgress(0, 60).disabled().label('Seek the episode')),
    bloom: () => (
      <PlaybackProgress value={0} duration={60} disabled accessibilityLabel="Seek the episode" />
    ),
  },
];
