// @ts-check
/**
 * Generate the platform-aware bits of @oxy.so/bloom's published surface:
 *
 *   1. The `exports` field of `package.json`.
 *   2. Every WEB BARREL (`src/index.web.ts`, `src/theme/index.web.ts`) — each
 *      one derived from its native sibling.
 *
 * The single source of truth is the layout under `src/`. A subpath gets a
 * `"browser"` export condition iff it appears in `WEB_FORKED_SUBPATHS`
 * below — those are the entries whose source has a sibling `*.web.{ts,tsx}`
 * file, which bob compiles to `*.web.js` next to the regular `*.js`.
 *
 * Why a script:
 *   - The `exports` field has 40+ subpaths. Hand-editing it every time a
 *     `.web.tsx` is added is the kind of thing that drifts.
 *   - The root barrel `src/index.ts` re-exports every subpath; the web
 *     barrel `src/index.web.ts` needs to differ from it on precisely the
 *     lines that touch a web-forked subpath. Generating the web barrel from
 *     `src/index.ts` keeps the two files in lockstep.
 *
 * Wired as a `prebuild` step so `bun run build` always picks up changes.
 * The generated output is committed so diffs are reviewable.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const SRC = join(REPO_ROOT, 'src');
const PKG_PATH = join(REPO_ROOT, 'package.json');

// --------------------------------------------------------------------------
//  Public-API map
// --------------------------------------------------------------------------

/**
 * Subpath -> source entry (relative to `src/`).
 *
 * Listed explicitly (rather than auto-discovered) so adding a folder under
 * `src/` does not silently change the publishable surface. Order matches
 * the order in which entries are written to `package.json` for diff
 * readability.
 */
