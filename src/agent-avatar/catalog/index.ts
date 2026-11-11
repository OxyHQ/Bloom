/**
 * Choose which character vector assets an app ships. Import the assets you draw from
 * `@oxy.so/bloom/agent-avatar/catalog/<kind>-<id>` and pass them here; hand the result to
 * `BloomProvider avatarCatalog` or `AgentAvatarProvider catalog`. See docs/agent-avatar.mdx.
 */
export { createVectorAssetLoader } from '../vector-loader';
export type { VectorAssetImport, VectorAssetLoader, VectorAssetSources } from '../vector-loader';
