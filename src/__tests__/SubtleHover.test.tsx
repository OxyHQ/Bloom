import React from 'react';
import { render } from '@testing-library/react-native';
import type { ReactTestRendererJSON, ReactTestRendererNode } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SubtleHover } from '../subtle-hover';

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
  const roots: ReactTestRendererNode[] =
    tree === null ? [] : Array.isArray(tree) ? tree : [tree];

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
