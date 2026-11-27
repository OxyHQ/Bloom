// A copy of Mention's `utils/sheet.ts`: its parameter's type is an alias re-exported by a
// module index.
import type { PresentOptions, SurfaceRenderFn } from './surfaces';

export function presentSheet<Result = unknown>(
  render: SurfaceRenderFn,
  options?: PresentOptions,
): Promise<Result> {
  void render;
  void options;
  return Promise.resolve(undefined as Result);
}
