# Published ComposerLoader browser consumer

This offline fixture imports public subpaths of npm `@oxy.so/bloom@18.4.0`.
It does not import checkout source, change the renderer, or enable React Compiler.
The Vite host configuration comes from Bloom's documented Vite consumer. Its
locked React/RN/Reanimated versions describe this web host, not an Android binary.

```sh
cd scripts/loader-web-lab
bun install --frozen-lockfile
mkdir -p artifacts
npm view @oxy.so/bloom@18.4.0 dist --json > artifacts/registry.json
npm pack @oxy.so/bloom@18.4.0 --pack-destination artifacts --json > artifacts/pack.json
node attest.mjs
bun run typecheck
bun run build
bun run preview --port 6156
# In another terminal, same directory:
BROWSER=chromium BROWSER_PATH=/path/to/chrome node verify.mjs
BROWSER=firefox BROWSER_PATH=/path/to/firefox node verify.mjs
BROWSER=webkit BROWSER_PATH=/path/to/pw_run.sh node verify.mjs
```

`BROWSER_PATH` is optional when Playwright's matching browsers are installed.
Record the actual browser version from each report; the browser executable may
come from a different installation than the pinned Playwright client. `URL` and
`OUT` override the preview URL and result directory. Wrap a potentially stalled
browser in an external process-group timeout, e.g. `timeout --kill-after=5s 60s`;
a timeout is blocked/failed evidence, never a pass. Only terminate processes
launched by that run.

The receipt verifies the npm SHA-512 and every packaged file against the installed
consumer. Tests retain the actual input DOM node and assert focus, draft, backward
selection and its direction through width/theme/attachment and all six phase
changes, followed by a real Stop click and typing. Fixture control mouse-down
intentionally preserves focus: these controls simulate app state updates, not
normal user toolbar focus behavior. Attachment is exercised on ComposerPill;
AgentChatComposer sees the shared fixture state change but has no attachment prop
in this scene. No upload, microphone, chat service or remote turn is configured.

Retained Screen and reduced motion checks wait for CSS Animation.ready before
sampling a paused clock. An earlier Firefox read sampled the pending pause and
advanced before settling; that negative is retained in the evidence. The gate
checks steady suspension, not a maximum pause latency budget.

The phase captures pause the existing CSS animations at 0/1000/2000/3000 ms;
they do not mock the renderer. Full viewport PNGs precede any crop. SVG snapshots
retain filter regions, blur units, gradient, dashes and radius for diagnosis.
Equal elapsed CSS time does **not** align native path origins; no native optical
parity is claimed. These still frames are not two-lap video or performance data.

Scope limits: no device keyboard/rotation, drawer/menu, unmount during fade,
physical web browser, Alia app or iOS. The whole issue #663 interaction and
selection checkboxes therefore remain open. The web host and all controls are
private verification files, excluded from the published package.