const SUBPATHS = /** @type {const} */ ([
  ['.', 'index.ts'],
  // The single app-root provider. Not web-forked: it holds a store and an
  // adapter, composed identically on both platforms. (The
  // `provider/scroll-provider{,.web}.ts` filename fork this comment used to
  // name is gone — two identical files were dead weight.)
  ['./provider', 'provider/index.ts'],
  ['./surfaces', 'surfaces/index.ts'],
  ['./image-resolver', 'image-resolver/index.ts'],
  ['./image-aspect-ratio-cache', 'image-aspect-ratio-cache/index.ts'],
  ['./theme', 'theme/index.ts'],
  ['./color-presets', 'theme/color-presets.ts'],
  ['./preset-vars', 'theme/preset-vars.ts'],
  ['./design-tokens', 'design-tokens/index.ts'],
  ['./tailwind-preset', 'design-tokens/tailwind-preset.ts'],
  ['./portal', 'portal/index.ts'],
  // Connection loss as a toast; web-forked (navigator.onLine vs NetInfo).
  ['./connection-status', 'connection-status/index.ts'],
  // Shared overlay plumbing (OverlayRoot + Backdrop) for portaled surfaces.
  ['./overlay', 'overlay/index.ts'],
  ['./dialog', 'dialog/index.ts'],
  ['./appearance', 'appearance/index.ts'],
  ['./control-surface', 'control-surface/index.ts'],
  ['./screen', 'screen/index.ts'],
  ['./bottom-bar', 'bottom-bar/index.ts'],
  ['./button', 'button/index.ts'],
  ['./button-group', 'button-group/index.ts'],
  // The inherited control-presentation contract: what a container tells the
  // controls inside it about material and density, and nothing else.
  ['./control-surface', 'control-surface/index.ts'],
  // Window-edge geometry shared by every floating surface, plus the registry
  // that keeps them off each other. Platform-neutral, no native deps.
  ['./layout', 'layout/index.ts'],
  ['./fab', 'fab/index.ts'],
  ['./frosted-icon-button', 'frosted-icon-button/index.ts'],
  ['./divider', 'divider/index.ts'],
  ['./breadcrumb', 'breadcrumb/index.ts'],
  ['./pagination', 'pagination/index.ts'],
  ['./agent-limits-card', 'agent-limits-card/index.ts'],
  ['./carousel', 'carousel/index.ts'],
  ['./file-upload', 'file-upload/index.ts'],
  ['./social-button', 'social-button/index.ts'],
  ['./notification', 'notification/index.ts'],
  ['./announcement', 'announcement/index.ts'],
  ['./data-table', 'data-table/index.ts'],
  ['./chart-cards', 'chart-cards/index.ts'],
  ['./calendar', 'calendar/index.ts'],
  ['./stat-cards', 'stat-cards/index.ts'],
  ['./recent-hires-card', 'recent-hires-card/index.ts'],
  ['./ai-profile-card', 'ai-profile-card/index.ts'],
  ['./important-alerts-card', 'important-alerts-card/index.ts'],
  ['./patient-info-card', 'patient-info-card/index.ts'],
  ['./sidebar', 'sidebar/index.ts'],
  ['./app-shell', 'app-shell/index.ts'],
  ['./page-header', 'page-header/index.ts'],
  ['./notification-center', 'notification-center/index.ts'],
  ['./theme-toggle', 'theme-toggle/index.ts'],
  ['./settings-modal', 'settings-modal/index.ts'],
  ['./auth-card', 'auth-card/index.ts'],
  ['./agent-thinking', 'agent-thinking/index.ts'],
  ['./agent-log', 'agent-log/index.ts'],
  ['./agent-progress', 'agent-progress/index.ts'],
  ['./composer-loader', 'composer-loader/index.ts'],
  ['./composer-panel', 'composer-panel/index.ts'],
  ['./questionnaire', 'questionnaire/index.ts'],
  ['./web-search', 'web-search/index.ts'],
  ['./task-list', 'task-list/index.ts'],
  ['./agent-chat', 'agent-chat/index.ts'],
  ['./ai-chat', 'ai-chat/index.ts'],
  ['./radio-indicator', 'radio-indicator/index.ts'],
  ['./radio', 'radio/index.ts'],
  ['./error-boundary', 'error-boundary/index.ts'],
  ['./avatar', 'avatar/index.ts'],
  ['./avatar-group', 'avatar-group/index.ts'],
  ['./user-hover-card', 'user-hover-card/index.ts'],
  ['./loading', 'loading/index.ts'],
  ['./switch', 'switch/index.ts'],
  ['./toast', 'toast/index.ts'],
  ['./styles', 'styles/index.ts'],
  ['./hooks', 'hooks/index.ts'],
  ['./icons', 'icons/index.ts'],
  // PATTERN. `*` is substituted by the resolver, so this is the one export
  // shape whose size does not grow with the number of modules behind it —
  // which is the whole reason it exists here and nowhere else yet. `./icons`
  // is a flat barrel over 461 glyph modules and Metro does not tree-shake, so
  // an app naming ONE icon through the barrel ships all 461. Measured on a
  // Metro bundle for the 12 `Ri*` names CrowdSource's apps import: 318,869
  // bytes of glyph modules from the barrel against 7,406 by subpath, 365,825
  // bytes of bundle in all (11.0%). Figures and method: `docs/icons.mdx`.
  // `@oxy.so/bloom/icons/RiHeart3Line` resolves to the single file instead.
  //
  // `./icons` is untouched and stays first-class: an EXACT key beats a pattern
  // in every resolver that implements `exports`, so no existing import moves.
  //
  // The `Ri` belongs in the pattern rather than in the `*`. A bare `./icons/*`
  // also matches `index`, and the four targets then disagree: the built
  // `lib/**/icons/remix/index.d.ts` and `index.js` exist, `src/icons/remix/`
  // has an `index.ts` and no `index.tsx` — so `@oxy.so/bloom/icons/index`
  // would type-check and bundle everywhere EXCEPT Metro, which is the one
  // consumer that reads `src/`. Every glyph is `Ri`-prefixed (461 of 461), so
  // moving the prefix left makes that collision unrepresentable instead of
  // excluded by a list. The specifier a consumer writes is unchanged.
  ['./icons/Ri*', 'icons/remix/Ri*.tsx'],
  ['./typography', 'typography/index.ts'],
  ['./skeleton', 'skeleton/index.ts'],
  ['./grid', 'grid/index.ts'],
  ['./fill', 'fill/index.ts'],
  ['./media-inset-border', 'media-inset-border/index.ts'],
  // TWO specifiers, ONE module. The family became media-capable (video pages
  // fed by a consumer-owned expo-video player) and was renamed to match, but
  // `./zoomable-image-gallery` is what three apps already import and an image
  // gallery is still exactly what this serves them — so the old specifier stays
  // a first-class entry point rather than becoming a shim. Both resolve the same
  // built files; there is no alias module and no re-export layer.
  ['./zoomable-media-gallery', 'zoomable-media-gallery/index.ts'],
  ['./zoomable-image-gallery', 'zoomable-media-gallery/index.ts'],
  // The shared-element layer that survives a route change. Subpath-only for the
  // same reason as the gallery: it statically links `expo-image`.
  ['./media-flight', 'media-flight/index.ts'],
  ['./teleport', 'teleport/index.ts'],
  ['./pressable-scale', 'pressable-scale/index.ts'],
  ['./subtle-hover', 'subtle-hover/index.ts'],
  ['./motion', 'motion/index.ts'],
  ['./animated-check', 'animated-check/index.ts'],
  ['./icon-circle', 'icon-circle/index.ts'],
  // Nothing to show, said once — the base block a dozen families hand-rolled.
  ['./empty-state', 'empty-state/index.ts'],
  ['./connection-dots', 'connection-dots/index.ts'],
  ['./composition-bar', 'composition-bar/index.ts'],
  ['./dot-grid-meter', 'dot-grid-meter/index.ts'],
  ['./stat-bar', 'stat-bar/index.ts'],
  ['./activity-heatmap', 'activity-heatmap/index.ts'],
  ['./text-field', 'text-field/index.ts'],
  ['./segmented-control', 'segmented-control/index.ts'],
  ['./textarea', 'textarea/index.ts'],
  ['./input-otp', 'input-otp/index.ts'],
  ['./phone-input', 'phone-input/index.ts'],
  ['./table', 'table/index.ts'],
  ['./date-picker', 'date-picker/index.ts'],
  ['./search', 'search/index.ts'],
  ['./admonition', 'admonition/index.ts'],
  ['./dropdown-menu', 'dropdown-menu/index.ts'],
  ['./tooltip', 'tooltip/index.ts'],
  ['./select', 'select/index.ts'],
  ['./bottom-sheet', 'bottom-sheet/index.ts'],
  ['./context-menu', 'context-menu/index.ts'],
  ['./menubar', 'menubar/index.ts'],
  ['./popover', 'popover/index.ts'],
  ['./hover-card', 'hover-card/index.ts'],
  ['./aspect-ratio', 'aspect-ratio/index.ts'],
  ['./alert-dialog', 'alert-dialog/index.ts'],
  ['./command', 'command/index.ts'],
  ['./label', 'label/index.ts'],
  ['./kbd', 'kbd/index.ts'],
  ['./item', 'item/index.ts'],
  ['./field', 'field/index.ts'],
  ['./input-group', 'input-group/index.ts'],
  ['./slider', 'slider/index.ts'],
  ['./stepper', 'stepper/index.ts'],
  ['./rating', 'rating/index.ts'],
  ['./media-controls', 'media-controls/index.ts'],
  ['./chat-indicators', 'chat-indicators/index.ts'],
  ['./call-ui', 'call-ui/index.ts'],
  ['./chat-people', 'chat-people/index.ts'],
  ['./chat-screen', 'chat-screen/index.ts'],
  ['./chat-composer', 'chat-composer/index.ts'],
  ['./message-media', 'message-media/index.ts'],
  ['./message-bubble', 'message-bubble/index.ts'],
  ['./chat-list', 'chat-list/index.ts'],
  ['./creator-studio', 'creator-studio/index.ts'],
  ['./media-card', 'media-card/index.ts'],
  ['./media-shelf', 'media-shelf/index.ts'],
  ['./queue-panel', 'queue-panel/index.ts'],
  ['./lyrics', 'lyrics/index.ts'],
  ['./music-library', 'music-library/index.ts'],
  ['./media-player', 'media-player/index.ts'],
  ['./media-header', 'media-header/index.ts'],
  ['./track-list', 'track-list/index.ts'],
  ['./stay-filters', 'stay-filters/index.ts'],
  ['./stay-search', 'stay-search/index.ts'],
  ['./home-search', 'home-search/index.ts'],
  ['./listing-details', 'listing-details/index.ts'],
  ['./property-insights', 'property-insights/index.ts'],
  ['./booking', 'booking/index.ts'],
  ['./listing-actions', 'listing-actions/index.ts'],
  ['./listing-card', 'listing-card/index.ts'],
  ['./offering-badge', 'offering-badge/index.ts'],
  ['./category-bar', 'category-bar/index.ts'],
  ['./map-marker', 'map-marker/index.ts'],
  ['./place-card', 'place-card/index.ts'],
  ['./map-controls', 'map-controls/index.ts'],
  // Drawn ON the map: the blue dot and its heading cone, the guidance while it
  // is happening, and the credit and scale the data's licence requires.
  ['./location-puck', 'location-puck/index.ts'],
  ['./navigation-banner', 'navigation-banner/index.ts'],
  ['./map-attribution', 'map-attribution/index.ts'],
  // Commerce: the four things a maps, a courier and a food app all need.
  ['./order-status', 'order-status/index.ts'],
  ['./price-breakdown', 'price-breakdown/index.ts'],
  // Checkout: review and confirm, the delivery window, and the screen that
  // says it is placed.
  ['./checkout-summary', 'checkout-summary/index.ts'],
  ['./delivery-slot', 'delivery-slot/index.ts'],
  ['./order-confirmation', 'order-confirmation/index.ts'],
  // Ordering food: the vendor, the dish and the basket.
  ['./vendor-card', 'vendor-card/index.ts'],
  ['./menu-item', 'menu-item/index.ts'],
  ['./cart-panel', 'cart-panel/index.ts'],
  ['./address', 'address/index.ts'],
  ['./route-stops', 'route-stops/index.ts'],
  ['./directions', 'directions/index.ts'],
  ['./shipment-request', 'shipment-request/index.ts'],
  ['./carrier-quote', 'carrier-quote/index.ts'],
  ['./vehicle-picker', 'vehicle-picker/index.ts'],
  ['./mail-list', 'mail-list/index.ts'],
  ['./mail-thread', 'mail-thread/index.ts'],
  ['./mail-compose', 'mail-compose/index.ts'],
  ['./swipe-row', 'swipe-row/index.ts'],
  ['./tenancy', 'tenancy/index.ts'],
  ['./eviction', 'eviction/index.ts'],
  ['./place-reviews', 'place-reviews/index.ts'],
  ['./wizard', 'wizard/index.ts'],
  ['./sortable-media', 'sortable-media/index.ts'],
  ['./listing-editor', 'listing-editor/index.ts'],
  ['./contact-card', 'contact-card/index.ts'],
  ['./pipeline', 'pipeline/index.ts'],
  ['./activity-feed', 'activity-feed/index.ts'],
  ['./lead-score', 'lead-score/index.ts'],
  ['./note-card', 'note-card/index.ts'],
  ['./note-editor', 'note-editor/index.ts'],
  ['./tag-field', 'tag-field/index.ts'],
  ['./outline-nav', 'outline-nav/index.ts'],
  ['./card', 'card/index.ts'],
  ['./badge', 'badge/index.ts'],
  ['./chip', 'chip/index.ts'],
  ['./tabs', 'tabs/index.ts'],
  ['./tabs/expo-router', 'tabs/expo-router/index.ts'],
  ['./checkbox', 'checkbox/index.ts'],
  ['./accordion', 'accordion/index.ts'],
  ['./settings-list', 'settings-list/index.ts'],
  ['./link-preview', 'link-preview/index.ts'],
  ['./code', 'code/index.ts'],
  ['./fonts', 'fonts/index.ts'],
  ['./scroll', 'scroll/index.ts'],
  ['./scroll/expo-router', 'scroll/expo-router/index.ts'],
  ['./content-panel', 'content-panel/index.ts'],
  ['./list', 'list/index.ts'],
  ['./rail', 'rail/index.ts'],
  ['./tab-bar', 'tab-bar/index.ts'],
  ['./tab-bar/expo-router', 'tab-bar/expo-router/index.ts'],
  ['./progressive-blur', 'progressive-blur/index.ts'],
]);

