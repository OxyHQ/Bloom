/**
 * The app's Tailwind stylesheet in a form jsdom reads, and the CSS values of
 * both sides in one spelling.
 *
 * jsdom's CSS parser predates cascade layers and nesting: the sheet is lowered
 * by lightningcss (nesting unwrapped), its layers are unwrapped in their order
 * (theme, base, utilities, then the app's unlayered rules, which only set root
 * variables and the document's own box), and each rule is inserted on its own,
 * so a rule jsdom cannot parse (a vendor pseudo-element) is left out alone.
 * jsdom keeps `border-radius` unexpanded, so it is written as its four
 * corners, and a breakpoint's `width >= 48rem` is written as the
 * `min-width: 768px` the harness reads.
 *
 * Values: the browser would compute a Tailwind `calc(4px * 4)` and a React
 * Native Web `16px` to the same length, but the harness compares declared
 * text. Lengths are folded to px (rem at the document's 16px, rounded to
 * the browser's 1/64 px layout unit), simple calc()
 * evaluated, and a unitless line-height multiplied by the element's own font
 * size, as the browser computes it for that element. jsdom does not know the
 * logical shorthands (`padding-block`, `padding-inline`, margins alike), so
 * they are folded onto their sides (the page is left to right, as the
 * language harness folds them), and a border side with no width is no side.
 * `overflow` is its two axes, a percentage is compared to 4 decimals (NativeWind's
 * `33.3333%` third), a unitless 0 length is 0px,
 * `font-weight: normal` is 400; an em letter-spacing is px of the element's
 * size; a colour mixed with transparent is that colour at the mix's alpha;
 * and `letter-spacing` 0 or `font-weight` 400 written where no ancestor
 * declares either is the initial value it would inherit.
 */
import { transform } from 'lightningcss';
import postcss from 'postcss';

export function jsdomRules(css: string): string[] {
  const lowered = transform({
    filename: 'app.css',
    code: Buffer.from(css),
    targets: { chrome: 90 << 16 },
  }).code.toString();
  const root = postcss.parse(lowered);
  root.walkAtRules('layer', (rule) => {
    if (rule.nodes) rule.replaceWith(rule.nodes);
    else rule.remove();
  });
  root.walkAtRules('property', (rule) => {
    rule.remove();
  });
  // `--x: initial` is the guaranteed-invalid value: a var() of it takes its fallback, as with no declaration.
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--') && decl.value.trim() === 'initial') decl.remove();
  });
  // jsdom keeps `border-radius` as a shorthand it never expands, so it is written as its corners.
  root.walkDecls('border-radius', (decl) => {
    if (decl.value.includes('/')) return;
    const values = decl.value.trim().split(/\s+(?![^(]*\))/);
    const [a, b = a, c = a, d = b] = values;
    const corners = { 'top-left': a, 'top-right': b, 'bottom-right': c, 'bottom-left': d };
    for (const [corner, value] of Object.entries(corners))
      decl.cloneBefore({ prop: `border-${corner}-radius`, value: value as string });
    decl.remove();
  });
  // The harness reads a breakpoint as `min-width: <n>px`; Tailwind writes `width >= <n>rem`.
  root.walkAtRules('media', (rule) => {
    rule.params = rule.params
      .replace(/\(\s*width\s*>=\s*([\d.]+)rem\s*\)/g, (_, n) => `(min-width: ${Number(n) * 16}px)`)
      .replace(/\(\s*min-width:\s*([\d.]+)rem\s*\)/g, (_, n) => `(min-width: ${Number(n) * 16}px)`);
  });
  // jsdom rejects a whole rule for one selector it cannot parse (`:host`, `::backdrop`…).
  root.walkRules((rule) => {
    const kept = rule.selectors.filter((s) => !/:host|::[\w-]+/.test(s));
    if (kept.length === 0) rule.remove();
    else rule.selectors = kept;
  });
  return (root.nodes ?? []).map((node) => node.toString());
}

export function insertRules(rules: readonly string[]): number {
  const style = document.createElement('style');
  document.head.appendChild(style);
  const sheet = style.sheet as CSSStyleSheet;
  let dropped = 0;
  for (const rule of rules) {
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
    } catch {
      dropped++;
    }
  }
  return dropped;
}

const NUMBER = String.raw`-?\d*\.?\d+(?:e-?\d+)?`;

