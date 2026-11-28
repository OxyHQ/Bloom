/**
 * Generate `BloomTheme`'s data — the Swift package of the native iOS runtime (ADR 0003) — from
 * the SAME TypeScript source the web and React Native theme reads, so the two can never drift:
 *
 *   packages/bloom-language-compiler/crates/native/runtime/ios/Sources/BloomTheme/Generated/
 *     Presets.generated.swift      the preset registry, families, gates, hex lookup, accent hues
 *     Tokens.generated.swift       canonical tokens, role names, `ThemeColors`, field and alias maps
 *     Constants.generated.swift    status seeds, gradients, label and press alphas
 *     EngineTables.generated.swift the colour engine's numeric tables (critical planes, matrices)
 *     BloomThemeTokens.generated.swift every preset's resolved palette, light and dark, as constants
 *
 * Only DATA is generated. The colour engine and policy are ported to Swift by hand
 * (`Sources/BloomTheme/Engine`, `Policy`) and proven against the TypeScript by the goldens
 * `scripts/generate-theme-native-golden.ts` writes. The preset palettes are the one output that
 * runs the engine (`getResolvedTokens`, `buildTheme`), so a preset's first frame needs no solve on
 * the device; they are checked here against the frozen oracle, and the Swift tests check them
 * against the Swift engine.
 *
 * Numbers are written with `String(number)`, the shortest form that round-trips, so Swift parses
 * every table back to the identical double.
 *
 *   bun run generate:swift-theme            # write
 *   bun scripts/generate-swift-theme.ts --check   # exit 1 when a checked-in file is stale
 *
 * Wired into `prebuild`, after the token JSON: it reads data only, so it is fast and cannot fail
 * a build that the theme itself does not fail.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stubReactNative } from './swift-theme/react-native-stub';
import { labelAlpha } from './swift-theme/source-constants';

stubReactNative();

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(
  repoRoot,
  'packages/bloom-language-compiler/crates/native/runtime/ios/Sources/BloomTheme/Generated',
);
const check = process.argv.includes('--check');

const theme = (path: string) => import(join(repoRoot, 'src/theme', path));
const presets = await theme('color-presets.ts');
const { PRESET_ACCENT_HUES } = await theme('preset-accent-hues.ts');
const { CANONICAL_TOKENS } = await theme('canonical-tokens.ts');
const { Roles } = await theme('color-engine/color-roles.ts');
const { STATUS_SEEDS } = await theme('color-policy.ts');
const { STATUS_COLORS, buildTheme } = await theme('build-theme.ts');
const { getResolvedTokens } = await theme('token-registry.ts');
const { THEME_GRADIENTS } = await theme('gradients.ts');
const LABEL_ALPHA = labelAlpha(repoRoot);
const { PRESS_LAYER_ALPHA } = await theme('press-colors.ts');
const { COLOR_FIELDS } = await theme('color-scope/resolve-scope.ts');
const { withScopeAliases } = await theme('color-scope/seed-scope.ts');
const { COMPONENT_COLOR_ROLES } = await import(
  join(repoRoot, 'src/design-tokens/component-roles.ts')
);
const { FILL_ROLES, TEXT_ROLES, ACCENT_TEXT_ROLES, BORDER_ROLES } = await import(
  join(repoRoot, 'src/design-tokens/color-roles.ts')
);

// ---------------------------------------------------------------------------------------------
// Swift spelling

const SWIFT_KEYWORDS = new Set([
  'associatedtype',
  'class',
  'deinit',
  'enum',
  'extension',
  'fileprivate',
  'func',
  'import',
  'init',
  'inout',
  'internal',
  'let',
  'open',
  'operator',
  'private',
  'protocol',
  'public',
  'rethrows',
  'static',
  'struct',
  'subscript',
  'typealias',
  'var',
  'break',
  'case',
  'continue',
  'default',
  'defer',
  'do',
  'else',
  'fallthrough',
  'for',
  'guard',
  'if',
  'in',
  'repeat',
  'return',
  'switch',
  'where',
  'while',
  'as',
  'catch',
  'false',
  'is',
  'nil',
  'super',
  'self',
  'Self',
  'throw',
  'throws',
  'true',
  'try',
  'Any',
  'some',
  'any',
]);

/** `muted-foreground` → `mutedForeground`, `chart-1-active` → `chart1Active`. */
function swiftCase(name: string): string {
  const camel = name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  if (!/^[a-z][A-Za-z0-9]*$/.test(camel)) throw new Error(`no Swift name for "${name}"`);
  return SWIFT_KEYWORDS.has(camel) ? `\`${camel}\`` : camel;
}

