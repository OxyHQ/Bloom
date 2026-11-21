import { createElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { Avatar, Button, HStack, Icon, Text, VStack } from '../primitives';
import { COLORS, VARIANT_SELECTORS } from '../generated/spec.generated';
import { toElement } from '../render';
import type { Child } from '../node';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import { adoptVariantClasses, variantSheet } from '../web-sheet';
import { adoptStyleSheet } from '@oxy.so/bloom/styles';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));

jest.mock('@oxy.so/bloom/styles', () => ({
  ...jest.requireActual('@oxy.so/bloom/styles'),
  adoptStyleSheet: jest.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

/** The text the variant sheet of `condition` was last adopted with. */
function adoptedText(condition: string): string | undefined {
  const calls = (adoptStyleSheet as jest.Mock).mock.calls.filter(
    ([id]) => id === `bloom-language-${condition}`,
  );
  return calls[calls.length - 1]?.[1];
}

function mount(node: Child): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: LIGHT }, toElement(node)),
    );
  });
  return renderer;
}

describe('on the web, a variant is the same class under its condition’s CSS', () => {
  it('a breakpoint variant is a second class, keyed apart from the base so both stay', () => {
    const stack = mount(
      VStack(Text('a'))
        .padding('sm')
        .when('md', (v) => v.padding('lg')),
    ).root.findByType('View' as never);
    expect(stack.props.style).toMatchObject({
      $$css: true,
      paddingTop: WEB_CLASS['paddingTop:8'],
      'paddingTop@md': `${WEB_CLASS['paddingTop:16']}-md`,
    });
  });

  it('a state variant’s view carries the anchor its selectors start from', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .when('hovered', (v) => v.background('surface')),
    );
    const press = r.root.findByType('Pressable' as never);
    expect(press.props.style).toEqual([
      {
        $$css: true,
        flexDirection: WEB_CLASS['flexDirection:row'],
        'backgroundColor@hovered': `${WEB_CLASS['backgroundColor:@surface']}-hovered`,
      },
      { $$css: true, blStateAnchor: 'blsg' },
    ]);
  });

  it('a variant sheet puts each class under its condition’s CSS', () => {
    const name = WEB_CLASS['paddingTop:16'] as string;
    expect(variantSheet('md', [name])).toBe(
      `@media (min-width: 768px){.${name}-md{padding-top:16px;}}`,
    );
    expect(variantSheet('dark', [name])).toBe(`.dark .${name}-dark{padding-top:16px;}`);
    expect(variantSheet('hovered', [name])).toBe(
      `${VARIANT_SELECTORS.hovered.replaceAll('&', `.${name}-hovered`)}{padding-top:16px;}`,
    );
    expect(VARIANT_SELECTORS.hovered).toBe(
      '&:is(.blsg:hover:where(:not(:has(.blsg:hover))), .blsg:hover:where(:not(:has(.blsg:hover))) *):where(:not(.blsg:hover:where(:not(:has(.blsg:hover))) .blsg, .blsg:hover:where(:not(:has(.blsg:hover))) .blsg *))',
    );
  });

  it('a variant sheet holds only the classes it is given, in the generated sheet’s order', () => {
    const top = WEB_CLASS['paddingTop:16'] as string;
    const width = WEB_CLASS['borderWidth:1'] as string;
    const sheet = variantSheet('md', [top, width, top]);
    expect(sheet.match(/-md\{/g)).toHaveLength(2);
    // react-native-web's precedence: the shorthand group before a longhand.
    expect(WEB_SHEET.indexOf(`.${width}{`)).toBeLessThan(WEB_SHEET.indexOf(`.${top}{`));
    expect(sheet.indexOf(`.${width}-md`)).toBeLessThan(sheet.indexOf(`.${top}-md`));
    expect(variantSheet('md', [])).toBe('');
  });

  it('a rendered variant puts exactly its own rules on the page', () => {
    adoptVariantClasses('lg', []);
    const before = adoptedText('lg');
    expect(before).toBe('');
    mount(
      VStack(Text('a'))
        .padding('sm')
        .when('lg', (v) => v.padding('lg')),
    );
    const sheet = adoptedText('lg') ?? '';
    expect(sheet.match(/-lg\{/g)).toHaveLength(4);
    for (const edge of ['Top', 'Bottom', 'Start', 'End'])
      expect(sheet).toContain(`.${WEB_CLASS[`padding${edge}:16`]}-lg{`);
  });

  it('a Bloom component takes its variants in its own style object, its roles their CSS variables', () => {
    const r = mount(
      Avatar('a.png')
        .background('surface')
        .when('dark', (v) => v.background('popover')),
    );
    const [avatar] = r.root.findAll((node) => (node.type as unknown) === 'BloomAvatar');
    expect(avatar?.props.style).toEqual({ backgroundColor: COLORS.surface.web });
    expect(r.root.findAll((node) => (node.type as unknown) === 'View')).toHaveLength(0);
  });

  it('a Bloom component’s state variant is read in JS from its own press, with no anchor class', () => {
    const r = mount(
      Button(Text('Save'))
        .onPress(() => {})
        .when('pressed', (v) => v.opacity('70')),
    );
    const button = (): ReactTestInstance =>
      r.root.find((node) => (node.type as unknown) === 'BloomButton');
    expect(button().props.style).toBeUndefined();
    act(() => button().props.onPressIn());
    expect(button().props.style).toEqual({ opacity: 0.7 });
    act(() => button().props.onPressOut());
    expect(button().props.style).toBeUndefined();
  });
});

