/**
 * The anchored surface every WEB fork of `Popover`, `DropdownMenu`,
 * `ContextMenu` and `Menubar` renders. WEB ONLY — imported by `.web.tsx` files
 * and nothing else, which is why it names `../portal/index.web` outright rather
 * than relying on a platform extension.
 *
 * What it encodes, once, instead of four times:
 *
 *  - The portal body sits inside `<OverlayRoot>`, and that `OverlayRoot` is
 *    inside the `open` guard — so the surface's rank in `overlay/stack.ts` is
 *    taken on MOUNT and a menu opened from inside a dialog paints above it. No
 *    surface here carries a `zIndex` of its own.
 *  - The dismiss layer is the shared `<Backdrop>` with its blur and dim turned
 *    off: an anchored surface is not modal, so it gets a transparent hit box
 *    rather than the wash a Dialog or a sheet uses. Routing it through
 *    `Backdrop` (instead of a bare full-screen `Pressable`) is what keeps the
 *    `pointer-events` opt-in correct — the web `Portal` root is
 *    `pointer-events: none` and the property inherits.
 *  - Placement goes through `overlay/dropdown-placement`, which fits, flips and
 *    clamps on the vertical axis and clamps on the horizontal one.
 *
 * `alignOffset` is applied by SHIFTING THE ANCHOR before resolving, not by
 * nudging the result: the resolver's own clamp then still owns the horizontal
 * axis, so an offset can never push the surface off the viewport edge.
 */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { Backdrop, OverlayRoot } from '../overlay';
import {
  resolveDropdownPlacement,
  type DropdownPlacement,
} from '../overlay/dropdown-placement';
import { Portal } from '../portal/index.web';
import { borderRadius } from '../styles/tokens';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { DEFAULT_ALIGN_OFFSET, DEFAULT_SIDE_OFFSET, VIEWPORT_GUTTER } from './constants';
import type { FloatingPanelProps } from './types';

export function FloatingPanel({
  open,
  anchor,
  side = 'bottom',
  align = 'start',
  sideOffset = DEFAULT_SIDE_OFFSET,
  alignOffset = DEFAULT_ALIGN_OFFSET,
  dismissible = true,
  onDismiss,
  label,
  role,
  minWidth,
  maxWidth,
  style,
  testID,
  children,
}: FloatingPanelProps) {
  const theme = useTheme();
  // The mounted panel as STATE, not a bare ref: placement has to measure it,
  // and `Portal` renders null on its first pass (it resolves its host in its own
  // layout effect), so the node lands one render after `open` flips. An effect
  // keyed only on `open` would measure nothing.
  const [panelNode, setPanelNode] = useState<View | null>(null);
  const [placement, setPlacement] = useState<DropdownPlacement | null>(null);

  const attach = useCallback((node: View | null) => {
    setPanelNode(node);
  }, []);

  useLayoutEffect(() => {
    const element = panelNode as unknown as { getBoundingClientRect?: () => DOMRect } | null;
    if (
      !open ||
      !anchor ||
      typeof window === 'undefined' ||
      typeof element?.getBoundingClientRect !== 'function'
    ) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const box = element.getBoundingClientRect();
      // Measured BEFORE `minWidth` is applied, so the laid-out surface can only
      // be wider than the box read here — and a wider surface wraps less, so the
      // measured height is an upper bound. Erring that way flips early in a tie,
      // never late.
      const width = Math.max(box.width, minWidth ?? 0);
      setPlacement(
        resolveDropdownPlacement({
          anchor: {
            top: anchor.top,
            bottom: anchor.bottom,
            left: anchor.left + alignOffset,
            right: anchor.right + alignOffset,
          },
          size: { width, height: box.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          offset: sideOffset,
          gutter: VIEWPORT_GUTTER,
          align,
          side,
        }),
      );
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchor, panelNode, side, align, sideOffset, alignOffset, minWidth]);

  useEffect(() => {
    if (!open || !dismissible || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Stop the key reaching a Dialog underneath: the innermost open surface is
      // the one Escape dismisses.
      event.stopPropagation();
      onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, onDismiss]);

  if (!open || !anchor) return null;

  return (
    <Portal>
      <OverlayRoot>
        {dismissible ? (
          <Backdrop
            style={styles.backdrop}
            onPress={onDismiss}
            // An anchored surface dims nothing: this layer exists only to catch
            // the outside press. `Backdrop` still owns the pointer-events
            // contract, which is the whole reason it is not a bare Pressable.
            blurIntensity={0}
            dimOpacity={0}
            accessibilityLabel="Dismiss"
          />
        ) : null}
        <View
          ref={attach}
          role={role}
          aria-label={label}
          testID={testID}
          style={[
            styles.panel,
            {
              // Before the first measurement the panel sits at the anchor and is
              // invisible, so it never paints a frame in the wrong place.
              left: placement?.left ?? anchor.left,
              top: placement?.top ?? anchor.bottom + sideOffset,
              opacity: placement ? 1 : 0,
              minWidth,
              maxWidth,
              backgroundColor: theme.isDark
                ? theme.colors.backgroundSecondary
                : theme.colors.background,
              borderColor: theme.colors.borderLight,
              // Design-system overlay elevation as a `boxShadow` — RN-Web
              // deprecated the `shadow*` style props.
              ...bloomShadowStyle('m'),
            },
            style,
          ]}>
          {children}
        </View>
      </OverlayRoot>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  panel: {
    position: WEB_POSITION_FIXED,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
});
