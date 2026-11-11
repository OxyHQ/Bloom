# Pixel 8a Android material performance sample

Captured 2026-11-11 on the USB-connected Pixel 8a, Android 16/API 36, with
`@oxy.so/bloom@18.5.2` local packed snapshot and the offline Material Lab APK
identified in the parent audit's `build.json` and `attestation.json`. The APK
is the same SHA-256 recorded there. It contains the in-flow Surface, nested
Card, header/tab chrome, composer and an active loader. The moving-photo case
adds the animated bundled-photo backdrop. The fixture has no INTERNET
permission. Android ADB `dumpsys gfxinfo` was reset before each 15-second
foreground window; no screen recording or device-setting changes were used.

| Scene | Frames | Janky | App frame P95 | GPU P95 | App PSS | GPU cache total | Thermal |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Solid + active loader | 1,829 | 0 (0.00%) | 12 ms | 9 ms | 360,795 KB | 153.96 MB | 0 |
| Moving photo + active loader | 1,821 | 1 (0.05%) | 11 ms | 6 ms | 377,428 KB | 162.73 MB | 0 |
| Moving photo + active loader, repeat | 1,816 | 0 (0.00%) | 12 ms | 6 ms | 373,603 KB | 157.25 MB | 0 |

`gfxinfo` GPU percentile is a platform GPU timing sample; it is not a universal
frame-time guarantee. These are three descriptive windows on one API/device,
with no predeclared product budget or baseline. They do not measure older
Android API levels, long-duration thermal behavior, dense scrolling, large
canvases or repeated overlays, and they do not establish an Android-wide
performance pass. Use them as a reproducible current-device cost sample, not
as closure evidence for the broader §7.3/§7.4 matrix.

The `*-gfx.txt`, `*-meminfo.txt` and `*-thermal.txt` files are raw Android
outputs with capture timestamps. `SHA256SUMS` covers these raw files.
