# Published composer checks on Pixel 8a

On 2026-11-10, `verify-composers.py` completed with exit code 0 on serial
`43221JEKB12200` (Pixel 8a, Android 16/API 36, arm64-v8a). The installed app is
the isolated `so.oxy.bloom.loaderpackagelab` fixture; the APK is a published
`@oxy.so/bloom@18.2.1` consumer build, with its integrity and build receipt in
`environment.json` and `attestation.json`.

For both packaged `ComposerPill` and `AgentChatComposer`, real touch and keyboard
input verified that narrowing and entering busy preserve the native editor,
draft, focus and caret; Stop preserves the editor and permits another typed
character; and rotating portrait → landscape → portrait preserves editor
identity, selection direction, focus and visible keyboard. `report.json` contains
the per-transition state receipts. The PNGs capture each transition and rotation.
The verifier restores the original orientation and stops the fixture afterward.

The current npm `18.2.2` artifact was separately confirmed to contain the same
Bloom native and adapter hashes as this `18.2.1` build. This run directly tests
18.2.1; it is evidence for those matching code artifacts, not a claim that an
18.2.2 APK was installed. It does not complete the broader composer lifecycle
matrix or iPhone validation.
