/** Shared WebGPU presentation only. The authored engine still owns all 3D work.
 * Local structural types keep this optional browser API out of public peer types. */
type Resource = { destroy(): void };
type Texture = Resource & { createView(): object };
type Pipeline = { getBindGroupLayout(index: number): object };
type Pass = {
  setPipeline(pipeline: Pipeline): void;
  setBindGroup(index: number, group: object): void;
  draw(vertices: number): void;
  end(): void;
};
type Device = Resource & {
  limits: { maxTextureDimension2D: number };
  lost: Promise<{ message: string }>;
  addEventListener(name: 'uncapturederror', callback: (event: { error: Error }) => void): void;
  pushErrorScope(filter: 'validation'): void;
  popErrorScope(): Promise<Error | null>;
  createShaderModule(descriptor: { code: string }): object;
  createRenderPipelineAsync(descriptor: object): Promise<Pipeline>;
  createSampler(descriptor: object): object;
  createBuffer(descriptor: { size: number; usage: number }): Resource;
  createTexture(descriptor: object): Texture;
  createBindGroup(descriptor: object): object;
  createCommandEncoder(): { beginRenderPass(descriptor: object): Pass; finish(): object };
  queue: {
    writeBuffer(buffer: Resource, offset: number, data: Float32Array): void;
    copyExternalImageToTexture(source: object, destination: object, size: number[]): void;
    submit(commands: object[]): void;
    onSubmittedWorkDone(): Promise<void>;
  };
};
type Context = {
  configure(configuration: {
    device: Device;
    format: string;
    alphaMode: 'premultiplied';
    colorSpace: 'srgb';
  }): void;
  unconfigure(): void;
  getCurrentTexture(): Texture;
};
type BrowserGPU = {
  requestAdapter(): Promise<{
    info?: { isFallbackAdapter?: boolean };
    requestDevice(): Promise<Device>;
  } | null>;
  getPreferredCanvasFormat(): string;
};

export type WebGPUAvatarTarget = { readonly canvas: HTMLCanvasElement };
export type WebGPUAvatarTile = {
  target: WebGPUAvatarTarget;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destinationWidth: number;
  destinationHeight: number;
};
export type WebGPUAvatarPresenter = {
  readonly backend: 'webgpu';
  readonly maxTextureDimension2D: number;
  attach(canvas: HTMLCanvasElement): WebGPUAvatarTarget | null;
  present(stage: HTMLCanvasElement, tiles: readonly WebGPUAvatarTile[]): Promise<boolean>;
  release(target: WebGPUAvatarTarget): void;
  dispose(): void;
};

type Shared = {
  device: Device;
  pipeline: Pipeline;
  sampler: object;
  format: string;
  retired: boolean;
};
type Listener = {
  recovering(): void;
  restored(shared: Shared): void;
  failed(error: Error): void;
};
type CanvasState = { context: Context; configured?: Shared; owner?: Target };
type Target = WebGPUAvatarTarget & {
  state: CanvasState;
  active: boolean;
  buffer?: Resource;
  binding?: object;
  atlas?: Texture;
  rect?: readonly number[];
};
type Ticket = { finish(success: boolean): void };
const canvasStates = new WeakMap<HTMLCanvasElement, CanvasState>();
const listeners = new Set<Listener>();
let current: Shared | undefined;
let initialization: Promise<Shared | null> | undefined;
let retryAfter = 0;
let recovering = false;
let recoveryUsed = false;
let healthyTimer: ReturnType<typeof setTimeout> | undefined;
const INIT_TIMEOUT = 5000;
const BATCH_TIMEOUT = 5000;
const NEGATIVE_TTL = 5000;
const HEALTHY_INTERVAL = 30000;
const MAX_PENDING = 2;
const TEXTURE_USAGE = 2 | 4 | 16; // COPY_DST | TEXTURE_BINDING | RENDER_ATTACHMENT
const UNIFORM_USAGE = 8 | 64; // COPY_DST | UNIFORM
const shader = `
struct Out { @builtin(position) position:vec4f, @location(0) uv:vec2f };
@group(0) @binding(0) var atlas:texture_2d<f32>;
@group(0) @binding(1) var linearSampler:sampler;
@group(0) @binding(2) var<uniform> rect:vec4f;
@vertex fn vertex(@builtin(vertex_index) i:u32)->Out {
  let positions=array<vec2f,3>(vec2f(-1,1),vec2f(-1,-3),vec2f(3,1));
  let uvs=array<vec2f,3>(vec2f(0,0),vec2f(0,2),vec2f(2,0));
  var output:Out;output.position=vec4f(positions[i],0,1);output.uv=uvs[i];return output;
}
@fragment fn fragment(input:Out)->@location(0) vec4f {
  // drawImage filters outside its source rectangle within the original image.
  // Clamp only at the atlas boundary, matching the existing presentation.
  return textureSample(atlas,linearSampler,rect.xy+input.uv*rect.zw);
}`;
const errorOf = (value: unknown) => (value instanceof Error ? value : new Error(String(value)));
const contextFor = (canvas: HTMLCanvasElement) =>
  (canvas as unknown as { getContext(kind: 'webgpu'): Context | null }).getContext('webgpu');
