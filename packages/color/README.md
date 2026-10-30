# @oxy.so/color

Bloom's colour engine with no React, for code that runs where Bloom does not:
a server, a worker, a build script. It is the same engine, built from Bloom's
own source (`src/theme/color-engine/`), so a colour worked out here is exactly
the colour Bloom draws. In an app, use `ColorEngine` from `@oxy.so/bloom/theme`
instead; it is the same surface.

## Install

```bash
bun add @oxy.so/color
```

No dependencies. ESM and CommonJS, typed for `node16` and `bundler` resolution.

## Seed colours from a photo

Work out a photo's seeds once, where the photo is stored, and send them with
it: the screen that shows it then themes itself without reading pixels.

```ts
import sharp from 'sharp';
import { argbFromRgb, hexFromArgb, seedsFromImagePixels } from '@oxy.so/color';

const { data } = await sharp(bytes)
  .resize(48, 48, { fit: 'cover' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels: number[] = [];
for (let i = 0; i < data.length; i += 3) {
  pixels.push(argbFromRgb(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0));
}
const seeds = seedsFromImagePixels(pixels).slice(0, 3).map(hexFromArgb);
// best first, as '#rrggbb'
```

`seeds[0]` is `BloomProvider seed` (or `BloomSeedScope seed`); `seeds[1]` and
`seeds[2]` can pin the secondary and tertiary accents. A 48×48 thumbnail gives
the same ranking as the full photo at a fraction of the work.

## Theme roles from a seed

```ts
import { generateRoleColors } from '@oxy.so/color';

const roles = generateRoleColors({ seed: '#c4502f', isDark: true });
roles.primary; // 'rgb(255 181 160)', a CSS colour
```

## Surface

`seedsFromImagePixels`, `seedHexFromImagePixels`, `quantizeImage`,
`generateRoleColors`, `argbFromRgb`, `argbFromHex`, `hexFromArgb`,
`redFromArgb`, `greenFromArgb`, `blueFromArgb`, and the types `RoleColors`,
`GenerateOptions`, `RoleName`, `SchemeVariant`, `AccentSources`.

## License

The Breathe License 1.0 (`LICENSE`). The engine is a port of Material Color
Utilities (Apache-2.0); see `NOTICE`.