/** A Swift string literal. */
function str(value: string): string {
  let out = '"';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (code < 0x20 || code === 0x7f) out += `\\u{${code.toString(16)}}`;
    else out += ch;
  }
  return `${out}"`;
}

/** A Swift Double literal that parses back to the identical double. */
function num(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`not a finite number: ${value}`);
  return String(value);
}

const opt = (value: string | undefined, render: (v: string) => string = str): string =>
  value === undefined ? 'nil' : render(value);

function unique(names: string[], what: string): void {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) throw new Error(`two ${what} spell "${name}" in Swift`);
    seen.add(name);
  }
}

const HEADER = (
  what: string,
) => `// AUTO-GENERATED by scripts/generate-swift-theme.ts from ${what}. DO NOT EDIT.
// Re-run \`bun run generate:swift-theme\` after changing the TypeScript source.
`;

// ---------------------------------------------------------------------------------------------
// Presets.generated.swift

function renderPresets(): string {
  const registry = presets.COLOR_PRESET_REGISTRY as Array<Record<string, unknown>>;
  const names = registry.map((p) => p.name as string);
  unique(names.map(swiftCase), 'presets');

  const families = presets.COLOR_PRESET_FAMILY_REGISTRY as Array<Record<string, string>>;
  const familyCases = families.map((f) => `  case ${swiftCase(f.name)} = ${str(f.name)}`);
  const familyRows = families.map(
    (f) =>
      `    ColorPresetFamilyDefinition(name: .${swiftCase(f.name)}, displayName: ${str(f.displayName)}, description: ${str(f.description)}),`,
  );

  const tokenRows = (tokens: Record<string, string> | undefined): string =>
    tokens === undefined
      ? 'nil'
      : `[${Object.entries(tokens)
          .map(([name, value]) => `TokenPair(${str(name)}, ${str(value)})`)
          .join(', ')}]`;

  const presetRows = registry.map((p) => {
    const tokens = p.tokens as { light?: Record<string, string>; dark?: Record<string, string> };
    const fields = [
      `name: .${swiftCase(p.name as string)}`,
      `displayName: ${str(p.displayName as string)}`,
      `family: .${swiftCase(p.family as string)}`,
      `description: ${str(p.description as string)}`,
      `hex: ${str(p.hex as string)}`,
      `variant: .${p.variant as string}`,
      `secondaryHex: ${opt(p.secondaryHex as string | undefined)}`,
      `tertiaryHex: ${opt(p.tertiaryHex as string | undefined)}`,
      `pairing: .${p.pairing as string}`,
      `featured: ${p.featured === true}`,
      `label: ${opt(p.label as string | undefined, (v) => `.${v}`)}`,
      `gate: ${opt(p.gate as string | undefined, (v) => `.${v}`)}`,
      `tokens: ${
        tokens === undefined
          ? 'nil'
          : `PresetTokenOverrides(light: ${tokenRows(tokens.light)}, dark: ${tokenRows(tokens.dark)})`
      }`,
    ];
    return `    ColorPresetRecipe(\n      ${fields.join(',\n      ')}\n    ),`;
  });

  const hexRows = Object.entries(presets.HEX_TO_APP_COLOR as Record<string, string>).map(
    ([hex, name]) => `    ${str(hex)}: .${swiftCase(name)},`,
  );
  const hueRows = Object.entries(
    PRESET_ACCENT_HUES as Record<string, { secondary: number; tertiary: number }>,
  ).map(
    ([hex, hues]) =>
      `    ${str(hex)}: AccentHues(secondary: ${num(hues.secondary)}, tertiary: ${num(hues.tertiary)}),`,
  );
  const nameList = (list: readonly string[]) =>
    `[${list.map((n) => `.${swiftCase(n)}`).join(', ')}]`;

  return `${HEADER('src/theme/color-presets.ts and src/theme/preset-accent-hues.ts')}
/// A preset's identifier (\`AppColorName\`), in registry order: \`allCases\` is \`APP_COLOR_NAMES\`.
public enum AppColorName: String, CaseIterable, Codable, Sendable, Hashable {
${names.map((n) => `  case ${swiftCase(n)} = ${str(n)}`).join('\n')}
}

/// The picker families (\`ColorPresetFamily\`), ordered from specific to general.
public enum ColorPresetFamily: String, CaseIterable, Codable, Sendable, Hashable {
${familyCases.join('\n')}
}

public enum BloomThemeData {
  /// \`COLOR_PRESET_FAMILY_REGISTRY\`.
  public static let colorPresetFamilyRegistry: [ColorPresetFamilyDefinition] = [
${familyRows.join('\n')}
  ]

  /// \`COLOR_PRESET_REGISTRY\`: every preset, in order, with its picker metadata.
  public static let colorPresetRegistry: [ColorPresetRecipe] = [
${presetRows.join('\n')}
  ]

  /// \`HEX_TO_APP_COLOR\`: a lowercase seed hex to the preset it names (the last one wins).
  public static let hexToAppColor: [String: AppColorName] = [
${hexRows.join('\n')}
  ]

  /// \`PRESET_ACCENT_HUES\`: each built-in seed's \`deriveAccentHues\`, keyed by lowercase seed hex.
  public static let presetAccentHues: [String: AccentHues] = [
${hueRows.join('\n')}
  ]

  /// \`FREE_COLOR_NAMES\`.
  public static let freeColorNames: [AppColorName] = ${nameList(presets.FREE_COLOR_NAMES)}
  /// \`HANDLE_COLOR_NAMES\`.
  public static let handleColorNames: [AppColorName] = ${nameList(presets.HANDLE_COLOR_NAMES)}
  /// \`PREMIUM_COLOR_NAMES\`.
  public static let premiumColorNames: [AppColorName] = ${nameList(presets.PREMIUM_COLOR_NAMES)}
  /// \`COLOR_PLAYGROUND_NAMES\`.
  public static let colorPlaygroundNames: [AppColorName] = ${nameList(presets.COLOR_PLAYGROUND_NAMES)}
}
`;
}

