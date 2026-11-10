# Composer phase lifecycle (2026-11-10)

Browser evidence for the controlled `ComposerLoaderPhase` contract in the
synthetic `ComposerLoader/Lifecycle` Storybook story. The run used Chrome
156.0.8078.80, React Native Web 0.21.4, React Native 0.88.1, and the package
source at commit `a5e3985f332cf196fd0d8e48bc7a24481cdb738a`.

The 18-case report verifies that submit-to-streaming advances the same CSS
animation clock, stopping remains active, and error, completion, and idle settle.
It also covers inactive settling, explicit pause, retained screens, interrupted
fade, AgentChat Stop, background tabs, viewport widths from 320 to 1440 CSS px,
height changes, reduced motion, and offscreen suspension. Existing input identity,
focus, selection, and draft checks run during resize.

`report.json` records the browser, package versions, measurements, and case
results. The screenshots show the active phase at 768 px and 390 px after a
height change. This is browser behavior from a synthetic Bloom fixture; it does
not establish native optical quality or device performance.
