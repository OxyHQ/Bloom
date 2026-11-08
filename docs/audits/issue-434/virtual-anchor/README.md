# Virtual selection anchor

The source Storybook `VirtualSelection` fixture uses a live DOM Range without a PopoverTrigger. Chromium 1248 passes at widths 320, 390 and 1024: the shared panel follows a nested scroller by 35 px, stays in bounds after resizing, retains the same focused link input and its draft, and dismisses with Escape from a button. Measurements and a representative screenshot accompany this report.

Run `BLOOM_PLAYWRIGHT_MODULE=<playwright> CHROME_PATH=<chromium> node scripts/verify-popover-virtual-anchor.mjs http://localhost:6135`.

The unit gate verifies synchronous initial virtual measurement, coalesced scroll reads, resize invalidation to null and cancellation of queued reads on close. Existing trigger placement/focus tests still pass. This is the shared anchor contract, not completion of editor selection sessions or physical-device validation. RNW TextInput stops keydown propagation; editor link fields retain their explicit Escape handling rather than relying on the shared bubbling escape stack.
