# Editor overlay candidate

These are source-candidate checks, not published-package acceptance. Nilo source
is cec942f. The consumer uses an isolated packed Bloom mirror with the public
virtual-anchor API (#678) and explicit Button interaction pairs (#680), plus a
packed editor tarball. Reported package versions remain 17.22.0/0.7.2 until the
coordinated release. No published package or Bun cache files were overwritten.

Chromium 1248, Nilo Metro 8130, synthetic offline document and intercepted account/
API requests. Published-package pilot Metro 8128 remains separate. Metro 8130 was
restarted after an atomic package swap left a negative resolution cache; the
exported file existed on disk. The final run uses the refreshed packed mirror.

## Results

- `fine/`: keyboard entry, Tab/Shift+Tab, Space/Enter toggle state and retained
  selection; stable Apply/cancellation on a changed range; existing-link editing
  at a collapsed caret; invalid URL correction; single-step undo; Escape and
  unrelated focus; Remove without navigation; draft identity/value through real
  container scroll and 390→320→390 resize.
- `coarse/`: the same interactions plus 20 palette targets at least 44×44 px,
  fully inside the panel/viewport at 320 and 390 px.
- `long-labels/`: inherited lg and German labels. Before: controls 444.7/441.6 px
  wide extend to x917.3 in viewport 320. After: shared single-line label contract
  fits available width with ellipsis and complete accessible names; 44 px height,
  16 px text retained. Full interaction runner passes.
- `dialog/`: shared Dialog owns the editor. The inner formatting overlay can
  close with Escape and restore selection while the parent dialog stays open.
- `custom-theme/`: editor foreground rgb(72,13,47), accent rgb(143,31,92), and
  selection rgba(143,31,92,0.22) differ from the provider. Actual computed hover/
  pressed foreground and background, Apply and Open accents match those values.
  This final full run also reproduces/fixes selecting the same range after Escape:
  dismissal lasts only for the current selection session, not those coordinates
  forever. `reselect-before.json` records the original failure.

Ordinary Open invokes application routing exactly once. Ctrl-click and middle-click
open the real href through browser behavior without invoking application routing.
Destinations are local; no external navigation is required. Context page events
observe native background tabs, which do not emit the opener's popup event here.
A minimal HTML anchor also bypasses context.route on its first Ctrl/middle navigation
in this Chromium build; fake external domains are unsuitable for that assertion.
No browser errors or unexpected API requests occurred in completed runs.

## Reproduction and provenance

Run `scripts/verify-editor-overlays-nilo.mjs` with NILO_ROOT, MENTION_ROOT (installed
Playwright runner), NILO_ORIGIN, CHROME_PATH and BASELINE_OUTPUT. EDITOR_POINTER=coarse
checks touch geometry. The isolated fixture patches in long-labels/, dialog/ and
custom-theme/ enable EDITOR_LONG_LABELS=1, EDITOR_DIALOG=1 or EDITOR_CUSTOM_THEME=1
respectively; each fixture was restored after capture. They are not product changes.

Packed editor SHA256 by capture:
- coarse initial: 0fba69170149c09afc5e109de2ad0312d5b2ebfe972277fb0fc839a1ef0a1114
- fine/long-labels/dialog: 8105afbf247de30fae57375a47b2b8fb32d6477af65db496883d8fa3464b6ae3
- custom-theme/final session fix: f06b0e5d9250050f19b5b9dd2d7a375efd5d5ba686280084d530481041981f54

20 editor suites / 268 tests, editor TypeScript and build pass. Regressions cover
remote replacement/deletion, read-only invalidation, control autofocus, session
re-entry and a pending blur microtask when its block unmounts. Shared Button pair
checks cover light/dark and all 3 material modes; transparent/default delegation
is unchanged. Root build/package/freshness pass for the packaged source candidate.

Remaining acceptance: integrate/publish shared APIs, deduplicate their temporary
source copies, declare the editor's actual minimum published Bloom version, restore
the local mirror before final published-package consumer checks, and validate on
physical Android. iPhone is deferred by user request. This does not close #434.
