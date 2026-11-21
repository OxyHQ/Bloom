import { createElement } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Icon, Text, VStack } from '../primitives';
import { toElement } from '../render';
import type { Child } from '../node';
import { WEB_CLASS } from '../generated/web-sheet.generated';
import { variantSheet } from '../web-sheet';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

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
    expect(variantSheet('md')).toMatch(/^@media \(min-width: 768px\)\{/);
    expect(variantSheet('md')).toContain(`.${name}-md{padding-top:16px;}`);
    expect(variantSheet('dark')).toContain(`.dark .${name}-dark{padding-top:16px;}`);
    expect(variantSheet('hovered')).toContain(
      `.blsg:hover .${name}-hovered, .blsg:hover.${name}-hovered{padding-top:16px;}`,
    );
  });
});

describe('a class react-native-web writes as two rules varies as two', () => {
  it('no hit testing reaches the children under its condition too', () => {
    const name = WEB_CLASS['pointerEvents:none'] as string;
    const sheet = variantSheet('hovered');
    const own = `.blsg:hover .${name}-hovered, .blsg:hover.${name}-hovered`;
    expect(sheet).toContain(`${own}{pointer-events:none!important;}`);
    expect(sheet).toContain(
      `.blsg:hover .${name}-hovered>*, .blsg:hover.${name}-hovered>*{pointer-events:none;}`,
    );
    expect(variantSheet('md')).toContain(`.${name}-md>*{pointer-events:none;}`);
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
    const sheet = variantSheet('md+hovered');
    expect(sheet.startsWith('@media (min-width: 768px){')).toBe(true);
    expect(
      sheet.includes(
        `.blsg:hover .${name}-md-hovered, .blsg:hover.${name}-md-hovered{padding-top:16px;}`,
      ),
    ).toBe(true);
  });

  it('the scheme around a state; two states of one view are one anchor', () => {
    const name = WEB_CLASS['paddingTop:16'] as string;
    expect(
      variantSheet('dark+hovered').includes(
        `.dark .blsg:hover .${name}-dark-hovered, .dark .blsg:hover.${name}-dark-hovered{padding-top:16px;}`,
      ),
    ).toBe(true);
    expect(
      variantSheet('hovered+pressed').includes(
        `.blsg:hover:active .${name}-hovered-pressed, .blsg:hover:active.${name}-hovered-pressed{`,
      ),
    ).toBe(true);
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
