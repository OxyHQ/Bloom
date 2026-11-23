import { createElement, type ReactElement } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import * as styles from '@oxy.so/bloom/styles';
import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Icon, Text, VStack } from '../primitives';
import { toElement } from '../render';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);

function mount(element: ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(PaintContext.Provider, { value: LIGHT }, element));
  });
  return renderer;
}

/** The leaves drawn `OnSurface`: the only ones that read the surface's context. */
const onSurface = (renderer: ReactTestRenderer) =>
  renderer.root.findAll(
    (instance) =>
      typeof instance.type === 'function' &&
      (instance.type as { displayName?: string }).displayName === 'BloomOnSurface',
  );

describe('the surface fill costs nothing where it is not painted', () => {
  let read: jest.SpyInstance;
  beforeEach(() => {
    read = jest.spyOn(styles, 'useSurfaceFill');
  });
  afterEach(() => read.mockRestore());

  it('a painted leaf without surfaceFill reads no surface context', () => {
    const r = mount(
      toElement(
        HStack(
          Text('a').foreground('muted'),
          Icon(Glyph).foreground('primary'),
          VStack().background('card').border('border', 'thin'),
          VStack()
            .background('card')
            .when('dark', (v) => v.background('mutedFill')),
        ),
      ),
    );
    expect(read).not.toHaveBeenCalled();
    expect(onSurface(r)).toHaveLength(0);
  });

  it('only the leaf that paints surfaceFill reads it, and paints with it', () => {
    const r = mount(
      toElement(HStack(VStack().background('card'), VStack().background('surfaceFill'))),
    );
    expect(onSurface(r)).toHaveLength(1);
    expect(read).toHaveBeenCalledTimes(1);
    const filled = r.root.findAll(
      (instance) =>
        (instance.type as unknown) === 'View' &&
        JSON.stringify(instance.props.style ?? null).includes(LIGHT.background as string),
    );
    expect(filled.length).toBeGreaterThan(0);
  });
});
