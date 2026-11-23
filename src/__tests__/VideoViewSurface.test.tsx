/**
 * Android draws Bloom's video on a TextureView unless the caller says otherwise: expo-video's own
 * default, a SurfaceView, is composited outside the view hierarchy, and on a Pixel 8a the lens
 * bottom bar over a feed video lost its glass wherever the video was under it.
 */
import { render } from '@testing-library/react-native';

import { provideExpoVideo, resetExpoVideoModule } from '../media-flight/expo-video-module';
import { VideoView } from '../video-view/VideoView';

const seen: Record<string, unknown>[] = [];
function NativeVideoView(props: Record<string, unknown>) {
  seen.push(props);
  return null;
}

beforeEach(() => {
  seen.length = 0;
  provideExpoVideo({ VideoView: NativeVideoView as never });
});
afterEach(() => resetExpoVideoModule());

it('draws on a TextureView by default', () => {
  render(<VideoView player={null} />);
  expect(seen[seen.length - 1]?.surfaceType).toBe('textureView');
});

it('keeps the surface a caller names', () => {
  render(<VideoView player={null} surfaceType="surfaceView" />);
  expect(seen[seen.length - 1]?.surfaceType).toBe('surfaceView');
});
