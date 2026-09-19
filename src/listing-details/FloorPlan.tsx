import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FLOOR_PLAN_TWO_COLUMN_MIN_WIDTH } from './constants';
import {
  LISTING_DETAILS_CSS,
  LISTING_DETAILS_STYLE_ID,
  resolveImageUri,
  resolveListingPalette,
} from './shared';
import type { FloorPlanItem, FloorPlanProps } from './types';
import { useContainerWidth } from '../hooks/use-container-width';

/**
 * The floor plans of a home: one tile per plan, a label under each.
 *
 *   columns   `auto` measures its own width: 1 below 560, 2 from 560, 16 apart
 *             (rows 24 apart); one plan always spans the width
 *   tile      radius 16, 1px neutral-200 (dark neutral-800) border, aspect
 *             `aspectRatio` (4 / 3), the plan CONTAINED with 16 inset on
 *             neutral-50 in BOTH modes — a plan is dark line work on a light
 *             or transparent sheet, and would vanish on a dark tile
 *   expand    a 32 disc top-right (card surface, hairline border) with an
 *             expand glyph, when `onPressPlan` is set; hover steps the tile's
 *             border to neutral-400 (web)
 *   label     body-semibold, 12 under the tile; `description` body-2-regular
 *             text-secondary
 *
 * Pressing a tile reports its index — open `ZoomableMediaGallery` there (the
 * same wiring as `ListingPhotoGrid`).
 */

const GAP = 16;

function defaultPlanLabel(plan: FloorPlanItem, position: number, total: number): string {
  return `${plan.alt ?? plan.label}, floor plan ${position} of ${total}`;
}

interface PlanTileProps {
  plan: FloorPlanItem;
  uri: string | undefined;
  name: string;
  aspectRatio: number;
  onPress?: () => void;
  testID?: string;
}

function PlanTile({ plan, uri, name, aspectRatio, onPress, testID }: PlanTileProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { neutral: n } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();

  const frame: WebCssStyle = {
    width: '100%',
    aspectRatio,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: onPress && hovered ? n[400] : palette.cardBorder,
    backgroundColor: n[50],
    overflow: 'hidden',
    '--bloom-listing-ring': palette.ring,
  };

  const inner = (
    <>
      {uri ? (
        <View style={[StyleSheet.absoluteFill, { paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 }]}>
          <Image
            source={{ uri }}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      ) : null}
      {onPress ? (
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          testID={testID ? `${testID}-expand` : undefined}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.cardBorder,
            backgroundColor: palette.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RiExpandDiagonalSLine width={16} height={16} fill={palette.text} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={{ gap: 12 }}>
      {onPress ? (
        <Pressable
          {...webDataSet({ bloomListingPress: '' })}
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={frame}
          testID={testID}
        >
          {inner}
        </Pressable>
      ) : (
        <View accessible accessibilityRole="image" accessibilityLabel={name} style={frame} testID={testID}>
          {inner}
        </View>
      )}
      <View style={{ gap: 2 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text variant="body-semibold" style={{ color: palette.text }} testID={testID ? `${testID}-label` : undefined}>
          {plan.label}
        </Text>
        {plan.description ? (
          <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
            {plan.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function FloorPlanComponent({
  plans,
  onPressPlan,
  columns = 'auto',
  aspectRatio = 4 / 3,
  planLabel = defaultPlanLabel,
  imageVariant = 'large',
  style,
  testID,
}: FloorPlanProps) {
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const resolver = useImageResolver();
  const { width, onLayout } = useContainerWidth();

  const wanted = columns === 'auto' ? (width != null && width >= FLOOR_PLAN_TWO_COLUMN_MIN_WIDTH ? 2 : 1) : columns;
  const count = plans.length <= 1 ? 1 : wanted;
  const total = plans.length;

  return (
    <View
      onLayout={onLayout}
      role="list"
      style={[{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 }, style]}
      testID={testID}
    >
      {plans.map((plan, index) => (
        <View
          key={`${plan.source}-${index}`}
          role="listitem"
          style={{
            width: `${100 / count}%`,
            // Two columns split the gutter, so both tiles are equal and the edges stay flush.
            paddingRight: count > 1 && index % 2 === 0 ? GAP / 2 : 0,
            paddingLeft: count > 1 && index % 2 === 1 ? GAP / 2 : 0,
          }}
          testID={testID ? `${testID}-item-${index}` : undefined}
        >
          <PlanTile
            plan={plan}
            uri={resolveImageUri(plan.source, resolver, imageVariant)}
            name={planLabel(plan, index + 1, total)}
            aspectRatio={aspectRatio}
            onPress={onPressPlan ? () => onPressPlan(index) : undefined}
            testID={testID ? `${testID}-plan-${index}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

export const FloorPlan = memo(FloorPlanComponent);
FloorPlan.displayName = 'FloorPlan';
