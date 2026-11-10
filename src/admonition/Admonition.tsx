import { createContext, useContext } from 'react';
import { BloomScope, useBloomAppearance } from '../appearance';
import { SurfacePaint } from '../surface/SurfacePaint';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text as BaseText } from '../typography';
import { Button as BaseButton } from '../button';
import { RiInformationLine as CircleInfoIcon } from '../icons/remix/RiInformationLine';
import { RiForbidLine as ForbidIcon } from '../icons/remix/RiForbidLine';
import { RiLightbulbLine as LightbulbIcon } from '../icons/remix/RiLightbulbLine';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { RiAlertLine as WarningIcon } from '../icons/remix/RiAlertLine';
import { RiEmotionUnhappyLine as EmojiSadIcon } from '../icons/remix/RiEmotionUnhappyLine';
import { ADMONITION_GEOMETRY } from './geometry';
import type {
  AdmonitionButtonProps,
  AdmonitionContentProps,
  AdmonitionIconProps,
  AdmonitionProps,
  AdmonitionRootProps,
  AdmonitionRowProps,
  AdmonitionTextProps,
  AdmonitionType,
} from './types';

type AdmonitionContextValue = {
  type: AdmonitionType;
};

const AdmonitionContext = createContext<AdmonitionContextValue>({
  type: 'info',
});
AdmonitionContext.displayName = 'AdmonitionContext';

const ICON_MAP = {
  info: CircleInfoIcon,
  tip: LightbulbIcon,
  warning: WarningIcon,
  error: ForbidIcon,
  apology: EmojiSadIcon,
} as const;

const TONE_MAP: Record<AdmonitionType, AccentTone> = {
  info: 'info',
  tip: 'success',
  warning: 'warning',
  error: 'error',
  apology: 'default',
};

export function AdmonitionIcon({ testID }: AdmonitionIconProps) {
  const theme = useTheme();
  const { type } = useContext(AdmonitionContext);
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  const geometry = ADMONITION_GEOMETRY[size];
  const IconComponent = ICON_MAP[type];
  const colors = resolveAccentColors(theme.colors, TONE_MAP[type], 'subtle');

  return (
    <View
      aria-hidden
      style={[styles.icon, { width: geometry.icon, height: geometry.icon }]}
      testID={testID}
    >
      <IconComponent fill={colors.foreground} width={geometry.icon} height={geometry.icon} />
    </View>
  );
}
AdmonitionIcon.displayName = 'AdmonitionIcon';

export function AdmonitionContent({ children, style }: AdmonitionContentProps) {
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  return (
    <View style={[styles.content, { gap: ADMONITION_GEOMETRY[size].contentGap }, style]}>
      {children}
    </View>
  );
}
AdmonitionContent.displayName = 'AdmonitionContent';

export function AdmonitionText({ children, style }: AdmonitionTextProps) {
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  const geometry = ADMONITION_GEOMETRY[size];
  return (
    <BaseText
      style={[styles.text, { fontSize: geometry.fontSize, lineHeight: geometry.lineHeight }, style]}
    >
      {children}
    </BaseText>
  );
}
AdmonitionText.displayName = 'AdmonitionText';

export function AdmonitionButton({ children, ...props }: AdmonitionButtonProps) {
  return <BaseButton {...props}>{children}</BaseButton>;
}
AdmonitionButton.displayName = 'AdmonitionButton';

export function AdmonitionRow({ children, style }: AdmonitionRowProps) {
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  return (
    <View style={[styles.row, { gap: ADMONITION_GEOMETRY[size].rowGap }, style]}>{children}</View>
  );
}
AdmonitionRow.displayName = 'AdmonitionRow';

export function AdmonitionRoot({ children, type = 'info', size, style }: AdmonitionRootProps) {
  const theme = useTheme();
  const { size: resolvedSize } = useBloomAppearance({ size }, { size: 'md', tone: 'neutral' });
  const geometry = ADMONITION_GEOMETRY[resolvedSize];

  const tone = TONE_MAP[type];
  const colors = resolveAccentColors(theme.colors, tone, 'subtle');
  const border = resolveAccentColors(theme.colors, tone, 'solid').border;

  return (
    <BloomScope size={size}>
      <AdmonitionContext.Provider value={{ type }}>
        <View style={[styles.outer, { padding: geometry.padding }, style]}>
          {StyleSheet.flatten(style)?.backgroundColor === undefined ? (
            <SurfacePaint fill={colors.background} radius={16} composite />
          ) : null}
          {/* Separate opacity preserves the token's native colour syntax and
              keeps the content fully opaque on both native and web. */}
          <View pointerEvents="none" aria-hidden style={[styles.border, { borderColor: border }]} />
          {children}
        </View>
      </AdmonitionContext.Provider>
    </BloomScope>
  );
}
AdmonitionRoot.displayName = 'AdmonitionRoot';

/**
 * Simple all-in-one Admonition component for common use cases.
 * For more control, compose with AdmonitionRoot, AdmonitionRow, AdmonitionIcon,
 * AdmonitionContent, AdmonitionText, and AdmonitionButton.
 */
export function Admonition({ children, type, size, style }: AdmonitionProps) {
  return (
    <AdmonitionRoot type={type} size={size} style={style}>
      <AdmonitionRow>
        <AdmonitionIcon />
        <AdmonitionContent>
          <AdmonitionText>{children}</AdmonitionText>
        </AdmonitionContent>
      </AdmonitionRow>
    </AdmonitionRoot>
  );
}
Admonition.displayName = 'Admonition';

const styles = StyleSheet.create({
  outer: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.3,
  },
  icon: {
    flexShrink: 0,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    gap: 4,
    flex: 1,
    minWidth: 0,
    minHeight: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
});
