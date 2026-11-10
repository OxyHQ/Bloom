# Composer screen unmount during fade-out — Pixel 8a

Physical acceptance test against the exact published `@oxy.so/bloom@18.5.1` package in an offline synthetic consumer on Google Pixel 8a, Android 16/API 36. The install is bound to `build-attestation.json`; it records npm integrity `sha512-vngo+CYJ2ji5qjlzLy296BuJwm/kT66CJXRGs23/f4BsYhvm2M/GI7ws+fYZByu3nKfjVXz9W5OcbIBcO4YKog==`, the fixture digest and APK SHA-256. The manifest had no INTERNET permission.

The fixture control started the loader in `streaming`, switched it to `idle` to begin the 450 ms fade-out, then unmounted the ComposerCases screen after 100 ms. The Pixel displayed the parent fallback screen and reopened the composer successfully; the remounted state was `busy=false phase=idle`. `unmount-report.json` records the exact runtime and checks; both screen captures are included.

This confirms unmounting during fade-out does not crash the packaged runtime on this device. It does not establish focus/caret/selection retention during unmount; remounting creates a new composer by design. The wider requirement to retain input through active loader transitions remains covered by the separate interaction report, and this result does not by itself close the complete ComposerLoader checklist.
