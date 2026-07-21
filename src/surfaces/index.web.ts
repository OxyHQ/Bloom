import { Dialog } from '../dialog/index.web';
import { createSurfaceHost } from './SurfaceHost';

/**
 * Web variant of the surface stack barrel. Identical surface area to the native
 * `./index.ts` — it just binds the web-fork `Dialog` (`Dialog.web.tsx`, a
 * pure-DOM overlay) instead of the native `BottomSheet`-backed one. The store,
 * imperative API, hook, and types are shared, platform-agnostic modules.
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
  confirm,
  prompt,
} from './api';
export { useSurface } from './useSurface';
export type {
  SurfacePresentation,
  PresentOptions,
  SurfaceControls,
  SurfaceRenderFn,
  SurfaceStatus,
  SurfaceEntry,
  SurfaceConfirmOptions,
  SurfacePromptOptions,
} from './types';
