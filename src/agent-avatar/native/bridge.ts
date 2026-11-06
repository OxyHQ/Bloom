import type { NativeBridge, ExpoContext } from './types';

type NativeModule = Omit<NativeBridge, 'present'> & {
  abiVersion: number;
  available?: boolean;
  present(id: number, framebuffer: number, tiles: number[][], ticket: number): void;
  addListener(
    event: 'onPresented',
    callback: (event: { ticket: number; ids?: number[]; error?: string }) => void,
  ): { remove(): void };
};
function loadBindings() {
  if (typeof require !== 'function') return null;
  // Literal requires directly inside try preserve Metro optional-peer resolution.
  // Expected absence must settle here: Metro reports module-initialization throws
  // before a caller's outer try/catch can select the WebView fallback.
  try {
    const glVersion = require('expo-gl/package.json') as { version?: string };
    const coreVersion = require('expo-modules-core/package.json') as { version?: string };
    if (glVersion.version !== '58.0.3' || !coreVersion.version?.startsWith('58.')) return null;
    const modules = require('expo-modules-core') as typeof import('expo-modules-core');
    const native = modules.requireOptionalNativeModule<NativeModule>('BloomAvatarGPU');
    // The original complete ABI 1 module predates the flag; only the new stub says false.
    if (!native || native.available === false || native.abiVersion !== 1) return null;
    // Check the linked module before loading GL's JS entry, which requires it eagerly.
    if (!modules.requireOptionalNativeModule('ExpoGL')) return null;
    require('expo-gl');
    const view = modules.requireNativeViewManager('BloomAvatarGPU');
    return { native, view };
  } catch {
    return null;
  }
}
const bindings = loadBindings();
const native = bindings?.native;
// Reading this export evaluates the guards even with Metro inlineRequires.
export const isAvailable = bindings !== null;
function requireBridge() {
  if (!native) throw Error('Bloom native avatar graphics are unavailable');
  return native;
}
let nextTicket = 0;
const pending = new Map<
  number,
  {
    contextId: number;
    resolve(ids: number[]): void;
    reject(error: Error): void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
native?.addListener('onPresented', (event) => {
  const request = pending.get(event.ticket);
  if (!request) return;
  pending.delete(event.ticket);
  clearTimeout(request.timer);
  if (event.error) request.reject(Error(event.error));
  else request.resolve(event.ids ?? []);
});
export const bridge: NativeBridge = {
  createContext: () => requireBridge().createContext(),
  destroyContext: (id) => {
    for (const [ticket, request] of pending)
      if (request.contextId === id) {
        pending.delete(ticket);
        clearTimeout(request.timer);
        request.reject(Error('Avatar context was disposed'));
      }
    return requireBridge().destroyContext(id);
  },
  multisampleStorage: (...args) => requireBridge().multisampleStorage(...args),
  snapshot: (id) => requireBridge().snapshot(id),
  stats: () => requireBridge().stats(),
  present: (id, framebuffer, tiles) =>
    new Promise((resolve, reject) => {
      const ticket = ++nextTicket;
      const timer = setTimeout(() => {
        pending.delete(ticket);
        reject(Error('Avatar presentation timed out'));
      }, 5_000);
      pending.set(ticket, { contextId: id, resolve, reject, timer });
      // Synchronous submission preserves ordering with the next EXGL flush, while
      // the completion event allows CPU/GPU overlap with a bounded queue.
      try {
        requireBridge().present(id, framebuffer, tiles, ticket);
      } catch (error) {
        pending.delete(ticket);
        clearTimeout(timer);
        reject(error);
      }
    }),
};
export const NativeView =
  bindings?.view ??
  function UnavailableNativeView() {
    throw Error('Bloom native avatar graphics are unavailable');
  };

/** Bloom owns the native context so it can present several surfaces.
 * Expo 58 registers that context's JSI object in this same per-runtime registry. */
export async function createContext() {
  const id = await bridge.createContext();
  const registry = (
    globalThis as typeof globalThis & { __EXGLContexts?: Record<string, ExpoContext> }
  ).__EXGLContexts;
  const gl = registry?.[String(id)];
  if (!gl || typeof gl.texStorage2D !== 'function') {
    await bridge.destroyContext(id);
    throw Error('Bloom native avatars require Expo GL 58 WebGL2 bindings');
  }
  gl.renderbufferStorageMultisample = (target, samples, format, width, height) => {
    gl.flushEXP();
    bridge.multisampleStorage(id, target, samples, format, width, height);
  };
  return gl;
}
