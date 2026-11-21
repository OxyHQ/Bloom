import { createElement } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Text, VStack } from '../primitives';
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

  it('the variant sheet puts each class under each condition, in the order they override', () => {
    const sheet = variantSheet();
    const name = WEB_CLASS['paddingTop:16'] as string;
    const md = sheet.indexOf(`@media (min-width: 768px){`);
    expect(md).toBeGreaterThan(sheet.indexOf(`@media (min-width: 640px){`));
    expect(sheet).toContain(`.${name}-md{padding-top:16px;}`);
    expect(sheet).toContain(`.dark .${name}-dark{padding-top:16px;}`);
    expect(sheet).toContain(
      `.blsg:hover .${name}-hovered, .blsg:hover.${name}-hovered{padding-top:16px;}`,
    );
    expect(sheet.indexOf(`-pressed{`)).toBeGreaterThan(sheet.indexOf(`-hovered{`));
  });
});