// ---------------------------------------------------------------------------------------------
// Tokens.generated.swift

/**
 * The alias layer `withScopeAliases` (color-scope/seed-scope.ts) re-declares inside a scope. It
 * is module-private there, so it is rebuilt here from the same exported maps, in the same
 * spread order, and then PROVEN equal to the real function below — a change to seed-scope.ts
 * that this does not follow fails the generator instead of shipping a different alias layer.
 */
function scopedAliases(): Array<[string, string]> {
  const aliases: Record<string, string> = {
    ...COMPONENT_COLOR_ROLES,
    ...FILL_ROLES,
    ...TEXT_ROLES,
    ...ACCENT_TEXT_ROLES,
    ...BORDER_ROLES,
    divider: 'var(--border)',
  };
  return Object.entries(aliases);
}

function proveAliases(aliases: Array<[string, string]>): void {
  const probe: Record<string, string> = {};
  for (const token of CANONICAL_TOKENS as readonly string[])
    probe[`--${token}`] = `probe(${token})`;
  const expected = JSON.stringify(Object.entries(withScopeAliases(probe)));
  const vars: Record<string, string> = { ...probe };
  for (const [key, value] of Object.entries(probe)) vars[`--color-${key.slice(2)}`] = value;
  for (const [alias, reference] of aliases) {
    const canonical = /^var\(--(.+)\)$/.exec(reference)?.[1];
    const resolved = canonical === undefined ? undefined : probe[`--${canonical}`];
    if (resolved !== undefined) vars[`--color-${alias}`] = resolved;
  }
  if (JSON.stringify(Object.entries(vars)) !== expected) {
    throw new Error(
      'scopedAliases() no longer matches withScopeAliases (color-scope/seed-scope.ts)',
    );
  }
}

