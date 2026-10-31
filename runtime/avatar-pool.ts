import { AuthoredAvatarEngine } from './avatar/authored-engine';
import {
  createWebGPUAvatarPresenter,
  type WebGPUAvatarPresenter,
  type WebGPUAvatarTarget,
} from './avatar-webgpu-presenter';
import {
  createPBOAvatarPresenter,
  PBO_MINIMUM_DESTINATIONS,
  PBO_MAXIMUM_DESTINATION_AREA,
} from './avatar-pbo-presenter';
import { bindAvatarPointer } from './avatar/bind-pointer';
import type { EditorRenderProps } from './avatar-contract';
import type { CompleteEditorRecipe as EditorRecipe } from './avatar/recipe';
import { createCatalogAssetResolver } from './avatar/catalog-assets';
import { createCatalogMotion } from './avatar/catalog-motion-factory';
import {
  avatarPresentationFrozen as frozen,
  createAvatarSlotController,
  type AvatarSlotState,
} from './avatar-controller';

type Entry = AvatarSlotState & {
  canvas: HTMLCanvasElement;
  context?: CanvasRenderingContext2D;
  target?: WebGPUAvatarTarget;
  revision: number;
  delivered: number;
  size: number;
  width: number;
  height: number;
  onReady?: () => void;
  onRenderError?: () => void;
};
const pools = new Set<EditorPool>();
const sizeFor = (canvas: HTMLCanvasElement) => {
  const width = canvas.clientWidth;
  return width <= 64 ? 64 : width <= 128 ? 128 : 320;
};
const aborted = () => new DOMException('Avatar attachment aborted', 'AbortError');

/** Live instanced scenes; resizing raises the whole pool's resolution so no
 * member loses its independent motion state or receives an undersized render. */
