import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button } from '../button';
import { ScrollArea } from '../layout/ScrollArea';
import { ScrollMetricsContext } from '../layout/scroll-metrics';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Text, Title, Subtitle, typeScale } from '../typography';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { pointerEventsStyles } from '../styles/pointer-events';
import { useTheme } from '../theme/use-theme';
import { SubscriptionPrice } from './SubscriptionPrice';
import type { SubscriptionPlansProps } from './types';

/** A plan-selection body; its host owns scrolling, navigation and billing. */
export function SubscriptionPlans({
  productName,
  heroBackground,
  heroBackgroundHeight = 260,
  plans,
  value,
  onValueChange,
  selectorLabel,
  controls,
  primaryAction,
  moreBenefits,
  terms,
  footer,
  fallback,
  style,
  testID,
}: SubscriptionPlansProps) {
  const theme = useTheme();
  const surfaceFill = useSurfaceFill();
  const selected = plans.find((plan) => plan.id === value);
  const actionDisabled =
    !selected || selected.disabled || primaryAction?.disabled || primaryAction?.loading;
  return (
    <View testID={testID} style={[styles.root, style]}>
      {heroBackground != null ? (
        <View
          testID="subscription-plans-artwork"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.artwork,
            pointerEventsStyles.none,
            Platform.OS === 'web' ? mediaFadeStyle : null,
            { height: heroBackgroundHeight },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>{heroBackground}</View>
          {Platform.OS !== 'web' ? (
            <EdgeScrim edge="bottom" color={surfaceFill} testID="subscription-plans-artwork-fade" />
          ) : null}
        </View>
      ) : null}
      <View style={[styles.hero, heroBackground != null && styles.heroWithArtwork]}>
        <Title variant="display-4-semibold" style={styles.centered}>
          {productName}
          {selected ? (
            <>
              {' '}
              <Text variant="display-4-semibold" style={{ color: theme.colors.primary }}>
                {selected.label}
              </Text>
            </>
          ) : null}
        </Title>
        {selected?.subtitle ? (
          <Subtitle variant="body-regular" style={styles.centered}>
            {selected.subtitle}
          </Subtitle>
        ) : null}
        {selected?.price != null ? (
          <View style={styles.price}>
            {typeof selected.price === 'object' &&
            selected.price !== null &&
            'amount' in selected.price ? (
              <SubscriptionPrice {...selected.price} />
            ) : (
              <Text
                style={[
                  typeScale('title-2-regular'),
                  styles.centered,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {selected.price}
              </Text>
            )}
          </View>
        ) : null}
      </View>
      {controls}
      {plans.length > 0 ? (
        <ScrollMetricsContext.Provider value={null}>
          <ScrollArea
            horizontal
            style={styles.selector}
            contentContainerStyle={styles.selectorContent}
          >
            <SegmentedControl
              type="radio"
              label={selectorLabel}
              value={value}
              onValueChange={onValueChange}
              size="md"
            >
              {plans.map((plan) => (
                <SegmentedControlItem key={plan.id} value={plan.id} disabled={plan.disabled}>
                  <SegmentedControlItemText>{plan.label}</SegmentedControlItemText>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </ScrollArea>
        </ScrollMetricsContext.Provider>
      ) : null}
      {selected ? (
        <View style={styles.benefits}>
          {selected.benefits.map((benefit) => (
            <View key={benefit.id} style={styles.benefit}>
              {benefit.icon ? (
                <View
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.icon}
                >
                  {benefit.icon}
                </View>
              ) : null}
              <View style={styles.benefitCopy}>
                <Title variant="headline-semibold">{benefit.title}</Title>
                {benefit.description ? (
                  <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
                    {benefit.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
          {moreBenefits ? (
            <Button
              appearance="plain"
              tone="neutral"
              onPress={moreBenefits.onPress}
              style={styles.more}
            >
              {moreBenefits.label}
            </Button>
          ) : null}
        </View>
      ) : (
        fallback
      )}
      {terms != null || primaryAction || footer != null ? (
        <View style={styles.footer}>
          {terms != null ? (
            <Text
              variant="caption-1-regular"
              style={[styles.centered, { color: theme.colors.textSecondary }]}
            >
              {terms}
            </Text>
          ) : null}
          {primaryAction ? (
            <Button
              size="lg"
              appearance="solid"
              tone="accent"
              disabled={actionDisabled}
              loading={primaryAction.loading}
              onPress={actionDisabled ? undefined : primaryAction.onPress}
              style={styles.action}
            >
              {primaryAction.label}
            </Button>
          ) : null}
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  artwork: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  hero: { alignItems: 'center', gap: 10 },
  heroWithArtwork: { paddingTop: 96 },
  centered: { textAlign: 'center' },
  price: { alignSelf: 'stretch' },
  selector: { flexGrow: 0, width: '100%' },
  selectorContent: { flexGrow: 1, justifyContent: 'center' },
  benefits: { gap: 28 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  icon: { width: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  benefitCopy: { flex: 1, minWidth: 0, gap: 6 },
  more: { alignSelf: 'flex-start' },
  footer: { gap: 12 },
  action: { alignSelf: 'stretch' },
});

// Fade the media itself on web, revealing the actual material beneath instead
// of ending in an opaque approximation of a translucent surface's color.
const mediaFadeStyle: WebCssStyle = {
  maskImage:
    'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.14) 58%, transparent 100%)',
  WebkitMaskImage:
    'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.14) 58%, transparent 100%)',
};
