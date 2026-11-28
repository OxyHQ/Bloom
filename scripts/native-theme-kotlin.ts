/**
 * Bloom's theme and the language's token scales as Kotlin, for the native Android runtime
 * (ADR 0003, docs/native-runtime-api.mdx "Theme"). Rendered from the SAME sources as
 * `tokens.json`: every preset's resolved palette comes from the colour engine
 * (`getResolvedTokens`), the scales, the type ramp and the colour roles from the language's
 * spec. No colour is typed by hand; `scripts/generate-design-tokens-json.ts` writes the file and
 * `src/__tests__/design-tokens-kotlin.test.ts` holds it byte-identical to this render.
 */

import spec from '../packages/bloom-language/spec/language.json';
import { APP_COLOR_NAMES } from '../src/theme/color-presets';
import { getResolvedTokens } from '../src/theme/token-registry';
import { resolvedColorToHex } from '../src/design-tokens/tokens-json';
import { NATIVE_SURFACE_EDGE } from '../src/surface/native-edge';

/** Where the generated file lives, relative to the repository root. */
export const KOTLIN_THEME_PATH =
  'packages/bloom-language-compiler/crates/native/runtime/android/so/oxy/bloom/ui/BloomTheme.generated.kt';

/** `--muted-foreground` → `mutedForeground`, `--chart-1` → `chart1`. */
function fieldName(property: string): string {
  return property
    .replace(/^--/, '')
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/**
 * A token's Kotlin name: `2xl` is `_2xl`, `caption-1` is `caption1`, `large-title` is
 * `largeTitle`, `12.5` is `_12_5` (the native backend's `token_name` names them the same).
 */
function tokenName(name: string): string {
  const flat = name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/\./g, '_');
  return /^[0-9]/.test(flat) ? `_${flat}` : flat;
}

/** `#rrggbb` or `#rrggbbaa` → `0xAARRGGBB` (a Compose `Color(Long)`'s argument). */
function argb(hex: string): string {
  const rgb = hex.slice(1, 7).toUpperCase();
  const alpha = (hex.length === 9 ? hex.slice(7, 9) : 'ff').toUpperCase();
  return `0x${alpha}${rgb}`;
}

