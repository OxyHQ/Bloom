import { Sticker } from '@oxy.so/bloom/sticker';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const PARTY = 'https://stickers.oxy.so/party.lottie';
const STILL = 'https://stickers.oxy.so/party.webp';

/**
 * `Lottie()` is Bloom's `Sticker` (the one Lottie path). It plays once unless
 * it loops, and pauses while its screen is not in front; a still is its fallback.
 */
export const STICKER_CASES: readonly ParityCase[] = [
  {
    name: 'a sticker',
    language: () => toElement(L.Lottie(PARTY)),
    bloom: () => <Sticker animation={PARTY} fallback="" loop={false} paused={false} />,
  },
  {
    name: 'a looping sticker',
    language: () => toElement(L.Lottie(PARTY).loop()),
    bloom: () => <Sticker animation={PARTY} fallback="" loop paused={false} />,
  },
  {
    name: 'a paused sticker',
    language: () => toElement(L.Lottie(PARTY).loop().paused(true)),
    bloom: () => <Sticker animation={PARTY} fallback="" loop paused />,
  },
  {
    name: 'a sticker with its still, named',
    language: () => toElement(L.Lottie(PARTY).fallback(L.Image(STILL, 'Party popper'))),
    bloom: () => (
      <Sticker
        animation={PARTY}
        fallback={STILL}
        accessibilityLabel="Party popper"
        loop={false}
        paused={false}
      />
    ),
  },
  {
    name: 'a sticker at its own edge',
    language: () => toElement(L.Lottie(PARTY).frame({ width: '96' })),
    bloom: () => <Sticker animation={PARTY} fallback="" size={96} loop={false} paused={false} />,
  },
  {
    name: 'a sticker its container names',
    language: () => toElement(L.Lottie(PARTY).fallback(L.Image(STILL)).decorative()),
    bloom: () => (
      <Sticker animation={PARTY} fallback={STILL} decorative loop={false} paused={false} />
    ),
  },
];