function px(value: string): string {
  let out = value.replace(new RegExp(`(${NUMBER})rem\\b`, 'g'), (_, n) => `${Number(n) * 16}px`);
  for (let guard = 0; guard < 8; guard++) {
    const next = out.replace(/calc\(([^()]*)\)/g, (all, body: string) => {
      const terms = body.trim().split(/\s+/);
      let unit = '';
      const numbers: (number | string)[] = terms.map((term) => {
        const m = new RegExp(`^(${NUMBER})(px)?$`).exec(term);
        if (!m) return term;
        if (m[2]) unit = 'px';
        return Number(m[1]);
      });
      if (numbers.some((t) => typeof t === 'string' && !['+', '-', '*', '/'].includes(t)))
        return all;
      let result = numbers[0] as number;
      for (let i = 1; i < numbers.length; i += 2) {
        const op = numbers[i] as string;
        const right = numbers[i + 1] as number;
        result =
          op === '*'
            ? result * right
            : op === '/'
              ? result / right
              : op === '+'
                ? result + right
                : result - right;
      }
      return `${result}${unit}`;
    });
    if (next === out) break;
    out = next;
  }
  // A browser lays out in 1/64 px (Chrome's LayoutUnit): lengths are compared at that unit.
  out = out.replace(
    new RegExp(`(${NUMBER})px`, 'g'),
    (_, n) => `${Math.round(Number(n) * 64) / 64}px`,
  );
  // A colour mixed with transparent is that colour at the mix's alpha, in any space.
  return out.replace(
    /color-mix\(in \w+, rgb\((\d+), (\d+), (\d+)\) ([\d.]+)%, transparent\)/g,
    (_, r, g, b, p) => `rgba(${r}, ${g}, ${b}, ${Number(p) / 100})`,
  );
}

interface Dom {
  tag: string;
  attributes: Record<string, string>;
  css: Record<string, string>;
  children: (Dom | string)[];
}

const LOGICAL: Record<string, string[]> = {
  'padding-block': ['padding-top', 'padding-bottom'],
  'padding-inline': ['padding-left', 'padding-right'],
  'margin-block': ['margin-top', 'margin-bottom'],
  'margin-inline': ['margin-left', 'margin-right'],
};

/** The inherited text properties an ancestor declares; one no ancestor declares is its initial value. */
interface Inherited {
  letterSpacing: boolean;
  fontWeight: boolean;
}

function fold(node: Dom | string, inherited: Inherited): Dom | string {
  if (typeof node === 'string') return node;
  const css: Record<string, string> = {};
  for (const [name, value] of Object.entries(node.css)) css[name] = px(value);
  if (css.overflow !== undefined) {
    const [x, y] = css.overflow.split(/\s+/);
    css['overflow-x'] = x as string;
    css['overflow-y'] = (y ?? x) as string;
    delete css.overflow;
  }
  for (const [name, value] of Object.entries(css)) {
    const percent = /^(-?[\d.]+)%$/.exec(value);
    if (percent) css[name] = `${Number(Number(percent[1]).toFixed(4))}%`;
  }
  for (const [name, value] of Object.entries(css))
    if (
      value === '0' &&
      /(width|height|margin|padding|radius|top|left|right|bottom|gap)/.test(name)
    )
      css[name] = '0px';
  for (const [shorthand, sides] of Object.entries(LOGICAL)) {
    const value = css[shorthand];
    if (value === undefined) continue;
    const parts = value.split(/\s+/);
    sides.forEach((side, i) => {
      css[side] = (parts[i] ?? parts[0]) as string;
    });
    delete css[shorthand];
  }
  for (const side of ['top', 'right', 'bottom', 'left']) {
    const width = css[`border-${side}-width`];
    if (width === undefined || width === '0px' || width === '0') {
      delete css[`border-${side}-width`];
      delete css[`border-${side}-color`];
      delete css[`border-${side}-style`];
    }
  }
  const lineHeight = css['line-height'];
  const size = /^([\d.]+)px$/.exec(css['font-size'] ?? '');
  if (lineHeight && size && new RegExp(`^${NUMBER}$`).test(lineHeight))
    css['line-height'] = `${Math.round(Number(lineHeight) * Number(size[1]) * 64) / 64}px`;
  const em = new RegExp(`^(${NUMBER})em$`).exec(css['letter-spacing'] ?? '');
  if (em && size)
    css['letter-spacing'] = `${Math.round(Number(em[1]) * Number(size[1]) * 64) / 64}px`;
  if (css['font-weight'] === 'normal') css['font-weight'] = '400';
  const own = {
    letterSpacing: css['letter-spacing'] !== undefined,
    fontWeight: css['font-weight'] !== undefined,
  };
  // The initial value written out is the initial value.
  if (
    !inherited.letterSpacing &&
    (css['letter-spacing'] === '0px' || css['letter-spacing'] === 'normal')
  )
    delete css['letter-spacing'];
  if (!inherited.fontWeight && css['font-weight'] === '400') delete css['font-weight'];
  const next = {
    letterSpacing: inherited.letterSpacing || own.letterSpacing,
    fontWeight: inherited.fontWeight || own.fontWeight,
  };
  return { ...node, css, children: node.children.map((child) => fold(child, next)) };
}

export function normalizeWeb(tree: unknown): unknown {
  return (tree as (Dom | string)[]).map((node) =>
    fold(node, { letterSpacing: false, fontWeight: false }),
  );
}
