import { AmbientPhoto } from '@oxy.so/bloom/ambient-photo';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const PHOTO = 'https://example.com/frame/1.jpg';
const shown = () => {};

/**
 * The photo cross-fades in on a timer and drifts while it rests, so two side
 * by side in Chrome are read at different frames: Jest compares them as they
 * mount, and the story leaves them out.
 */
export const AMBIENT_PHOTO_CASES_MOVING: ParityCase[] = [
  {
    name: 'AmbientPhoto',
    language: () => toElement(L.AmbientPhoto(PHOTO)),
    bloom: () => <AmbientPhoto source={PHOTO} />,
  },
  {
    name: 'AmbientPhoto no drift, a short fade, reporting, framed',
    language: () =>
      toElement(
        L.AmbientPhoto(PHOTO, { drift: false, fadeMs: 800, onShown: shown }).frame({
          width: '64',
          height: '64',
        }),
      ),
    bloom: () => (
      <AmbientPhoto
        source={PHOTO}
        drift={false}
        fadeMs={800}
        onShown={shown}
        style={{ width: 64, height: 64 }}
      />
    ),
  },
  {
    name: 'AmbientPhoto none yet',
    language: () => toElement(L.AmbientPhoto(null, { driftMs: 30000, driftScale: 1.02 })),
    bloom: () => <AmbientPhoto source={null} driftMs={30000} driftScale={1.02} />,
  },
];
