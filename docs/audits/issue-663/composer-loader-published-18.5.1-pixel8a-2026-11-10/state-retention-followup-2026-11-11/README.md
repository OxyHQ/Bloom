# Composer input retention follow-up — Pixel 8a

Physical Android verification for issue #663, captured 2026-11-11 against the exact published `@oxy.so/bloom@18.5.1` package. Device: USB-connected Google Pixel 8a, Android 16/API 36, serial `43221JEKB12200`. The isolated package fixture is `so.oxy.bloom.loaderpackagelab`; see `build-attestation.json` for the tarball integrity, fixture hash, and release APK SHA-256 (`bfafe92621f834ef5322dc1f9d0c2496fb2a760b91c38b986defea36cd81381f`).

## Result

`retention-report.json` records native `EditText` identity, text, focus, attachment, and selection for both `ComposerPill` and `AgentChatComposer` while the keyboard was visible. Both inputs retained their native identity, selected draft, focus, and selection through two complete submit/stream/stop/complete cycles. Theme changes, fixture attachment, error, and reset retained those values as well. During the first streaming phase for each owner, the test collapsed the selection to the end, typed `Z` through the Android input path, and verified that the new text appeared while the input remained focused and attached. The updated draft then persisted through the remaining phases and the second lap. The keyboard was visible during both phase cycles; the fixture returned to idle.

The same checks can be reproduced with `verify-composer-state-retention.py` by setting `ANDROID_SERIAL`, `AUTHORIZED_PHYSICAL_SERIAL`, `ADB`, `ADB_PORT`, and `OUT`. The script requires the physical serial to match the explicit authorization variable.

## Limits

This establishes behavior for these two composer owners in the published package on one physical Android 16 Pixel 8a. It does not validate iPhone, other Android versions/devices, production app integrations, or visual acceptance. iPhone work is deferred per the user's instruction; issue #663 remains open.
