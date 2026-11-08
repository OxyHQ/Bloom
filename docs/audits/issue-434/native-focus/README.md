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