const notify = (callback: (listener: Listener) => void) => {
  for (const listener of [...listeners]) {
    try {
      callback(listener);
    } catch (error) {
      queueMicrotask(() => {
        throw error;
      });
    }
  }
};
function healthy(shared: Shared) {
  if (!recoveryUsed || healthyTimer || current !== shared || shared.retired) return;
  healthyTimer = setTimeout(() => {
    healthyTimer = undefined;
    if (current === shared && !shared.retired) recoveryUsed = false;
  }, HEALTHY_INTERVAL);
}
function fatal(shared: Shared, error: Error) {
  if (shared.retired) return;
  shared.retired = true;
  if (current === shared) current = undefined;
  clearTimeout(healthyTimer);
  healthyTimer = undefined;
  recovering = false;
  retryAfter = Date.now() + NEGATIVE_TTL;
  notify((listener) => listener.failed(error));
  shared.device.destroy();
}
function lost(shared: Shared, error: Error) {
  if (shared.retired) return;
  shared.retired = true;
  if (current === shared) current = undefined;
  clearTimeout(healthyTimer);
  healthyTimer = undefined;
  shared.device.destroy();
  if (!listeners.size) return;
  if (recoveryUsed) {
    retryAfter = Date.now() + NEGATIVE_TTL;
    notify((listener) => listener.failed(error));
    return;
  }
  recoveryUsed = true;
  recovering = true;
  notify((listener) => listener.recovering());
  retryAfter = 0;
  void acquire().then((next) => {
    recovering = false;
    if (next) notify((listener) => listener.restored(next));
    else notify((listener) => listener.failed(error));
  });
}
async function initialize(): Promise<Shared | null> {
  const gpu = (globalThis as unknown as { navigator?: { gpu?: BrowserGPU } }).navigator?.gpu;
  if (!gpu || typeof document === 'undefined') return null;
  let abandoned = false;
  let candidate: Device | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      abandoned = true;
      candidate?.destroy();
      resolve(null);
    }, INIT_TIMEOUT);
  });
  const work = (async (): Promise<Shared | null> => {
    try {
      const adapter = await gpu.requestAdapter();
      if (!adapter || adapter.info?.isFallbackAdapter === true || abandoned) return null;
      candidate = await adapter.requestDevice();
      if (abandoned) {
        candidate.destroy();
        return null;
      }
      const format = gpu.getPreferredCanvasFormat();
      candidate.pushErrorScope('validation');
      const module = candidate.createShaderModule({ code: shader });
      const pipeline = await candidate.createRenderPipelineAsync({
        layout: 'auto',
        vertex: { module, entryPoint: 'vertex' },
        fragment: { module, entryPoint: 'fragment', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      });
      if (abandoned) {
        candidate.destroy();
        return null;
      }
      const probe = document.createElement('canvas');
      probe.width = probe.height = 1;
      const context = contextFor(probe);
      if (!context) throw new Error('WebGPU canvas unavailable');
      context.configure({
        device: candidate,
        format,
        alphaMode: 'premultiplied',
        colorSpace: 'srgb',
      });
      context.unconfigure();
      const validation = await candidate.popErrorScope();
      if (validation || abandoned) throw validation ?? new Error('WebGPU initialization expired');
      const shared: Shared = {
        device: candidate,
        pipeline,
        sampler: candidate.createSampler({ minFilter: 'linear', magFilter: 'linear' }),
        format,
        retired: false,
      };
      candidate.addEventListener('uncapturederror', (event) => fatal(shared, errorOf(event.error)));
      void candidate.lost.then((info) =>
        lost(shared, new Error(info.message || 'WebGPU device lost')),
      );
      return shared;
    } catch {
      candidate?.destroy();
      return null;
    }
  })();
  const result = await Promise.race([work, timeout]);
  clearTimeout(timer);
  return result;
}
function acquire(): Promise<Shared | null> {
  if (current && !current.retired) return Promise.resolve(current);
  if (initialization) return initialization;
  if (Date.now() < retryAfter) return Promise.resolve(null);
  initialization = initialize()
    .then((shared) => {
      if (shared && !shared.retired) current = shared;
      else retryAfter = Date.now() + NEGATIVE_TTL;
      return shared?.retired ? null : shared;
    })
    .finally(() => {
      initialization = undefined;
    });
  return initialization;
}

