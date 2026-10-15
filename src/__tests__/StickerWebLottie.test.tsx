/**
 * @jest-environment jsdom
 *
 * The WEB `Sticker`, through its real loader (`sticker/lottie-module.web.ts`).
 *
 * `Sticker.test.tsx` hands in a stand-in player with `provideLottiePlayer`, so it
 * never exercises how the web player is LOADED. That is what this suite pins:
 * `@lottiefiles/dotlottie-react` (and the ~160 KiB dotlottie-web under it) is a
 * dynamic `import()` that runs only when an animated sticker mounts, the still
 * covers the wait, and the app's WebAssembly URL reaches the player without
 * loading it early. `mockImports` counts evaluations of the peer module: jest
 * evaluates a mock factory on first `require`, which is exactly what the
 * compiled `import()` does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ReactElement, useEffect } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => false,
}));

type Listener = () => void;

const mockState = {
  imports: 0,
  wasmUrls: [] as string[],
  listeners: {} as Record<string, Listener[]>,
};

jest.mock('@lottiefiles/dotlottie-react', () => {
  mockState.imports += 1;
  const instance = {
    play: () => undefined,
    pause: () => undefined,
    addEventListener: (event: string, listener: Listener) => {
      mockState.listeners[event] = [...(mockState.listeners[event] ?? []), listener];
    },
    removeEventListener: () => undefined,
  };
  function DotLottieReact(props: {
    src: string;
    dotLottieRefCallback?: (next: typeof instance | null) => void;
  }) {
    const { dotLottieRefCallback } = props;
    useEffect(() => {
      dotLottieRefCallback?.(instance);
    }, [dotLottieRefCallback]);
    return <canvas data-testid="dotlottie" data-src={props.src} />;
  }
  return {
    DotLottieReact,
    setWasmUrl: (url: string) => {
      mockState.wasmUrls.push(url);
    },
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Sticker, resetLottiePlayer, setLottieWasmUrl } from '../sticker/index.web';

let container: HTMLDivElement;
let root: Root;

function mount(ui: ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

/** Lets the dynamic import's promise chain settle and React commit what it set. */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

function has(id: string): boolean {
  return container.querySelector(`[data-testid="${id}"]`) !== null;
}

function fire(event: string) {
  act(() => {
    for (const listener of mockState.listeners[event] ?? []) listener();
  });
}

beforeEach(() => {
  resetLottiePlayer();
  mockState.wasmUrls = [];
  mockState.listeners = {};
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const STILL = 'https://cloud.oxy.invalid/s.webp';
const ANIMATION = 'https://cloud.oxy.invalid/s.json';
const WASM = 'https://app.oxy.invalid/assets/dotlottie-player.wasm';

// Ordered: the first two run before anything has imported the peer, which is
// the claim (jest keeps a mocked module for the whole file once evaluated).
describe('web Sticker loads its Lottie player on demand', () => {
  it('does not load the player for a still sticker, nor for setting the wasm URL', async () => {
    setLottieWasmUrl(WASM);
    mount(<Sticker fallback={STILL} testID="s" />);
    await settle();

    expect(has('s-still')).toBe(true);
    expect(mockState.imports).toBe(0);
    expect(mockState.wasmUrls).toEqual([]);
  });

  it('shows the still while the player loads, then hands the animation over', async () => {
    setLottieWasmUrl(WASM);
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);

    // First commit: the import has only been started, so the still is all there is.
    expect(has('s-still')).toBe(true);
    expect(has('dotlottie')).toBe(false);

    await settle();
    expect(mockState.imports).toBe(1);
    // The app's WebAssembly URL reached dotLottie before its first player rendered.
    expect(mockState.wasmUrls).toEqual([WASM]);
    expect(container.querySelector('[data-testid="dotlottie"]')?.getAttribute('data-src')).toBe(
      ANIMATION,
    );
    // Loaded but not yet playing: still visible until the animation reports in.
    expect(has('s-still')).toBe(true);

    fire('load');
    expect(has('s-still')).toBe(false);
    expect(has('dotlottie')).toBe(true);
  });

  it('applies a wasm URL set after the player has loaded', async () => {
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);
    await settle();
    expect(has('dotlottie')).toBe(true);

    setLottieWasmUrl(WASM);
    expect(mockState.wasmUrls).toEqual([WASM]);
  });

  it('falls back to the still for good when the animation fails to load', async () => {
    mount(<Sticker animation={ANIMATION} fallback={STILL} testID="s" />);
    await settle();
    fire('loadError');
    expect(has('s-still')).toBe(true);
    expect(has('s-animation')).toBe(false);
  });
});

// The runtime cases above cannot tell a bundler-visible `require` from an
// `import()` — jest evaluates both lazily. The difference is the whole point
// (a `require` is collected into the importing chunk; an `import()` is a split
// point), so the source shape is pinned directly.
it('loads the web player through a dynamic import, never a require', () => {
  const code = readFileSync(join(__dirname, '..', 'sticker', 'lottie-module.web.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  expect(code).not.toMatch(/\brequire\s*\(/);
  expect(code).toMatch(/\bimport\(\s*'@lottiefiles\/dotlottie-react'\s*\)/);
});