/**
 * Subpaths whose default entry has a `.web.{ts,tsx}` sibling.
 *
 * The corresponding `.web` source files MUST exist (the script asserts this);
 * if you remove a fork delete the entry here and re-run the script.
 */
const WEB_FORKED_SUBPATHS = new Set([
  './bottom-bar',
  './app-shell',
  '.',
  './connection-status',
  './media-flight',
  './surfaces',
  './portal',
  './dialog',
  './button',
  './fab',
  './frosted-icon-button',
  './avatar-group',
  './connection-dots',
  './loading',
  './dropdown-menu',
  './tooltip',
  './select',
  './theme',
  './bottom-sheet',
  './context-menu',
  './menubar',
  './popover',
  './hover-card',
  './alert-dialog',
  './command',
  './motion',
  './composer-loader',
  './composer-panel',
  './agent-chat',
  './ai-chat',
  // NOT web-forked: the toast engine is ONE universal implementation that runs
  // on react-native-web. Its only platform split is the 40-line
  // `ToastHost.native.tsx`, which Metro picks up by filename. Listing it here
  // would emit `lib/module/toast/index.web.js`, and any bundler with `.web.js`
  // in `resolve.extensions` would resolve a bare `./toast` import to it.
  './fonts',
  './scroll',
  // NOT web-forked: `./scroll/expo-router` has no `.web` sibling — the router
  // adapter is universal (its two hooks behave the same on both platforms; the
  // platform split lives in `./scroll` itself). Listing it here would trip
  // `assertWebSourceExists()`.
  './content-panel',
  './list',
  './tab-bar',
  // NOT web-forked: `./tab-bar/expo-router` has no `.web` sibling — the router
  // adapter is universal (it only re-binds `TabBar`/`TabBarButton`, whose own
  // entry already resolves per platform). Listing it here would trip
  // `assertWebSourceExists()`.
  './progressive-blur',
]);

