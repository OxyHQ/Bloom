# Composer phase lifecycle on current main (2026-11-10)

Re-ran the Storybook lifecycle fixture from Bloom `e97802b8` in Chrome
146.0.7680.31. All 18 browser cases passed. The report records the live CSS
animation clock through submit, streaming, stopping, and settled states; responsive
width/height changes; reduced motion; pause/resume; background tab; and retained
composer input focus, selection, and value. `active-768.png` and `tall-390.png` are
current-main screenshots. `report.json` contains the measurements and exact
checkout metadata.

This browser run pairs with the physical Pixel 8a evidence in
[`composer-phase-pixel8a-2026-11-10`](../composer-phase-pixel8a-2026-11-10/README.md).
Neither synthetic fixture is a substitute for the separate iPhone run.
