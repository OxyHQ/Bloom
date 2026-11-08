# Pixel 8a composer revalidation

Physical re-run on the packaged Bloom composer fixture, tied to the installed APK hash in `report.json`. The orientation was locked to portrait for coordinate-stable controls; the verifier exercised portrait → landscape → portrait with Gboard visible and restored the device rotation settings afterward.

Both `ComposerPill` and `AgentChatComposer` passed resize/busy, Stop, subsequent typing, and rotation retention. A backward-selection comparison passed at rest, after resize, and while busy. JSON includes the observations and hashes for each captured screenshot. `physical-lifecycle.json` adds a fresh run of pause/resume, inactive screen, background, resize, rapid toggle, and initially inactive behavior on the same Pixel 8a and APK hash.

The app is an offline synthetic Bloom fixture, not production Alia; this is Android-only evidence.

`physical-reduced-motion.json` records a Pixel 8a run with Android’s reduced-motion preference enabled and restored: active pixels stayed identical across samples, remained visible compared with idle, and resumed moving after restoring the original setting.