/**
 * Subpaths that additionally need an `index.node.ts` sibling, because plain
 * Node would otherwise choke on something in the default graph.
 *
 * Only `./fonts` qualifies, and the reason is specific: its default files ARE
 * the web implementation (`FontLoader.tsx` names `./apply-font-faces.web`
 * outright), which transitively reaches `font-urls.web`'s `.woff2` imports.
 * Node hands a `.woff2` to the JS parser and dies with a `SyntaxError`.
 *
 * The obvious alternative — fork `FontLoader` and leave a neutral default —
 * does NOT work: `theme/BloomThemeProvider.tsx` imports `../fonts/FontLoader`
 * by RELATIVE path, and export conditions do not apply to relative
 * specifiers, so Vite would take the neutral default and silently stop
 * injecting `@font-face` for every `@oxy.so/bloom/theme` consumer. Conditions
 * are the only lever that separates Node from a browser bundler here.
 *
 * Ordering matters: `node` is emitted AFTER `browser`, so a browser-targeting
 * bundler still gets the web build and only real Node (and SSR passes, which
 * want the no-op anyway) lands on the safe barrel.
 */
const NODE_FORKED_SUBPATHS = new Set(['./fonts']);

// --------------------------------------------------------------------------
//  Path helpers
// --------------------------------------------------------------------------

