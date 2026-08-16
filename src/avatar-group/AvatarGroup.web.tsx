import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OverlayRoot } from '../overlay';
// `../portal/index.web`, not `../portal`: export conditions do not apply to
// relative specifiers, so the bare name resolves to the NATIVE barrel in any
// bundler that does not add web extensions to its resolution order. The native
// Portal renders into a `PortalOutlet`, which a web app never mounts — both are
// no-ops in the web fork — so the hover card would render nothing at all.
// `Dialog.web.tsx` and `BottomSheet.web.tsx` already name it this way.
import { Portal } from '../portal/index.web';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { UserHoverCard } from '../user-hover-card';
import {
  AvatarGroupBase,
  getItemName,
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

/**
 * Web `AvatarGroup`. Identical layout rendering to native (stack / row /
 * cluster) via {@link AvatarGroupBase}, plus an optional hover card: when
 * `hoverCard` is enabled, hovering an avatar reveals a {@link UserHoverCard}
 * positioned beneath it. The card receives the per-item `renderItemAction` slot
 * so the app can drop its SDK FollowButton inside.
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
          {/* The hover card stacks by when it opened, like every other Bloom
              overlay (`src/overlay/stack.ts`). `box-none` keeps the area
              around it click-through. */}
          <OverlayRoot>
            {/*
              The hover-bridge keeps the card open while the cursor is over it.
              It is a `View` with the W3C pointer events (in React Native's own
              `ViewProps`, forwarded to the DOM by react-native-web — so no
              web-only type suppression) and NOT a `Pressable`, which is what it
              used to be.

              A `Pressable` bridge closes the card the moment the cursor reaches
              anything pressable INSIDE it — the identity area, or a FollowButton
              in the `action` slot. react-native-web's `Pressable` calls
              `useHover` with `contain: true`, which dispatches a BUBBLING
              `react-gui:hover:lock` event on itself; an ancestor `Pressable`
              that is currently hovered ends its own hover for any lock whose
              target is not itself. So a descendant `Pressable` fired this
              bridge's `onHoverOut` and the card dismissed ~120ms later, with
              nothing in the console. Measured in Chrome; jest cannot see it.

              `pointerenter`/`pointerleave` do not bubble and do not fire when
              the cursor moves between descendants, which is exactly the
              containment the bridge needs.
            */}
            <View
              onPointerEnter={cancelClose}
              onPointerLeave={scheduleClose}
              pointerEvents="auto"
              style={[
                webStyles.floating,
                { top: hover.top, left: hover.left, width: CARD_WIDTH },
              ]}
            >
              <UserHoverCard
                avatar={hover.item.uri ?? undefined}
                // `UserHoverCardProps.displayName` is contractually an
                // already-resolved string, and resolving it is precisely this
                // component's job. `''` is the honest terminal case: no field on
                // the item named the person at all, so there is nothing to show.
                displayName={getItemName(hover.item) ?? ''}
                username={hover.item.username}
                onPressProfile={
                  onPressItem
                    ? () => onPressItem(hover.item, hover.index)
                    : undefined
                }
                action={renderItemAction?.(hover.item, hover.index)}
                style={webStyles.card}
              />
            </View>
          </OverlayRoot>
        </Portal>
      )}
    </>
  );
};

const webStyles = StyleSheet.create({
  floating: {
    position: WEB_POSITION_FIXED,
  },
  card: {
    width: CARD_WIDTH,
  },
});

export const AvatarGroup = memo(AvatarGroupWebComponent);
AvatarGroup.displayName = 'AvatarGroup';
