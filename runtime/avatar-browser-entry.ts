import { registerAvatarRuntime } from './avatar-runtime';

export { CHARACTER_RUNTIME_URL, createAvatar } from './avatar-runtime';

// This leaf entry is never imported by the renderer's implementation chunks.
// Registration therefore follows the actual requested URL, including relocated
// hosts, entry URL aliases and query strings, rather than a shared chunk URL.
registerAvatarRuntime(import.meta.url);
