# Android backward selection changes during a Fabric resize

Reproduced on Pixel 8a, Android 16 / API 36, React Native 0.88.1, Expo
58.0.23, Fabric, release/Hermes, font scale 1.15 and density 420. No device
settings were changed. The source hash and APK are pinned in `source.json`.

The `raw-input` fixture renders RN TextInput directly, with the same draft,
font/line height, width and autosize as ComposerPill. It contains no loader or
pill. Start the isolated fixture with `--es scene raw-input` and run
`verify-selection-direction.py` with `SCENE=raw-input TRACE_SELECTION=1`.
The script is an acceptance assertion and currently exits nonzero on resize.

Each fresh case places the caret at offset 5, then uses a real Shift+Left chord
to select backwards (5 → 4). After four seconds, another Shift+Left gives:

| Transition | Settled endpoints | Next Shift+Left |
| --- | --- | --- |
| None | 5 → 4 | 5 → 3, extends |
| Resize | 4 → 5 | 4 → 4, collapses |
| Busy state only | 5 → 4 | 5 → 3, extends |

Text, focus and the native input identity remain unchanged. The same failure
occurs in ComposerPill. Sorting the endpoints hides this functional difference.
Public RN selection events already sort endpoints, so a JS onSelectionChange
workaround cannot reconstruct the original anchor reliably.

The fixture-only SpanWatcher records attachment time, START/END changes and native
stacks without changing selection. The inversion stack is:

```
ReactTextInputManager.updateExtraData
ReactEditText.maybeSetText
SpannableStringBuilder.replace
TextView.handleTextChanged / Editor.sendOnTextChanged
SelectionModifierCursorController.resetTouchOffsets
SelectionModifierCursorController.resetDragAcceleratorState
Selection.setSelection
```

This is a Fabric text-state update reaching Android's Editor during layout.
The direct control does not call setText on resize; it changes width and field
height from onContentSizeChange. The watcher is diagnostic, not a fix.

The adjacent patch is proposed for the React Native source repository. It saves
native directional endpoints before replacing identical characters and restores
them after Android's synchronous text-change callbacks. Character-changing updates
retain current behavior. It has **not** been applied or validated; no node_modules
or published dependency was patched. Before adoption it needs native tests and
runtime checks for backwards/forward/collapsed selection, changed text, composition,
style-only updates and event ordering. Upstream submission remains separate.

Raw reports, full stacks, screenshots, R8 mapping and APK live under this worktree's
`.local/combined-native/raw-direction` and `.local/combined-native`. No claim of
complete selection preservation or issue acceptance follows from the other passing
composer interactions.

Required patch validation matrix (all pending):

- Backward, forward and collapsed selections across identical-text style/layout updates.
- Identical text with an explicit NEW controlled selection: the manager's later command must win.
- Changed characters, empty text and clearing composing text retain existing semantics.
- Secure-text early return and stale event counters must still bypass updates correctly.
- Active IME/composing spans and style spans survive; no spurious composition commits.
- Event ordering and repeated resize must not emit a lasting intermediate selection.

A successful resize case alone is insufficient to accept the proposed RN patch.

### Source test checkpoint (2026-11-08)

The original v0.88.1 source checkout compiled and passed all 27 existing
`ReactTextInputPropertyTest` cases. The accompanying selection-tests patch adds
five contract cases. Its TextWatcher **models** the sorting observed in Android
16 Editor; it does not reproduce the platform Editor implementation in
Robolectric. Without the source fix, 2 of 32 cases fail (backward direction,
including composing/style spans). With the proposed source fix, all 32 pass.
The matrix also covers forward/collapsed selection, explicit manager selection
commands after identical text, stale event counts, changed text, clearing
composition, and the existing secure-text bypass test. Real IME behavior and
physical resize still require an APK built against this patched RN source.

Command from the source clone (Yarn is a local wrapper for `corepack yarn`):

```sh
ANDROID_HOME=/home/nate/Android/Sdk ./gradlew \
  :packages:react-native:ReactAndroid:testDebugUnitTest \
  --tests com.facebook.react.views.textinput.ReactTextInputPropertyTest \
  --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

Raw original/negative/patched logs and XML are archived in the integration
worktree's `.local/rn-selection-evidence/`. No installed React Native package
was patched.