function renderTokens(): string {
  const tokens = CANONICAL_TOKENS as readonly string[];
  unique(tokens.map(swiftCase), 'canonical tokens');
  const roles = Object.keys(Roles);
  const colors = buildTheme('teal', 'light').colors as Record<string, string>;
  const fields = Object.keys(colors);
  for (const field of fields) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(field) || SWIFT_KEYWORDS.has(field)) {
      throw new Error(`ThemeColors field "${field}" has no Swift name`);
    }
  }
  const aliases = scopedAliases();
  proveAliases(aliases);

  const fieldRows = Object.entries(COLOR_FIELDS as Record<string, string[]>).map(
    ([token, list]) => `    (.${swiftCase(token)}, [${list.map((f) => `.${f}`).join(', ')}]),`,
  );

  return `${HEADER('src/theme (canonical-tokens.ts, color-engine/color-roles.ts, types.ts, color-scope)')}
/// \`CanonicalToken\`: a canonical token name (no leading \`--\`), in \`CANONICAL_TOKENS\` order.
public enum CanonicalToken: String, CaseIterable, Codable, Sendable, Hashable {
${tokens.map((t) => `  case ${swiftCase(t)} = ${str(t)}`).join('\n')}

  /// The CSS custom property, \`--\${rawValue}\`.
  public var variable: String { "--" + rawValue }
}

/// \`RoleName\`: the engine's Material 3 roles (\`Roles\`), in their order.
public enum RoleName: String, CaseIterable, Codable, Sendable, Hashable {
${roles.map((r) => `  case ${r}`).join('\n')}
}

/// A \`ThemeColors\` field name, in the order \`buildTheme\` writes them.
public enum ThemeColorField: String, CaseIterable, Codable, Sendable, Hashable {
${fields.map((f) => `  case ${f}`).join('\n')}
}

/// \`ThemeColors\`: the JS \`theme.colors\` object, field for field.
public struct ThemeColors: Sendable, Hashable, Codable {
${fields.map((f) => `  public var ${f}: String`).join('\n')}

  public init(
${fields.map((f) => `    ${f}: String`).join(',\n')}
  ) {
${fields.map((f) => `    self.${f} = ${f}`).join('\n')}
  }

  /// From the values in field order (the generated preset palettes).
  init(orderedValues v: ArraySlice<String>) {
    let s = v.startIndex
${fields.map((f, i) => `    self.${f} = v[s + ${i}]`).join('\n')}
  }

  public subscript(field: ThemeColorField) -> String {
    get {
      switch field {
${fields.map((f) => `      case .${f}: return ${f}`).join('\n')}
      }
    }
    set {
      switch field {
${fields.map((f) => `      case .${f}: ${f} = newValue`).join('\n')}
      }
    }
  }
}

public enum BloomTokenData {
  /// \`COLOR_FIELDS\` (color-scope/resolve-scope.ts): the \`ThemeColors\` fields each canonical
  /// token feeds; the first is the token's own field.
  public static let colorFields: [(token: CanonicalToken, fields: [ThemeColorField])] = [
${fieldRows.join('\n')}
  ]

  /// \`SCOPED_ALIASES\` (color-scope/seed-scope.ts): each \`--color-<alias>\` a scope re-declares
  /// against its own values, with the reference it resolves (\`var(--token)\` or a literal).
  public static let scopedAliases: [(alias: String, reference: String)] = [
${aliases.map(([alias, ref]) => `    (${str(alias)}, ${str(ref)}),`).join('\n')}
  ]
}
`;
}

