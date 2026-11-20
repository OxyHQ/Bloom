import { createElement, type ReactElement } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Icon, Text, VStack } from '../primitives';
import { toElement } from '../render';
import { defineTokens } from '../tokens';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';

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

function mount(element: ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(PaintContext.Provider, { value: LIGHT }, element));
  });
  return renderer;
}

const Glyph = (props: { fill?: string }) => createElement('Glyph', props);

/** The CSS a class sets, from the generated sheet. */
function css(name: string): string {
  const rule = WEB_SHEET.split('\n').find((line) => line.startsWith(`.${name}{`));
  return rule ? rule.slice(name.length + 2, -1) : '';
}

describe('on the web, styles are classes from the generated sheet', () => {
  it('a stack and its text are react-native-web class objects; colours are theme variables', () => {
    const r = mount(toElement(HStack(Text('a').foreground('muted').font('md')).spacing('sm')));
    const stack = r.root.findByType('View' as never);
    expect(stack.props.style).toEqual({
      $$css: true,
      flexDirection: WEB_CLASS['flexDirection:row'],
      gap: WEB_CLASS['gap:8'],
    });
    const text = r.root.findByType('Text' as never);
    expect(text.props.style).toEqual({
      $$css: true,
      fontSize: WEB_CLASS['fontSize:15'],
      color: WEB_CLASS['color:@muted'],
    });
    expect(css(text.props.style.color)).toBe('color:var(--muted-foreground);');
    expect(css(stack.props.style.gap)).toBe('gap:8px;');
  });

  it('logical edges are CSS logical properties', () => {
    const r = mount(toElement(VStack().padding('leading', 'md')));
    const style = r.root.findByType('View' as never).props.style;
    expect(css(style.paddingStart)).toBe('padding-inline-start:12px;');
  });

  it('a value the sheet has no class for (an app token) stays inline beside the classes', () => {
    const t = defineTokens({ space: { gutter: 64 } });
    const r = mount(toElement(VStack().padding('top', 'md').padding('leading', t.space.gutter)));
    expect(r.root.findByType('View' as never).props.style).toEqual([
      { $$css: true, paddingTop: WEB_CLASS['paddingTop:12'] },
      { paddingStart: 64 },
    ]);
  });

  it('text reads no theme on the web; an icon’s fill still paints from it', () => {
    const r = mount(toElement(VStack(Text('a'), Icon(Glyph).foreground('primary'))));
    expect(
      r.root.findAll((i) => (i.type as { displayName?: string }).displayName === 'BloomPaint'),
    ).toHaveLength(1);
    expect(r.root.findByType('Glyph' as never).props.fill).toBe(LIGHT.primary);
  });
});
