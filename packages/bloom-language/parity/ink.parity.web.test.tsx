/**
 * A colour at an opacity, drawn through react-native-web as an app draws it.
 * react-native-web takes a colour it can parse or a `var()` and drops anything
 * else (its `normalizeColor`), so a `color-mix()` written inline draws nothing:
 * here the fill must reach the element, the role's own colour at the alpha,
 * under a live variant too, and as a prop a Bloom component draws as a style
 * under Bloom's prepaint (its colours `var(--bloom-paint-…)`).
 */
import type { ViewNode } from '../src/node';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { LISTING_CARD_CASES } from './listing-card.cases';
import { RATING_CASES } from './rating.cases';
import { SLIDER_CASES } from './slider.cases';
import { STAT_BAR_CASES } from './stat-bar.cases';
import { type DomTree, webTree } from './support/web';

type Scheme = 'light' | 'dark';
const css = (view: ViewNode, scheme: Scheme) =>
  (webTree(toElement(view), scheme) as DomTree[])[0]?.css ?? {};

/** A role's colour in `scheme`, at `alpha`. */
function at(role: 'mutedFill' | 'primary' | 'border', alpha: number, scheme: Scheme): string {
  const opaque = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(
    css(L.VStack().background(role), scheme)['background-color'] ?? '',
  );
  expect(opaque).not.toBeNull();
  const [, r, g, b] = opaque as RegExpExecArray;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it("VStack().background('mutedFill/half') is the role at half its alpha", () => {
    expect(css(L.VStack().background('mutedFill/half'), scheme)['background-color']).toBe(
      at('mutedFill', 0.5, scheme),
    );
  });

  it('a dark variant of a colour at an opacity overrides it in the dark only', () => {
    const view = L.VStack()
      .background('primary/10')
      .when('dark', (v) => v.background('primary/40'));
    expect(css(view, scheme)['background-color']).toBe(
      at('primary', scheme === 'dark' ? 0.4 : 0.1, scheme),
    );
  });

  it('a breakpoint variant of a colour at an opacity is its class under the media query', () => {
    // jsdom's window is 0 wide (react-native-web's Dimensions): no breakpoint holds.
    const view = L.VStack()
      .background('primary/10')
      .when('md', (v) => v.background('primary/20'));
    expect(css(view, scheme)['background-color']).toBe(at('primary', 0.1, scheme));
    expect(document.getElementById('bloom-language-md')?.textContent).toMatch(
      /^@media \(min-width: 768px\)\{\.bl\w+-primary-20-md\{background-color:var\(--bl-primary-20\);\}\}$/,
    );
  });
});

/** Every colour property the tree's elements draw, by element. */
function colours(tree: unknown): string[] {
  const out: string[] = [];
  const walk = (node: DomTree | string, path: string) => {
    if (typeof node === 'string') return;
    for (const [name, value] of Object.entries(node.css))
      if (/color/.test(name)) out.push(`${path} ${name}: ${value}`);
    node.children.forEach((child, index) => walk(child, `${path}/${index}`));
  };
  (tree as DomTree[]).forEach((node, index) => walk(node, String(index)));
  return out;
}

// A prop painted from a role at an opacity that the component draws as a react-native-web
// style: under the prepaint its colour is a variable, which only the browser can mix.
const PROPS = [
  ...LISTING_CARD_CASES.filter((c) => c.name === 'WishlistCard empty, its colour and glyph'),
  ...RATING_CASES.filter((c) => c.name === 'Rating with its star, count and empty star tinted'),
  ...SLIDER_CASES.filter(
    (c) => c.name === 'a slider of its own geometry and colours, committed, formatted, no bubble',
  ),
  ...STAT_BAR_CASES.filter((c) => c.name === 'MeterRing with content, tinted, over a backdrop'),
];

describe.each(['light', 'dark'] as const)('%s, under Bloom’s prepaint', (scheme) => {
  it('finds every case', () => expect(PROPS).toHaveLength(4));
  it.each(PROPS.map((c) => [c.name, c] as const))('%s draws its colours', (_name, c) => {
    expect(colours(webTree(c.language(), scheme, true))).toEqual(
      colours(webTree(c.language(), scheme)),
    );
  });
});
