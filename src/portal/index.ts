export {
  PortalProvider,
  PortalOutlet,
  Portal,
} from './Portal';
// The app-content half of a modal overlay: wrap everything EXCEPT the
// `PortalOutlet` in it. Lives in `overlay/` (it reads the modal registry) and is
// offered here because this is the subpath the app root already imports.
export { OverlayInertBoundary } from '../overlay/OverlayInertBoundary';
export type { OverlayInertBoundaryProps } from '../overlay/types';
