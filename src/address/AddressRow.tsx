import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { BloomScope, useBloomAppearance, useBloomContentDensity } from '../appearance';
import { Item } from '../item';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { ADDRESS_KIND_ICON } from './constants';
import { ADDRESS_META_VARIANT, ADDRESS_SCOPED_GEOMETRY, ADDRESS_TITLE_VARIANT } from './geometry';
import { joinAddressName, resolveAddressPaint } from './shared';
import type { AddressRowProps } from './types';

/**
 * An address as a row: a glyph or an avatar, the line you recognise it by, the
 * rest of it, and what you can do with it.
 *
 * It is `Item` with an address's slots filled in, deliberately — a row, a
 * selected wash, the press target, the density rungs and the a11y role
 * translation are `Item`'s job and this family does not own a second copy of
 * any of them. What it adds is the leading tile, the badge beside the title,
 * the `meta`/`action` pairing in the trailing slot, and an accessible name
 * assembled from the row's own text.
 *
 *   tile     40 round (compact 32), one surface step off whatever is behind
 *            the row, with a 20 glyph in the secondary rung
 *   title    `Item`'s own title rung, with `badge` beside it
 *   trailing `meta` in body-2 tabular figures, then `action`
 *
 * The text INPUT is not here. An app searches with `search`/`text-field` and
 * renders what comes back as these rows.
 */
function AddressRowComponent({
  title,
  subtitle,
  kind = 'place',
  icon,
  leading,
  meta,
  badge,
  action,
  selected,
  disabled = false,
  onPress,
  density: densityProp,
  size: sizeProp,
  role,
  accessibilityLabel,
  style,
  testID,
}: AddressRowProps) {
  const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const density = useBloomContentDensity(densityProp);
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveAddressPaint(theme, surface), [theme, surface]);
  const g = ADDRESS_SCOPED_GEOMETRY[size][density];
  const Glyph = icon ?? ADDRESS_KIND_ICON[kind];

  // `leading` is read for PRESENCE, not truthiness: `leading={null}` is a row
  // that draws no media at all — the shape `RouteStops` needs, where the marker
  // column outside the row is already the gutter — and `??` would have quietly
  // given it the tile instead.
  const media =
    leading !== undefined ? (
      leading
    ) : (
      <View
        testID={testID ? `${testID}-tile` : undefined}
        style={{
          width: g.tile,
          height: g.tile,
          borderRadius: g.tile / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: paint.tile,
        }}
      >
        <Glyph width={g.glyph} height={g.glyph} fill={paint.textSecondary} />
      </View>
    );

  const titleNode = badge ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: g.badgeGap, minWidth: 0 }}>
      <Text
        variant={ADDRESS_TITLE_VARIANT[size]}
        numberOfLines={1}
        testID={testID ? `${testID}-title` : undefined}
        style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
      >
        {title}
      </Text>
      {badge}
    </View>
  ) : (
    title
  );

  const metaNode = meta ? (
    <Text
      variant={ADDRESS_META_VARIANT[size]}
      numberOfLines={1}
      testID={testID ? `${testID}-meta` : undefined}
      style={{ flexShrink: 1, color: paint.textSecondary, fontVariant: ['tabular-nums'] }}
    >
      {meta}
    </Text>
  ) : null;

  // A PRESSABLE row is a real `<button>` on web (react-native-web's `Pressable`
  // is one), so an `action` that is itself a control cannot live inside it: a
  // button inside a button is invalid HTML, React warns about it, and on web —
  // unlike native, which does not bubble a press — a click on the inner control
  // ALSO opens the row. So a pressable row with an action splits into the row
  // and the action SIDE BY SIDE, which is where they already looked like they
  // were. A row with no press target keeps the action in its trailing slot,
  // where there is nothing to nest inside.
  const splitAction = action != null && onPress != null;

  const trailingInside =
    metaNode || (action && !splitAction) ? (
      // `minWidth: 0` for the reason `order-status/OrderStatusBar.tsx` records:
      // a one-line Text is `nowrap` on web and its min-content width becomes
      // the row's floor.
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: g.metaGap, minWidth: 0 }}>
        {metaNode}
        {splitAction ? null : action}
      </View>
    ) : null;

  const row = (
    <Item
      title={titleNode}
      subtitle={subtitle}
      leading={media}
      trailing={trailingInside}
      onPress={onPress}
      disabled={disabled}
      selected={selected}
      contentDensity={density}
      titleStyle={TYPE_SCALE[ADDRESS_TITLE_VARIANT[size]]}
      subtitleStyle={TYPE_SCALE[ADDRESS_META_VARIANT[size]]}
      role={role}
      accessibilityLabel={accessibilityLabel ?? joinAddressName([title, subtitle, meta])}
      // `paddingRight`, never `paddingHorizontal`: `Item` writes the longhand
      // for the reason its own file records, and a shorthand here would outrank
      // it on web and not on native.
      style={splitAction ? { paddingRight: g.splitActionPadding } : style}
      testID={testID}
    />
  );

  if (!splitAction)
    return (
      <BloomScope size={sizeProp} contentDensity={density}>
        {row}
      </BloomScope>
    );

  return (
    <BloomScope size={sizeProp} contentDensity={density}>
      <View
        style={[
          { flexDirection: 'row', alignItems: 'center', paddingRight: g.splitActionPadding },
          style,
        ]}
      >
        {/*
        `Item`'s `style` lands on its CONTENT view, inside the `Pressable` (or
        the plain `View`) that is actually this row's flex child — so `flex: 1`
        written there would sit one node below where the layout happens, and the
        row would take the full min-content width of a `numberOfLines={1}` title
        instead of shrinking. The flex goes on a wrapper the parent CAN see.
      */}
        <View style={{ flex: 1, minWidth: 0 }}>{row}</View>
        {action}
      </View>
    </BloomScope>
  );
}

export const AddressRow = memo(AddressRowComponent);
AddressRow.displayName = 'AddressRow';
