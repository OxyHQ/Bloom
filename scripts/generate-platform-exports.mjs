// @ts-check
/**
 * Generate the platform-aware bits of @oxyhq/bloom's published surface:
 *
 *   1. The `exports` field of `package.json`.
 *   2. `src/index.web.ts` — the web variant of the root barrel.
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

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const SRC = join(REPO_ROOT, 'src');
const PKG_PATH = join(REPO_ROOT, 'package.json');
const ROOT_BARREL_PATH = join(SRC, 'index.ts');
const ROOT_BARREL_WEB_PATH = join(SRC, 'index.web.ts');

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
  ['./surfaces', 'surfaces/index.ts'],
  ['./image-resolver', 'image-resolver/index.ts'],
  ['./image-aspect-ratio-cache', 'image-aspect-ratio-cache/index.ts'],
  ['./theme', 'theme/index.ts'],
  ['./color-presets', 'theme/color-presets.ts'],
  ['./preset-vars', 'theme/preset-vars.ts'],
  ['./design-tokens', 'design-tokens/index.ts'],
  ['./tailwind-preset', 'design-tokens/tailwind-preset.ts'],
  ['./portal', 'portal/index.tsx'],
  ['./dialog', 'dialog/index.ts'],
  ['./button', 'button/index.ts'],
  ['./fab', 'fab/index.ts'],
  ['./frosted-icon-button', 'frosted-icon-button/index.ts'],
  ['./grouped-buttons', 'grouped-buttons/index.ts'],
  ['./divider', 'divider/index.ts'],
  ['./radio-indicator', 'radio-indicator/index.ts'],
  ['./collapsible', 'collapsible/index.ts'],
  ['./error-boundary', 'error-boundary/index.ts'],
  ['./avatar', 'avatar/index.ts'],
  ['./avatar-group', 'avatar-group/index.ts'],
  ['./user-hover-card', 'user-hover-card/index.ts'],
  ['./loading', 'loading/index.ts'],
  ['./switch', 'switch/index.ts'],
  ['./prompt-input', 'prompt-input/index.ts'],
  ['./toast', 'toast/index.tsx'],
  ['./styles', 'styles/index.ts'],
  ['./hooks', 'hooks/index.ts'],
  ['./icons', 'icons/index.ts'],
  ['./typography', 'typography/index.tsx'],
  ['./skeleton', 'skeleton/index.tsx'],
  ['./grid', 'grid/index.tsx'],
  ['./fill', 'fill/index.tsx'],
  ['./media-inset-border', 'media-inset-border/index.ts'],
  ['./zoomable-image-gallery', 'zoomable-image-gallery/index.ts'],
  ['./pressable-scale', 'pressable-scale/index.ts'],
  ['./pressable-with-hover', 'pressable-with-hover/index.ts'],
  ['./subtle-hover', 'subtle-hover/index.ts'],
  ['./motion', 'motion/index.ts'],
  ['./animated-check', 'animated-check/index.ts'],
  ['./icon-circle', 'icon-circle/index.tsx'],
  ['./connection-dots', 'connection-dots/index.ts'],
  ['./composition-bar', 'composition-bar/index.ts'],
  ['./dot-grid-meter', 'dot-grid-meter/index.ts'],
  ['./stat-bar', 'stat-bar/index.ts'],
  ['./activity-heatmap', 'activity-heatmap/index.ts'],
  ['./profile-card', 'profile-card/index.ts'],
  ['./benefit-list', 'benefit-list/index.tsx'],
  ['./text-field', 'text-field/index.tsx'],
  ['./segmented-control', 'segmented-control/index.tsx'],
  ['./search', 'search/index.tsx'],
  ['./admonition', 'admonition/index.tsx'],
  ['./menu', 'menu/index.tsx'],
  ['./tooltip', 'tooltip/index.tsx'],
  ['./select', 'select/index.tsx'],
  ['./bottom-sheet', 'bottom-sheet/index.tsx'],
  ['./context-menu', 'context-menu/index.tsx'],
  ['./popover', 'popover/index.tsx'],
  ['./alert-dialog', 'alert-dialog/index.ts'],
  ['./combobox', 'combobox/index.ts'],
  ['./command', 'command/index.ts'],
  ['./label', 'label/index.ts'],
  ['./kbd', 'kbd/index.ts'],
  ['./item', 'item/index.ts'],
  ['./field', 'field/index.ts'],
  ['./input-group', 'input-group/index.ts'],
  ['./slider', 'slider/index.ts'],
  ['./card', 'card/index.ts'],
  ['./badge', 'badge/index.ts'],
  ['./chip', 'chip/index.ts'],
  ['./tabs', 'tabs/index.ts'],
  ['./checkbox', 'checkbox/index.ts'],
  ['./accordion', 'accordion/index.ts'],
  ['./settings-list', 'settings-list/index.ts'],
  ['./link-preview', 'link-preview/index.ts'],
  ['./code', 'code/index.ts'],
  ['./fonts', 'fonts/index.ts'],
  ['./scroll', 'scroll/index.ts'],
  ['./content-panel', 'content-panel/index.tsx'],
  ['./list', 'list/index.tsx'],
]);

/**
 * Subpaths whose default entry has a `.web.{ts,tsx}` sibling.
 *
 * The corresponding `.web` source files MUST exist (the script asserts this);
 * if you remove a fork delete the entry here and re-run the script.
 */
