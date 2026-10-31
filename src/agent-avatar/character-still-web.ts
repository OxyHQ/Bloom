import type { Controller, RuntimeModule } from './CharacterAvatar';
import { loadCharacterRuntime } from './character-runtime-module';
import type { StillBackend } from './character-still';

const PAINT_TIMEOUT_MS = 15_000;
/** The last render stays attached briefly so the next one joins its pool instead of building a new GL scene. */
const LINGER_MS = 1_500;

type Held = { controller: Controller; box: HTMLElement };
let lingering: (Held & { timer: ReturnType<typeof setTimeout> }) | undefined;
const release = (held: Held) => {
  held.controller.dispose();
  held.box.remove();
};

/**
 * Draws a still on web with the runtime the live avatars use: a paused portrait in an invisible,
 * fixed-size box (the pool reads the canvas's layout size, so it cannot be detached or
 * `display:none`), read back once with `toDataURL`. Renders arrive one at a time from the queue.
 */
export const renderWebStill: StillBackend = async ({
  runtimeUrl,
  character,
  css,
  previewPart,
  onCapabilities,
}) => {
  if (typeof document === 'undefined') return null;
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = `position:fixed;left:0;top:0;width:${css}px;height:${css}px;opacity:0;pointer-events:none`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  box.append(canvas);
  document.body.append(box);
  let controller: Controller | undefined;
  let finished = false;
  let timeout!: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Still timed out')), PAINT_TIMEOUT_MS);
  });
  try {
    const runtime = await Promise.race([loadCharacterRuntime<RuntimeModule>(runtimeUrl), deadline]);
    let painted!: () => void;
    let failed!: (reason: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      painted = resolve;
      failed = reject;
    });

    const created = runtime
      .createAvatar(
        canvas,
        { character, paused: true, portrait: true, reduced: true, previewPart },
        { onError: () => failed(new Error('Still failed')), onReady: painted, onCapabilities },
      )
      .then((instance) => {
        if (finished) {
          instance.dispose();
          return instance;
        }
        controller = instance;
        return instance;
      });
    // A hung asset load must not block the entire still queue past the timeout.
    // The controller may arrive after a failure; release it in the continuation.
    await Promise.race([Promise.all([created, ready]), deadline]);
    const uri = canvas.toDataURL('image/png');
    return uri.startsWith('data:image/png;base64,') ? uri : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    finished = true;
    if (lingering) {
      clearTimeout(lingering.timer);
      release(lingering);
      lingering = undefined;
    }
    if (controller) {
      const held = { controller, box };
      const retained = {
        ...held,
        timer: setTimeout(() => {
          release(held);
          if (lingering === retained) lingering = undefined;
        }, LINGER_MS),
      };
      lingering = retained;
    } else box.remove();
  }
};
