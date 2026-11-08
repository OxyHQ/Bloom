# Native input responder ownership

Pixel 8a, density 420/font scale 1.15 unchanged, Expo 58.0.23 / RN 0.88.1 /
React 19.3.0 / enriched-html 1.1.1. Offline synthetic editor fixture; no production
API or document. This is source-candidate diagnosis, not published acceptance or
physical iPhone validation. The editor's independent URL Apply cleanup fix is
in PR 679; this change does not replace it.

A native custom text host received focus while its parent ScrollView treated
that same tap as unhandled. With keyboardShouldPersistTaps="handled", RN
ScrollView._handleResponderRelease calls TextInputState.blurTextInput on the
previous URL field. Instrumentation records ScrollView release with that field
still registered, then URL onBlur with registry cleared, then the new rich
input's onFocus. The latter keeps native focus, but the stale blur hides IME.
RN TextInput installs pressability handlers; the enriched input had none.
This is distinct from the URL field's Apply/unmount cleanup ordering.

The same APK/content compares three explicit modes (report.json and receipt):

- handled / input does not claim the tap: paragraph 2 focus/caret preserved,
  IME false.
- always / input does not claim the tap: same focus/caret, IME true.
- handled / editable input claims responder and permits termination: same
  focus/caret, IME true; input grant/release replaces ScrollView release.

The third case also preserves native long-press selection 0..6 and a physical
handle drag to 0..13 with IME true. The diagnostic App exposes mode state; the
mode controls were moved below the state after an earlier toggle was covered by
the Android status bar. A failed mode assertion was not counted as an always
result. An earlier instrument-only build had a type-only TextInput import and
failed before producing focus data; it is not attributed to the product.

The source adapter now installs only native editable tap ownership and permits
parent scrolling to take over; it never calls focus, changes selection, or alters
ScreenScrollView defaults. Web has no responder changes, and read-only inputs
do not claim the tap. A boundary regression fails Android/iOS before the change
and passes after it; all 7 suites/50 tests and the package build pass. The iOS
case is a platform-prop test, not physical validation.

The exact-source APK is being checked separately for real parent scrolling,
read-only mode and the editing handoffs. Publication and consumer verification
remain pending; package version is deliberately unchanged in this source PR.
