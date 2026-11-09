# Android editor candidate run — 2026-11-09

**Result: failed; do not use as final acceptance.** The Pixel 8a could run the
candidate APK and the link editor retained its target through Apply and an
external selection. Android Back did not dismiss the open link editor: with the
IME visible, Back hid the keyboard and left the editor open; the next Back
returned to GoWay instead of closing the editor. The failure reproduced on a
second run. This leaves the physical Android gate for PR #679 open.

## Exact build

- Device: Pixel 8a, Android 16 / API 36, 1080 × 2400, density 420, font scale
  1.15; connected over USB and addressed through the Windows ADB server at port
  5038 (`43221JEKB12200`).
- App: `so.oxy.bloom.editorlab`; release APK, arm64-v8a; SHA-256
  `a40239c4ed523c031426def6b9cb56a0415c3f9dae7469a0b1b2518773f845b2`.
- Bloom: published `@oxy.so/bloom@17.24.0`.
- Editor: candidate `@oxy.so/bloom-editor@0.8.0` tarball, SHA-512
  `c4ac9bc9c07b6b3021bfac162ff1891626dee3d5ba3abd1ff4e7375e88ab07a9ceadfe7d4ba31306a4ad3c689e16800b0460a0a965fc9b29eaa1d8aabca3cf14`.
  The 0.8.0 package is not yet published to npm, so this is candidate-package
  evidence, not the required published-package run.
- Host: Expo 58.0.23, React Native 0.88.1, `react-native-enriched-html` 1.1.1.
- The release APK built successfully with Gradle. The screen and UIAutomator
  captures below came from the installed APK; they use synthetic in-memory
  editor state only.

## Observed interaction

| Step | Observed | Result |
| --- | --- | --- |
| Tap the first paragraph inside “linked” | Caret selected at offsets 10–10; IME visible. | Pass |
| Open Link from the shared toolbar | Draft target is `fixture-1`, selection offsets 7–13; URL field is focused and IME remains visible. | Pass |
| Append `changed` to the URL and Apply | Only the original target's link changed to `https://example.test/linkchanged`; editor focus returned and IME stayed visible. | Pass |
| Reopen Link, then select the second paragraph | Link draft cleared; focus moved to `fixture-2`; no stale sheet remained. | Pass |
| Open Link and press Android Back with IME visible | IME hid, but the Link sheet remained open with its URL and Apply/Cancel controls. | **Fail** |
| Press Back again with IME hidden | The editor activity exited to GoWay while the link sheet was still open. | **Fail** |

The automated sequence used Android input injection for the text edit and Back
keys. It did not exercise physical selection-handle dragging, real typing,
invalid-URL correction, a parent Dialog, orientation changes, or performance.
Those checks remain not run. No iPhone validation was performed, as requested.

## Artifacts

- [Link editor with IME](link-editor-with-ime.png)
- [Back left the overlay open](back-leaves-overlay-open.png)
- [UIAutomator hierarchy after Back](back-leaves-overlay-open.xml)
- [Machine-readable observations](report.json)

The fixture's capture and interaction scripts now use `dumpsys window` for the
foreground check; on this Pixel, `dumpsys window windows` omits the current
focus lines and incorrectly rejects a valid capture.
