# Android block focus and stacking

Physical Pixel 8a, density 420 and font scale 1.15 unchanged. Synthetic document;
separate `so.oxy.bloom.editorlab` release APK denies INTERNET permission. Receipts
record APK and embedded JS hashes plus the actual BlockRow source in the bundle.
This is a source-candidate diagnostic, not published-package acceptance or iPhone
validation. The fixture's missing host SafeAreaProvider was corrected before these
comparisons; that initial startup error is not attributed to the editor.

Published Bloom 17.22.0/editor 0.7.2 and the initial editor candidate both lost
focus about 44ms after tapping a paragraph outside its link. Removing AppShell and
Screen did not fix it. Direct React Native TextInput, EnrichedTextInput and Bloom
RichTextInput controls retained focus and the IME in the same host. The direct
RichTextInput control uses complete semantic text colors, as the editor does;
a partial diagnostic style initially failed native validation before interaction.

`before.log` records the published editor's native input host #48@117792717:
focus at 12:32:06.491, detach .555, attach .558 beneath new ReactViewGroup #58,
then another detach/attach .586–.589 when blur removes that group. The host object
itself is unchanged. R8 mapping identifies qs0 as EnrichedTextInputView and hc3 as
ReactViewGroup. `MainActivity.kt` is the fixture-only focus/attach observer used
for both builds, with no focus or layout writes.

BlockRow raised both wrappers with zIndex on focus even on native. Restricting
that existing web stacking to web prevents Fabric from materializing the native
row mid-focus. `after.log` has a single focus into host #48@219491273 under parent
#60 and no detach/reattach. `after.png` and UI state show focused fixture-1 with
IME visible. A real on-screen q key tap produced `Beqfore linked after` and caret
3 without losing focus. The platform styling regression fails Android/iOS before
the fix and preserves the web raise; all three cases pass afterward. The iOS
case is a styling contract test in jsdom, not a physical device claim.

A separate unresolved criterion remains: tapping inside the link now opens the
candidate's native Popover sheet automatically and hides the IME. The negative
PNG/log preserve this failure. It must be addressed through deliberate actions
in the existing native editor toolbar. Link editing, range dragging, Apply, Back,
undo and final published acceptance remain pending; the focus fix alone does not
complete issue 434.

The follow-up candidate moves contextual navigation/removal into EditorToolbar
and opens URL editing only on a deliberate Link press. Native TextBlock never
opens the inline sheet on caret movement. Nilo's full page and row peek, and
Noted's native editor, already mount EditorToolbar. Custom hosts must provide
explicit controller actions if they omit that toolbar. The surface registers
current navigation callbacks without callback-identity UI loops and clears them
on readOnly/unmount. A component regression checks collapsed-link routing,
callback replacement, selection movement, explicit editing/removal and cleanup.
22 editor suites / 272 tests and the editor build pass against the source mirror;
this is still pending physical interaction and published-package acceptance.
The acceptance fixture now supplies the required single KeyboardProvider and
Screen bottomBarKeyboardBehavior="follow", with matching light host/editor theme.

Physical follow-up `actions/`: tapping inside the link reaches caret 10 with
IME visible and no sheet; pressing the real Gboard q key produces
`Before linqked after`, caret 11, with IME/focus retained. Source-map markers
confirm both native changes are in the installed bundle. Toolbar acceptance is
not inferred: this first host used AppShell's default container scrolling, so
Screen was content-height and keyboard following moved its footer out of view.
The fixture now uses `scroll="fixed"`, matching Nilo's shell and the documented
Screen-owned scrolling contract. This is a harness correction, not a product
layout workaround. Apply/drag/undo remain pending the corrected fixture build.

The fixed host's physical run (`actions-fixed/`) shows toolbar above IME,
existing URL editing with range 7..13 retained, Apply changing only that href,
and one Undo restoring the old URL. A real selection-handle drag changes the
range from 7..13 to 0..13. Horizontal toolbar scrolling exposes Undo/Redo.
Apply still has a negative keyboard result: native editor focus at 13:03:02.289,
URL host detach at .301, keyboardDidHide at .377, with editor focus/range retained.
RN 0.88.1 TextInput cleanup (TextInput.js 298–309) blurs an unmounting input if
TextInputState still owns it. EnrichedTextInput 1.1.1's imperative focus calls its
native command directly and never updates that RN registry. The candidate now
explicitly blurs the owned URL input before the deliberate return to the editor;
no timer or focus-on-navigation was added. The ordering regression and all 272
editor tests/build pass; this handoff candidate awaits physical comparison.

Physical handoff candidate 0cba1f02 (`handoff/`): Apply and Cancel now retain IME
and range 7..13; Back hides IME while preserving draft/range, and deliberate
Cancel restores editing. The source-map marker proves the blur-before-handoff
code is installed. Moving from URL to paragraph 2 preserves that paragraph's
focus and cancels the old draft, but still hides IME: this remains a failure,
not acceptance. Injected Android Escape also hides IME and leaves the draft; no
physical keyboard claim is made. Investigating URL onBlur lifetime before
changing that external transition; no timer or forced refocus workaround.

The external-transition investigation is resolved at the text adapter, not by
retaining the URL field: the instrumented sequence was ScrollView responder
release with URL still registered, then URL onBlur clearing RN state, then
paragraph 2 focus. A same-APK comparison reproduced failure with handled taps,
passed with always, and passed with handled plus native input responder ownership.
No FormatBar lifetime workaround or global Screen default change was added.

PR 686 (`fix/native-rich-text-responder`, final evidence at 64e65c4a) contains the
shared text owner correction. Its exact-source Pixel run with editor 0cba1f02
passes Apply, Cancel, paragraph-to-paragraph handoff with IME, parent scrolling,
read-only, longpress/selection-handle drag, real Gboard replacement and one Undo.
A background tap from URL still dismisses IME without stealing focus; explicit
Cancel returns to editing. See that PR's docs/audits/issue-434/native-responder/final
for reports, receipt, markers and PNGs. This remains source-candidate evidence:
release Bloom APIs 678/680 and bloom-text 0.1.7, declare the actual minimums and
repeat published acceptance before releasing/accepting editor 679. No iPhone or
physical hardware Escape validation is claimed.

The reusable fixture now supplies top safe-area layout (the Pixel status bar
occupied 121 physical pixels and covered the original setup controls), a read-only
toggle and a 600-point scroll probe. These are host/test corrections; product
routes and ScreenScrollView's keyboardShouldPersistTaps default were unchanged.
