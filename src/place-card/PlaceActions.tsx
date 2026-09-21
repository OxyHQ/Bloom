import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { PLACE_CARD_GEOMETRY } from './constants';
import type { PlaceActionsProps } from './types';

/**
 * What you can do with a place: `Directions`, `Call`, `Save`, `Share`.
 *
 * Each action is a Bloom `Button` in the `secondary` variant at the `small`
 * rung — the same labelled action `ai-profile-card` pins under its cover — and
 * the row is a `group` named as one. Nothing here draws a control: the fill,
 * the hover, the press, the focus ring, the disabled opacity and the anchor an
 * `href` turns the button into are all `Button`'s.
 *
 * The row WRAPS rather than scrolling. Four labelled actions do not fit across
 * a 390 phone, and a horizontal scroller hides the fourth one behind an edge
 * with nothing to say it is there; two rows of two are entirely legible and
 * every action stays a tab stop in reading order.
 *
 * THERE IS NO PRESSED STATE, deliberately. "Save" is a toggle in every maps
 * app, and `Button` carries no `aria-pressed` — so a saved place is expressed
 * by the action's own WORDS and glyph ("Save" / "Saved", outline / filled),
 * which is the one spelling that reaches both platforms today. `docs/place-card.mdx`
 * records the gap.
 */
function PlaceActionsComponent({
  actions,
  size = 'small',
  accessibilityLabel = 'Actions',
  style,
  testID,
}: PlaceActionsProps) {
  if (actions.length === 0) return null;
  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: PLACE_CARD_GEOMETRY.actionGap,
          rowGap: PLACE_CARD_GEOMETRY.actionGap,
        },
        style,
      ]}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="secondary"
          size={size}
          leadingIcon={action.icon}
          href={action.href}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          testID={testID ? `${testID}-${action.id}` : undefined}
        >
          {action.label}
        </Button>
      ))}
    </View>
  );
}

export const PlaceActions = memo(PlaceActionsComponent);
PlaceActions.displayName = 'PlaceActions';
