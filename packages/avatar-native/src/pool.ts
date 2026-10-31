import { AppState, PixelRatio } from 'react-native';
import { bridge, createContext } from './bridge';
import { assetBase, getRuntime } from './runtime';
import type {
  AvatarController,
  Capabilities,
  Engine,
  EngineHost,
  ExpoContext,
  Output,
  RenderValue,
  Runtime,
  SlotController,
  SlotState,
} from './types';

const pools = new Set<NativePool>();
let nextSurfaceId = 1;
export const sizeBucket = (width: number) => (width <= 64 ? 64 : width <= 128 ? 128 : 320);
const cancelled = () => Object.assign(Error('Avatar attachment cancelled'), { name: 'AbortError' });
type Callbacks = { onReady?(): void; onError(): void; onCapabilities?(value: Capabilities): void };
type Entry = SlotState & {
  id: number;
  index: number;
  size: number;
  width: number;
  height: number;
  surfaceReady: boolean;
  disposed: boolean;
  revision: number;
  callbacks: Callbacks;
  slot?: SlotController;
  controller?: AvatarController;
};

/** Shared by every provider using this runtime and resolution bucket. Different
 * buckets own separate renderers/contexts so a hero cannot inflate every icon. */
class NativePool {
  readonly runtime: Runtime;
  readonly entries: (Entry | undefined)[] = [];
  readonly ready: Promise<void>;
  readonly base: string;
  cell: number;
  capacity = 16;
  contextId = 0;
  engine!: Engine;
  private gl!: ExpoContext;
  private disposed = false;
  private columns = 1;
  private rows = 1;
  private hostEvents?: Parameters<EngineHost['subscribe']>[0];
  private inFlight = new Set<Promise<void>>();
  private frameSequence = 0;
  private scheduled = new Map<number, number>();
  private resizing: Promise<void> | undefined;
  private pendingAttachments = 0;