describe('a Bloom component’s focus variant answers a keyboard’s focus, as a view’s does', () => {
  it('a focus the browser shows (:focus-visible) holds it; a click’s focus does not', () => {
    const r = mount(
      Button(Text('Save'))
        .onPress(() => {})
        .when('focused', (v) => v.opacity('70')),
    );
    const button = (): ReactTestInstance =>
      r.root.find((node) => (node.type as unknown) === 'BloomButton');
    const focus = (visible: boolean) => ({
      currentTarget: { matches: (selector: string) => selector === ':focus-visible' && visible },
    });
    act(() => button().props.onFocus(focus(false)));
    expect(button().props.style).toBeUndefined();
    act(() => button().props.onBlur());
    act(() => button().props.onFocus(focus(true)));
    expect(button().props.style).toEqual({ opacity: 0.7 });
    act(() => button().props.onBlur());
    expect(button().props.style).toBeUndefined();
  });
});

describe('a class react-native-web writes as two rules varies as two', () => {
  it('no hit testing reaches the children under its condition too', () => {
    const name = WEB_CLASS['pointerEvents:none'] as string;
    const sheet = variantSheet('hovered', [name]);
    const at = (rest: string) =>
      VARIANT_SELECTORS.hovered.replaceAll('&', `.${name}-hovered${rest}`);
    // The children's rule comes first in the generated sheet, so it does here.
    expect(sheet).toBe(
      `${at('>*')}{pointer-events:none;}\n${at('')}{pointer-events:none!important;}`,
    );
    expect(variantSheet('md', [name])).toContain(`.${name}-md>*{pointer-events:none;}`);
  });
});

describe('a variant inside a variant is both conditions’ CSS', () => {
  it('a breakpoint and a state: the state’s selector inside the query', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .when('md', (v) => v.when('hovered', (h) => h.padding('lg'))),
    );
    const press = r.root.findByType('Pressable' as never);
    const name = WEB_CLASS['paddingTop:16'] as string;
    expect((press.props.style as Record<string, unknown>[])[0]).toMatchObject({
      'paddingTop@md+hovered': `${name}-md-hovered`,
    });
    const sheet = variantSheet('md+hovered', [name]);
    const own = VARIANT_SELECTORS.hovered.replace('&', `.${name}-md-hovered`);
    expect(sheet).toBe(`@media (min-width: 768px){${own}{padding-top:16px;}}`);
  });

  it('the scheme around a state; two states answer one anchor, the nearest', () => {
    const name = WEB_CLASS['paddingTop:16'] as string;
    const hovered = (inner: string) => VARIANT_SELECTORS.hovered.replace('&', inner);
    const pressed = (inner: string) => VARIANT_SELECTORS.pressed.replace('&', inner);
    expect(variantSheet('dark+hovered', [name])).toBe(
      `${VARIANT_SELECTORS.dark.replace('&', hovered(`.${name}-dark-hovered`))}{padding-top:16px;}`,
    );
    expect(variantSheet('hovered+pressed', [name])).toBe(
      `${pressed(hovered(`.${name}-hovered-pressed`))}{padding-top:16px;}`,
    );
  });
});

describe('on the web an icon’s varied ink is CSS', () => {
  it('the glyph paints currentColor; its colour and the variant’s are classes', () => {
    const Glyph = (props: object) => createElement('Glyph', props);
    const r = mount(
      HStack(Icon(Glyph))
        .onPress(() => {})
        .foreground('muted')
        .when('hovered', (v) => v.foreground('primary')),
    );
    const glyph = r.root.findByType('Glyph' as never);
    expect(glyph.props.fill).toBe('currentColor');
    expect(glyph.props.style).toEqual({
      $$css: true,
      color: WEB_CLASS['color:@muted'],
      'color@hovered': `${WEB_CLASS['color:@primary']}-hovered`,
    });
  });
});
