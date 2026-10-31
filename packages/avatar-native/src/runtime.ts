import expected from '../lib/asset-manifest.json';
import type { Runtime } from './types';
const factory = require('../lib/runtime.cjs') as (base: string) => Runtime;
const compatible = new Map<string, { pending: Promise<boolean>; expires: number }>();
const runtimes = new Map<string, Runtime>();

export const assetBase = (runtimeUrl: string) => new URL('.', runtimeUrl).href;

/** Native JS is bundled with the app; it must never guess whether a mutable host
 * still serves its exact geometry/motion revision. The web fallback owns its own
 * runtime/assets pairing when this check cannot establish compatibility. */
export function isRuntimeCompatible(runtimeUrl: string) {
  const base = assetBase(runtimeUrl);
  if (new URL(runtimeUrl).href !== new URL(expected.entry, base).href)
    return Promise.resolve(false);
  let record = compatible.get(base);
  if (!record || record.expires <= Date.now()) {
    const pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(new URL('manifest.json', base).href, {
          signal: controller.signal,
        });
        if (!response.ok) return false;
        const manifest = (await response.json()) as { files?: Record<string, string> };
        return (
          manifest.files != null &&
          Object.keys(manifest.files).length === Object.keys(expected.files).length &&
          Object.entries(expected.files).every(([name, hash]) => manifest.files?.[name] === hash)
        );
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    })();
    record = { pending, expires: Infinity };
    compatible.set(base, record);
    const current = record;
    void pending.then((valid) => {
      current.expires = Date.now() + (valid ? 60_000 : 5_000);
    });
  }
  return record.pending;
}

export function getRuntime(runtimeUrl: string) {
  const base = assetBase(runtimeUrl);
  let runtime = runtimes.get(base);
  if (!runtime) {
    runtime = factory(base);
    runtimes.set(base, runtime);
  }
  return runtime;
}