  constructor(runtimeUrl: string, cell: number, preset: string) {
    this.base = assetBase(runtimeUrl);
    this.cell = cell;
    const runtime = getRuntime(runtimeUrl);
    this.runtime = runtime;
    this.ready = (async () => {
      const gl = await createContext();
      this.gl = gl;
      this.contextId = gl.contextId;
      if (this.disposed) {
        await bridge.destroyContext(this.contextId);
        throw cancelled();
      }
      const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
      const limit = Math.min(
        gl.getParameter(gl.MAX_TEXTURE_SIZE),
        gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        viewport[0]!,
        viewport[1]!,
      );
      this.capacity = Math.min(16, Math.max(1, Math.floor(limit / 512)) ** 2);
      const host: EngineHost = {
        context: gl,
        getSize: () => ({
          width: this.columns * this.cell,
          height: this.rows * this.cell,
          pixelRatio: PixelRatio.get(),
        }),
        isHidden: () => AppState.currentState !== 'active',
        requestFrame: (callback) => {
          const token = ++this.frameSequence;
          const run = (time: number) => {
            if (!this.scheduled.has(token) || this.disposed) return;
            if (this.inFlight.size >= 2) {
              // At most two GL presentation batches are outstanding. Continue on a
              // display frame after completion; never accumulate stale frames.
              Promise.race(this.inFlight).finally(() => {
                if (this.scheduled.has(token) && !this.disposed)
                  this.scheduled.set(token, requestAnimationFrame(run));
              });
            } else {
              this.scheduled.delete(token);
              callback(time);
            }
          };
          this.scheduled.set(token, requestAnimationFrame(run));
          return token;
        },
        cancelFrame: (token) => {
          const frame = this.scheduled.get(token);
          if (frame !== undefined) cancelAnimationFrame(frame);
          this.scheduled.delete(token);
        },
        subscribe: (events) => {
          this.hostEvents = events;
          const subscription = AppState.addEventListener('change', () => events.visibility());
          return () => {
            subscription.remove();
            this.hostEvents = undefined;
          };
        },
        onFrame: (output) => this.present(output),
      };
      this.engine = new runtime.AuthoredAvatarEngine(null, {
        host,
        count: 1,
        size: cell,
        preset,
        lazyWork: true,
        resolveAsset: runtime.createCatalogAssetResolver(runtime.createCatalogMotion),
      });
      this.engine.setInstancePaused(0, true);
      this.engine.setInstanceRendering(0, false);
      await this.engine.loaded;
      if (this.disposed) throw cancelled();
    })();
    void this.ready.catch(() => {});
  }
  get available() {
    return !this.disposed && (this.entries.some((e) => !e) || this.entries.length < this.capacity);
  }
  private present(output: Output) {
    if (this.disposed) return;
    const presented = output.renderedIndices.flatMap((index) => {
      const entry = this.entries[index];
      if (
        !entry ||
        !entry.ready ||
        !entry.visible ||
        !entry.surfaceReady ||
        (this.runtime.avatarPresentationFrozen(entry.props) && entry.painted && !entry.dirty)
      )
        return [];
      return [
        {
          entry,
          revision: entry.revision,
          tile: [
            entry.id,
            (index % output.columns) * output.pixels,
            output.height - (Math.floor(index / output.columns) + 1) * output.pixels,
            ((index % output.columns) + 1) * output.pixels,
            output.height - Math.floor(index / output.columns) * output.pixels,
          ],
        },
      ];
    });
    if (!presented.length) return;
    this.gl.flushEXP();
    const pending = bridge
      .present(
        this.contextId,
        output.framebuffer.id,
        presented.map((item) => item.tile),
      )
      .then((ids) => {
        if (this.disposed) return;
        const successful = new Set(ids);
        for (const { entry, revision } of presented) {
          if (entry.disposed || entry.revision !== revision || !successful.has(entry.id)) continue;
          entry.dirty = false;
          if (this.runtime.avatarPresentationFrozen(entry.props))
            this.engine.setInstanceRendering(entry.index, false);
          if (!entry.painted) {
            entry.painted = true;
            entry.callbacks.onReady?.();
          }
        }
      })
      .catch(() => {
        if (!this.disposed) for (const entry of this.entries) entry?.callbacks.onError();
      })
      .finally(() => {
        this.inFlight.delete(pending);
      });
    this.inFlight.add(pending);
  }
  private layout() {
    this.columns = Math.max(1, Math.ceil(Math.sqrt(this.entries.length)));
    this.rows = Math.max(1, Math.ceil(this.entries.length / this.columns));
    this.engine.setCount(Math.max(1, this.entries.length));
    this.hostEvents?.resize();
    for (const entry of this.entries)
      if (entry) {
        entry.dirty = true;
        entry.revision++;
        entry.slot?.setPresentation(entry.props);
      }
  }
  private release(entry: Entry) {
    if (entry.disposed) return;
    entry.disposed = true;
    if (this.engine) {
      this.engine.setInstancePaused(entry.index, true);
      this.engine.setInstanceRendering(entry.index, false);
    }
    this.entries[entry.index] = undefined;
    while (this.entries.length && !this.entries[this.entries.length - 1]) this.entries.pop();
    if (this.entries.length) {
      if (this.engine) this.layout();
      return;
    }
    this.closeIfUnused();
  }
  private closeIfUnused() {
    if (this.disposed || this.entries.length || this.pendingAttachments) return;
    this.disposed = true;
    pools.delete(this);
    for (const frame of this.scheduled.values()) cancelAnimationFrame(frame);
    this.scheduled.clear();
    // A submitted batch must finish before its FBOs/context are deleted.
    void Promise.all(this.inFlight)
      .then(async () => {
        this.engine?.dispose();
        if (this.contextId) await bridge.destroyContext(this.contextId);
      })
      .catch(() => {
        /* The owning component has already been disposed. */
      });
  }
  async acquire(
    initial: RenderValue,
    width: number,
    height: number,
    callbacks: Callbacks,
    signal: AbortSignal,
  ) {
    this.pendingAttachments++;
    let reject!: (error: Error) => void;
    const aborted = new Promise<never>((_, fail) => {
      reject = fail;
    });
    const cancel = () => reject(cancelled());
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    try {
      await Promise.race([this.ready, aborted]);
      if (signal.aborted) throw cancelled();
      // Resolve device limits before reserving slots. Concurrent mounts share
      // context creation, then fill this pool serially without exceeding it.
      if (!this.available) return undefined;
      return await this.attach(initial, width, height, callbacks, signal);
    } finally {
      signal.removeEventListener('abort', cancel);
      this.pendingAttachments--;
      this.closeIfUnused();
    }
  }
  async attach(
    initial: RenderValue,
    width: number,
    height: number,
    callbacks: Callbacks,
    signal: AbortSignal,
  ) {
    let index = this.entries.findIndex((entry) => !entry);
    if (index < 0) index = this.entries.length;
    if (!this.available || signal.aborted) throw cancelled();
    const entry: Entry = {
      id: nextSurfaceId++,
      index,
      size: sizeBucket(width),
      width,
      height,
      props: initial,
      ready: false,
      visible: false,
      surfaceReady: false,
      dirty: true,
      painted: false,
      disposed: false,
      revision: 0,
      callbacks,
    };
    this.entries[index] = entry;
    let reject!: (error: unknown) => void;
    const interrupted = new Promise<never>((_, fail) => {
      reject = fail;
    });
    void interrupted.catch(() => {});
    const dispose = () => {
      signal.removeEventListener('abort', dispose);
      entry.controller?.dispose();
      this.release(entry);
      reject(cancelled());
    };
    signal.addEventListener('abort', dispose, { once: true });
    const wait = <T>(promise: Promise<T>) => Promise.race([promise, interrupted]);
    try {
      await wait(this.ready);
      this.layout();
      this.engine.setInstancePaused(index, true);
      this.engine.setInstanceRendering(index, false);
      const recipe = this.runtime.resolveCompleteEditorRecipe(initial);
      await wait(this.engine.setPreset(index, recipe.preset));
      this.engine.resetAppearance(index);
      this.engine.idle(index);
      entry.slot = this.runtime.createAvatarSlotController(this.engine, index, entry, recipe, {
        isDisposed: () => entry.disposed,
        wait,
        dispose: () => this.release(entry),
      });
      await wait(entry.slot.update(initial, recipe));
      entry.controller = this.runtime.createAvatarReconciler(
        initial,
        { ...entry.slot, dispose: () => this.release(entry) },
        {
          resolveRecipe: this.runtime.resolveCompleteEditorRecipe,
          initialRecipe: recipe,
          onCapabilities: callbacks.onCapabilities,
          onError: callbacks.onError,
          onDispose: () => this.release(entry),
        },
      );
      const invalidate = () => {
        entry.dirty = true;
        entry.revision++;
        entry.slot?.setPresentation(entry.props);
      };
      let ownsPointer = false;
      let hovered = false;
      const clearPointer = () => {
        if (ownsPointer) {
          ownsPointer = false;
          this.engine.endPointer();
        }
        if (hovered) {
          hovered = false;
          this.engine.point(-1, -1);
        }
      };
      signal.addEventListener('abort', clearPointer, { once: true });
      const coordinates = (x: number, y: number) =>
        [
          (index % this.columns) * this.cell + (x * this.cell) / Math.max(1, entry.width),
          Math.floor(index / this.columns) * this.cell +
            (y * this.cell) / Math.max(1, entry.height),
        ] as const;
      return {
        contextId: this.contextId,
        surfaceId: entry.id,
        update: (value: RenderValue) => {
          entry.revision++;
          return entry.controller?.update(value);
        },
        dispose,
        surfaceReady: () => {
          entry.surfaceReady = true;
          invalidate();
        },
        visibility: (visible: boolean) => {
          entry.visible = visible;
          invalidate();
        },
        resize: (w: number, h: number) => {
          entry.width = w;
          entry.height = h;
          entry.size = sizeBucket(w);
          if (!this.resizing) {
            this.resizing = (async () => {
              while (!this.disposed) {
                const target = Math.max(
                  ...this.entries.flatMap((item) => (item ? [item.size] : [])),
                );
                if (target === this.cell) break;
                // Keep the same state objects and motion clocks during a size
                // change. An existing group may promote; new mounts use buckets.
                await this.engine.setSize(target);
                if (this.disposed) return;
                this.cell = target;
                this.layout();
              }
            })().finally(() => {
              this.resizing = undefined;
            });
            void this.resizing.catch(callbacks.onError);
          }
          invalidate();
        },
        snapshot: async () => (entry.painted ? bridge.snapshot(entry.id) : null),
        pointerDown: (x: number, y: number) => {
          ownsPointer = this.engine.beginPointer(...coordinates(x, y)) === index;
          hovered ||= ownsPointer;
          return ownsPointer;
        },
        pointerMove: (x: number, y: number) => {
          hovered = true;
          this.engine.point(...coordinates(x, y));
        },
        pointerLeave: () => {
          if (!ownsPointer && hovered) {
            hovered = false;
            this.engine.point(-1, -1);
          }
        },
        pointerEnd: (x?: number, y?: number) => {
          if (x === undefined || y === undefined) {
            clearPointer();
            return;
          }
          if (!ownsPointer) return;
          ownsPointer = false;
          this.engine.endPointer(...coordinates(x, y));
        },
        react: () => this.engine.react(index),
      };
    } catch (error) {
      dispose();
      throw error;
    }
  }
}

export async function attachNativeAvatar(
  runtimeUrl: string,
  initial: RenderValue,
  width: number,
  height: number,
  callbacks: Callbacks,
  signal: AbortSignal,
) {
  const cell = sizeBucket(width),
    base = assetBase(runtimeUrl);
  while (!signal.aborted) {
    let pool = [...pools].find(
      (candidate) => candidate.base === base && candidate.cell === cell && candidate.available,
    );
    if (!pool) {
      pool = new NativePool(
        runtimeUrl,
        cell,
        getRuntime(runtimeUrl).resolveCompleteEditorRecipe(initial).preset,
      );
      pools.add(pool);
    }
    const attachment = await pool.acquire(initial, width, height, callbacks, signal);
    if (attachment) return attachment;
  }
  throw cancelled();
}
export type NativeAttachment = Awaited<ReturnType<typeof attachNativeAvatar>>;
