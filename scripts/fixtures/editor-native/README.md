# Physical Android editor acceptance

Source candidates executed on the Pixel 8a; published-package acceptance remains pending. Coordinate the Pixel 8a window with the Bloom device
owner before changing the foreground app. Use a Nilo-compatible native dev client
that includes `react-native-enriched-html` and the declared editor peers; the
material-only lab APK cannot prove editor behavior. WSL must use the already
verified Windows ADB server/serial, not start another server against the USB port.
Record APK identity, native module versions, resolved Bloom/editor package versions
and whether this is a packed source candidate or published-package pass.

Copy App.tsx into an isolated native fixture entrypoint, register it with Expo's
registerRootComponent, and use the app's normal Metro/native configuration. It
uses only public package APIs and synthetic in-memory test document state. Do not
commit that entrypoint to a product route or point the fixture at production APIs.
The final gate requires published packages; a packed candidate is diagnostic only.

Capture screen recording, screenshots, UIAutomator hierarchy and filtered
`EDITOR434`/`EDITOR434_OPEN` logcat. The fixture exposes keyboard visibility,
focused block, link draft and selection, plus document transactions in its logs.
The setup buttons select reproducible ranges but do not substitute for gestures.

1. Tap first paragraph, type a suffix using the actual IME and confirm it persists.
   Move caret inside/outside “linked” with taps and selection handles. A link
   preview must not grab focus, hide the IME or block continuous editing.
2. Long-press and drag both range handles across the link boundary; type replacement
   text. Verify the correct range, one undo, keyboard continuity and no stale sheet.
3. Use the shared bottom toolbar to open Link. Check focus enters its URL field;
   invalid URL remains editable; Apply changes the original range. Moving selection
   or entering the second block cancels that draft instead of retargeting it.
4. Edit the existing link at a collapsed caret. Open logs exactly one route action;
   Remove only removes its link. Android Back closes the innermost editor overlay
   first and keeps the document/caret usable. Repeat with keyboard visible/hidden.
5. Repeat in a parent Dialog and after width/orientation change. Retain draft and
   document identity; no duplicate material, covered Apply, or detached selection.

Current risk requiring this gate: web uses an anchored Popover; native Popover's
existing presentation is a sheet/platform popup. Automatically opening that sheet
merely from caret placement is not accepted until the above checks pass. If it
interrupts native editing, keep contextual actions in the existing EditorToolbar
and open the appropriate overlay only on deliberate activation; do not add a
second local popup engine. The complete matrix remains a pending gate; see the measured cases in docs/audits/issue-434/native-focus.


`capture.mjs` records one named checkpoint without launching the app or touching
focus. Set ADB to the coordinated executable, optional ADB_PORT, ANDROID_SERIAL,
APP_ID, BLOOM_VERSION, EDITOR_VERSION and a fresh OUTPUT directory. It refuses to
capture when the fixture does not own the foreground window. Each capture is
explicitly marked captured-not-evaluated; review text/selection/IME and recording
against the sequence above. App.tsx typechecks against public package exports;
that is not evidence that the native binary or interaction has passed.

`verify-handoff.py` drives the synthetic fixture's URL handoffs with UIAutomator
labels/bounds, taps, text and Back/Escape key injection. Set the same coordinated
ADB/ADB_PORT/ANDROID_SERIAL/APP_ID plus a fresh OUTPUT path. It requires the
fixture already running and does not install, launch, reset or alter settings.
It captures observations; evaluate report.json and events against acceptance
criteria rather than treating process exit zero as a pass. Injected Escape is
not physical keyboard validation. The tested Pixel uses density 420/font scale
1.15; the paragraph tap positions are for that fixture configuration.

Host requirements: one SafeAreaProvider, GestureHandlerRootView, KeyboardProvider
(react-native-keyboard-controller 1.23.0 in the recorded lab), AppShell scroll=fixed
and Screen bottomBarKeyboardBehavior=follow. The lab uses Expo 58.0.23, RN 0.88.1,
React 19.3.0, enriched-html 1.1.1, Reanimated 4.7.1 and app-preset 6.5.1. Source
candidates are packed/extracted separately; never overwrite Bun's hardlinked
node_modules packages. Save APK/embedded bundle hashes and source-map markers.
