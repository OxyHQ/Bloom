# Pixel 8a composer revalidation

Physical re-run on the packaged Bloom composer fixture, tied to the installed APK hash in `report.json`. The orientation was locked to portrait for coordinate-stable controls; the verifier exercised portrait → landscape → portrait with Gboard visible and restored the device rotation settings afterward.

Both `ComposerPill` and `AgentChatComposer` passed resize/busy, Stop, subsequent typing, and rotation retention. A backward-selection comparison passed at rest, after resize, and while busy. JSON includes the observations and hashes for each captured screenshot.

The app is an offline synthetic Bloom fixture, not production Alia; this is Android-only evidence.
