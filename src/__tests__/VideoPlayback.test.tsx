/**
 * The playback authority's decision logic, on the native branch (`Platform.OS`
 * is `ios` here): which player is elected audible, how viewability and screen
 * visibility gate it, and how one player shared by several presenters is told
 * to play. Real autoplay, scrolling and backgrounding need a browser and a
 * device; nothing below claims them.
 */
import type { ReactElement } from 'react';
import { act, render } from '@testing-library/react-native';
import type { VideoPlayer } from 'expo-video';

import { useScreenVisible } from '../screen/use-screen-visible';
import {
  type ControlledVideoPlayer,
  createViewableKeysStore,
  type UseVideoPlaybackOptions,
  type UseVideoPlaybackResult,
  useVideoPlayback,
  useVideoPlaybackControl,
  useViewableVisible,
  VideoPlaybackProvider,
  VideoViewabilityProvider,
  VideoViewabilityScope,
} from '../video-playback';

jest.mock('../screen/use-screen-visible', () => ({ useScreenVisible: jest.fn(() => true) }));

// A real expo-video player must satisfy the structural slice the control drives.
type Assignable<T extends ControlledVideoPlayer> = T;
type _RealPlayerIsControllable = Assignable<VideoPlayer>;

const probes = new Map<string, UseVideoPlaybackResult>();

function Player(options: UseVideoPlaybackOptions): null {
  probes.set(options.id, useVideoPlayback(options));
  return null;
}

const playing = (): string[] =>
  [...probes].filter(([, probe]) => probe.shouldPlay).map(([id]) => id);

function Feed({ keys, children }: { keys: string[]; children: ReactElement | ReactElement[] }) {
  return (
    <VideoPlaybackProvider>
      <VideoViewabilityProvider viewableKeys={new Set(keys)}>{children}</VideoViewabilityProvider>
    </VideoPlaybackProvider>
  );
}

beforeEach(() => {
  jest.mocked(useScreenVisible).mockReturnValue(true);
  probes.clear();
});

describe('video playback authority', () => {
  it('plays only the earliest viewable audible player, and nothing once none is viewable', () => {
    const players = [
      <Player key="a" id="a" viewabilityKey="post-a" />,
      <Player key="b" id="b" viewabilityKey="post-b" />,
      <Player key="c" id="c" viewabilityKey="post-c" />,
    ];
    const view = render(<Feed keys={['post-a', 'post-b']}>{players}</Feed>);
    expect(playing()).toEqual(['a']);

    view.rerender(<Feed keys={['post-b', 'post-c']}>{players}</Feed>);
    expect(playing()).toEqual(['b']);

    view.rerender(<Feed keys={[]}>{players}</Feed>);
    expect(playing()).toEqual([]);
  });

  it('lets every visible silent player play without taking the audible slot', () => {
    render(
      <Feed keys={['gif-1', 'gif-2', 'post-a']}>
        <Player id="gif-1" viewabilityKey="gif-1" silent />
        <Player id="gif-2" viewabilityKey="gif-2" silent />
        <Player id="a" viewabilityKey="post-a" />
      </Feed>,
    );
    expect(playing().sort()).toEqual(['a', 'gif-1', 'gif-2']);
  });

  it('hands the slot to a manual claim, and drops the claim once it leaves view', () => {
    const players = [
      <Player key="a" id="a" viewabilityKey="post-a" />,
      <Player key="b" id="b" viewabilityKey="post-b" />,
    ];
    const view = render(<Feed keys={['post-a', 'post-b']}>{players}</Feed>);
    act(() => probes.get('b')?.claimActive());
    expect(playing()).toEqual(['b']);

    view.rerender(<Feed keys={['post-a']}>{players}</Feed>);
    view.rerender(<Feed keys={['post-a', 'post-b']}>{players}</Feed>);
    expect(playing()).toEqual(['a']);
  });

  it('plays nothing on a hidden screen, except the Picture-in-Picture owner', () => {
    jest.mocked(useScreenVisible).mockReturnValue(false);
    render(
      <Feed keys={['post-a']}>
        <Player id="a" viewabilityKey="post-a" />
        <Player id="pip" viewabilityKey="post-gone" ownsSession />
      </Feed>,
    );
    expect(playing()).toEqual(['pip']);
    expect(probes.get('a')?.canLoad).toBe(false);
    expect(probes.get('pip')?.canLoad).toBe(true);
  });

  it('binds a scope to one key, and a store-published set reaches its players', () => {
    const store = createViewableKeysStore(new Set(['header']));
    render(
      <VideoPlaybackProvider>
        <VideoViewabilityProvider store={store}>
          <VideoViewabilityScope viewabilityKey="header">
            <Player id="header-video" viewabilityKey="unknown-to-the-list" />
          </VideoViewabilityScope>
          <Player id="row" viewabilityKey="row" />
        </VideoViewabilityProvider>
      </VideoPlaybackProvider>,
    );
    expect(playing()).toEqual(['header-video']);

    act(() => store.publish(new Set(['row'])));
    expect(playing()).toEqual(['row']);
  });

  it('answers row visibility for a view that is not a video', () => {
    const seen = new Map<string, boolean>();
    function Card({ id }: { id: string }): null {
      seen.set(id, useViewableVisible({ viewabilityKey: id, target: { current: null } }));
      return null;
    }
    render(
      <Feed keys={['one']}>
        <Card id="one" />
        <Card id="two" />
      </Feed>,
    );
    expect(Object.fromEntries(seen)).toEqual({ one: true, two: false });
  });
});

describe('useVideoPlaybackControl', () => {
  it('plays a shared player while ANY presenter asks, and pauses when none does', () => {
    const player = {
      playing: false,
      status: 'readyToPlay',
      play: jest.fn(),
      pause: jest.fn(),
      addListener: () => ({ remove: () => {} }),
    } satisfies ControlledVideoPlayer;
    function Presenter({ play }: { play: boolean }): null {
      useVideoPlaybackControl(player, play);
      return null;
    }

    const view = render(
      <>
        <Presenter play={false} />
        <Presenter play />
      </>,
    );
    expect(player.play).toHaveBeenCalled();

    player.pause.mockClear();
    view.rerender(
      <>
        <Presenter play={false} />
        <Presenter play={false} />
      </>,
    );
    expect(player.pause).toHaveBeenCalledTimes(1);
  });
});