function sortedTokens(record: Record<string, string>): [string, string][] {
  return Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

type Scale = Record<string, number>;

function dpObject(name: string, doc: string, scale: Scale): string {
  const lines = Object.entries(scale).map(([k, v]) => `  val ${tokenName(k)}: Dp = ${v}.dp`);
  return `/** ${doc} */\nobject ${name} {\n${lines.join('\n')}\n}\n`;
}

function dpEnum(name: string, doc: string, scale: Scale): string {
  const cases = Object.entries(scale).map(([k, v]) => `${tokenName(k)}(${v}.dp)`);
  return `/** ${doc} */\nenum class ${name}(val dp: Dp) { ${cases.join(', ')} }\n`;
}

/** A number as a Kotlin `Double` literal (`0` is `0.0`). */
function double(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

function fontObject(): string {
  const ramp = spec.typeRamp as Record<string, unknown>;
  const families = new Map<string, [number, number, number]>();
  const lines: string[] = [];
  for (const [key, value] of Object.entries(ramp)) {
    if (key.startsWith('$')) continue;
    const [size, line, tracking, weight] = value as [number, number, number, string];
    const family = key.replace(/-(regular|medium|semibold|bold)$/, '');
    lines.push(`  val ${tokenName(key)} = ramp(${size}, ${line}, ${double(tracking)}, ${weight})`);
    if (!families.has(family)) families.set(family, [size, line, tracking]);
  }
  // A family's own token (`.headline`) is its regular weight; `.weight()` sets another.
  for (const [family, [size, line, tracking]] of families) {
    lines.push(`  val ${tokenName(family)} = ramp(${size}, ${line}, ${double(tracking)}, 400)`);
  }
  // A size rung (`.md`) sets the size alone: the text keeps the rest of its style (Bloom's
  // `Text` keeps its body step's line height under a `fontSize`).
  const sizes = (spec.scales as unknown as Record<string, Scale>).fontSize ?? {};
  for (const [key, size] of Object.entries(sizes)) {
    if (key.startsWith('$')) continue;
    lines.push(`  val ${tokenName(key)} = TextStyle(fontSize = ${size}.sp)`);
  }
  return [
    "/** The type ramp, the spec's `typeRamp`: each family at each weight, and the family's regular; then the size rungs (`spec.scales.fontSize`). */",
    'object Font {',
    '  private fun ramp(size: Int, line: Int, tracking: Double, weight: Int) =',
    '    TextStyle(fontSize = size.sp, lineHeight = line.sp, letterSpacing = (tracking / size).em, fontWeight = FontWeight(weight))',
    '',
    ...lines,
    '}',
    '',
  ].join('\n');
}

/** `.weight()`, `.leading()` and a border's width, from the spec's scales. */
function textAndLineScales(scales: Record<string, Record<string, unknown>>): string {
  const entries = (scale: Record<string, unknown> | undefined) =>
    Object.entries(scale ?? {}).filter(([k]) => !k.startsWith('$'));
  const weights = entries(scales.weight).map(
    ([k, v]) => `  val ${tokenName(k)} = FontWeight(${v})`,
  );
  const leading = [
    ...entries(scales.leading).map(([k, v]) => `  val ${tokenName(k)}: TextUnit = ${v}.em`),
    ...entries(scales.leadingPx).map(([k, v]) => `  val ${tokenName(k)}: TextUnit = ${v}.sp`),
  ];
  const widths = entries(scales.borderWidth).map(([k, v]) =>
    v === 'hairline'
      ? `  val ${tokenName(k)}: Dp = Dp.Hairline`
      : `  val ${tokenName(k)}: Dp = ${v}.dp`,
  );
  return [
    "/** A text's weight (`spec.scales.weight`). */",
    'object Weight {',
    ...weights,
    '}',
    '',
    "/** A text's line height (`spec.scales.leading`, a multiple of its size, and `leadingPx`). */",
    'object Leading {',
    ...leading,
    '}',
    '',
    "/** A border's width (`spec.scales.borderWidth`): `hairline` is the screen's thinnest line. */",
    'object BorderWidth {',
    ...widths,
    '}',
    '',
  ].join('\n');
}

/** The language's colour roles (`.muted`, `.onPrimary`), read from the theme in scope. */
function colorRoles(fields: Set<string>): string {
  const roles = spec.colors as Record<string, unknown>;
  const lines: string[] = [];
  for (const [role, value] of Object.entries(roles)) {
    if (role.startsWith('$')) continue;
    const [, css] = value as [string, string | null];
    if (css === null) continue;
    const name = tokenName(role);
    if (css.startsWith('#')) {
      lines.push(`  val ${name}: Color get() = Color(${argb(css)})`);
    } else if (css === 'transparent') {
      lines.push(`  val ${name}: Color get() = Color(0x00000000)`);
    } else {
      const field = fieldName(css);
      if (!fields.has(field)) {
        throw new Error(
          `the spec's colour role ${role} names --${css}, which no Bloom palette has`,
        );
      }
      lines.push(
        `  val ${name}: Color @Composable @ReadOnlyComposable get() = BloomTheme.palette.${field}`,
      );
    }
  }
  return [
    "/** The language's colour roles (`spec.colors`), each its palette token in the theme in scope. */",
    'object Colors {',
    ...lines,
    '}',
    '',
  ].join('\n');
}

/**
 * A control's tone (`.tint(.danger)`): its colour role, from the spec's `toneRole` (`null`, a
 * neutral tone, is the foreground). A colour role written as a tint (`.tint(.primary)`) is a
 * tone of that role.
 */
function toneEnum(): string {
  const tones = spec.toneRole as Record<string, string | null>;
  const cases: [string, string][] = [];
  for (const [tone, role] of Object.entries(tones)) {
    if (tone.startsWith('$')) continue;
    cases.push([tone, role ?? 'foreground']);
  }
  for (const role of ['primary', 'secondary', 'tertiary', 'error']) {
    if (!cases.some(([t]) => t === role)) cases.push([role, role]);
  }
  return [
    "/** A control's tone (`.tint`): its colour role, the spec's `toneRole`. */",
    'enum class Tone {',
    `  ${cases.map(([t]) => tokenName(t)).join(', ')};`,
    '',
    '  val color: Color',
    '    @Composable @ReadOnlyComposable get() = when (this) {',
    ...cases.map(([t, r]) => `      ${tokenName(t)} -> Colors.${tokenName(r)}`),
    '    }',
    '}',
    '',
  ].join('\n');
}

function float(n: number): string {
  return `${Number.isInteger(n) ? `${n}.0` : `${n}`}f`;
}

/**
 * Bloom's material, from its two sources: the native edge Surface draws (`NATIVE_SURFACE_EDGE`,
 * src/surface/shared.ts) and the spec's glass materials (`spec.glass`) and tint opacities
 * (`spec.scales.glassOpacity`). The runtime's `BloomMaterial` draws through them.
 */
function materialSpec(): string {
  const edge = (e: { rimLine: number; sheen: { reach: number; blur: number; gain: number } }) =>
    `MaterialEdge(rimLine = ${float(e.rimLine)}, sheenReach = ${float(e.sheen.reach)}, sheenBlur = ${float(e.sheen.blur)}, sheenGain = ${float(e.sheen.gain)})`;
  type Glass = {
    sheen: boolean;
    fill: string | null;
    tintOpacity: string | null;
    lensBlur: number;
    lensMenuBlur?: number;
  };
  const glass = Object.entries(spec.glass as unknown as Record<string, Glass>).filter(
    ([k]) => !k.startsWith('$'),
  );
  const opacity = spec.scales.glassOpacity as unknown as Record<string, number>;
  const opacities = Object.entries(opacity).filter(([k]) => !k.startsWith('$'));
  return [
    "/** The native edge: the rim's 1px lines and the sheen's two inset shadows (Surface's `NATIVE_SURFACE_EDGE`), in dp. */",
    '@Immutable',
    'class MaterialEdge(val rimLine: Float, val sheenReach: Float, val sheenBlur: Float, val sheenGain: Float)',
    '',
    '/** The edge of each scheme. */',
    'object MaterialEdges {',
    `  val light = ${edge(NATIVE_SURFACE_EDGE.light)}`,
    `  val dark = ${edge(NATIVE_SURFACE_EDGE.dark)}`,
    '}',
    '',
    "/** A glass tint's opacity (`spec.scales.glassOpacity`). */",
    `enum class GlassOpacity(val value: Float) { ${opacities.map(([k, v]) => `${tokenName(k)}(${float(v)})`).join(', ')} }`,
    '',
    '/**',
    " * The glass materials (`spec.glass`): whether the edge's sheen is drawn, whether the body paints the",
    " * surface fill when untinted, the opacity a tint takes by default, and the lens engine's frost at",
    ' * rest and as a menu, in dp.',
    ' */',
    'enum class GlassMaterial(val sheen: Boolean, val fillsSurface: Boolean, val tintOpacity: GlassOpacity?, val lensBlur: Float, val lensMenuBlur: Float?) {',
    ...glass.map(
      ([name, g], i) =>
        `  ${tokenName(name)}(${g.sheen}, ${g.fill === 'surface'}, ${g.tintOpacity ? `GlassOpacity.${tokenName(g.tintOpacity)}` : 'null'}, ${float(g.lensBlur)}, ${g.lensMenuBlur === undefined ? 'null' : float(g.lensMenuBlur)})${i === glass.length - 1 ? ';' : ','}`,
    ),
    '}',
    '',
  ].join('\n');
}

export function renderBloomThemeKotlin(): string {
  const [firstPreset] = APP_COLOR_NAMES;
  if (firstPreset === undefined) throw new Error('Bloom ships no colour preset');
  const first = getResolvedTokens(firstPreset, 'light');
  const properties = sortedTokens(first).map(([p]) => p);
  const fields = properties.map(fieldName);
  const palette = [
    "/** A preset's resolved palette in one scheme: every colour token of Bloom's theme, by name. */",
    '@Immutable',
    'class BloomPalette(private val argb: LongArray) {',
    ...fields.map((f, i) => `  val ${f}: Color get() = Color(argb[${i}])`),
    '',
    '  /**',
    "   * This palette with some colours replaced, by field name (`background`): a theme resolved",
    "   * elsewhere, such as React Native's for an island (`useColorTokens()`'s names). An unknown name",
    '   * is ignored.',
    '   */',
    '  fun with(colors: Map<String, Long>): BloomPalette {',
    '    val next = argb.copyOf()',
    '    for ((name, value) in colors) {',
    '      val index = FIELDS.indexOf(name)',
    '      if (index >= 0) next[index] = value',
    '    }',
    '    return BloomPalette(next)',
    '  }',
    '',
    '  companion object {',
    '    /** The fields, in the order of the palette\'s values. */',
    `    val FIELDS: List<String> = listOf(${fields.map((f) => `"${f}"`).join(', ')})`,
    '  }',
    '}',
    '',
  ].join('\n');
  // One function per preset: a single `when` of every palette passes the JVM's 64 KB method limit.
  const functions: string[] = [];
  const dispatch: string[] = [];
  for (const [index, name] of APP_COLOR_NAMES.entries()) {
    const arrays = (['light', 'dark'] as const).map((scheme) => {
      const tokens = getResolvedTokens(name, scheme);
      const values = properties.map((p) => {
        const value = tokens[p];
        if (value === undefined) throw new Error(`${name}/${scheme} has no ${p}`);
        return argb(resolvedColorToHex(value));
      });
      return `longArrayOf(${values.join(', ')})`;
    });
    functions.push(
      `  /** \`${name}\`. */\n  private fun preset${index}(dark: Boolean): LongArray =\n    if (dark) ${arrays[1]}\n    else ${arrays[0]}`,
    );
    dispatch.push(`      "${name}" -> preset${index}(dark)`);
  }
  const lookup = [
    '/** Every preset Bloom ships, light and dark, as the colour engine resolves them. */',
    'object BloomPresets {',
    `  val names: List<String> = listOf(${APP_COLOR_NAMES.map((n) => `"${n}"`).join(', ')})`,
    '',
    '  /** The palette of `preset` (an `AppColorName`) in a scheme; none for an unknown preset. */',
    '  fun palette(preset: String, dark: Boolean): BloomPalette? {',
    '    val values = when (preset) {',
    ...dispatch,
    '      else -> return null',
    '    }',
    '    return BloomPalette(values)',
    '  }',
    '',
    functions.join('\n\n'),
    '}',
    '',
  ].join('\n');
  const scales = spec.scales as unknown as Record<string, Scale>;
  return [
    "// Generated by scripts/generate-design-tokens-json.ts from Bloom's colour engine and the",
    '// language spec (scripts/native-theme-kotlin.ts). Do not edit.',
    '@file:Suppress("ObjectPropertyName", "EnumEntryName", "unused")',
    '',
    'package so.oxy.bloom.ui',
    '',
    'import androidx.compose.runtime.Composable',
    'import androidx.compose.runtime.Immutable',
    'import androidx.compose.runtime.ReadOnlyComposable',
    'import androidx.compose.ui.graphics.Color',
    'import androidx.compose.ui.text.TextStyle',
    'import androidx.compose.ui.text.font.FontWeight',
    'import androidx.compose.ui.unit.Dp',
    'import androidx.compose.ui.unit.TextUnit',
    'import androidx.compose.ui.unit.dp',
    'import androidx.compose.ui.unit.em',
    'import androidx.compose.ui.unit.sp',
    '',
    dpObject('Space', "The language's space scale (`spec.scales.space`).", scales.space ?? {}),
    dpObject('Corner', "The language's corner scale (`spec.scales.corner`).", scales.corner ?? {}),
    dpEnum('IconSize', "An icon's size (`spec.scales.iconSize`).", scales.iconSize ?? {}),
    dpEnum('AvatarSize', "An avatar's size (`spec.scales.avatarSize`).", scales.avatarSize ?? {}),
    fontObject(),
    textAndLineScales(spec.scales as unknown as Record<string, Record<string, unknown>>),
    colorRoles(new Set(fields)),
    toneEnum(),
    materialSpec(),
    palette,
    lookup,
  ].join('\n');
}