class EditorPool {
  readonly stage = document.createElement('canvas');
  readonly engine: AuthoredAvatarEngine;
  readonly entries: (Entry | undefined)[] = [];
  private limit = 1;
  private presenter?: WebGPUAvatarPresenter;
  private presenterReady?: Promise<void>;
  private cpuPresenter?: ReturnType<typeof createPBOAvatarPresenter>;
  private recovering = false;
  private sequence = 0;
  private onVisibility = () => {
    if (document.hidden) this.cpuPresenter?.cancelPending();
  };
  private presentations = new Set<Promise<void>>();
  readonly presentation = {
    webgpuFrames: 0,
    pboFrames: 0,
    directFrames: 0,
    completed: 0,
    maximumPending: 0,
  };
  cell: number;
  private columns = 1;
  private observer: IntersectionObserver;
  private disposed = false;
  private failed = false;
  private resizing?: Promise<void>;
  constructor(cell: number, preset: string) {
    this.cell = cell;
    this.stage.dataset.avatarRenderer = 'shared-editor-scene';
    this.stage.setAttribute('aria-hidden', 'true');
    this.stage.style.cssText = `position:fixed;left:0;top:0;width:${cell}px;height:${cell}px;opacity:0;pointer-events:none`;
    document.body.append(this.stage);
    try {
      this.engine = new AuthoredAvatarEngine(this.stage, {
        count: 1,
        size: cell,
        preset,
        lazyWork: true,
        resolveAsset: createCatalogAssetResolver(createCatalogMotion),
        onFrame: () => this.paint(),
        onError: () => this.fail(),
      });
    } catch (error) {
      this.stage.remove();
      throw error;
    }
    const gl = this.stage.getContext('webgl2')!;
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    const limit = Math.min(
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      viewport[0]!,
      viewport[1]!,
    );
    // Reserve the maximum per-avatar backing (512) even before a future resize.
    this.limit = Math.min(200, Math.max(1, Math.floor(limit / 512)) ** 2);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.observer = new IntersectionObserver((changes) => {
      for (const change of changes) {
        const index = this.entries.findIndex((e) => e?.canvas === change.target);
        const entry = this.entries[index];
        if (!entry) continue;
        if (entry.visible !== change.isIntersecting) entry.revision++;
        entry.visible = change.isIntersecting;
        if (entry.ready) {
          this.engine.setInstancePaused(index, frozen(entry.props) || !entry.visible);
          this.engine.setInstanceRendering(
            index,
            entry.visible && (!frozen(entry.props) || entry.dirty || !entry.painted),
          );
        }
      }
    });
  }
  private initializePresenter(force = false) {
    if (this.presenterReady) return this.presenterReady;
    // Coalesce reservations during the shared engine load. A standalone avatar
    // (including each legacy native WebView) must not allocate another GPU device.
    if (!force && this.entries.filter(Boolean).length < 2) return Promise.resolve();
    this.presenterReady = createWebGPUAvatarPresenter(
      () => this.fail(),
      (recovering) => {
        if (this.disposed || this.failed) return;
        this.recovering = recovering;
        for (const [index, entry] of this.entries.entries()) {
          if (!entry?.target) continue;
          entry.revision++;
          entry.dirty = true;
          if (!recovering && entry.ready && entry.visible)
            this.engine.setInstanceRendering(index, true);
        }
        this.updateCapacity();
      },
    ).then((presenter) => {
      if (!presenter) return;
      if (this.disposed || this.failed) {
        presenter.dispose();
        return;
      }
      const capacity = Math.min(
        this.limit,
        Math.max(1, Math.floor(presenter.maxTextureDimension2D / 512)) ** 2,
      );
      if (this.entries.length > capacity) {
        presenter.dispose();
        return;
      }
      this.limit = capacity;
      this.presenter = presenter;
    });
    return this.presenterReady;
  }
  get capacity() {
    return this.limit;
  }
  private updateCapacity() {
    this.engine.setPresentationCapacity(!this.recovering && this.presentations.size < 2);
  }
  private fail() {
    if (this.disposed || this.failed) return;
    // Reentrant replacement callbacks must never reserve this failed engine.
    this.failed = true;
    for (const entry of [...this.entries]) {
      try {
        entry?.onRenderError?.();
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    }
  }
  get available() {
    return (
      !this.disposed &&
      !this.failed &&
      (this.entries.length < this.capacity || this.entries.some((e) => !e))
    );
  }
  private layout() {
    if (this.disposed) return;
    const count = Math.max(1, this.entries.length);
    this.columns = Math.ceil(Math.sqrt(count));
    this.stage.style.width = `${this.columns * this.cell}px`;
    this.stage.style.height = `${Math.ceil(count / this.columns) * this.cell}px`;
    this.engine.setCount(count);
    this.entries.forEach((entry, index) => {
      if (!entry) return;
      entry.dirty = true;
      entry.revision++;
      if (entry.ready && entry.visible) this.engine.setInstanceRendering(index, true);
    });
  }
  private resolution() {
    if (this.disposed) return Promise.resolve();
    if (!this.resizing) {
      this.resizing = (async () => {
        while (!this.disposed) {
          const wanted = Math.max(
            64,
            ...this.entries.filter((e): e is Entry => !!e).map((e) => e.size),
          );
          if (wanted === this.cell) return;
          this.cell = wanted;
          this.layout();
          await this.engine.setSize(wanted);
        }
      })().finally(() => {
        this.resizing = undefined;
      });
    }
    return this.resizing;
  }
  private release(index: number, entry: Entry) {
    if (this.entries[index] !== entry) return;
    this.observer.unobserve(entry.canvas);
    if (entry.target) this.presenter?.release(entry.target);
    this.engine.setInstancePaused(index, true);
    this.engine.setInstanceRendering(index, false);
    this.entries[index] = undefined;
    while (this.entries.length && !this.entries[this.entries.length - 1]) this.entries.pop();
    if (!this.entries.length) {
      this.disposed = true;
      this.observer.disconnect();
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.engine.dispose();
      this.cpuPresenter?.dispose();
      this.presenter?.dispose();
      this.stage.remove();
      pools.delete(this);
    } else this.layout();
  }
  private paint() {
    if (this.disposed || this.failed || this.recovering) return;
    const stageWidth = this.stage.width,
      stageHeight = this.stage.height;
    const sequence = ++this.sequence;
    const pixels = stageWidth / this.columns;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const records = this.entries.flatMap((entry, index) => {
      if (!entry?.ready || !entry.visible || (frozen(entry.props) && entry.painted && !entry.dirty))
        return [];
      const width = Math.max(1, Math.round(entry.width * ratio));
      const height = Math.max(1, Math.round(entry.height * ratio));
      if (entry.context) {
        if (entry.canvas.width !== width) entry.canvas.width = width;
        if (entry.canvas.height !== height) entry.canvas.height = height;
      }
      const revision = entry.revision;
      const isCurrent = () =>
        !this.disposed &&
        !this.failed &&
        this.entries[index] === entry &&
        entry.revision === revision &&
        sequence >= entry.delivered &&
        this.stage.width === stageWidth &&
        this.stage.height === stageHeight &&
        entry.ready &&
        entry.visible &&
        entry.canvas.width === width &&
        entry.canvas.height === height;
      return [
        {
          entry,
          index,
          width,
          height,
          isCurrent,
          sourceX: (index % this.columns) * pixels,
          sourceY: Math.floor(index / this.columns) * pixels,
        },
      ];
    });
    type Record = (typeof records)[number];
    const finish = (record: Record) => {
      if (!record.isCurrent()) return;
      const { entry, index } = record;
      entry.delivered = sequence;
      entry.dirty = false;
      if (frozen(entry.props)) this.engine.setInstanceRendering(index, false);
      if (!entry.painted) {
        entry.painted = true;
        try {
          entry.onReady?.();
        } catch (error) {
          queueMicrotask(() => {
            throw error;
          });
        }
      }
    };
    const small = records.filter(
      (record) =>
        record.entry.context && record.width * record.height <= PBO_MAXIMUM_DESTINATION_AREA,
    );
    const cpu = small.length >= PBO_MINIMUM_DESTINATIONS ? small : [];
    const gpu = records.filter((record) => record.entry.target);
    const deferred = new Set([...cpu, ...gpu]);
    const jobs: Promise<boolean>[] = [];
    try {
      if (cpu.length) {
        this.cpuPresenter ??= createPBOAvatarPresenter();
        this.presentation.pboFrames++;
        jobs.push(
          this.cpuPresenter
            .present(
              this.stage,
              cpu.map((record) => ({
                context: record.entry.context!,
                sourceX: record.sourceX,
                sourceY: record.sourceY,
                sourceWidth: pixels,
                sourceHeight: pixels,
                destinationWidth: record.width,
                destinationHeight: record.height,
                isCurrent: record.isCurrent,
                onPresented: () => {
                  record.entry.delivered = sequence;
                },
              })),
            )
            .then((completed) => {
              if (completed) cpu.forEach(finish);
              return completed;
            }),
        );
      }
      if (gpu.length && this.presenter) {
        this.presentation.webgpuFrames++;
        jobs.push(
          this.presenter
            .present(
              this.stage,
              gpu.map((record) => ({
                target: record.entry.target!,
                sourceX: record.sourceX,
                sourceY: record.sourceY,
                sourceWidth: pixels,
                sourceHeight: pixels,
                destinationWidth: record.width,
                destinationHeight: record.height,
              })),
            )
            .then((completed) => {
              if (completed) gpu.forEach(finish);
              return completed;
            }),
        );
      }
      let direct = false;
      for (const record of records) {
        if (deferred.has(record) || !record.entry.context) continue;
        const context = record.entry.context;
        context.clearRect(0, 0, record.width, record.height);
        context.drawImage(
          this.stage,
          record.sourceX,
          record.sourceY,
          pixels,
          pixels,
          0,
          0,
          record.width,
          record.height,
        );
        finish(record);
        direct = true;
      }
      if (direct) this.presentation.directFrames++;
    } catch {
      // A backend may fail after another has submitted; always observe every
      // pending rejection while the pool releases its entries and resources.
      void Promise.all(jobs).catch(() => {});
      this.fail();
      return;
    }
    if (!jobs.length) return;
    let task: Promise<void>;
    task = Promise.all(jobs)
      .then((results) => {
        if (results.some(Boolean)) this.presentation.completed++;
      })
      .catch(() => this.fail())
      .finally(() => {
        this.presentations.delete(task);
        if (!this.disposed && !this.failed) this.updateCapacity();
      });
    this.presentations.add(task);
    this.presentation.maximumPending = Math.max(
      this.presentation.maximumPending,
      this.presentations.size,
    );
    this.updateCapacity();
  }
  async attach(
    canvas: HTMLCanvasElement,
    initial: EditorRenderProps,
    recipe: EditorRecipe,
    onReady?: () => void,
    onError?: () => void,
    signal?: AbortSignal,
  ) {
    if (signal?.aborted) throw aborted();
    let index = this.entries.findIndex((e) => !e);
    if (index < 0) index = this.entries.length;
    if (!this.available || index >= this.capacity) throw Error('Editor scene capacity exceeded');
    const entry: Entry = {
      canvas,
      revision: 0,
      delivered: 0,
      props: initial,
      ready: false,
      visible: true,
      dirty: true,
      painted: false,
      size: sizeFor(canvas),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      onReady,
    };
    // Reservation exists throughout every asynchronous load, including the first.
    this.entries[index] = entry;
    let disposed = false;
    let unbind = () => {};
    let resize: ResizeObserver | undefined;
    let rejectAbort: ((reason: unknown) => void) | undefined;
    const interrupted = new Promise<never>((_, reject) => {
      rejectAbort = reject;
    });
    // The same promise is raced for every pending operation, with a handler
    // already installed when abort happens between operations.
    void interrupted.catch(() => {});
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      signal?.removeEventListener('abort', abort);
      unbind();
      resize?.disconnect();
      this.release(index, entry);
      rejectAbort?.(aborted());
    };
    const abort = () => dispose();
    entry.onRenderError = () => {
      if (disposed) return;
      dispose();
      onError?.();
    };
    signal?.addEventListener('abort', abort, { once: true });
    const wait = <T>(promise: Promise<T>) => Promise.race([promise, interrupted]);
    try {
      await wait(this.engine.loaded);
      await wait(this.initializePresenter());
      if (this.failed) throw Error('Avatar presentation unavailable');
      entry.target = this.presenter?.attach(canvas) ?? undefined;
      if (!entry.target) {
        entry.context = canvas.getContext('2d') ?? undefined;
        if (!entry.context) {
          // A retained WebGPU canvas cannot become 2D, including after a new
          // runtime URL replaces the module's ownership map. Fresh singletons
          // already acquired 2D above and never enter this forced GPU path.
          await wait(this.initializePresenter(true));
          entry.target = this.presenter?.attach(canvas) ?? undefined;
          if (!entry.target) throw Error('Editor canvas unavailable');
        }
      }
      this.layout();
      await wait(this.resolution());
      await wait(this.engine.setPreset(index, recipe.preset));
      this.engine.resetAppearance(index);
      this.engine.idle(index);
      let ownsPointer = false;
      let hovered = false;
      const pointerOptions = {
        enabled: !!initial.interactive && !frozen(initial),
        onTap: () => this.engine.react(index),
      };
      const mapped = (x: number, y: number) => {
        const rect = canvas.getBoundingClientRect();
        return [
          (index % this.columns) * this.cell + (x * this.cell) / Math.max(1, rect.width),
          Math.floor(index / this.columns) * this.cell + (y * this.cell) / Math.max(1, rect.height),
        ] as const;
      };
      unbind = bindAvatarPointer(
        canvas,
        {
          hitTest: (x, y) => this.engine.hitTest(...mapped(x, y)),
          beginPointer: (x, y) => {
            const value = this.engine.beginPointer(...mapped(x, y));
            ownsPointer = value === index;
            return value;
          },
          point: (x, y) => {
            if (x === -1 && y === -1) {
              if (hovered) this.engine.point(-1, -1);
              hovered = false;
            } else {
              hovered = true;
              this.engine.point(...mapped(x, y));
            }
          },
          endPointer: (x, y) => {
            if (!ownsPointer) return;
            ownsPointer = false;
            if (x === undefined || y === undefined) this.engine.endPointer();
            else this.engine.endPointer(...mapped(x, y));
          },
        },
        pointerOptions,
      );
      const { update, setPresentation } = createAvatarSlotController(
        this.engine,
        index,
        entry,
        recipe,
        {
          isDisposed: () => disposed,
          wait,
          dispose,
          onPresentation: (props) => {
            entry.revision++;
            pointerOptions.enabled = !!props.interactive && !frozen(props);
          },
        },
      );
      await update(initial, recipe);
      this.observer.observe(canvas);
      resize = new ResizeObserver(([change]) => {
        if (disposed) return;
        // Layout dimensions stay stable during ancestor scale animations.
        // Pointer hit testing still reads its current transformed client rect.
        entry.width = change?.contentRect.width ?? canvas.clientWidth;
        entry.height = change?.contentRect.height ?? canvas.clientHeight;
        entry.size = sizeFor(canvas);
        entry.dirty = true;
        entry.revision++;
        void this.resolution()
          .then(() => {
            if (!disposed) {
              this.engine.setInstancePaused(index, frozen(entry.props) || !entry.visible);
              this.engine.setInstanceRendering(index, entry.visible);
            }
          })
          .catch(() => {
            if (!disposed) {
              dispose();
              onError?.();
            }
          });
      });
      resize.observe(canvas);
      return { update, setPresentation, dispose };
    } catch (error) {
      dispose();
      throw error;
    }
  }
}

export async function attachEditorAvatar(
  canvas: HTMLCanvasElement,
  props: EditorRenderProps,
  recipe: EditorRecipe,
  onReady?: () => void,
  onError?: () => void,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw aborted();
  const cell = sizeFor(canvas);
  let pool = [...pools].find((p) => p.cell === cell && p.available);
  if (!pool) {
    pool = new EditorPool(cell, recipe.preset);
    pools.add(pool);
  }
  return pool.attach(canvas, props, recipe, onReady, onError, signal);
}
export function editorPoolDiagnostics() {
  return [...pools].map((p) => ({
    cell: p.cell,
    capacity: p.capacity,
    avatars: p.entries.filter(Boolean).length,
    pending: p.entries.filter((e) => e && !e.ready).length,
    activeIndices: p.entries.flatMap((entry, index) => (entry ? [index] : [])),
    presentation: {
      ...p.presentation,
      webgpuTargets: p.entries.filter((entry) => entry?.target).length,
      canvas2dTargets: p.entries.filter((entry) => entry?.context).length,
    },
    stats: p.engine.stats(),
  }));
}
