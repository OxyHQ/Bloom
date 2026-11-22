import { LyricsPreviewCard, LyricsView } from '@oxy.so/bloom/lyrics';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const seek = () => {};
const show = () => {};
const WORDS = [
  'Streetlights hum a quiet tune',
  'Paper lanterns chase the moon',
  'We were counting every train',
  'Rolling out beneath the rain',
  '',
  'Hold the night a little longer',
  'Every hour makes us stronger',
];
const LINES = WORDS.map((text, index) => ({ time: 4 + index * 3.5, text }));
const PLAIN = WORDS.join('\n');
const PROVIDER = 'Lyrics licensed from the publisher';

export const LYRICS_CASES: ParityCase[] = [
  ...ENUMS.lyricsSize.map((size) => ({
    name: `LyricsView ${size}`,
    language: () =>
      toElement(
        L.LyricsView(LINES, {
          currentTime: 12,
          onSeekLine: seek,
          providerText: PROVIDER,
          footer: L.Text('Written by Juniper Vale'),
        }).size(size),
      ),
    bloom: () => (
      <LyricsView
        lines={LINES}
        currentTime={12}
        onSeekLine={seek}
        providerText={PROVIDER}
        footer={<Text>Written by Juniper Vale</Text>}
        size={size}
      />
    ),
  })),
  {
    name: 'LyricsView from the artwork, named',
    language: () =>
      toElement(
        L.LyricsView(LINES, { currentTime: 20, artworkColor: '#3a2a6b' })
          .size('medium')
          .label('Lyrics'),
      ),
    bloom: () => (
      <LyricsView
        lines={LINES}
        currentTime={20}
        artworkColor="#3a2a6b"
        size="medium"
        accessibilityLabel="Lyrics"
      />
    ),
  },
  {
    name: 'LyricsView plain text',
    language: () => toElement(L.LyricsView([], { text: PLAIN }).size('small')),
    bloom: () => <LyricsView lines={[]} text={PLAIN} size="small" />,
  },
  {
    name: 'LyricsView empty',
    language: () => toElement(L.LyricsView([], { emptyText: 'No lyrics yet' }).size('small')),
    bloom: () => <LyricsView lines={[]} emptyText="No lyrics yet" size="small" />,
  },
  ...([4, 5] as const).map((visible) => ({
    name: `LyricsPreviewCard ${visible} lines`,
    language: () =>
      toElement(
        L.LyricsPreviewCard(LINES, {
          currentTime: 12,
          onShowLyrics: show,
          onSeekLine: seek,
          providerText: PROVIDER,
        }).lines(visible),
      ),
    bloom: () => (
      <LyricsPreviewCard
        lines={LINES}
        currentTime={12}
        onShowLyrics={show}
        onSeekLine={seek}
        providerText={PROVIDER}
        visibleLines={visible}
      />
    ),
  })),
  {
    name: 'LyricsPreviewCard plain text, from the artwork',
    language: () =>
      toElement(L.LyricsPreviewCard([], { text: PLAIN, artworkColor: '#3a2a6b', title: 'Lyrics' })),
    bloom: () => (
      <LyricsPreviewCard lines={[]} text={PLAIN} artworkColor="#3a2a6b" title="Lyrics" />
    ),
  },
];