const WEB_FORKED_SUBPATHS = new Set([
  '.',
  './surfaces',
  './portal',
  './dialog',
  './button',
  './fab',
  './frosted-icon-button',
  './avatar-group',
  './connection-dots',
  './loading',
  './menu',
  './tooltip',
  './select',
  './bottom-sheet',
  './context-menu',
  './popover',
  './alert-dialog',
  './combobox',
  './command',
  // NOT web-forked: the toast engine is ONE universal implementation that runs
  // on react-native-web. Its only platform split is the 40-line
  // `ToastHost.native.tsx`, which Metro picks up by filename. Listing it here
  // would emit `lib/module/toast/index.web.js`, and any bundler with `.web.js`
  // in `resolve.extensions` would resolve a bare `./toast` import to it.
  './fonts',
  './scroll',
  './content-panel',
  './list',
]);

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
    libModule: `./lib/module/${stem}.js`,
    libModuleWeb: `./lib/module/${stem}.web.js`,
    libCommonjs: `./lib/commonjs/${stem}.js`,
    libCommonjsWeb: `./lib/commonjs/${stem}.web.js`,
    libTypesModule: `./lib/typescript/module/${stem}.d.ts`,
    libTypesModuleWeb: `./lib/typescript/module/${stem}.web.d.ts`,
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

// --------------------------------------------------------------------------
//  exports map
// --------------------------------------------------------------------------

function buildExportsField() {
  /** @type {Record<string, unknown>} */
  const out = {};

  for (const [name, entrySrc] of SUBPATHS) {
    const paths = computePaths(entrySrc);
    const hasFork = WEB_FORKED_SUBPATHS.has(name);

    if (hasFork) assertWebSourceExists(name, paths);

    /** @type {Record<string, unknown>} */
    const entry = {
      'react-native': `./src/${entrySrc}`,
    };

    if (hasFork) {
      entry.browser = {
        types: paths.libTypesModuleWeb,
        import: paths.libModuleWeb,
        require: paths.libCommonjsWeb,
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

  // Allow consumers / tooling to resolve the package.json itself.
  out['./package.json'] = './package.json';

  return out;
}

// --------------------------------------------------------------------------
//  Root barrel (web variant)
// --------------------------------------------------------------------------

/**
 * Rewrite `src/index.ts` into `src/index.web.ts` by retargeting every line
 * that re-exports a web-forked subpath to its `.web` entry.
 *
 * The transform is purely textual and only touches lines of the form
 * `from './<folder>'`. Lines that don't match are passed through verbatim.
 */
function buildRootWebBarrel(originalSource) {
  const forkedFolderNames = [...WEB_FORKED_SUBPATHS]
    .filter((s) => s !== '.')
    .map((s) => s.replace(/^\.\//, ''));

  const header = [
    '// AUTO-GENERATED by scripts/generate-platform-exports.mjs — DO NOT EDIT.',
    '// Source of truth: src/index.ts.',
    '// Re-run `bun run generate:exports` (or any `bun run build`) after',
    '// changing the root barrel or the set of web-forked subpaths.',
    '',
    '',
  ].join('\n');

  const transformed = originalSource
    .split('\n')
    .map((line) => {
      const match = line.match(/from '\.\/([a-z-]+)'(\s*;?\s*)$/);
      if (!match) return line;
      const folder = match[1];
      if (!forkedFolderNames.includes(folder)) return line;
      return line.replace(`from './${folder}'`, `from './${folder}/index.web'`);
    })
    .join('\n');

  return header + transformed;
}

// --------------------------------------------------------------------------
//  Main
// --------------------------------------------------------------------------

function main() {
  // 1. Regenerate src/index.web.ts FIRST so the exports-field assertion
  //    that the file exists will pass.
  const rootBarrel = readFileSync(ROOT_BARREL_PATH, 'utf8');
  writeFileSync(ROOT_BARREL_WEB_PATH, buildRootWebBarrel(rootBarrel));
  console.log(
    `[generate-platform-exports] wrote ${relative(REPO_ROOT, ROOT_BARREL_WEB_PATH)} from ${relative(REPO_ROOT, ROOT_BARREL_PATH)}`,
  );

  // 2. Update `exports` in package.json.
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  pkg.exports = buildExportsField();
  // Remove any stale `browser` field — internal sibling imports now use
  // explicit `index.web` paths so the older Browserify-style remap is
  // unnecessary. Leaving it would just be noise.
  delete pkg.browser;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  console.log(
    `[generate-platform-exports] wrote ${SUBPATHS.length} subpaths to package.json#exports`,
  );

  // 3. Stat package.json so the size shows up in CI logs.
  console.log(
    `[generate-platform-exports] package.json is now ${statSync(PKG_PATH).size} bytes`,
  );
}

main();
