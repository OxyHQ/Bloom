import { Dialog } from '../dialog';
import { createSurfaceHost } from './SurfaceHost';

/**
 * The shared, content-agnostic SURFACE STACK.
 *
 * `<SurfaceProvider>`/`<SurfaceHost>` render the coordinated stack; the
 * imperative `surfaces` API (+ its named functions) present into it from
 * anywhere; `useSurface()` gives a presented surface its own controls.
 *
 * `SurfaceHost`/`SurfaceProvider` are bound to the NATIVE `Dialog` here; the web
 * fork (`./index.web`) binds the web `Dialog`. The store, imperative API, hook,
 * and types are platform-agnostic and shared by both.
 */
const { SurfaceHost, SurfaceProvider } = createSurfaceHost(Dialog);

export { SurfaceHost, SurfaceProvider };
export {
  surfaces,
  present,
  dismiss,
  dismissById,
  dismissToRoot,
  dismissAll,
  alert,
  confirm,
  prompt,
} from './api';
export { useSurface } from './use-surface';
export type {
  SurfacePresentation,
  PresentOptions,
  SurfaceControls,
  SurfaceRenderFn,
  SurfaceStatus,
  SurfaceEntry,
  AlertButton,
  AlertButtonStyle,
  SurfaceConfirmOptions,
  SurfacePromptOptions,
} from './types';