/**
 * Given an `entrySrc` like `dialog/index.ts` or `theme/color-presets.ts`,
 * compute the set of paths bob's output will land at, in both the regular
 * and `.web` variants.
 */
function computePaths(entrySrc) {
  const stem = entrySrc.replace(/\.tsx?$/, ''); // dialog/index | theme/color-presets
  return {
    webSource: `${stem}.web.ts`, // candidate web source file (we also accept .web.tsx)
    webSourceTsx: `${stem}.web.tsx`,
    nodeSource: `${stem}.node.ts`, // candidate node source file (we also accept .node.tsx)
    nodeSourceTsx: `${stem}.node.tsx`,
    libModule: `./lib/module/${stem}.js`,
    libModuleWeb: `./lib/module/${stem}.web.js`,
    libModuleNode: `./lib/module/${stem}.node.js`,
    libCommonjs: `./lib/commonjs/${stem}.js`,
    libCommonjsWeb: `./lib/commonjs/${stem}.web.js`,
    libCommonjsNode: `./lib/commonjs/${stem}.node.js`,
    libTypesModule: `./lib/typescript/module/${stem}.d.ts`,
    libTypesModuleWeb: `./lib/typescript/module/${stem}.web.d.ts`,
    libTypesModuleNode: `./lib/typescript/module/${stem}.node.d.ts`,
    libTypesCjs: `./lib/typescript/commonjs/${stem}.d.ts`,
  };
}

