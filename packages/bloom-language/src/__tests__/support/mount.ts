import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { LIGHT, PaintContext, type ThemeColors } from './bloom-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Mounts under the stand-in theme. */
export function mount(element: ReactElement, colors: ThemeColors = LIGHT): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: colors }, element),
    );
  });
  return renderer;
}

export function hosts(renderer: ReactTestRenderer, type: string): ReactTestInstance[] {
  return renderer.root.findAll((instance) => instance.type === type);
}

export function only(renderer: ReactTestRenderer, type: string): ReactTestInstance {
  const found = hosts(renderer, type);
  if (found.length !== 1) throw new Error(`${found.length} ${type} hosts, not 1`);
  return found[0] as ReactTestInstance;
}

/** The test renderer's deprecation notice, once per mount; nothing else is silenced. */
export function quietRenderer(): void {
  const consoleError = console.error;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('react-test-renderer is deprecated')) return;
      consoleError(...args);
    });
  });
}

export const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);
export const OtherGlyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('OtherGlyph', props);

export { act };
