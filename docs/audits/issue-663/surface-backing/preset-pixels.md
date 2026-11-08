# Actual mono and graphite pixels after the conservative union

Chromium 1248 measured 48 dark-mode samples per preset: black and white backing,
LTR and RTL, four sizes, ordinary and grouped canonical inputs, plus explicit
24px text with 32px line height. Full viewport and ink-hidden captures retain
exact painted foreground matches and backing samples. `fields.ts` now accepts
COLOR_PRESET and MODES; defaults preserve the original blue two-mode matrix.

All 32 canonical samples per preset clear 4.5. Mono's minimum is 4.674239;
graphite's is 4.647028. Thus the conservative unknown-sampler/4px-rim flag alone
did not reproduce a canonical contrast failure in these painted scenes. The
flag remains unsatisfied: these captures do not prove all RGB samplers, every
font/script, every glyph reaching the rim, or arbitrary explicit styling.

The explicit 24px cases reach 4.053437 (mono) and 3.988687 (graphite), with several
below 4.5. They are explicit large text, not a test of native accessible font
scaling, layout height or clipping. They do not close that requirement. No paint
or token changes are justified solely by treating a conservative bound as an
observed failure. A genuinely failing default scene still requires a shared
owner correction or sufficient backing.

Production source is unchanged from 75aa79eb / 7c89ce0b. Preset results and
artifact hashes are in `preset-pixels/`; native and published acceptance remain
separate. This is evidence for the named scenes, not global AA certification.
