import type { ImageSource } from './types';

/** Geometry errors must fail explicitly rather than producing invalid SVG dimensions. */
export function assertSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('[Bloom] Shapes: size must be a positive finite number.');
  }
}

export function assertWidth(width: number): void {
  if (!Number.isFinite(width) || width < 0) {
    throw new Error(
      '[Bloom] Shapes: border width must be a non-negative finite number.',
    );
  }
}

/** SVG and native image loaders only share this URI/asset subset. */
export function assertImageSource(
  source: unknown,
): asserts source is ImageSource {
  if (typeof source === 'number' && Number.isSafeInteger(source) && source > 0)
    return;
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const descriptor = source as Record<string, unknown>;
    const keys = Object.keys(descriptor);
    const allowed = new Set(['uri', 'width', 'height', 'scale']);
    const metadataValid = ['width', 'height', 'scale'].every((key) => {
      const value = descriptor[key];
      return (
        value === undefined ||
        (typeof value === 'number' && Number.isFinite(value) && value > 0)
      );
    });
    if (
      keys.every((key) => allowed.has(key)) &&
      typeof descriptor.uri === 'string' &&
      descriptor.uri.trim() &&
      metadataValid
    )
      return;
  }
  throw new TypeError(
    '[Bloom] Shapes.Image source must be a positive asset ID or { uri, width?, height?, scale? }. Source arrays and request options (headers, method, body, cache) are unsupported; use a directly accessible, signed, data or local URI.',
  );
}