/** Resolve which `.web.{ts,tsx}` source actually exists for a forked subpath. */
function assertWebSourceExists(name, paths) {
  const tsCandidate = join(SRC, paths.webSource);
  const tsxCandidate = join(SRC, paths.webSourceTsx);
  if (!existsSync(tsCandidate) && !existsSync(tsxCandidate)) {
    throw new Error(
      `[generate-platform-exports] ${name} is listed as web-forked but ` +
        `neither ${relative(REPO_ROOT, tsCandidate)} nor ${relative(REPO_ROOT, tsxCandidate)} exists.`,
    );
  }
}

/** Same assertion for `.node.{ts,tsx}`, so a stale set cannot emit a dead path. */
function assertNodeSourceExists(name, paths) {
  const tsCandidate = join(SRC, paths.nodeSource);
  const tsxCandidate = join(SRC, paths.nodeSourceTsx);
  if (!existsSync(tsCandidate) && !existsSync(tsxCandidate)) {
    throw new Error(
      `[generate-platform-exports] ${name} is listed as node-forked but ` +
        `neither ${relative(REPO_ROOT, tsCandidate)} nor ${relative(REPO_ROOT, tsxCandidate)} exists.`,
    );
  }
}

/**
 * Vacuity floor for a pattern subpath, and only that.
 *
 * Deliberately NOT the current count (461 icons): a number written here goes
 * stale on the next glyph added, and a stale number reads as a measurement.
 * It exists so a pattern whose folder was renamed — which resolves to nothing
 * at all, for every consumer, with no error anywhere in this repo — cannot be
 * emitted as a live export.
 */
const MIN_PATTERN_MATCHES = 100;

/**
 * A pattern entry names no file, so `existsSync` cannot check it. Expand `*`
 * against the directory instead and assert the entry actually stands for
 * something.
 */
function assertPatternExpands(name, entrySrc) {
  const [prefix, suffix] = entrySrc.split('*');
  if (suffix === undefined) {
    throw new Error(`[generate-platform-exports] ${name} is a pattern but ${entrySrc} has no '*'.`);
  }
  // Split on the LAST slash rather than with `dirname`, which drops a path's
  // final segment when it ends in one — `dirname('icons/remix/')` is `icons`,
  // and the scan then reads the wrong directory and finds nothing.
  const slash = prefix.lastIndexOf('/');
  const dir = join(SRC, prefix.slice(0, slash + 1));
  const base = prefix.slice(slash + 1);
  const matches = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.startsWith(base) && f.endsWith(suffix))
    : [];
  if (matches.length < MIN_PATTERN_MATCHES) {
    throw new Error(
      `[generate-platform-exports] ${name} -> src/${entrySrc} expands to ${matches.length} ` +
        `file(s), below the floor of ${MIN_PATTERN_MATCHES}. A pattern that matches nothing ` +
        `resolves to nothing in every consumer and is silent here.`,
    );
  }
  return matches.length;
}

// --------------------------------------------------------------------------
//  exports map
// --------------------------------------------------------------------------