/** Fallback is decided before binding user canvases. A canvas already bound to
 * WebGPU cannot become 2D; failures after binding are observable/recoverable. */
export async function createWebGPUAvatarPresenter(
  onFailure: (error: Error) => void,
  onRecoveryChange?: (recovering: boolean) => void,
): Promise<WebGPUAvatarPresenter | null> {
  let shared = await acquire();
  if (!shared || shared.retired) return null;
  let disposed = false;
  let unavailable = recovering;
  let failed = false;
  let atlas: Texture | undefined;
  let atlasWidth = 0;
  let atlasHeight = 0;
  const targets = new Set<Target>();
  const pending = new Set<Ticket>();
  const interrupt = () => {
    for (const ticket of [...pending]) ticket.finish(false);
  };
  const retireResources = () => {
    const texture = atlas;
    atlas = undefined;
    atlasWidth = atlasHeight = 0;
    const buffers: Resource[] = [];
    for (const target of targets) {
      if (target.buffer) buffers.push(target.buffer);
      target.buffer = target.binding = target.atlas = target.rect = undefined;
    }
    // Submitted commands retain their GPU references. Destroying application
    // resources is safe after submit, including when completion never arrives.
    texture?.destroy();
    for (const buffer of buffers) buffer.destroy();
  };
  const fail = (error: Error) => {
    if (disposed || failed) return;
    failed = true;
    unavailable = true;
    interrupt();
    retireResources();
    onFailure(error);
  };
  const listener: Listener = {
    recovering() {
      if (disposed || failed) return;
      unavailable = true;
      interrupt();
      retireResources();
      onRecoveryChange?.(true);
    },
    restored(next) {
      if (disposed || failed) return;
      shared = next;
      unavailable = false;
      onRecoveryChange?.(false);
    },
    failed: fail,
  };
  listeners.add(listener);
  const presenter: WebGPUAvatarPresenter = {
    backend: 'webgpu',
    get maxTextureDimension2D() {
      return shared!.device.limits.maxTextureDimension2D;
    },
    attach(canvas) {
      if (disposed || failed) return null;
      let state = canvasStates.get(canvas);
      if (state?.owner?.active) return null;
      if (!state) {
        const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
        const limit = shared!.device.limits.maxTextureDimension2D;
        if (
          Math.round(canvas.clientWidth * ratio) > limit ||
          Math.round(canvas.clientHeight * ratio) > limit
        )
          return null;
        // An existing 2D canvas keeps its context; do not replace its DOM node.
        const context = contextFor(canvas);
        if (!context) return null;
        state = { context };
        canvasStates.set(canvas, state);
      }
      const target: Target = { canvas, state, active: true };
      state.owner = target;
      targets.add(target);
      return target;
    },
    present(stage, tiles) {
      if (disposed || failed || unavailable || shared!.retired) return Promise.resolve(false);
      if (pending.size >= MAX_PENDING)
        return Promise.reject(new Error('WebGPU presentation capacity exceeded'));
      if (!tiles.length) return Promise.resolve(true);
      const active = shared!;
      const limit = active.device.limits.maxTextureDimension2D;
      try {
        if (!(stage.width > 0 && stage.height > 0 && stage.width <= limit && stage.height <= limit))
          throw new Error('WebGPU atlas dimensions exceed device limits');
        let minX = stage.width,
          minY = stage.height,
          maxX = 0,
          maxY = 0;
        for (const tile of tiles) {
          const target = tile.target as Target;
          if (!targets.has(target) || !target.active)
            throw new Error('WebGPU target is not attached');
          if (
            ![tile.destinationWidth, tile.destinationHeight].every(
              (value) => Number.isInteger(value) && value > 0 && value <= limit,
            )
          )
            throw new Error('WebGPU destination dimensions exceed device limits');
          if (
            ![tile.sourceX, tile.sourceY, tile.sourceWidth, tile.sourceHeight].every(
              Number.isFinite,
            ) ||
            tile.sourceX < 0 ||
            tile.sourceY < 0 ||
            tile.sourceWidth <= 0 ||
            tile.sourceHeight <= 0 ||
            tile.sourceX + tile.sourceWidth > stage.width ||
            tile.sourceY + tile.sourceHeight > stage.height
          )
            throw new Error('Invalid WebGPU source rectangle');
          minX = Math.min(minX, tile.sourceX);
          minY = Math.min(minY, tile.sourceY);
          maxX = Math.max(maxX, tile.sourceX + tile.sourceWidth);
          maxY = Math.max(maxY, tile.sourceY + tile.sourceHeight);
        }
        if (!atlas || atlasWidth !== stage.width || atlasHeight !== stage.height) {
          const previous = atlas;
          atlasWidth = stage.width;
          atlasHeight = stage.height;
          atlas = active.device.createTexture({
            size: [atlasWidth, atlasHeight],
            format: 'rgba8unorm',
            usage: TEXTURE_USAGE,
          });
          previous?.destroy();
        }
        // Preserve sparse atlas rendering: copy only submitted tiles' union.
        // One source texel around it supplies the exact drawImage filter guard,
        // including current transparent pixels instead of stale atlas contents.
        const left = Math.max(0, Math.floor(minX) - 1),
          top = Math.max(0, Math.floor(minY) - 1),
          right = Math.min(stage.width, Math.ceil(maxX) + 1),
          bottom = Math.min(stage.height, Math.ceil(maxY) + 1);
        active.device.queue.copyExternalImageToTexture(
          { source: stage, origin: { x: left, y: top } },
          {
            texture: atlas,
            origin: { x: left, y: top },
            premultipliedAlpha: true,
            colorSpace: 'srgb',
          },
          [right - left, bottom - top],
        );
        const encoder = active.device.createCommandEncoder();
        for (const tile of tiles) {
          const target = tile.target as Target;
          const { canvas, state } = target;
          if (canvas.width !== tile.destinationWidth) canvas.width = tile.destinationWidth;
          if (canvas.height !== tile.destinationHeight) canvas.height = tile.destinationHeight;
          if (state.configured !== active) {
            state.context.configure({
              device: active.device,
              format: active.format,
              alphaMode: 'premultiplied',
              colorSpace: 'srgb',
            });
            state.configured = active;
          }
          if (!target.buffer)
            target.buffer = active.device.createBuffer({ size: 16, usage: UNIFORM_USAGE });
          const x = tile.sourceX / stage.width,
            y = tile.sourceY / stage.height,
            width = tile.sourceWidth / stage.width,
            height = tile.sourceHeight / stage.height;
          const rect = target.rect;
          if (!rect || rect[0] !== x || rect[1] !== y || rect[2] !== width || rect[3] !== height) {
            target.rect = [x, y, width, height];
            active.device.queue.writeBuffer(target.buffer, 0, new Float32Array(target.rect));
          }
          if (!target.binding || target.atlas !== atlas) {
            target.binding = active.device.createBindGroup({
              layout: active.pipeline.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: atlas.createView() },
                { binding: 1, resource: active.sampler },
                { binding: 2, resource: { buffer: target.buffer } },
              ],
            });
            target.atlas = atlas;
          }
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: state.context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
              },
            ],
          });
          pass.setPipeline(active.pipeline);
          pass.setBindGroup(0, target.binding);
          pass.draw(3);
          pass.end();
        }
        active.device.queue.submit([encoder.finish()]);
        let resolve!: (success: boolean) => void;
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const promise = new Promise<boolean>((done) => {
          resolve = done;
        });
        const gpuDone = active.device.queue.onSubmittedWorkDone();
        const ticket: Ticket = {
          finish(success) {
            if (settled) return;
            settled = true;
            // Cancellation settles the caller, but does not cancel the physical
            // queue watchdog. Even a disposed pool must detect a hung device.
            pending.delete(ticket);
            resolve(success);
          },
        };
        pending.add(ticket);
        timer = setTimeout(() => {
          lost(active, new Error('WebGPU presentation timed out'));
          ticket.finish(false);
        }, BATCH_TIMEOUT);
        void gpuDone.then(
          () => {
            clearTimeout(timer);
            const success = !disposed && !failed && !active.retired && shared === active;
            if (success) healthy(active);
            ticket.finish(success);
          },
          (error) => {
            clearTimeout(timer);
            lost(active, errorOf(error));
            ticket.finish(false);
          },
        );
        return promise;
      } catch (error) {
        fail(errorOf(error));
        return Promise.resolve(false);
      }
    },
    release(value) {
      const target = value as Target;
      if (!targets.delete(target)) return;
      target.active = false;
      if (target.state.owner === target) target.state.owner = undefined;
      const buffer = target.buffer;
      target.buffer = target.binding = target.atlas = target.rect = undefined;
      buffer?.destroy();
      // Do not unconfigure: it clears the retained canvas image. The WeakMap
      // permits same-canvas reattachment without retaining detached DOM nodes.
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.delete(listener);
      for (const target of [...targets]) presenter.release(target);
      retireResources();
      interrupt();
      // One idle device is retained for existing canvas bitmaps and future
      // mounts. No frame loop remains; individual atlas/uniform resources close.
    },
  };
  if (unavailable) onRecoveryChange?.(true);
  return presenter;
}
