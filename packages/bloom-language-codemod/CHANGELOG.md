# Changelog

## 0.1.0

First release. Moves an app's NativeWind `className` JSX and Bloom JSX to the Bloom language only where the rendered result stays the same, keeps everything else as JSX with its reason, and writes a report. See `docs/bloom-language-codemod.mdx` in the Bloom repository.

It is 0.x on purpose: the Bloom components it maps grow with each release, and a minor release may convert more or change a report's reasons.

### Compatibility

- Runs on Node 20.19 or newer: `npx bloom-language-codemod <app dir>` (`--help` for the options).
- Reads the language it writes for from the app's install: `@oxy.so/bloom-language` 1.0.0 or newer is its peer (the spec, the className table and the exports it ships).
- Compiles the app's NativeWind entry with Tailwind 4 from the app's own install (`tailwindcss`, `nativewind`, `@oxy.so/bloom`, `@oxy.so/app-preset`); `--package <name>=<dir>` reads one from a checkout instead.
- The parity proof (`--fixtures` and the parity suites) runs from a Bloom checkout: it renders each region with Bloom's Jest environment, the before side with Bloom 22 where the app hands a Bloom component a class.

### Added

- The CLI, `bloom-language-codemod`: the report (`report.md`, `report.generated.json`), the converted files (`--write` in place) and the parity corpus (`--fixtures`).
- A README for the npm page.
- The library entry: `transformSource`, `report`, `loadTable`, `overriddenClasses` and `tailwind`.
