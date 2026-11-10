# Responsive header actions in Chrome

Browser evidence for the existing adaptive-actions Storybook example at Bloom
commit `4a984fc512b0e1414024d8af80298dc407d9cd9c`. Chrome 156.0.8078.4 ran the
same mounted header through a 1400 → 240 → 1400 CSS-pixel container sequence.

`report.json` and the three screenshots are produced by
[`verify-page-header-responsive-actions.mjs`](../../../../scripts/verify-page-header-responsive-actions.mjs).
The run confirms that a selected action moves into the narrow overflow with its
state intact, ArrowDown focuses the first menu item, the open menu and focused
item survive expansion, and Enter still invokes the original action handler.
There were no uncaught browser errors.

Run it with Storybook serving the Bloom checkout:

```sh
STORYBOOK_URL=http://127.0.0.1:6006 \
CHROME_PATH=/path/to/chrome \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
node scripts/verify-page-header-responsive-actions.mjs
```

This closes only the compact/spacious state, focus, menu and handler check in
§4. It does not verify the remaining header requirements for title hierarchy,
scroll choreography, RTL, zoom, touch, embedded consumer adoption or other
platforms.
