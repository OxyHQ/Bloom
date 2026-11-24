import type React from 'react';
import { render } from '@testing-library/react-native';
import type { ReactTestRendererJSON, ReactTestRendererNode } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { type PressHighlight, SubtleHover } from '../subtle-hover';

// Default test Platform.OS is 'ios' (see __mocks__/react-native.ts), so the
// web-only hover wash is suppressed unless the JS `active` mode opts in via
// `native`.
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/**
 * The provider's own layout wrapper — the `<View style={[{ flex: 1 }, …]}>` in
 * `BloomThemeProvider`, whose children are the subject.
 *
 * It is FOUND rather than assumed to be the root. How many nodes sit above it
 * depends on whether `nativewind` resolves: when it does, the provider wraps
 * the tree in the consumer's `VariableContextProvider` as well, and every Oxy
 * app installs that peer. Reading `toJSON().children` directly measured the
 * depth of the provider stack, not what `SubtleHover` rendered, so it flipped
 * the moment the optional peer appeared in the tree.
 *
 * Throwing when no wrapper matches is the vacuity floor: without it, a helper
 * that found nothing would report the same `null` children as a subject that
 * correctly rendered nothing.
 */
function renderWrapper(ui: React.ReactElement): ReactTestRendererJSON {
  const tree = renderWithTheme(ui).toJSON();
  const roots: ReactTestRendererNode[] = tree === null ? [] : Array.isArray(tree) ? tree : [tree];

  const isFlexWrapper = (node: ReactTestRendererJSON) => {
    const style: unknown = node.props.style;
    return (
      node.type === 'View' &&
      Array.isArray(style) &&
      typeof style[0] === 'object' &&
      style[0] !== null &&
      (style[0] as { flex?: number }).flex === 1
    );
  };

  const search = (nodes: ReactTestRendererNode[]): ReactTestRendererJSON | null => {
    for (const node of nodes) {
      if (typeof node === 'string') continue;
      if (isFlexWrapper(node)) return node;
      const found = search(node.children ?? []);
      if (found) return found;
    }
    return null;
  };

  const wrapper = search(roots);
  if (!wrapper) throw new Error("BloomThemeProvider's flex wrapper was not found");
  return wrapper;
}

describe('SubtleHover', () => {
  it('carries a displayName', () => {
    expect(SubtleHover.displayName).toBe('SubtleHover');
  });

  it('renders nothing on native in the CSS group-hover mode', () => {
    expect(renderWrapper(<SubtleHover />).children).toBeNull();
  });

  it('renders nothing on native in the JS active mode by default', () => {
    expect(renderWrapper(<SubtleHover active />).children).toBeNull();
  });

  it('renders the wash on native in the JS active mode when opted in', () => {
    expect(renderWrapper(<SubtleHover active native />).children).not.toBeNull();
  });

  it('accepts a style override in the native active mode', () => {
    expect(
      renderWrapper(<SubtleHover active native style={{ borderRadius: 12 }} />).children,
    ).not.toBeNull();
  });
});

describe('SubtleHover pressed', () => {
  it('draws the press wash on native, at the full contrast fill, its opacity the press', () => {
    const pressed = { value: 0 } as never;
    const wrapper = renderWrapper(<SubtleHover pressed={pressed} />);
    const washes = wrapper.children ?? [];
    expect(washes).toHaveLength(1);
    const style = Object.assign(
      {},
      ...[(washes[0] as ReactTestRendererJSON).props.style].flat(4).filter(Boolean),
    );
    expect(style).toMatchObject({ position: 'absolute', opacity: 0, pointerEvents: 'none' });
    expect(typeof style.backgroundColor).toBe('string');
  });

  it('adds the press wash beside a coordinated highlight', () => {
    const pressed = { value: 0 } as never;
    expect(renderWrapper(<SubtleHover active native pressed={pressed} />).children).toHaveLength(2);
  });
});

/**
 * The hook is chosen once per platform at module load, so each platform loads
 * the module afresh against the same React the renderer uses.
 */
function loadPressHighlight(os: 'ios' | 'android' | 'web') {
  let hook!: typeof import('../subtle-hover').usePressHighlight;
  const reactModule: unknown = jest.requireActual('react');
  jest.isolateModules(() => {
    jest.doMock('react', () => reactModule);
    const { Platform } = require('react-native') as typeof import('react-native');
    const previous = Platform.OS;
    Platform.OS = os;
    try {
      hook = (require('../subtle-hover/use-press-highlight') as typeof import('../subtle-hover'))
        .usePressHighlight;
    } finally {
      Platform.OS = previous;
    }
  });
  return hook;
}

function HookProbe({
  hook,
  onResult,
}: {
  hook: () => PressHighlight;
  onResult: (result: PressHighlight) => void;
}) {
  onResult(hook());
  return null;
}

function runPressHighlight(os: 'ios' | 'android' | 'web'): PressHighlight {
  const hook = loadPressHighlight(os);
  let result: PressHighlight | undefined;
  renderWithTheme(
    <HookProbe
      hook={hook}
      onResult={(r) => {
        result = r;
      }}
    />,
  );
  if (result === undefined) throw new Error('the hook did not run');
  return result;
}

describe('usePressHighlight', () => {
  it('Android: the bounded platform ripple in the contrast fill, nothing for the wash', () => {
    const { hostProps, pressed } = runPressHighlight('android');
    expect(hostProps.android_ripple).toEqual({ color: expect.any(String), borderless: false });
    expect(hostProps.onPressIn).toBeUndefined();
    expect(pressed).toBeUndefined();
  });

  it('iOS: press in lights the wash at once, press out fades it, with no ripple', () => {
    const { hostProps, pressed } = runPressHighlight('ios');
    expect(hostProps.android_ripple).toBeUndefined();
    expect(pressed?.value).toBe(0);
    hostProps.onPressIn?.();
    expect(pressed?.value).toBe(1);
    hostProps.onPressOut?.();
    expect(pressed?.value).toBe(0);
  });

  it('web: nothing (the pointer has the hover wash)', () => {
    const { hostProps, pressed } = runPressHighlight('web');
    expect(hostProps).toEqual({});
    expect(pressed).toBeUndefined();
  });
});
