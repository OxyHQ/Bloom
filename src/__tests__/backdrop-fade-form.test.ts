// The black flash every centered dialog opened with.
//
// The backdrop's fade used to be a CSS `@keyframes opacity: 0 → 1` handed to
// BOTH of `Backdrop`'s layers through `layerStyle`. A running CSS animation
// outranks inline styles in the cascade, so on the DIM layer — whose inline
// opacity IS the dim (0.28) — those keyframes drove opacity all the way to 1,
// i.e. opaque BLACK, for the length of the animation, then dropped it back to
// 0.28 the instant it ended. Nothing errored, and a screenshot taken after the
// 150ms looked perfect; it only ever showed as a flicker behind an opening
// dialog. A CSS *transition* is fine and is what the side-sheet path uses: it
// interpolates the inline value instead of overriding it.
//
// This is a SOURCE gate on purpose. The DOM cannot answer the question in
// jest: the layers are a mocked `BlurView` and a mocked reanimated
// `Animated.View`, so neither the inline style nor a react-native-web class
// ever reaches jsdom — a DOM-level assertion here passes just as happily with
// the bug in place (it did, which is why this file looks like this).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** `layerStyle={X}` → the source text X actually resolves to. */
function resolveLayerStyles(source: string): string[] {
  const out: string[] = [];
  for (const match of source.matchAll(/layerStyle=\{([^}]*(?:\}[^}]*)?)\}/g)) {
    const expression = match[1] ?? '';
    out.push(expression);
    // An identifier (`layerStyle={BACKDROP_FADE_IN}`) has to be followed home:
    // the animation lived in the constant, not at the call site.
    for (const identifier of expression.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) {
      const declaration = new RegExp(
        `const ${identifier[1]}[^=]*=\\s*([\\s\\S]{0,400}?);\\n`,
      ).exec(source);
      if (declaration?.[1]) out.push(declaration[1]);
    }
  }
  return out;
}

describe('backdrop fade form', () => {
  const files = sourceFiles(SRC);

  it('scans the whole source tree', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('never drives the backdrop layers with a CSS animation', () => {
    const offenders: string[] = [];
    let layerStyles = 0;

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const style of resolveLayerStyles(source)) {
        layerStyles += 1;
        if (/\banimation\b/.test(style)) {
          offenders.push(`${file.slice(SRC.length + 1)}  ${style.replace(/\s+/g, ' ').slice(0, 80)}`);
        }
      }
    }

    // Vacuity floor: the side-sheet's transition is a real `layerStyle` and must
    // be found, or the scan resolved nothing and this passes for free.
    expect(layerStyles).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  // The other half of the contract: the fade is multiplied INTO each layer's own
  // opacity, so a fully-arrived backdrop is still only `dimOpacity` dark.
  it('multiplies the fade into the dim opacity', () => {
    const overlay = readFileSync(join(SRC, 'overlay', 'Overlay.tsx'), 'utf8');

    expect(overlay).toMatch(
      /const dimFade[\s\S]{0,200}?progress\.value[\s\S]{0,80}?\* dimOpacity/,
    );
  });
});
