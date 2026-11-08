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
