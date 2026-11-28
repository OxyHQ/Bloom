/**
 * The standard library's `VideoPlayer` and `Video(player:)` / `Video(url:poster:)` (AVKit's
 * shape), over the language's pool: one decoding player at a time by default, a player that
 * starts takes the decoder from the one before, which pauses and keeps its position.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = Parameters<typeof toElement>[0];
type Model = { isMuted: boolean; isPlaying: boolean; currentTime: number };
// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/Videos.bloom') as {
  makePlayer: (url: { absoluteString: string }) => Model;
  FeedVideo: (props: {
    url: { absoluteString: string };
    poster: { absoluteString: string };
  }) => Node;
};
const std = require('./packages/format-app/.bloom/std/Bloom/Video.bloom') as {
  VideoPlayer$play: (p: Model) => void;
  VideoPlayer$pause: (p: Model) => void;
};
const pool = require('@oxy.so/bloom-language/video-view') as {
  provideVideoPlayers: (f: ((url: string) => unknown) | null | undefined) => void;
};

interface Fake {
  url: string;
  playing: boolean;
  muted: boolean;
  loop: boolean;
  currentTime: number;
  duration: number;
  timeUpdateEventInterval: number;
  released: boolean;
  play(): void;
  pause(): void;
  release(): void;
  addListener(): { remove(): void };
}
let made: Fake[] = [];
beforeEach(() => {
  made = [];
  pool.provideVideoPlayers((url) => {
    const player: Fake = {
      url,
      playing: false,
      muted: false,
      loop: false,
      currentTime: 0,
      duration: 10,
      timeUpdateEventInterval: 0,
      released: false,
      play() {
        this.playing = true;
      },
      pause() {
        this.playing = false;
      },
      release() {
        this.released = true;
      },
      addListener: () => ({ remove() {} }),
    };
    made.push(player);
    return player;
  });
});
afterAll(() => pool.provideVideoPlayers(undefined));

const url = (absoluteString: string) => ({ absoluteString });

it('plays a VideoPlayer from the pool, with its settings and position', () => {
  const a = m.makePlayer(url('https://v/a.mp4'));
  expect(made).toHaveLength(0);
  std.VideoPlayer$play(a);
  expect(made).toHaveLength(1);
  expect(made[0]).toMatchObject({
    url: 'https://v/a.mp4',
    muted: true,
    currentTime: 2,
    playing: true,
  });
  expect(a.isPlaying).toBe(true);
  std.VideoPlayer$pause(a);
  expect(made[0]?.playing).toBe(false);
});

it('hands the one decoder to the player that starts', () => {
  const a = m.makePlayer(url('https://v/a.mp4'));
  const b = m.makePlayer(url('https://v/b.mp4'));
  std.VideoPlayer$play(a);
  std.VideoPlayer$play(b);
  expect(made.map((p) => [p.url, p.released])).toEqual([
    ['https://v/a.mp4', true],
    ['https://v/b.mp4', false],
  ]);
  expect(a.isPlaying).toBe(false);
  expect(b.isPlaying).toBe(true);
  // `a` plays again from where it was, taking the decoder back.
  std.VideoPlayer$play(a);
  expect(made[2]).toMatchObject({ url: 'https://v/a.mp4', currentTime: 2 });
  expect(made[1]?.released).toBe(true);
});

it("draws a URL's own video with its poster until it plays", () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      toElement(m.FeedVideo({ url: url('https://v/c.mp4'), poster: url('https://v/c.jpg') })),
    );
  });
  const images = r.root.findAll(
    (n) => (n.props as { source?: unknown }).source === 'https://v/c.jpg',
  );
  expect(images.length).toBeGreaterThan(0);
  act(() => r.unmount());
});
