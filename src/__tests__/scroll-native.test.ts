import {
  ScrollRestorationProvider,
  useScrollRestoration,
} from '../scroll/index';

// The native barrel is a deliberate no-op: native-stack already preserves
// scroll. These tests pin that contract so a future refactor can't silently
// turn the native path into something that touches the DOM or throws.

describe('native scroll-restoration barrel', () => {
  it('ScrollRestorationProvider renders its children unchanged', () => {
    const child = { sentinel: true } as unknown as React.ReactElement;
    expect(ScrollRestorationProvider({ children: child })).toBe(child);
  });

  it('useScrollRestoration is a no-op for any target/options', () => {
    const ref = { current: null };
    expect(() => useScrollRestoration(ref)).not.toThrow();
    expect(() => useScrollRestoration('window')).not.toThrow();
    expect(() =>
      useScrollRestoration(ref, { key: 'feed', enabled: true }),
    ).not.toThrow();
    expect(useScrollRestoration(ref)).toBeUndefined();
  });
});
