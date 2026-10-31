import 'expo-gl';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import type { NativeBridge, ExpoContext } from './types';

type NativeModule = Omit<NativeBridge, 'present'> & {
  abiVersion: number;
  present(id: number, framebuffer: number, tiles: number[][], ticket: number): void;
  addListener(
    event: 'onPresented',
    callback: (event: { ticket: number; ids?: number[]; error?: string }) => void,
  ): { remove(): void };
};
const native = requireNativeModule<NativeModule>('BloomAvatarGPU');
if (native.abiVersion !== 1)
  throw Error('Bloom native avatar module requires a native rebuild (ABI 1)');
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
native.addListener('onPresented', (event) => {
  const request = pending.get(event.ticket);
  if (!request) return;
  pending.delete(event.ticket);
  clearTimeout(request.timer);
  if (event.error) request.reject(Error(event.error));
  else request.resolve(event.ids ?? []);
});
export const bridge: NativeBridge = {
  createContext: () => native.createContext(),
  destroyContext: (id) => {
    for (const [ticket, request] of pending)
      if (request.contextId === id) {
        pending.delete(ticket);
        clearTimeout(request.timer);
        request.reject(Error('Avatar context was disposed'));
      }
    return native.destroyContext(id);
  },
  multisampleStorage: (...args) => native.multisampleStorage(...args),
  snapshot: (id) => native.snapshot(id),
  stats: () => native.stats(),
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
        native.present(id, framebuffer, tiles, ticket);
      } catch (error) {
        pending.delete(ticket);
        clearTimeout(timer);
        reject(error);
      }
    }),
};
export const NativeView = requireNativeViewManager('BloomAvatarGPU');

/** The companion owns the native context so it can present several surfaces.
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
