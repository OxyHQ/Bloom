import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHook } from '@testing-library/react-native';

import {
  isStackHovered as isStackHoveredNative,
  useStackHover as useStackHoverNative,
} from '../toast/use-stack-hover.native';
import { isStackHovered, useStackHover } from '../toast/use-stack-hover';

/**
 * The hover trigger's platform split. jest resolves the WEB file by default (as
 * every non-Metro bundler and a consumer's `tsc` do), so `Toaster.test.tsx` covers
 * the web behaviour through real rows; this file covers the NATIVE fork, which has
 * no behaviour to exercise, plus the source properties that keep the split honest.
 */
const SRC = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('stack hover platform split', () => {
  it('native hands back no handlers at all, for either stacking value', () => {
    const stacked = renderHook(() => useStackHoverNative({ enableStacking: true }));
    const flat = renderHook(() => useStackHoverNative({ enableStacking: false }));

    expect(Object.keys(stacked.result.current)).toEqual([]);
    expect(Object.keys(flat.result.current)).toEqual([]);
  });

  it('native returns ONE object identity, so the row box props never churn', () => {
    const { result, rerender } = renderHook(() =>
      useStackHoverNative({ enableStacking: true }),
    );
    const first = result.current;
    rerender(undefined);

    expect(result.current).toBe(first);
  });

  it('nothing ever hovers on native', () => {
    expect(isStackHoveredNative()).toBe(false);
  });

  it('web hands back both pointer handlers', () => {
    const { result } = renderHook(() => useStackHover({ enableStacking: true }));

    expect(typeof result.current.onPointerEnter).toBe('function');
    expect(typeof result.current.onPointerLeave).toBe('function');
  });

  it('web is not hovered until a pointer says so', () => {
    expect(isStackHovered()).toBe(false);
  });

  it('the native fork carries no hover state, no timer and no store import', () => {
    const native = code('toast/use-stack-hover.native.ts');
    // A native bundle must not ship the web file's module-level latch or its
    // pending-leave timeout, which is the whole reason this is a file split rather
    // than a `Platform.OS` branch.
    expect(native).not.toMatch(/setTimeout/);
    expect(native).not.toMatch(/from '\.\/toast-store'/);
    expect(native).not.toMatch(/pointerType/);
  });

  it('the web fork gates on a mouse pointer', () => {
    const web = code('toast/use-stack-hover.ts');
    // Touch fires enter before pointerdown and leave after pointerup, so without
    // this every tap on a touch-capable web device would expand then collapse.
    expect(web).toMatch(/pointerType === 'mouse'/);
  });

  it('the web fork drives the store rather than a second expansion mechanism', () => {
    const web = code('toast/use-stack-hover.ts');
    expect(web).toMatch(/toastStore\.expand\(\)/);
    expect(web).toMatch(/toastStore\.collapse\(\)/);
    // With stacking off there is nothing to expand, so the pointer pauses directly.
    expect(web).toMatch(/toastStore\.pauseAllTimers\(\)/);
    expect(web).toMatch(/toastStore\.resumeAllTimers\(\)/);
    // No parallel state: expansion lives in the store and nowhere else.
    expect(web).not.toMatch(/useState/);
    expect(web).not.toMatch(/isExpanded\s*=/);
  });

  it('the row box is the hover target and the press toggle stands down for it', () => {
    expect(code('toast/ToastSwipeHandler.tsx')).toMatch(/\{\.\.\.hoverProps\}/);
    // Hover owns expansion on web; a click must not toggle it shut again.
    expect(code('toast/ToastRow.tsx')).toMatch(/else if \(!isStackHovered\(\)\)/);
  });
});
