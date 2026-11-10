# Clean task discovery — published Bloom 18.2.1

This records the §10.3 clean consumer exercise against the exact 18.2.1
registry tarball. The consumer received the packed task guide and examples; it
did not import Bloom source or recreate Bloom's workspace, map controls or chat
composer.

## Package and consumer boundary

- Bloom: `@oxy.so/bloom@18.2.1`
- npm integrity: `sha512-DmGTL/4GiOqaDtU4MWSj2bKlt149uCAAVnxvfxclUXGUJyqDZ3a2WeUyQGHH/L3f200n8XMLH2Tl+L8RHty9ww==`
- Registry tarball: `https://registry.npmjs.org/@oxy.so/bloom/-/bloom-18.2.1.tgz`
- Tarball SHA-512 was computed locally and matched the registry's `dist.integrity` before extraction and install.
- Host: the Vite example copied from that tarball. Its `style.css` was used unchanged, including Bloom's required `web:` variant.
- The example manifest was adjusted only to install that exact tarball by file URL and to serve on an isolated local port. `consumer-manifest.json` records the package resolution.
- The published `workspace.tsx`, `canvas.tsx` and `conversation.tsx` examples are copied beside their source hashes; `main.tsx` is the consumer's content/state adapter. It supplies document text and inspector state, synthetic map-engine callbacks, and conversation submit/stop state.

## Selections and interactions

| Task | Selected example and imports | Browser check |
| --- | --- | --- |
| Continuous document workspace | `Workspace` from `@oxy.so/bloom/app-shell`, `/page-header`, `/screen`; app content uses `TextFieldInput` from `/text-field` | Enter document and inspector drafts; resize the same mounted tree through 1400, 700, 390 and 1400 CSS px; assert values and native DOM node identities persist. |
| Interactive canvas/map | `Canvas`, `MapTools` from `/map-controls`, `/typography`, `/app-shell`, `/page-header`, `/screen` | Invoke zoom, locate, tilt, reset heading and layer picker; assert callback state, then use controls at 390 CSS px. The canvas example explicitly leaves map rendering/gestures to the app engine. |
| Agent conversation | `Conversation` from `/agent-chat` | Submit text, verify the published animated loader changes frames while streaming, invoke Stop and confirm it returns to the ready state. |

`verify.mjs` contains the browser assertions and screenshot steps. The report is
`runtime-results.json`; the screenshots show the workspace at desktop/mobile,
the compact canvas and the busy conversation. `package.json` typecheck and
production build both passed from the installed tarball consumer. Logs are
included. Chromium was 156.0.8078.4 and the run had no uncaught page errors.

## Limits

This proves task discovery and browser behavior for these three examples in one
clean consumer. It does not prove adoption in any production app, every
catalogued component, Android/iOS behavior, or the persistent map-panel contract
that the canvas guide says is not yet provided. iPhone validation remains
deferred by the user.
