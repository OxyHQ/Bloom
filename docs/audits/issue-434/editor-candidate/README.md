# Editor overlay candidate

This is a source-candidate checkpoint, not a published-package acceptance pass.
Nilo source is cec942f; Bloom/editor source is 3d83278b. The consumer uses
an isolated packed Bloom mirror (virtual-anchor API) and a packed editor tarball
(SHA256 0fba69170149c09afc5e109de2ad0312d5b2ebfe972277fb0fc839a1ef0a1114).
The reported package versions remain 17.22.0/0.7.2 because this is pre-release
source. No published package or Bun cache files were overwritten.

Chromium 1248, Nilo Metro 8130, synthetic offline document and intercepted
account/API requests. The published-package pilot on Metro 8128 is separate.

Validated: keyboard entry and Tab retain selection/overlay; changing selection
cancels an Apply draft; fresh Apply targets the selected text; an existing link
is recognized at a collapsed caret; Ctrl+K preloads its URL; invalid URLs remain
correctable; editing a link undoes in one step; Escape restores selection;
focusing an unrelated field cancels the draft without stealing focus. The
palette fits at 320/390 px; coarse pointer targets are at least 44 by 44 px.
Ordinary Open calls application routing exactly once. Ctrl-click and middle-click
open the real href through browser behavior without calling application routing.
The navigation destination is local, with no external navigation required.

Runner: `scripts/verify-editor-overlays-nilo.mjs`. Set NILO_ROOT, MENTION_ROOT
(the installed Playwright runner), NILO_ORIGIN, CHROME_PATH and BASELINE_OUTPUT;
set EDITOR_POINTER=coarse for touch geometry. Context page events observe native
background tabs: these do not emit the opener's popup event in this Chromium
build. A bare HTML anchor also bypasses context.route on its first Ctrl/middle
navigation, so fake external domains are unsuitable destinations for that check.

Still pending: long translated labels/inherited sizes, nested editor scrolling
and dialog placement, additional keyboard activation and Remove checks, published
API/editor dependency gates, and physical Android. iPhone is deferred by request.


Follow-up: long translated labels at inherited `lg` initially measured 444.7 and
441.6 px, overflowing the 320 px viewport to x917.3. FormatBar now constrains
its rows/controls to the available width and uses the shared single-line label
contract (ellipsis, complete accessible name). It keeps 44 px height and 16 px
text at lg. `long-labels/fixture.patch` is an isolated Nilo test fixture, restored
after capture; use EDITOR_LONG_LABELS=1 with that fixture. The complete interaction
runner passes in this configuration, including Remove without navigation, undo,
and preserving the same draft input/value through real container scroll and
390→320→390 resize. Packed follow-up SHA256:
8105afbf247de30fae57375a47b2b8fb32d6477af65db496883d8fa3464b6ae3.
All 20 editor suites / 266 tests and editor TypeScript pass.

Remaining scope is dialog stacking, additional keyboard activation, final published
API/editor dependency gates, and physical Android. Long labels, inherited lg and
real container scroll are now covered by this source candidate.


Dialog follow-up: the same interaction sequence passes with BlockEditor hosted
inside shared Dialog. Escape dismisses the formatting overlay and restores the
selection while the parent dialog remains open. Use `dialog/fixture.patch` and
EDITOR_DIALOG=1; this fixture is restored after capture. The final fine-pointer
run also checks Shift+Tab and toggles Bold twice each through Space and Enter,
asserting aria-pressed and retained text selection. No browser errors or unexpected
requests were observed. Remaining acceptance gates: published dependency and
consumer validation, plus physical Android (iPhone deferred).
