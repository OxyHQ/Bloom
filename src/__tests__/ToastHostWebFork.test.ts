import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source/contract guards for the toast host split, mirroring
 * `BottomSheetWebFork.test.ts`.
 *
 * The toast engine is ONE universal implementation; its only platform split is
 * the host. Several of the properties below cannot be reproduced in jest (the
 * real paint, the portal ancestry, Metro's `.native` resolution), so they are
 * asserted against the source and the generated packaging instead, and verified
 * for real in a browser and on a device.
 */

const SRC = join(__dirname, '..');
const REPO_ROOT = join(SRC, '..');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/**
 * Source with comments removed. These files deliberately DOCUMENT the patterns
 * they must not contain (`ToastHost.native.tsx` shows a consumer how to inject
 * `FullWindowOverlay`; `Positioner.tsx` explains why it holds no `position:
 * 'fixed'`), so every negative assertion runs against code only.
 */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('ToastHost platform split', () => {
  it('web/default host portals into the shared bloom portal root', () => {
    const host = read('toast/ToastHost.tsx');
    expect(host).toMatch(/from '\.\.\/portal\/index\.web'/);
    expect(host).toMatch(/<Portal>/);
  });

  it('web/default host provides its own GestureHandlerRootView (W8)', () => {
    const host = read('toast/ToastHost.tsx');
    // Portaled content sits outside the app-root GHRV, so swipe-to-dismiss
    // would never receive touches without this.
    expect(host).toMatch(
      /import \{ GestureHandlerRootView \} from 'react-native-gesture-handler'/,
    );
  });

  it('web/default host anchors to the viewport through the shared style module (W7)', () => {
    const host = code('toast/ToastHost.tsx');
    expect(host).toMatch(/position: WEB_POSITION_FIXED/);
    expect(host).toMatch(/from '\.\.\/styles\/web-view-style'/);
    // The one-off inline cast this replaces must never come back.
    expect(host).not.toMatch(/'fixed' as/);
  });

  it('web/default host pins toasts above the whole overlay stack', () => {
    const host = code('toast/ToastHost.tsx');
    // A toast is a notification, not a modal surface: it must stay visible over
    // whatever is open, including a surface opened AFTER it. So it opts out of
    // the open-order stack via `OverlayRoot`'s `zIndex` prop rather than taking
    // a rank (see `src/overlay/stack.ts`).
    expect(host).toMatch(/<OverlayRoot zIndex=\{TOAST_LAYER_Z\}/);
    // And it must not ALSO carry a hand-picked depth in its stylesheet: a fixed
    // number there is exactly what left toasts stranded behind an open bottom
    // sheet, and it would fight the prop above.
    expect(host).not.toMatch(/zIndex: Z_INDEX\./);
  });

  it('native host imports neither react-native-screens nor the portal (D6)', () => {
    const native = code('toast/ToastHost.native.tsx');
    expect(native).not.toMatch(/from 'react-native-screens'/);
    expect(native).not.toMatch(/from '\.\.\/portal/);
    expect(native).toMatch(/ToasterOverlayWrapper/);
    // The doc comment still has to tell consumers how to inject it themselves.
    expect(read('toast/ToastHost.native.tsx')).toMatch(/FullWindowOverlay/);
  });

  it('the shared style module owns the only fixed-position assertion', () => {
    const styleModule = read('styles/web-view-style.ts');
    expect(styleModule).toMatch(
      /export const WEB_POSITION_FIXED = 'fixed' as ViewStyle\['position'\]/,
    );
    // Exactly one cast in the module, and it is the only RUNTIME export.
    // (Counted against code — the doc comment discusses casts in prose.)
    // The module's other export is the `WebCssStyle` interface, which covers the
    // other half of the same RN/RNW gap and emits nothing — see
    // `web-css-style.test.ts`.
    expect(code('styles/web-view-style.ts').match(/ as /g)).toHaveLength(1);
    expect(styleModule.match(/^export const /gm)).toHaveLength(1);
    expect(styleModule.match(/^export (?!const |interface )/gm)).toBeNull();
  });

  it('no engine file other than the host reaches for a platform overlay', () => {
    for (const file of [
      'toast/Toaster.tsx',
      'toast/Positioner.tsx',
      'toast/ToastRow.tsx',
    ]) {
      const source = code(file);
      expect(source).not.toMatch(/from 'react-native-screens'/);
      // Doc comments explain why `fixed` lives in the host; assert no file here
      // actually POSITIONS anything fixed.
      expect(source).not.toMatch(/position:\s*'fixed'/);
      expect(source).not.toMatch(/webPosition\(/);
    }
  });

  it('never returns an animation from a mapper (reanimated web failure mode A)', () => {
    // `useDerivedValue(() => withTiming(...))` and a `withTiming` returned from
    // inside `useAnimatedStyle` do not tick on web: the value jumps to a static
    // frame. Every animation must be ASSIGNED from JS instead — the row's shared
    // values come from `useAnimatedTarget`, and its mappers only read them.
    for (const file of [
      'toast/ToastRow.tsx',
      'toast/use-toast-position.ts',
      'toast/ToastSwipeHandler.tsx',
    ]) {
      const source = code(file);
      expect(source).not.toMatch(/useDerivedValue/);
      expect(source).not.toMatch(/return withTiming/);
    }

    const driver = code('toast/use-animated-target.ts');
    expect(driver).toMatch(/value\.value = withTiming\(/);
    expect(driver).not.toMatch(/useDerivedValue/);
  });

  // This assertion used to demand the exact opposite, and it is what kept the
  // bug alive: `box-none` is an RN-only value that react-native-web resolves
  // ONLY from the prop (`createDOMProps` maps it to a class pair). As a style
  // entry it is dropped, so this full-host container inherited `auto` and sat
  // over the whole app as an invisible click-eater for as long as a toast was
  // up. The prop form logs an RNW deprecation notice once; that is the price.
  it('Positioner passes the RN-only pointerEvents value as a PROP, not a style', () => {
    const positioner = code('toast/Positioner.tsx');
    expect(positioner).toMatch(/pointerEvents=\{/);
    expect(positioner).not.toMatch(/pointerEvents:\s*(?:[^,;\n]*\n?){0,6}?['"]box-none['"]/);
  });

  it('package.json exports ./toast WITHOUT a browser condition', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      exports: Record<string, { browser?: unknown; import?: { default?: string } }>;
    };
    const entry = pkg.exports['./toast'];
    expect(entry).toBeDefined();
    // A browser condition would emit lib/module/toast/index.web.js, and any
    // bundler with `.web.js` in resolve.extensions would resolve `./toast` to it.
    expect(entry?.browser).toBeUndefined();
    expect(entry?.import?.default).toBe('./lib/module/toast/index.js');
  });

  it('the generator no longer lists ./toast as web-forked', () => {
    const generator = readFileSync(
      join(REPO_ROOT, 'scripts/generate-platform-exports.mjs'),
      'utf8',
    );
    const forkedBlock = /const WEB_FORKED_SUBPATHS = new Set\(\[([\s\S]*?)\]\)/.exec(
      generator,
    );
    expect(forkedBlock).not.toBeNull();
    expect(forkedBlock?.[1]).not.toMatch(/^\s*'\.\/toast',/m);
  });

  it('no sonner import survives in the toast surface or the root barrel', () => {
    for (const file of [
      'toast/ToastOutlet.tsx',
      'toast/Toaster.tsx',
      'toast/toast-fns.ts',
      'index.ts',
    ]) {
      expect(code(file)).not.toMatch(/from 'sonner(-native)?'/);
    }
  });
});
