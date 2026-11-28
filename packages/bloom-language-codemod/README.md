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

### Moving to the 2.x entries

`@oxy.so/bloom-language` 2.0.0 gave each family of nodes an entry of its own, and the root exports only the language. `Row` and `Card` now come from `/containers`, `TextField` and `Search` from `/inputs`, `VirtualList` from `/list`, and `Dialog` from `/overlays`. That way an app's bundle carries only the families it imports. A TS file that imports a family's name from the root gets TS's `has no exported member` error, and at run time the name is `undefined`. To move every such import to the entry that exports it now, run:

```bash
npx bloom-language-codemod imports .           # list what moves
npx bloom-language-codemod imports . --write   # rewrite the imports in place
```

The language's `package.json#exports` is the source of truth. It covers values and types, and keeps aliases, `type` imports and default imports. A name already imported from its entry is left as it is, and so is a name no entry exports, so a second run changes nothing. It reads `.ts` and `.tsx` files, skipping `node_modules`. On Mention it moved 352 names in 139 files.

## The proof

Every converted region can be rendered before and after through Bloom's parity harness, native and web, light and dark (`--fixtures`, then the parity suites). The proof runs from a Bloom checkout; see [the codemod's guide](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-codemod.mdx).

## License

See `LICENSE`.
