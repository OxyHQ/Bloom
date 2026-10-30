/**
 * Every blur Bloom draws follows ONE switch: reduced transparency, resolved
 * once by `BloomThemeProvider` from its `reduceTransparency` prop and the
 * platform's appearance (`appearance` capability).
 *
 * The surface material follows it in CSS, through the document attribute the
 * provider writes (`surface/web-material.ts`; every material host, the window
 * controls' bubbles included, is built by `surfaceMaterialCss`). Everything else
 * that blurs a backdrop, in JavaScript, reads `useReducedTransparency()` and
 * then draws no blur: a `BlurView`'s tint alone, or an opaque colour where a web
 * `backdrop-filter`'s translucent wash was.
 *
 * So every source file whose CODE (comments stripped) sets a backdrop filter or
 * imports `expo-blur` either reads the switch or is classified here with a
 * reason. An EQUALITY: a new blur fails until it follows the switch or someone
 * decides why it need not, and a stale entry fails too. What each follower draws
 * while reduced is pinned in `PlatformAppearance.test.tsx` and
 * `PlatformAppearance.web.test.tsx`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..');

const CLASSIFIED: Readonly<Record<string, string>> = {
  'surface/web-material.ts':
    'The material itself: its reduced rule is keyed on the document attribute the provider writes, and on the web media query.',
  'blur/blur-target.tsx':
    'Imports `BlurTargetView` only, the container a blur points at. It blurs nothing.',
  'styles/web-view-style.ts': 'The `WebCssStyle` type declaring the property.',
  'project-board/TicketCornerGenieSurface.web.tsx':
    'Sets `backdropFilter: none` on a frozen copy for a transition. It removes a blur.',
};

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== '__tests__') sources(path, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.includes('.stories.')) {
      out.push(path);
    }
  }
  return out;
}

function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const blurs = sources(SRC)
  .map((path) => ({ file: relative(SRC, path), code: code(path) }))
  .filter(({ code: text }) => /backdropFilter|backdrop-filter|from 'expo-blur'/.test(text));

it('every file that blurs a backdrop follows reduced transparency, or says why not', () => {
  const unaccounted = blurs
    .filter(
      ({ file, code: text }) => !CLASSIFIED[file] && !text.includes('useReducedTransparency('),
    )
    .map(({ file }) => file);
  expect(unaccounted).toEqual([]);
});

it('classifies only files that still blur and do not follow the switch', () => {
  const live = new Set(
    blurs.filter(({ code: text }) => !text.includes('useReducedTransparency(')).map((b) => b.file),
  );
  expect(Object.keys(CLASSIFIED).sort()).toEqual([...live].sort());
});

it('finds the followers, so the scan is not vacuous', () => {
  const followers = blurs
    .filter(({ code: text }) => text.includes('useReducedTransparency('))
    .map(({ file }) => file)
    .sort();
  expect(followers).toEqual([
    'ai-chat/AiChatGalleryPanelBase.tsx',
    'ai-chat/AiChatImageGenerationBase.tsx',
    'chart-cards/RadarChartCard.tsx',
    'composer-panel/ModelPickerBase.tsx',
    'message-media/parts.tsx',
    'overlay/Overlay.tsx',
    'progressive-blur/ProgressiveBlur.tsx',
    'progressive-blur/ProgressiveBlur.web.tsx',
  ]);
});
