# Avatar runtime

Generated from `runtime/` by `bun run build:avatar-runtime`. Host this whole directory at `/bloom-character/`, or configure AgentAvatarProvider with the absolute URL of `runtime.mjs`. Geometry and motion load on demand; files under assets/ and chunks/ must keep their relative paths. Selectors render isolated parts through this engine. `manifest.json` pins every deployed file.

This is the sole avatar engine. It uses a shared WebGL scene per browser document, with no WASM, workers, SVG renderer or compatibility fallback. Native uses the same runtime through the optional WebView bridge.
