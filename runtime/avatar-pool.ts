import { AuthoredAvatarEngine } from './avatar/authored-engine';
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
  context: CanvasRenderingContext2D;
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
  readonly capacity: number;
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
        onError: () => {
          // Callbacks may synchronously attach a replacement. A fatal engine
          // must never accept that reservation while its old entries drain.
          this.failed = true;
          for (const entry of [...this.entries]) {
            try {
              entry?.onRenderError?.();
            } catch (error) {
              // Preserve the caller's error without abandoning other entries'
              // observers, reservations or final renderer disposal.
              queueMicrotask(() => {
                throw error;
              });
            }
          }
        },
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
    this.capacity = Math.min(200, Math.max(1, Math.floor(limit / 512)) ** 2);
    this.observer = new IntersectionObserver((changes) => {
      for (const change of changes) {
        const index = this.entries.findIndex((e) => e?.canvas === change.target);
        const entry = this.entries[index];
        if (!entry) continue;
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
    this.engine.setInstancePaused(index, true);
    this.engine.setInstanceRendering(index, false);
    this.entries[index] = undefined;
    while (this.entries.length && !this.entries[this.entries.length - 1]) this.entries.pop();
    if (!this.entries.length) {
      this.disposed = true;
      this.observer.disconnect();
      this.engine.dispose();
      this.stage.remove();
      pools.delete(this);
    } else this.layout();
  }
  private paint() {
    const pixels = this.stage.width / this.columns;
    this.entries.forEach((entry, index) => {
      if (!entry?.ready || !entry.visible || (frozen(entry.props) && entry.painted && !entry.dirty))
        return;
      const { canvas, context } = entry;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(entry.width * ratio));
      const height = Math.max(1, Math.round(entry.height * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(
        this.stage,
        (index % this.columns) * pixels,
        Math.floor(index / this.columns) * pixels,
        pixels,
        pixels,
        0,
        0,
        width,
        height,
      );
      entry.dirty = false;
      if (frozen(entry.props)) this.engine.setInstanceRendering(index, false);
      if (!entry.painted) {
        entry.painted = true;
        entry.onReady?.();
      }
    });
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
    const context = canvas.getContext('2d');
    if (!context) {
      if (!this.entries.length) {
        this.engine.dispose();
        this.stage.remove();
        this.observer.disconnect();
        pools.delete(this);
        this.disposed = true;
      }
      throw Error('Editor canvas unavailable');
    }
    const entry: Entry = {
      canvas,
      context,
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
    stats: p.engine.stats(),
  }));
}
