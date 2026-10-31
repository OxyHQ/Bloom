/** Native builds consume the same engine and loaders, with a native host adapter.
 * This entry deliberately excludes the browser runtime and DOM canvas pool. */
export { AuthoredAvatarEngine } from './avatar/authored-engine';
export { createCatalogAssetResolver } from './avatar/catalog-assets';
export { createCatalogMotion } from './avatar/catalog-motion-factory';
export {
  createAvatarSlotController,
  createAvatarReconciler,
  avatarPresentationFrozen,
} from './avatar-controller';
export { resolveCompleteEditorRecipe } from './avatar/recipe';