// ---------------------------------------------------------------------------------------------
// Constants.generated.swift

function renderConstants(): string {
  const statusRows = (map: Record<string, string>) =>
    Object.entries(map)
      .map(([role, hex]) => `    (${str(role)}, ${str(hex)}),`)
      .join('\n');
  const gradients = Object.entries(
    THEME_GRADIENTS as Record<string, { values: Array<[number, string]> }>,
  ).map(
    ([name, g]) =>
      `    (${str(name)}, ThemeGradient(values: [${g.values
        .map(([offset, color]) => `GradientStop(${num(offset)}, ${str(color)})`)
        .join(', ')}])),`,
  );
  const alpha = LABEL_ALPHA as Record<string, number>;
  return `${HEADER('src/theme (color-policy.ts, build-theme.ts, gradients.ts, label-colors.ts, press-colors.ts)')}
public enum BloomConstantData {
  /// \`STATUS_SEEDS\` (color-policy.ts): only hue and chroma survive; tones come from the policy.
  public static let statusSeeds: [(role: String, hex: String)] = [
${statusRows(STATUS_SEEDS)}
  ]

  /// \`STATUS_COLORS\` (build-theme.ts).
  public static let statusColors: [(role: String, hex: String)] = [
${statusRows(STATUS_COLORS)}
  ]

  /// \`THEME_GRADIENTS\`, in order.
  public static let themeGradients: [(name: String, gradient: ThemeGradient)] = [
${gradients.join('\n')}
  ]

  /// \`LABEL_ALPHA\`.
  public static let labelAlpha = LabelAlpha(label: ${num(alpha.label as number)}, secondary: ${num(alpha.secondary as number)}, tertiary: ${num(alpha.tertiary as number)}, quaternary: ${num(alpha.quaternary as number)})

  /// \`PRESS_LAYER_ALPHA\`.
  public static let pressLayerAlpha: Double = ${num(PRESS_LAYER_ALPHA)}
}
`;
}

// ---------------------------------------------------------------------------------------------
// EngineTables.generated.swift — numeric tables read out of the engine's own source text, since
// they are module-private constants: copying 255 doubles by hand is the drift this exists to stop.

function numericConst(file: string, name: string): string {
  const source = readFileSync(join(repoRoot, 'src/theme/color-engine', file), 'utf8');
  const match = new RegExp(`const ${name}(?::[^=]+)?=\\s*(\\[[\\s\\S]*?\\]);`).exec(source);
  if (!match?.[1]) throw new Error(`${file}: no numeric table "${name}"`);
  const value = JSON.parse(match[1].replace(/,(\s*\])/g, '$1')) as unknown;
  const render = (v: unknown): string =>
    Array.isArray(v) ? `[${v.map(render).join(', ')}]` : num(v as number);
  return render(value);
}

function renderEngineTables(): string {
  const table = (file: string, name: string, swift: string, type: string) =>
    `  /// \`${name}\` (src/theme/color-engine/${file}).\n  static let ${swift}: ${type} = ${numericConst(file, name)}`;
  return `${HEADER('src/theme/color-engine (hct-solver.ts, color-utils.ts)')}
enum EngineTables {
${table('hct-solver.ts', 'SCALED_DISCOUNT_FROM_LINRGB', 'scaledDiscountFromLinrgb', '[[Double]]')}
${table('hct-solver.ts', 'LINRGB_FROM_SCALED_DISCOUNT', 'linrgbFromScaledDiscount', '[[Double]]')}
${table('hct-solver.ts', 'Y_FROM_LINRGB', 'yFromLinrgb', '[Double]')}
${table('hct-solver.ts', 'CRITICAL_PLANES', 'criticalPlanes', '[Double]')}
${table('color-utils.ts', 'SRGB_TO_XYZ', 'srgbToXyz', '[[Double]]')}
${table('color-utils.ts', 'XYZ_TO_SRGB', 'xyzToSrgb', '[[Double]]')}
${table('color-utils.ts', 'WHITE_POINT_D65', 'whitePointD65', '[Double]')}
}
`;
}

