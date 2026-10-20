import { memo, type ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '../card';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { IS_WEB } from '../styles/platform';
import { StyledPressable } from '../styles/styled-primitives';
import { surfaceFillOn, surfaceTextOn, useSurfaceFill } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useSidebarWebCss, webHook } from './parts';
import type { SidebarOnboardingCardProps } from './types';

/** A task opens a real app flow; completion is supplied by the app, never inferred from pressing. */
function OnboardingRow({
  label,
  leading,
  onPress,
  disabled = false,
  quiet = false,
  header = false,
}: {
  label: string;
  leading?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  quiet?: boolean;
  header?: boolean;
}) {
  const theme = useTheme();
  const fill = useSurfaceFill();
  const paint = surfaceTextOn(theme, fill);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: IS_WEB ? (header ? 40 : 28) : 44,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 10,
    borderRadius: 8,
    backgroundColor: hovered && !disabled ? surfaceFillOn(theme, fill) : 'transparent',
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-sidebar-ring': theme.colors.primary,
  };
  const content = (
    <>
      {leading === undefined ? null : (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          {leading}
        </View>
      )}
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: quiet ? '400' : '500',
          color: quiet ? paint.textSecondary : paint.text,
        }}
      >
        {label}
      </Text>
    </>
  );
  return onPress ? (
    <StyledPressable
      {...webHook('inset')}
      role="button"
      accessible
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={style}
    >
      {content}
    </StyledPressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

function PendingIndicator() {
  const theme = useTheme();
  const fill = useSurfaceFill();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: surfaceTextOn(theme, fill).textGraphical,
      }}
    />
  );
}

function SidebarOnboardingCardComponent({
  title,
  leading,
  steps,
  visibleCount = 2,
  onPress,
  onSeeAll,
  seeAllLabel,
  className,
  style,
  testID,
}: SidebarOnboardingCardProps) {
  const common = useCommonMessages();
  const dirProps = useDirectionProps();
  useSidebarWebCss();
  const count = Number.isFinite(visibleCount) ? Math.max(0, Math.floor(visibleCount)) : 2;
  const pending = steps.filter((step) => !step.completed).slice(0, count);
  return (
    <Card
      radius="radius-16"
      border="thin"
      elevation="s"
      className={className}
      style={[
        {
          width: '100%',
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 4,
          paddingBottom: 6,
        },
        style,
      ]}
      testID={testID}
    >
      <View {...dirProps}>
        <OnboardingRow label={title} leading={leading} onPress={onPress} header />
        {pending.map((step) => (
          <OnboardingRow
            key={step.key}
            label={step.label}
            leading={<PendingIndicator />}
            onPress={step.onPress}
            disabled={step.disabled}
          />
        ))}
        {onSeeAll ? (
          <OnboardingRow label={seeAllLabel ?? common.seeAll} onPress={onSeeAll} quiet />
        ) : null}
      </View>
    </Card>
  );
}

export const SidebarOnboardingCard = memo(SidebarOnboardingCardComponent);
SidebarOnboardingCard.displayName = 'SidebarOnboardingCard';
