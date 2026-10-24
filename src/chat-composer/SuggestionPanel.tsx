import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Keyboard, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import { Portal } from '../portal';
import { OverlayRoot } from '../overlay';
import { resolveDropdownPlacement } from '../overlay/dropdown-placement';
import type { FloatingAnchor } from '../floating/types';
import { useMenuDensity } from '../floating/use-menu-density';
import { Surface } from '../surface';
import { surfacePresenceStyle, useSurfacePresenceContent } from '../surface/use-surface-presence';
import type { ViewRef } from '../styles/native-refs';
import { ScrollArea } from '../layout/ScrollArea';
import type { SuggestionPanelProps } from './suggestion-panel-types';

/** Non-modal native suggestions leave the editing input and keyboard in place. */
export function SuggestionPanel({
  anchor,
  open,
  onOpenChange,
  listboxId,
  label,
  busy,
  maxHeight,
  style,
  testID,
  scrollRef,
  children,
}: SuggestionPanelProps) {
  const viewport = useWindowDimensions();
  const insets = useCssSafeAreaInsets(useSafeAreaInsets());
  const density = useMenuDensity();
  const [rect, setRect] = useState<FloatingAnchor | null>(null);
  const [height, setHeight] = useState(0);
  const [host, setHost] = useState<ViewRef | null>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(
    () => Keyboard.metrics()?.screenY ?? null,
  );
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardTop(e.endCoordinates.screenY),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardTop(null);
      onOpenChange?.(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [onOpenChange]);
  useLayoutEffect(() => {
    if (!open) return;
    let active = true;
    const given = anchor.getRect();
    if (given) {
      setRect((previous) =>
        JSON.stringify(previous) === JSON.stringify(given) ? previous : given,
      );
      return;
    }
    anchor.contextRef.current?.measureInWindow((x, y, width, measuredHeight) => {
      if (!active) return;
      const next = { left: x, right: x + width, top: y, bottom: y + measuredHeight };
      setRect((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    });
    return () => {
      active = false;
    };
  }, [anchor, open, viewport.width, viewport.height, keyboardTop, children]);
  // Hidden for the frame before it is measured through its presence, never an
  // opacity on the panel: that would make it its own material's backdrop root.
  useSurfacePresenceContent(host, { presence: height ? 1 : 0 });
  if (!open || !rect) return null;
  const gutter = 8;
  const top = insets.top + gutter;
  const bottom = Math.min(viewport.height - insets.bottom, keyboardTop ?? viewport.height) - gutter;
  const width = Math.max(
    0,
    Math.min(300, viewport.width - insets.left - insets.right - gutter * 2),
  );
  const ceiling = Math.max(
    0,
    Math.min(maxHeight, Math.max(rect.top - top - 4, bottom - rect.bottom - 4)),
  );
  const position = resolveDropdownPlacement({
    anchor: {
      ...rect,
      top: rect.top - top,
      bottom: rect.bottom - top,
      left: rect.left - insets.left,
      right: rect.right - insets.left,
    },
    size: { width, height: Math.min(height, ceiling) },
    bounds: {
      top: 0,
      left: 0,
      right: viewport.width - insets.left - insets.right,
      bottom: Math.max(0, bottom - top),
    },
    gutter: 0,
    offset: 4,
    align: 'start',
    side: 'bottom',
  });
  return (
    <Portal>
      <OverlayRoot onRequestClose={() => onOpenChange?.(false)}>
        <Surface
          style={[
            { position: 'absolute', width, padding: density.panelPadding, borderRadius: 16 },
            style,
            {
              top: position.top + top,
              left: position.left + insets.left,
              maxHeight: ceiling,
            },
            surfacePresenceStyle(height ? 1 : 0),
          ]}
          ref={setHost}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          testID={testID}
        >
          <ScrollArea
            ref={scrollRef}
            nativeID={listboxId}
            accessibilityRole="list"
            accessibilityLabel={label}
            aria-busy={busy}
            style={{ flexShrink: 1, minHeight: 0 }}
            keyboardShouldPersistTaps="always"
          >
            <View>{children}</View>
          </ScrollArea>
        </Surface>
      </OverlayRoot>
    </Portal>
  );
}
