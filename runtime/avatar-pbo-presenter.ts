import { readPixelsAsync } from './avatar/async-pixels';

export type CanvasAvatarTile = {
  context: CanvasRenderingContext2D;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destinationWidth: number;
  destinationHeight: number;
  isCurrent(): boolean;
  onPresented?(): void;
};

// Pixel8a: 4/8/16 CPU-backed 128² destinations improved from 43/22/13 to
// about60 completed batches/s. Larger outputs regressed. Keep this scoped to
// active small destinations; docs/benchmarks/avatar-web-presenters-2026-10-31.json.
export const PBO_MINIMUM_DESTINATIONS = 4;
export const PBO_MAXIMUM_DESTINATION_AREA = 128 * 128;

/** One asynchronous read of the eligible tiles' union, followed by the exact
 * existing Canvas2D crop/filter. Scratch storage remains CPU-backed; reading it
 * back from the GPU separately for each small destination would restore the cost. */
export function createPBOAvatarPresenter() {
  const scratch = document.createElement('canvas');
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) throw Error('Avatar CPU presentation canvas unavailable');
  const slots = Array.from({ length: 2 }, () => ({
    busy: false,
    bytes: new Uint8Array(0),
    read: undefined as ReturnType<typeof readPixelsAsync> | undefined,
  }));
  let disposed = false;
  let generation = 0;
  let image: ImageData | undefined;
  let previous: Promise<boolean> = Promise.resolve(true);
  return {
    backend: 'pbo' as const,
    present(stage: HTMLCanvasElement, tiles: readonly CanvasAvatarTile[]): Promise<boolean> {
      if (disposed || !tiles.length) return Promise.resolve(false);
      const slot = slots.find((value) => !value.busy);
      if (!slot) throw Error('Avatar CPU presentation capacity exceeded');
      // Preserve the neighboring sample used by the existing bilinear filter.
      const left = Math.max(0, Math.floor(Math.min(...tiles.map((tile) => tile.sourceX))) - 1);
      const top = Math.max(0, Math.floor(Math.min(...tiles.map((tile) => tile.sourceY))) - 1);
      const right = Math.min(
        stage.width,
        Math.ceil(Math.max(...tiles.map((tile) => tile.sourceX + tile.sourceWidth))) + 1,
      );
      const bottom = Math.min(
        stage.height,
        Math.ceil(Math.max(...tiles.map((tile) => tile.sourceY + tile.sourceHeight))) + 1,
      );
      const width = right - left,
        height = bottom - top;
      const gl = stage.getContext('webgl2');
      if (!gl) throw Error('Avatar presentation context unavailable');
      slot.busy = true;
      if (slot.bytes.length !== width * height * 4) slot.bytes = new Uint8Array(width * height * 4);
      const read = readPixelsAsync(
        gl,
        null,
        left,
        stage.height - bottom,
        width,
        height,
        30000,
        slot.bytes,
      );
      slot.read = read;
      const predecessor = previous;
      const currentGeneration = generation;
      const task = read.promise
        .then(async (pixels) => {
          // GPU reads may finish out of order; the destination must retain the
          // newest submitted frame, and scratch memory is shared between commits.
          await predecessor;
          if (disposed || generation !== currentGeneration || document.hidden) return false;
          if (scratch.width !== stage.width || scratch.height !== stage.height) {
            scratch.width = stage.width;
            scratch.height = stage.height;
          }
          if (!image || image.width !== width || image.height !== height) {
            image = new ImageData(width, height);
          }
          const target = image.data;
          for (let y = 0; y < height; y++) {
            let source = (height - y - 1) * width * 4,
              destination = y * width * 4;
            for (let x = 0; x < width; x++, source += 4, destination += 4) {
              const alpha = pixels[source + 3]!;
              target[destination + 3] = alpha;
              if (alpha === 255) {
                target[destination] = pixels[source]!;
                target[destination + 1] = pixels[source + 1]!;
                target[destination + 2] = pixels[source + 2]!;
              } else if (alpha === 0) {
                target[destination] = target[destination + 1] = target[destination + 2] = 0;
              } else {
                const scale = 255 / alpha;
                target[destination] = Math.round(pixels[source]! * scale);
                target[destination + 1] = Math.round(pixels[source + 1]! * scale);
                target[destination + 2] = Math.round(pixels[source + 2]! * scale);
              }
            }
          }
          context.putImageData(image, left, top);
          let painted = false;
          for (const tile of tiles) {
            if (!tile.isCurrent()) continue;
            painted = true;
            tile.context.clearRect(0, 0, tile.destinationWidth, tile.destinationHeight);
            tile.context.drawImage(
              scratch,
              tile.sourceX,
              tile.sourceY,
              tile.sourceWidth,
              tile.sourceHeight,
              0,
              0,
              tile.destinationWidth,
              tile.destinationHeight,
            );
            tile.onPresented?.();
          }
          return painted;
        })
        .catch((error) => {
          if (disposed || generation !== currentGeneration || document.hidden || gl.isContextLost())
            return false;
          throw error;
        })
        .finally(() => {
          slot.busy = false;
          slot.read = undefined;
        });
      // Install the rejection handler immediately, including when no next
      // frame is submitted. The caller still receives the original rejection.
      previous = task.catch(() => false);
      return task;
    },
    cancelPending() {
      generation++;
      for (const slot of slots) slot.read?.cancel();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      for (const slot of slots) {
        slot.read?.cancel();
        slot.bytes = new Uint8Array(0);
      }
      image = undefined;
      scratch.width = scratch.height = 0;
    },
  };
}
