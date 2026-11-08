# Offline avatar authoring inputs

This directory contains the original geometry, authored animation channels and extraction
helpers used by `scripts/build-avatar-vector-assets.mjs`. It is not shipped in the package,
imported by production components, hosted by Storybook, or loaded by consumers.

Run `bun run build:avatar-vectors` against the local source development server after changing
authored geometry or animation. This creates the tracked, lazy JSON vector assets under
`src/agent-avatar/vector-assets/` and the static SVG portraits. The generator uses Three only
as an offline development tool; neither browser nor native avatars load Three or a WebView.

The shipped renderer is `src/agent-avatar/VectorCharacterAvatar.tsx`, backed by the shared
pure frame projector. `scripts/verify-avatar-cutover.mjs` checks packed platform outputs and
rejects the retired hosted runtime. Geometry and retargeting unit tests remain useful here
as extraction tests; historical WebGL browser harnesses have been removed.
