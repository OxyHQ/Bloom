/**
 * Resolve Bloom class strings to the exact native style react-native-css gives
 * them (Android), plus the web CSS Tailwind emits, against the BASELINE tree.
 *
 * Input:  CLASSES_IN  = JSON array of class strings.
 * Output: CLASSES_OUT = JSON { [classString]: { view, text, roles, web, unresolved } }.
 * Colours: every theme var is a sentinel, so a colour comes back as the theme ROLE
 * (ThemeColors key) it paints, e.g. "$primary" / "$mutedForeground".
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import TestRenderer, { act } from 'react-test-renderer';

const BASE = process.env.BLOOM_BASELINE as string;
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Platform.OS = 'android';
  return { ...rn, PlatformColor: (...names: string[]) => ({ semantic: names }) };
});

const { buildScopeVars } = require(join(BASE, 'src/theme/color-scope/style-builder'));

function camel(v: string) {
  return v.replace(/^--/, '').replace(/-([a-z0-9])/g, (_: string, c: string) => c.toUpperCase());
}

it('resolves', () => {
  const strings: string[] = JSON.parse(readFileSync(process.env.CLASSES_IN!, 'utf8'));
  const tokens = [...new Set(strings.flatMap((s) => s.split(/\s+/).filter(Boolean)))];
  const tmp = mkdtempSync(join(tmpdir(), 'rcls-'));
  const cssFile = join(tmp, 'out.css');
  execFileSync(process.execPath, [join(__dirname, 'tailwind-classes.cjs'), BASE, cssFile], {
    cwd: BASE,
    input: JSON.stringify(tokens),
  });
  const tw = readFileSync(cssFile, 'utf8');
  const vars: Record<string, string> = buildScopeVars('oxy', 'light');
  const sentinel = new Map<string, string>();
  let i = 1;
  const decl = Object.keys(vars)
    .filter((k) => !k.startsWith('--color-'))
    .map((k) => {
      const hex = `#fe${(i++).toString(16).padStart(4, '0')}`;
      sentinel.set(hex, camel(k));
      return `${k}: ${hex};`;
    })
    .join(' ');
  const css = `${tw}\n:root { ${decl} --bloom-font-sans: Inter; }`;
  const { compile } = require(join(BASE, 'node_modules/react-native-css/dist/commonjs/compiler'));
  const { StyleCollection } = require(
    join(BASE, 'node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
  );
  StyleCollection.inject(compile(css, {}).stylesheet());
  const { View } = require(
    join(BASE, 'node_modules/react-native-css/dist/commonjs/components/View'),
  );
  const { Text } = require(
    join(BASE, 'node_modules/react-native-css/dist/commonjs/components/Text'),
  );
  const flat = (s: unknown): Record<string, unknown> =>
    Array.isArray(s) ? Object.assign({}, ...s.map(flat)) : ((s as object) ?? {});
  const alphaOf = (v: string): [string, number] | undefined => {
    const hex = /^#(fe[0-9a-f]{4})([0-9a-f]{2})$/i.exec(v);
    if (hex && sentinel.has(`#${hex[1]!.toLowerCase()}`))
      return [
        sentinel.get(`#${hex[1]!.toLowerCase()}`)!,
        Math.round((parseInt(hex[2]!, 16) / 255) * 100) / 100,
      ];
    const rgba = /^rgba\(254, 0, (\d+), ([\d.]+)\)$/.exec(v);
    if (rgba) {
      const key = `#fe00${Number(rgba[1]).toString(16).padStart(2, '0')}`;
      if (sentinel.has(key)) return [sentinel.get(key)!, Number(rgba[2])];
    }
    return undefined;
  };
  const decode = (style: Record<string, unknown>, roles: Record<string, string>) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(style)) {
      const alpha = typeof v === 'string' ? alphaOf(v) : undefined;
      if (alpha) {
        out[k] = `tokenAlpha($${alpha[0]}, ${alpha[1]})`;
        roles[k] = alpha[0];
      } else if (typeof v === 'string' && sentinel.has(v.toLowerCase())) {
        out[k] = `$${sentinel.get(v.toLowerCase())}`;
        roles[k] = sentinel.get(v.toLowerCase())!;
      } else out[k] = v;
    }
    return out;
  };
  // Web: the CSS rules for each token, as Tailwind emits them.
  const webRules = (token: string) => {
    const esc = token.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
    const found: string[] = [];
    const re = new RegExp(`[^{}]*\\.${esc.replace(/\\/g, '\\\\')}[^{]*\\{[^}]*\\}`, 'g');
    for (const m of tw.match(re) ?? []) found.push(m.trim().replace(/\s+/g, ' '));
    return found;
  };
  const result: Record<string, unknown> = {};
  for (const s of strings) {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(
        <>
          <View className={s} testID="v" />
          <Text className={s} testID="t">
            x
          </Text>
        </>,
      );
    });
    const [v, t] = r.toJSON() as unknown as { props: { style: unknown } }[];
    const roles: Record<string, string> = {};
    const view = decode(flat(v!.props.style), roles);
    const text = decode(flat(t!.props.style), roles);
    const unresolved = s
      .split(/\s+/)
      .filter(Boolean)
      .filter((tok) => !tw.includes(`.${tok.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)}`));
    const web: Record<string, string[]> = {};
    for (const tok of s.split(/\s+/).filter(Boolean)) web[tok] = webRules(tok);
    result[s] = { view, text, unresolved, web };
    act(() => r.unmount());
  }
  writeFileSync(process.env.CLASSES_OUT!, JSON.stringify(result, null, 1));
});
