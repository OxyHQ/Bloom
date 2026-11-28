/** `@oxy.so/bloom-language/video-view`: videos. */
export { Video } from '../controls/video-view';
export type { VideoView } from '../controls/video-view';
export {
  provideVideoPlayers,
  setVideoDecoders,
  videoAttach,
  videoPause,
  videoPlay,
  videoRelease,
  videoSeek,
} from '../controls/video-pool';
export type { PlayerFactory, PooledPlayer, VideoModel } from '../controls/video-pool';
