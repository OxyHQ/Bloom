import { VideoView } from '@oxy.so/bloom/video-view';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const PLAYER = { play: () => {}, pause: () => {} } as never;

export const VIDEO_CASES: readonly ParityCase[] = [
  {
    name: 'a video',
    language: () => toElement(L.Video(PLAYER)),
    bloom: () => <VideoView player={PLAYER} />,
  },
  ...ENUMS.contentFit.map((fit) => ({
    name: `a video, ${fit}`,
    language: () =>
      toElement(L.Video(PLAYER).contentFit(fit).frame({ width: '320', height: '200' })),
    bloom: () => (
      <VideoView player={PLAYER} contentFit={fit as never} style={{ width: 320, height: 200 }} />
    ),
  })),
  {
    name: 'a video with its controls, no picture in picture',
    language: () =>
      toElement(L.Video(PLAYER).nativeControls(true).allowsPictureInPicture(false).testID('clip')),
    bloom: () => (
      <VideoView player={PLAYER} nativeControls allowsPictureInPicture={false} testID="clip" />
    ),
  },
];
