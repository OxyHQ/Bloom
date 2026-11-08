# Overflow probe intrinsic width

On parent921afe6, the overflow probe wrapper stretched to the width of its absolute column: 197.734px for a 34px button with a fine pointer, 207.734px for a 44px button with a coarse pointer. The sibling full+compact probes determined the column width. That inflated the reserve passed to the packing policy.

The probe now aligns itself to flex-start. Its own width equals the actual overflow button recipe: 34px fine, 44px coarse. `verify-header-action-measurement.mjs` checks ten real Chromium cases across widths240/320/390/640/900 and both pointer modes, comparing the visible command IDs with the packing policy using the measured button width. The code, scope and measurement props remain shared on native; no responsive gap or SSR guards changed.

Run `BLOOM_PLAYWRIGHT_MODULE=<playwright> CHROME_PATH=<chromium> node scripts/verify-header-action-measurement.mjs http://localhost:6137`. `before.jsonl` is the exact parent baseline and `after.json` contains the ten passing measurements. This does not resolve the independent WebKit material frame stall documented alongside this audit.
