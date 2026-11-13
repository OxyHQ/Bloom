# Android emulator revalidation · 2026-11-09

This supplemental run used the dedicated `bloom_loader_api30_663` x86_64 emulator, Android API 30, SwiftShader. The synthetic offline fixture embedded Bloom 17.25.0 from commit `c0700e68b20f8259e3e5d61f82e093a8f26f5be3`; APK SHA-256: `14b45a1763a5efba0eda8bb1119b67b179f55ee586abcd6f66d2604fe9da7b16`.

`report.json` records a successful API 30 compatibility check: the Canvas adapter stayed unregistered on the software-rendered path, the SVG remained visible, reduced-motion frames were pixel-identical, motion resumed after restoring Android's transition scale, and the original scale (`1.0`) was restored. `environment.json` and `badging.txt` identify the installed artifact and device.

This is emulator compatibility evidence only. It does not establish physical-device performance, optical acceptance, production Alia adoption, or published-package acceptance. Physical Pixel 8a receipts remain separately documented in the parent benchmark directory. iPhone testing is deferred by the user.
