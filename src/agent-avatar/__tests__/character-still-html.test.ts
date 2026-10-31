import { characterStillHtml } from '../character-still-html';

const PNG = 'data:image/png;base64,QUJD';
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

async function bridge(createAvatar: jest.Mock) {
  const canvases: { style: Record<string, string>; remove: jest.Mock; toDataURL: jest.Mock }[] = [];
  const listeners: Record<string, () => void> = {};
  const window = {
    ReactNativeWebView: { postMessage: jest.fn() },
    addEventListener: (name: string, callback: () => void) => {
      listeners[name] = callback;
    },
    renderStill: undefined as unknown as (job: unknown) => Promise<void>,
  };
  const document = {
    body: { append: jest.fn() },
    createElement: () => {
      const canvas = { style: {}, remove: jest.fn(), toDataURL: jest.fn(() => PNG) };
      canvases.push(canvas);
      return canvas;
    },
  };
  const load = jest.fn(async () => ({ createAvatar }));
  const html = characterStillHtml('https://example.test/runtime.mjs');
  const code = html
    .match(/<script type="module">([\s\S]*?)<\/script>/)![1]!
    .replace('import("https://example.test/runtime.mjs")', 'load()');
  await new AsyncFunction('window', 'document', 'load', code)(window, document, load);
  return { window, canvases, listeners, load, reports: window.ReactNativeWebView.postMessage };
}

it('loads once, captures after readiness, retains the preceding scene until the next is ready', async () => {
  const controllers: { dispose: jest.Mock }[] = [];
  const create = jest.fn(async (_canvas, _props, callbacks) => {
    callbacks.onReady(); // May happen before the promise returns its controller.
    const controller = { dispose: jest.fn() };
    controllers.push(controller);
    return controller;
  });
  const page = await bridge(create);
  await page.window.renderStill({ id: 1, css: 64, character: { preset: 'blue_beret' } });
  expect(controllers[0]!.dispose).not.toHaveBeenCalled();
  expect(page.reports).toHaveBeenLastCalledWith(`snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  await page.window.renderStill({ id: 2, css: 128, character: { preset: 'alfred' } });
  expect(page.load).toHaveBeenCalledTimes(1);
  expect(controllers[0]!.dispose).toHaveBeenCalledTimes(1);
  expect(controllers[1]!.dispose).not.toHaveBeenCalled();
  expect(create.mock.calls[1]![1]).toMatchObject({ paused: true, portrait: true, reduced: true });
  page.listeners.pagehide!();
  expect(controllers[1]!.dispose).toHaveBeenCalledTimes(1);
});

it('releases a late controller after a renderer error, without reporting a second result', async () => {
  let finish!: (value: { dispose: jest.Mock }) => void;
  const controller = { dispose: jest.fn() };
  const page = await bridge(
    jest.fn((_canvas, _props, callbacks) => {
      callbacks.onError();
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
  );
  await page.window.renderStill({ id: 1, css: 64, character: {} });
  finish(controller);
  await Promise.resolve();
  expect(controller.dispose).toHaveBeenCalledTimes(1);
  expect(page.reports.mock.calls).toEqual([
    ['loaded'],
    [`snapshot:${JSON.stringify({ id: 1, uri: null })}`],
  ]);
});

it('releases a job completing after its document closes and never sends its snapshot', async () => {
  let finish!: (value: { dispose: jest.Mock }) => void;
  const controller = { dispose: jest.fn() };
  const page = await bridge(
    jest.fn((_canvas, _props, callbacks) => {
      callbacks.onReady();
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
  );
  const drawing = page.window.renderStill({ id: 1, css: 64, character: {} });
  page.listeners.pagehide!();
  finish(controller);
  await drawing;
  expect(controller.dispose).toHaveBeenCalled();
  expect(page.canvases[0]!.toDataURL).not.toHaveBeenCalled();
  expect(page.reports.mock.calls).toEqual([['loaded']]);
});
