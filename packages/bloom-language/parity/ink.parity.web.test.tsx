/**
 * A colour at an opacity, drawn through react-native-web as an app draws it.
 * react-native-web takes a colour it can parse or a `var()` and drops anything
 * else (its `normalizeColor`), so a `color-mix()` written inline draws nothing:
 * here the fill must reach the element, the role's own colour at the alpha,
 * under a live variant too, and in the generated sheet's precedence.
 */
import type { Node } from '../src/node';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type DomTree, webTree } from './support/web';

type Scheme = 'light' | 'dark';
const css = (view: Node, scheme: Scheme) =>
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
