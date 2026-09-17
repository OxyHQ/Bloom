import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { View } from 'react-native';

import type { FloatingAnchor } from '../floating/types';
import { rectOf } from '../floating/use-anchor-rect';
import { HOVER_CARD_CLOSE_DELAY } from '../hover-card/constants';
import { HoverCardPanel } from '../hover-card/HoverCardPanel';
import { useHoverIntent } from '../hover-card/use-hover-intent';
import { UserHoverCard } from '../user-hover-card';
import {
  AvatarGroupBase,
  getItemName,
  type AvatarGroupCellHoverHandlers,
} from './AvatarGroupBase';
import type { AvatarGroupItem, AvatarGroupProps } from './types';

interface HoverTarget {
  item: AvatarGroupItem;
  index: number;
  anchor: FloatingAnchor;
}

/**
 * Web `AvatarGroup`. Identical layout rendering to native (stack / row /
 * cluster) via {@link AvatarGroupBase}, plus an optional hover card: when
 * `hoverCard` is enabled, hovering an avatar reveals a {@link UserHoverCard}
 * beneath it. The card receives the per-item `renderItemAction` slot so the app
 * can drop its SDK FollowButton inside.
 *
 * The card floats in `HoverCardPanel`, the same surface `HoverCardContent`
 * renders — placement (flip and clamp), motion, Escape and outside-press
 * dismissal, and the pointer bridge all come from there. What stays here is the
 * one thing a single `HoverCard` cannot do: ONE card serving every face, which
 * re-anchors as the cursor moves along the pile instead of closing and
 * reopening per avatar. It opens with no delay for the same reason — the
 * pointer is already on a row of people, and the card is what it came for.
 */
const AvatarGroupWebComponent: React.FC<AvatarGroupProps> = (props) => {
  const { hoverCard, renderItemAction, onPressItem } = props;
  const [target, setTarget] = useState<HoverTarget | null>(null);
  const [open, setOpen] = useState(false);
  const cellRefs = useRef<Map<number, View>>(new Map());
  const { show, hide, hold } = useHoverIntent(open, setOpen, 0, HOVER_CARD_CLOSE_DELAY);

  const registerCellRef = useCallback((index: number, node: View | null) => {
    if (node) cellRefs.current.set(index, node);
    else cellRefs.current.delete(index);
  }, []);

  const handleHoverIn = useCallback(
    (item: AvatarGroupItem, index: number) => {
      const anchor = rectOf(cellRefs.current.get(index) ?? null);
      if (!anchor) return;
      setTarget({ item, index, anchor });
      show();
    },
    [show],
  );

  const dismiss = useCallback(() => {
    hold();
    setOpen(false);
  }, [hold]);

  const hoverHandlers = useMemo<AvatarGroupCellHoverHandlers | undefined>(() => {
    if (!hoverCard) return undefined;
    return {
      onHoverIn: handleHoverIn,
      onHoverOut: hide,
      registerCellRef,
    };
  }, [hoverCard, handleHoverIn, hide, registerCellRef]);

  return (
    <>
      <AvatarGroupBase {...props} hoverHandlers={hoverHandlers} />
      {hoverCard && target ? (
        <HoverCardPanel
          open={open}
          anchor={open ? target.anchor : null}
          onDismiss={dismiss}
          onPointerEnter={hold}
          onPointerLeave={hide}
          label={getItemName(target.item) ?? 'Profile'}>
          <UserHoverCard
            avatar={target.item.uri ?? undefined}
            // `UserHoverCardProps.displayName` is contractually an
            // already-resolved string, and resolving it is precisely this
            // component's job. `''` is the honest terminal case: no field on the
            // item named the person at all, so there is nothing to show.
            displayName={getItemName(target.item) ?? ''}
            username={target.item.username}
            onPressProfile={
              onPressItem ? () => onPressItem(target.item, target.index) : undefined
            }
            action={renderItemAction?.(target.item, target.index)}
          />
        </HoverCardPanel>
      ) : null}
    </>
  );
};

export const AvatarGroup = memo(AvatarGroupWebComponent);
AvatarGroup.displayName = 'AvatarGroup';