function buildExportsField() {
  /** @type {Record<string, unknown>} */
  const out = {};

  for (const [name, entrySrc] of SUBPATHS) {
    const paths = computePaths(entrySrc);
    const hasFork = WEB_FORKED_SUBPATHS.has(name);
    const hasNodeFork = NODE_FORKED_SUBPATHS.has(name);

    if (hasFork) assertWebSourceExists(name, paths);
    if (hasNodeFork) assertNodeSourceExists(name, paths);
    if (name.includes('*')) assertPatternExpands(name, entrySrc);

    /** @type {Record<string, unknown>} */
    const entry = {
      // Metro compiles Bloom from SOURCE, so the `react-native` condition
      // points at `src/`. It must NOT be a bare string: TypeScript honours
      // `react-native` too (expo/tsconfig.base sets `customConditions:
      // ["react-native"]`), and a string entry makes a consumer's tsc
      // type-check Bloom's own `.tsx` files. That drags every module Bloom
      // imports into the consumer's program — including web-fork imports like
      // `react-dom` and optional peers like `expo-haptics` — and produces
      // TS7016/TS2307 errors attributed to files inside `node_modules` that
      // the consumer cannot edit. `skipLibCheck` cannot suppress them because
      // a `.tsx` is not a declaration file.
      //
      // Splitting the condition fixes it at the root: tsc asks for `types` and
      // gets the built declarations; Metro never requests `types`, so it falls
      // through to `default` and still bundles source.
      'react-native': {
        types: paths.libTypesModule,
        default: `./src/${entrySrc}`,
      },
    };

    if (hasFork) {
      entry.browser = {
        types: paths.libTypesModuleWeb,
        import: paths.libModuleWeb,
        require: paths.libCommonjsWeb,
      };
    }

    if (hasNodeFork) {
      entry.node = {
        types: paths.libTypesModuleNode,
        import: paths.libModuleNode,
        require: paths.libCommonjsNode,
      };
    }

    entry.import = {
      types: paths.libTypesModule,
      default: paths.libModule,
    };
    entry.require = {
      types: paths.libTypesCjs,
      default: paths.libCommonjs,
    };

    out[name] = entry;
  }

  // Static CSS artifact for Tailwind v4 / NativeWind CSS-first consumers.
  // Generated from bloomThemeCss() by scripts/generate-theme-css.ts and
  // verified in src/__tests__/design-tokens.test.ts. Shipped from `src/`
  // (included in the package `files` list) so no build copy is needed.
  out['./design-tokens/theme.css'] = './src/design-tokens/theme.css';

  // The same tokens resolved, for a consumer that is not a browser (Astro
  // codegens C++ SkColor tables from it). Generated from the colour engine by
  // scripts/generate-design-tokens-json.ts and verified in
  // src/__tests__/design-tokens-json.test.ts.
  out['./design-tokens/tokens.json'] = './src/design-tokens/tokens.json';

  // Allow consumers / tooling to resolve the package.json itself.
  out['./package.json'] = './package.json';

  return out;
}

// --------------------------------------------------------------------------
//  typesVersions
// --------------------------------------------------------------------------

/**
 * The same map again, for TypeScript's LEGACY `moduleResolution: "node"`.
 *
 * `node` (node10) ignores `exports` entirely. Measured against a fixture on
 * TypeScript 5.9: `@oxy.so/bloom/icons`, `@oxy.so/bloom/theme` and
 * `@oxy.so/bloom/button` all report TS2307 under it while resolving cleanly
 * under `node16` and `bundler` — so until now NO Bloom subpath typechecked for
 * a consumer on that setting, and the compiler's own hint ("there are types
 * at …, but this result could not be resolved under your current
 * moduleResolution") is the only thing that said so.
 *
 * `typesVersions` is the one lever node10 does read. It is emitted for every
 * subpath rather than only for the icons pattern, because the alternative is
 * incoherent: `@oxy.so/bloom/icons/RiAddFill` would typecheck while the barrel
 * beside it did not.
 *
 * Purely additive — TypeScript does NOT consult `typesVersions` when the
 * package has `exports` and resolution is `node16`/`nodenext`/`bundler`, so
 * the modern paths keep resolving through the conditions above, and both
 * behaviours are pinned in `src/__tests__/exports-map-contract.test.ts`.
 *
 * The target is the MODULE declaration tree, matching what the `react-native`
 * and `import` conditions already agree on. node10 has no notion of a
 * condition, so there is only one answer to give it.
 *
 * The root `.` is deliberately absent: it resolves through the top-level
 * `types` field, which node10 does read.
 */
function buildTypesVersionsField() {
  /** @type {Record<string, string[]>} */
  const map = {};
  for (const [name, entrySrc] of SUBPATHS) {
    if (name === '.') continue;
    map[name.slice(2)] = [computePaths(entrySrc).libTypesModule];
  }
  return { '*': map };
}

// --------------------------------------------------------------------------
//  Web barrels
// --------------------------------------------------------------------------

/**
 * Barrels that exist in a native and a web variant, where the web variant is
 * DERIVED from the native one rather than maintained by hand.
 *
 * `children` names the sibling FOLDERS whose `index.web` the web barrel must
 * point at. This has to be spelled out because **export conditions do not
 * apply to relative specifiers** — `theme/index.ts` naming `./color-scope`
 * resolves to the native `index.tsx` in every bundler that is not Metro, no
 * matter what `package.json#exports` says about `./theme`. Metro alone picks
 * the `.web` sibling up by platform extension, which is exactly why the gap
 * was invisible: Metro-web was right and Vite/webpack/SSR silently got native.
 *
 * Generated rather than hand-written for the same reason the root barrel is:
 * two barrels that must agree on every line drift the moment one is edited.
 */
