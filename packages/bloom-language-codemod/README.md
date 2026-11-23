# @oxy.so/bloom-language-codemod

Moves an app's NativeWind `className` JSX and Bloom JSX to the [Bloom language](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language.mdx), only where the rendered result stays the same. Everything else stays JSX, embedded in the chain with `Embed`, and the report says why.

```tsx
// before
<Pressable onPress={open} className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
  <Text className="text-sm text-muted-foreground">{count} likes</Text>
</Pressable>

// after
toElement(
  HStack(Text(count, ' likes').font('14').leading('20px').foreground('muted'))
    .padding('horizontal', 'lg')
    .padding('vertical', 'md')
    .align('center')
    .spacing('md')
    .when('pressed', (v) => v.opacity('70'))
    .onPress(open),
)
```

## Use

Install it in the app beside `@oxy.so/bloom-language` (its peer, whose spec and className table it reads), then:

```bash
npx bloom-language-codemod . --out .bloom-language-codemod   # report and converted files
npx bloom-language-codemod . --write                          # rewrite the app's files in place
npx bloom-language-codemod --help
```

It writes `report.md` and `report.generated.json` (what converted, and why the rest did not) and, without `--write`, the converted files under `<out>/files`. The app's NativeWind entry (`global.css`, or `--css <entry>`) is compiled with Tailwind 4 from the app's own install, and a class the app's theme draws differently from Bloom's stays JSX.

Then typecheck the app and format it with its Biome: the codemod prints with recast and does not format.

## The proof

Every converted region can be rendered before and after through Bloom's parity harness, native and web, light and dark (`--fixtures`, then the parity suites). The proof runs from a Bloom checkout; see [the codemod's guide](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-codemod.mdx).

## License

See `LICENSE`.
