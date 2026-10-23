import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { Theme } from '../theme/types';
import { Text } from '../typography';
import type { ShareSheetTarget } from './types';

interface ShareTargetButtonProps {
  target: ShareSheetTarget;
  circleSize: number;
  colors: Theme['colors'];
}

/**
 * A destination in the targets row: the glyph on a neutral disc over its label.
 * Every disc is the same neutral tint, a brand's own colour included, so the
 * row reads as one set in both themes.
 */
function ShareTargetButtonComponent({ target, circleSize, colors }: ShareTargetButtonProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = target.icon;
  const glyph = Math.round(circleSize * 0.46);
  return (
    <Pressable
      role="button"
      accessibilityLabel={target.label}
      onPress={target.onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={{ width: circleSize + 20, alignItems: 'center', gap: 6 }}
      testID={target.testID}
    >
      {({ pressed }) => (
        <>
          <View
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed || hovered ? colors.border : colors.backgroundSecondary,
            }}
          >
            <Icon width={glyph} height={glyph} fill={colors.text} />
          </View>
          <Text
            variant="caption-1-regular"
            numberOfLines={2}
            style={{ color: colors.textSecondary, textAlign: 'center' }}
          >
            {target.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export const ShareTargetButton = memo(ShareTargetButtonComponent);
ShareTargetButton.displayName = 'ShareTargetButton';