// ---------------------------------------------------------------------------------------------
// BloomThemeTokens.generated.swift — every preset's resolved palette (`getResolvedTokens`) and JS
// theme colours (`buildTheme`), light and dark, by running the TypeScript functions themselves.

function renderPresetPalettes(): string {
  const golden = JSON.parse(
    readFileSync(
      join(repoRoot, 'src/theme/__tests__/__fixtures__/golden-resolved-tokens.json'),
      'utf8',
    ),
  ) as Record<string, Record<string, string>>;
  const names = presets.APP_COLOR_NAMES as readonly string[];
  let tokenNames: string[] | undefined;
  let fieldNames: string[] | undefined;
  const tokenRows: string[] = [];
  const colorRows: string[] = [];
  for (const name of names) {
    for (const mode of ['light', 'dark'] as const) {
      const tokens = getResolvedTokens(name, mode) as Record<string, string>;
      if (JSON.stringify(tokens) !== JSON.stringify(golden[`${name}/${mode}`])) {
        throw new Error(`${name}/${mode}: getResolvedTokens no longer matches the frozen oracle`);
      }
      const keys = Object.keys(tokens);
      tokenNames ??= keys;
      if (keys.join() !== tokenNames.join())
        throw new Error(`${name}/${mode}: token order differs`);
      const colors = buildTheme(name, mode).colors as Record<string, string>;
      fieldNames ??= Object.keys(colors);
      if (Object.keys(colors).join() !== fieldNames.join())
        throw new Error(`${name}/${mode}: field order differs`);
      tokenRows.push(`    // ${name}/${mode}\n    ${Object.values(tokens).map(str).join(', ')},`);
      colorRows.push(`    // ${name}/${mode}\n    ${Object.values(colors).map(str).join(', ')},`);
    }
  }
  return `${HEADER('src/theme (token-registry.ts getResolvedTokens, build-theme.ts buildTheme)')}
/// Every preset's resolved palette as constants, in \`AppColorName.allCases\` order, light then dark:
/// a preset's theme and token record (\`getPrepaintPalette\`) without a solve on the device.
public enum BloomThemeTokens {
  /// The token names of every preset's record, in \`getResolvedTokens\` order.
  static let tokenNames: [String] = [${(tokenNames ?? []).map(str).join(', ')}]

  /// \`tokenNames.count\` values per preset and mode.
  static let tokenValues: [String] = [
${tokenRows.join('\n')}
  ]

  /// \`ThemeColorField.allCases.count\` values per preset and mode.
  static let colorValues: [String] = [
${colorRows.join('\n')}
  ]
}
`;
}

// ---------------------------------------------------------------------------------------------

const outputs: Record<string, string> = {
  'BloomThemeTokens.generated.swift': renderPresetPalettes(),
  'Presets.generated.swift': renderPresets(),
  'Tokens.generated.swift': renderTokens(),
  'Constants.generated.swift': renderConstants(),
  'EngineTables.generated.swift': renderEngineTables(),
};

let stale = 0;
for (const [file, text] of Object.entries(outputs)) {
  const path = join(outDir, file);
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current !== text) {
      console.error(`[generate-swift-theme] stale: ${relative(repoRoot, path)}`);
      stale += 1;
    }
  } else {
    writeFileSync(path, text);
  }
}
if (check) {
  if (stale > 0) {
    console.error('[generate-swift-theme] run: bun run generate:swift-theme');
    process.exit(1);
  }
  console.log('[generate-swift-theme] Swift theme data is current');
} else {
  console.log(
    `[generate-swift-theme] wrote ${Object.keys(outputs).length} files to ${relative(repoRoot, outDir)}`,
  );
}