const WEB_BARRELS = /** @type {const} */ ([
  { source: 'button/index.ts', children: ['Button'] },
  { source: 'fab/index.ts', children: ['Fab'] },
  { source: 'bottom-bar/index.ts', children: ['BottomBar'] },
  { source: 'app-shell/index.ts', children: ['../bottom-bar', '../fab'] },
  {
    source: 'index.ts',
    // Every web-forked subpath except the root itself.
    children: [...WEB_FORKED_SUBPATHS].filter((s) => s !== '.').map((s) => s.replace(/^\.\//, '')),
  },
  {
    // `BloomColorScope` / `BloomSeedScope` fork because the web variants write
    // the resolved tokens as real CSS custom properties on an inline `style`,
    // while native publishes them through react-native-css's `VariableContext`.
    // Resolved to the native file, a web consumer's scope emits NO vars at all
    // (the provider is absent off-Metro), which is the silent
    // "scoped subtree renders with the root palette" failure.
    source: 'theme/index.ts',
    children: ['color-scope', 'seed-scope'],
  },
]);

/**
 * Rewrite a native barrel into its web variant by retargeting every line that
 * re-exports a forked child folder to that folder's `index.web` entry.
 *
 * The transform is purely textual and only touches lines of the form
 * `from './<folder>'`. Lines that don't match — including deeper paths like
 * `from './color-scope/seed-scope'`, which is not forked — pass through
 * verbatim.
 */
function buildWebBarrel(originalSource, sourceRelPath, children) {
  const header = [
    '// AUTO-GENERATED by scripts/generate-platform-exports.mjs — DO NOT EDIT.',
    `// Source of truth: src/${sourceRelPath}.`,
    '// Re-run `bun run generate:exports` (or any `bun run build`) after',
    '// changing that barrel or the set of web-forked subpaths.',
    '',
    '',
  ].join('\n');

  const transformed = originalSource
    .split('\n')
    .map((line) => {
      const match = line.match(/from '((?:\.\.\/|\.\/)[A-Za-z-]+)'(\s*;?\s*)$/);
      if (!match) return line;
      const specifier = match[1];
      const folder = specifier.replace(/^\.\//, '');
      if (!children.includes(folder)) return line;
      const isFile = existsSync(join(SRC, dirname(sourceRelPath), `${folder}.web.tsx`)) || existsSync(join(SRC, dirname(sourceRelPath), `${folder}.web.ts`));
      return line.replace(`from '${specifier}'`, `from '${specifier}${isFile ? '.web' : '/index.web'}'`);
    })
    .join('\n');

  return header + transformed;
}

// --------------------------------------------------------------------------
//  Main
// --------------------------------------------------------------------------

function main() {
  // 1. Regenerate the web barrels FIRST so the exports-field assertion that
  //    each `.web` source exists will pass.
  for (const { source, children } of WEB_BARRELS) {
    const nativePath = join(SRC, source);
    const webPath = join(SRC, source.replace(/\.ts$/, '.web.ts'));
    writeFileSync(webPath, buildWebBarrel(readFileSync(nativePath, 'utf8'), source, children));
    console.log(
      `[generate-platform-exports] wrote ${relative(REPO_ROOT, webPath)} from ${relative(REPO_ROOT, nativePath)}`,
    );
  }

  // 2. Update `exports` in package.json.
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  pkg.exports = buildExportsField();
  pkg.typesVersions = buildTypesVersionsField();
  // Remove any stale `browser` field — internal sibling imports now use
  // explicit `index.web` paths so the older Browserify-style remap is
  // unnecessary. Leaving it would just be noise.
  delete pkg.browser;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  console.log(
    `[generate-platform-exports] wrote ${SUBPATHS.length} subpaths to package.json#exports ` +
      `and ${Object.keys(pkg.typesVersions['*']).length} to package.json#typesVersions`,
  );

  // 3. Stat package.json so the size shows up in CI logs.
  console.log(
    `[generate-platform-exports] package.json is now ${statSync(PKG_PATH).size} bytes`,
  );
}

main();
