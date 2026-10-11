/**
 * @jest-environment jsdom
 */

/**
 * INLINE PLAYBACK, READ OFF THE ELEMENT.
 *
 * iPhone Safari plays a `<video>` inline only when it carries `playsinline`;
 * without it a muted autoplay is refused and the element keeps showing its
 * poster. expo-video's web view writes the attribute only when a caller passes
 * `playsInline`, and no Oxy app did — so on iPhones every feed, reel and
 * preview video showed its poster and never started.
 *
 * The only place that defect is visible is the DOM attribute, so this suite
 * renders expo-video's REAL web view (its source, not a stand-in) through the
 * REAL react-native-web into jsdom, and reads the attribute back. A mock view
 * would echo the prop and pass with or without the fix. The control is that
 * same real view rendered without Bloom: it must come out WITHOUT the
 * attribute, or this suite is measuring its own harness.
 */
import { act, createElement, createRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// The repo-wide mocks render these as string tags react-dom does not know. The
// box and the poster are not under test here — only the `<video>` is.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native-web');
  return { __esModule: true, default: { View } };
});
jest.mock('expo-image', () => ({ Image: () => null }));
// expo-video's web player reaches React Native's Flow-typed asset resolver for
// numeric `require()` sources only; none is used here, and jest cannot parse it.
jest.mock('react-native/Libraries/Image/resolveAssetSource', () => ({
  __esModule: true,
  default: () => null,
}));

import * as expoVideoModule from '../media-flight/expo-video-module';
import {
  provideExpoVideo,
  resetExpoVideoModule,
  type ExpoVideoLike,
} from '../media-flight/expo-video-module';
import { MediaSurface } from '../media-flight/MediaSurface';
import { VideoView, type VideoViewHandle } from '../video-view';

// expo-video's web player extends the `SharedObject` expo-modules-core installs
// on `globalThis.expo` at startup; the view only needs the class to exist.
(globalThis as { expo?: unknown }).expo = { SharedObject: class SharedObject {} };

// `jest.requireActual` rather than an import: the bare `expo-video` specifier is
// mapped to a mock repo-wide, and this suite needs the real web view. Typed by
// Bloom's slice, not by its source's own types, which would pull expo-video's
// sources into the repo's typecheck.
const { VideoView: ExpoWebVideoView } = jest.requireActual<ExpoVideoLike>(
  'expo-video/src/VideoView.web',
);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The members expo-video's web view calls on its player while mounting. */
const PLAYER = {
  playing: false,
  play: () => {},
  pause: () => {},
  mountVideoView: () => {},
  unmountVideoView: () => {},
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  provideExpoVideo({ VideoView: ExpoWebVideoView });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetExpoVideoModule();
});

function render(element: ReactElement): HTMLVideoElement {
  act(() => root.render(element));
  const videos = container.querySelectorAll('video');
  expect(videos).toHaveLength(1);
  return videos[0] as HTMLVideoElement;
}

describe('VideoView (web)', () => {
  it('CONTROL: expo-video alone renders a <video> iPhone Safari will not play inline', () => {
    const video = render(createElement(ExpoWebVideoView, { player: PLAYER }));
    expect(video.hasAttribute('playsinline')).toBe(false);
  });

  it('renders a <video> that plays inline by default', () => {
    const video = render(<VideoView player={PLAYER} nativeControls={false} />);
    expect(video.hasAttribute('playsinline')).toBe(true);
    // The caller's own props still reach expo-video's element.
    expect(video.hasAttribute('controls')).toBe(false);
  });

  it('lets a caller opt out', () => {
    const video = render(<VideoView player={PLAYER} playsInline={false} />);
    expect(video.hasAttribute('playsinline')).toBe(false);
  });

  it("forwards the ref to expo-video's own view", () => {
    const ref = createRef<VideoViewHandle>();
    render(<VideoView ref={ref} player={PLAYER} />);
    expect(typeof ref.current?.enterFullscreen).toBe('function');
    expect(typeof ref.current?.startPictureInPicture).toBe('function');
  });

  it('renders nothing, and warns, when expo-video cannot be loaded', () => {
    // Under jest the bare specifier always resolves (to the repo-wide mock), so
    // a missing peer is modelled at the boundary itself.
    const load = jest.spyOn(expoVideoModule, 'loadExpoVideo').mockReturnValue(null);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      act(() => root.render(<VideoView player={PLAYER} />));
      expect(container.querySelector('video')).toBeNull();
      expect(String(warn.mock.calls[0]?.[0])).toContain('expo-video');
    } finally {
      load.mockRestore();
      warn.mockRestore();
    }
  });
});

describe('MediaSurface (web)', () => {
  it('paints its video arm with a <video> that plays inline', () => {
    const video = render(
      <MediaSurface content={{ kind: 'video', player: PLAYER, poster: 'poster.jpg' }} />,
    );
    expect(video.hasAttribute('playsinline')).toBe(true);
  });
});
