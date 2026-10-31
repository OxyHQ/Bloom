import { createAvatarReconciler } from './avatar-controller';
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
  return createAvatarReconciler(initial, current, {
    resolveRecipe: resolveCompleteEditorRecipe,
    initialRecipe: recipe,
    onCapabilities: callbacks.onCapabilities,
    onError: callbacks.onError,
    onDispose: () => pending.abort(),
  });
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
