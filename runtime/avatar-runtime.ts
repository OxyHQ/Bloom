import { resolveCompleteEditorRecipe } from './avatar/recipe';
import type { EditorRenderProps } from './avatar-contract';
import type { CharacterCapabilities } from '../src/agent-avatar/context';

// The editor resolves its shape/eye thumbnails beside the runtime URL.
export const CHARACTER_RUNTIME_URL = '/bloom-character/runtime.mjs';
type Callbacks = {
  onError(): void;
  onReady?(): void;
  onCapabilities?(value: CharacterCapabilities): void;
};
type Controller = { update(props: EditorRenderProps): void | Promise<void>; dispose(): void };

/** The real editors and galleries share one renderer for every catalog recipe. */
export async function createAvatar(
  canvas: HTMLCanvasElement,
  initial: EditorRenderProps,
  callbacks: Callbacks,
): Promise<Controller> {
  const pending = new AbortController();
  const recipe = resolveCompleteEditorRecipe(initial);
  const { attachEditorAvatar } = await import('./avatar-pool');
  canvas.dataset.avatarEngine = 'new';
  const current = await attachEditorAvatar(
    canvas,
    initial,
    recipe,
    callbacks.onReady,
    callbacks.onError,
    pending.signal,
  );
  callbacks.onCapabilities?.(recipe.capabilities);
  let latest = initial;
  let applied = initial;
  let disposed = false;
  let running: Promise<void> | undefined;
  const reconcile = async () => {
    while (!disposed && applied !== latest) {
      const props = latest;
      const next = resolveCompleteEditorRecipe(props);
      await current.update(props, next);
      if (!disposed) callbacks.onCapabilities?.(next.capabilities);
      applied = props;
    }
  };
  return {
    update(props) {
      if (disposed) return;
      latest = props;
      if (!running)
        running = reconcile()
          .catch(() => {
            if (!disposed) {
              disposed = true;
              pending.abort();
              current.dispose();
              callbacks.onError();
            }
          })
          .finally(() => {
            running = undefined;
          });
      return running;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending.abort();
      current.dispose();
    },
  };
}

if (typeof document !== 'undefined') {
  const key = Symbol.for('bloom.character.runtimes');
  const scope = globalThis as unknown as Record<symbol, Map<string, unknown>>;
  const registry = (scope[key] ??= new Map());
  const runtime = {
    createAvatar,
    diagnostics: async () => (await import('./avatar-pool')).editorPoolDiagnostics(),
  };
  registry.set(import.meta.url, runtime);
  if (import.meta.env.DEV)
    registry.set(new URL(CHARACTER_RUNTIME_URL, document.baseURI).href, runtime);
}
