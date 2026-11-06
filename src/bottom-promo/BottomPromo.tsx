import { memo, useContext } from 'react';
import { View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { InverseButton } from '../button';
import { Text } from '../typography';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import type { BottomPromoProps } from './types';

/** Height of the fade that rises above the solid block. */
const FADE_HEIGHT = 96;
const SIDE_PADDING = 16;
const MIN_BOTTOM_PADDING = 20;

/**
 * A bottom-of-screen call to action: a fade into the surface, then a solid
 * block with a centred headline, a supporting line and a full-width action.
 * It is content only; the bottom slot of the screen or pane places it and
 * reserves its height. The fade and the block share the surrounding surface
 * fill, so the promo reads as part of the page rather than a card on it.
 */
function BottomPromoComponent({
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID,
}: BottomPromoProps) {
  const theme = useTheme();
  const fill = useSurfaceFill() ?? theme.colors.background;
  const safeAreaBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  return (
    <View testID={testID} style={style}>
      <View pointerEvents="none" style={{ height: FADE_HEIGHT }}>
        <EdgeScrim edge="bottom" color={fill} />
      </View>
      <View
        style={{
          backgroundColor: fill,
          gap: 16,
          paddingHorizontal: SIDE_PADDING,
          paddingBottom: Math.max(MIN_BOTTOM_PADDING, safeAreaBottom),
        }}
      >
        <View style={{ gap: 4 }}>
          <Text variant="title-2-bold" style={{ textAlign: 'center', color: theme.colors.text }}>
            {title}
          </Text>
          {description != null ? (
            <Text
              variant="body-regular"
              style={{ textAlign: 'center', color: theme.colors.textSecondary }}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <InverseButton fullWidth size="lg" onPress={onAction}>
          {actionLabel}
        </InverseButton>
      </View>
    </View>
  );
}

export const BottomPromo = memo(BottomPromoComponent);
BottomPromo.displayName = 'BottomPromo';
