/** Native Metro cannot analyze import(variable); load the optional browser module as a module script. */
const registryKey = Symbol.for('bloom.character.runtimes');
const pending = new Map<string, Promise<unknown>>();
export function loadCharacterRuntime<T>(url: string): Promise<T> {
  const resolved = new URL(url, document.baseURI).href;
  const registry = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[registryKey];
  const existing = registry?.get(resolved);
  if (existing) return Promise.resolve(existing as T);
  const request = pending.get(resolved);
  if (request) return request as Promise<T>;
  const promise = new Promise<unknown>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = resolved;
    script.onload = () => {
      script.remove();
      const loaded = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[
        registryKey
      ]?.get(resolved);
      if (loaded) resolve(loaded);
      else {
        pending.delete(resolved);
        reject(new Error('Invalid character runtime module'));
      }
    };
    script.onerror = () => {
      script.remove();
      pending.delete(resolved);
      reject(new Error('Character runtime could not be loaded'));
    };
    document.head.appendChild(script);
  });
  pending.set(resolved, promise);
  return promise as Promise<T>;
}
