/**
 * A colour at an opacity, drawn through react-native-web as an app draws it.
 * react-native-web takes a colour it can parse or a `var()` and drops anything
 * else (its `normalizeColor`), so a `color-mix()` written inline draws nothing:
 * here the fill must reach the element, the role's own colour at the alpha.
 */
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type DomTree, webTree } from './support/web';

const fill = (
  token: Parameters<ReturnType<typeof L.VStack>['background']>[0],
  scheme: 'light' | 'dark',
) =>
  (webTree(toElement(L.VStack().background(token)), scheme) as DomTree[])[0]?.css[
    'background-color'
  ];

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it("VStack().background('mutedFill/half') is the role at half its alpha", () => {
    const opaque = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(fill('mutedFill', scheme) ?? '');
    expect(opaque).not.toBeNull();
    const [, r, g, b] = opaque as RegExpExecArray;
    expect(fill('mutedFill/half', scheme)).toBe(`rgba(${r}, ${g}, ${b}, 0.5)`);
  });
});
