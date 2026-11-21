import { Text } from '@oxy.so/bloom/typography';
import {
  createViewableKeysStore,
  VideoPlaybackProvider,
  VideoViewabilityProvider,
  VideoViewabilityScope,
} from '@oxy.so/bloom/video-playback';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const ON_SCREEN: ReadonlySet<string> = new Set(['post-1', 'post-2']);
const STORE = createViewableKeysStore();

export const VIDEO_PLAYBACK_CASES: readonly ParityCase[] = [
  {
    name: 'the playback election around a screen',
    language: () => toElement(L.VideoPlayback(L.Text('Feed'))),
    bloom: () => (
      <VideoPlaybackProvider>
        <Text>Feed</Text>
      </VideoPlaybackProvider>
    ),
  },
  {
    name: 'no autoplay for a subtree',
    language: () => toElement(L.VideoPlayback(L.Text('Feed'), L.Text('More')).autoplay(false)),
    bloom: () => (
      <VideoPlaybackProvider autoplay={false}>
        <Text>Feed</Text>
        <Text>More</Text>
      </VideoPlaybackProvider>
    ),
  },
  {
    name: 'a list whose keys on screen are derived, and an item scope',
    language: () =>
      toElement(
        L.VideoPlayback(
          L.VideoViewability(ON_SCREEN, L.VideoViewabilityScope('post-1', L.Text('Post'))),
        ),
      ),
    bloom: () => (
      <VideoPlaybackProvider>
        <VideoViewabilityProvider viewableKeys={ON_SCREEN}>
          <VideoViewabilityScope viewabilityKey="post-1">
            <Text>Post</Text>
          </VideoViewabilityScope>
        </VideoViewabilityProvider>
      </VideoPlaybackProvider>
    ),
  },
  {
    name: 'a list that publishes its keys to a store',
    language: () => toElement(L.VideoViewability(STORE, L.Text('Post'))),
    bloom: () => (
      <VideoViewabilityProvider store={STORE}>
        <Text>Post</Text>
      </VideoViewabilityProvider>
    ),
  },
];
