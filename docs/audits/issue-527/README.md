# Document panel bottom paint

Atlas current-main baseline: commit86a0a81 in Atlas records unmodified sourcefc3b821, published Bloom17.19.3, four screenshots and DOM measurements. Compact390×844 light/dark: surface ended at770, group reserved74px outside its paint. Desktop1440: panel1132px with explicit contentMaxWidth="none".

This change moves horizontal document groups' reserve into each panel, keeps it nonshrinking and transparent, removes external group padding and gives the surface the full viewport minimum. It retains reserveBottomBarSpace=false and document scrolling. Vertical groups retain their existing group clearance. No Atlas product code changed.

Candidate: packed local Bloom17.22.0 from base0e876f06, resolved from both Atlas root and frontend to bloom-local/node_modules; the new app-shell-panel-reserve DOM node is the local-only marker. These are functional local-package checks, not release or performance evidence. Final published-package validation is outstanding.

Short and40-result pages passed in light/dark at390×844 and1440×900: eight normal full-viewport captures, no page errors or unexpected external requests. All APIs use synthetic anonymous fixtures. On compact short pages the panel reaches844 and the bar retains y770/height74. The former seam has identical painted RGBA at x2/y769 andy770 with the actual bottom bar visible (light255,245,248; dark72,39,68). Samples at800 also match. Near the material's foot at840 there is a small painted variation; no whole-viewport exact-color claim is made. Supplemental backing-only screenshots hide the bar without changing its layout; that variation persists, so it is not attributed solely to the bar's backdrop. Normal visible-chrome screenshots are the acceptance evidence.

Long pages reach document end, and the final result clears the bar. Reports preserve scroll positions, region bounds, last-result bounds and pixels; artifacts.json pins raster hashes. Capture script is Atlas scripts/capture-shell-baseline.mjs, with PLAYWRIGHT_PACKAGE_JSON, CHROME_PATH, BASELINE_OUTPUT and CANDIDATE=1; set FIXTURE_COUNT=40 for long content.

The first candidate used the JS published fill on its spacer. Pixel review rejected it: compact responsive CSS paints a different opaque surface while Screen remains transparent. The final spacer continues existing material without adding paint.

Verification: build including package1550literal exports and freshness20328values/7738types; AppShellPanelLayout and AppShellScrollSwitch.web60tests passed. Contract covers reserved/unreserved placement and transparent spacer ancestry. Browser captures verify painted pixels beyond the structural tests.

Auxiliary width finding remains: executing current built panelEnvelope for one undeclared-width panel returns360. resolvePanelFlex grows a sole track only inside that enclosing envelope. The explicit Atlas none override fills1132px; this patch does not change default width semantics. Native behavior is not claimed from these web observations.
