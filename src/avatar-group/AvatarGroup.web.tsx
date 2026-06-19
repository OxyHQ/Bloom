import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Portal } from '../portal';
import { Z_INDEX } from '../styles/z-index';
import { UserHoverCard } from '../user-hover-card';
import {
  AvatarGroupBase,
  type AvatarGroupCellHoverHandlers,
} from './AvatarGroupBase';
import type { AvatarGroupItem, AvatarGroupProps } from './types';

/** Delay before dismissing the card so the cursor can travel into it. */
const CLOSE_DELAY_MS = 120;
/** Gap between the anchored avatar and the floating card. */
const CARD_GAP = 8;
const CARD_WIDTH = 280;

interface HoverState {
  item: AvatarGroupItem;
  index: number;
  top: number;
  left: number;
}

function getItemName(item: AvatarGroupItem): string {
  return item.displayName ?? item.name ?? item.username ?? '';
}

/**
 * Web `AvatarGroup`. Identical stack rendering to native via
 * {@link AvatarGroupBase}, plus an optional hover card: when `hoverCard` is
 * enabled, hovering an avatar reveals a {@link UserHoverCard} positioned beneath
 * it. The card receives the per-item `renderItemAction` slot so the app can drop
 * its SDK FollowButton inside.
 */
const AvatarGroupWebComponent: React.FC<AvatarGroupProps> = (props) => {
  const { hoverCard, renderItemAction, onPressItem } = props;
  const [hover, setHover] = useState<HoverState | null>(null);
  const cellRefs = useRef<Map<number, View>>(new Map());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setHover(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const registerCellRef = useCallback((index: number, node: View | null) => {
    if (node) cellRefs.current.set(index, node);
    else cellRefs.current.delete(index);
  }, []);

  const handleHoverIn = useCallback(
    (item: AvatarGroupItem, index: number) => {
      cancelClose();
      const node = cellRefs.current.get(index);
      if (!node) return;
      node.measureInWindow((x, y, width, height) => {
        // Center the card under the avatar, clamped to the viewport.
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : CARD_WIDTH;
        let left = x + width / 2 - CARD_WIDTH / 2;
        left = Math.max(
          CARD_GAP,
          Math.min(left, viewportWidth - CARD_WIDTH - CARD_GAP),
        );
        setHover({
          item,
          index,
          top: y + height + CARD_GAP,
          left,
        });
      });
    },
    [cancelClose],
  );

  const hoverHandlers = useMemo<AvatarGroupCellHoverHandlers | undefined>(() => {
    if (!hoverCard) return undefined;
    return {
      onHoverIn: handleHoverIn,
      onHoverOut: scheduleClose,
      registerCellRef,
    };
  }, [hoverCard, handleHoverIn, scheduleClose, registerCellRef]);

  return (
    <>
      <AvatarGroupBase {...props} hoverHandlers={hoverHandlers} />
      {hoverCard && hover && (
        <Portal>
          {/*
            A Pressable hosts the hover-bridge: `onHoverIn`/`onHoverOut` are
            typed in React Native (and map to mouseenter/mouseleave on
            react-native-web), so the card stays open while the cursor is over
            it without any web-only DOM-prop type suppression.
          */}
          <Pressable
            onHoverIn={cancelClose}
            onHoverOut={scheduleClose}
            accessibilityRole="none"
            pointerEvents="auto"
            style={[
              webStyles.floating,
              { top: hover.top, left: hover.left, width: CARD_WIDTH },
            ]}
          >
            <UserHoverCard
              avatar={hover.item.uri ?? undefined}
              displayName={getItemName(hover.item)}
              username={hover.item.username}
              onPressProfile={
                onPressItem
                  ? () => onPressItem(hover.item, hover.index)
                  : undefined
              }
              action={renderItemAction?.(hover.item, hover.index)}
              style={webStyles.card}
            />
          </Pressable>
        </Portal>
      )}
    </>
  );
};

const webStyles = StyleSheet.create({
  floating: {
    position: 'fixed' as 'absolute',
    zIndex: Z_INDEX.tooltip,
  },
  card: {
    width: CARD_WIDTH,
  },
});

export const AvatarGroup = memo(AvatarGroupWebComponent);
AvatarGroup.displayName = 'AvatarGroup';
