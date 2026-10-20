import React, { memo, useContext, useEffect, useId, useInsertionEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { remainingScrollDistance, useScrollMetricsValue } from '../layout/scroll-metrics';
import { BloomScope } from '../appearance';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { EdgeScrim, SCRIM_TAIL_RATIO } from '../page-header/EdgeScrim';
import { BREAKPOINTS } from '../styles/breakpoints';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { dataHook } from '../styles/data-hook';
import { WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { useSurfaceFill } from '../styles/surface-levels';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { ScreenFooterContext, useScreenContext } from '../screen/context';
import { PageFooterContext } from './context';
import type { PageFooterProps } from './types';
import { useDocumentAnchor } from './use-document-anchor';
import { useCssSafeAreaInsets, NO_SAFE_AREA_INSETS } from '../hooks/use-css-safe-area-insets';

const BAR_HEIGHT = 56;
const FOOTER_LAYOUT_CSS = `
[data-bloom-page-footer] { --bloom-page-footer-inset: 16px; }
@container bloom-page-footer (min-width: ${BREAKPOINTS.sm}px) {
  [data-bloom-page-footer-row] { --bloom-page-footer-inset: 24px; }
}
`;
const FOOTER_WEB_LAYOUT: WebCssStyle = {
  containerType: 'inline-size',
  containerName: 'bloom-page-footer',
};

/** Page-local controls floating over a bounded scroller, above app navigation. */
function PageFooterComponent({
  children,
  actions,
  bottomInset,
  safeArea,
  position = 'absolute',
  scrim = 'always',
  scrimColor,
  scrollThreshold = 20,
  contentContainerStyle,
  style,
  testID,
}: PageFooterProps) {
  const theme = useTheme();
  useInsertionEffect(() => {
    if (Platform.OS === 'web') adoptStyleSheet('bloom-page-footer-layout', FOOTER_LAYOUT_CSS);
  }, []);
  const screen = useScreenContext();
  const footerScreen = useContext(ScreenFooterContext);
  const positionedByScreen = screen != null && screen === footerScreen;
  const inFlow = position === 'inline' || position === 'sticky';
  const documentAnchor = useDocumentAnchor(!positionedByScreen && position === 'document');
  const metrics = useScrollMetricsValue();
  const threshold = Math.max(1, Number.isFinite(scrollThreshold) ? scrollThreshold : 20);
  const scrimStyle = useAnimatedStyle(
    () => ({
      opacity: scrim === 'auto' ? Math.min(1, remainingScrollDistance(metrics) / threshold) : 1,
    }),
    [metrics, scrim, threshold],
  );
  const fill = useSurfaceFill() ?? theme.colors.background;
  const occupied = useBottomEdgeInset();
  const rawBottom = position === 'inline' ? 0 : (bottomInset ?? occupied);
  const bottom = Number.isFinite(rawBottom) ? Math.max(0, rawBottom) : 0;
  const insets = useCssSafeAreaInsets(useContext(SafeAreaInsetsContext) ?? NO_SAFE_AREA_INSETS);
  const padBottom = (safeArea ?? Platform.OS !== 'web') && bottom === 0 ? (insets?.bottom ?? 0) : 0;
  const windowWidth = useWindowDimensions().width;
  const [wide, setWide] = useState(windowWidth >= BREAKPOINTS.sm);
  // Measure the row, not the outer box: a safe-area change can then update the
  // published clearance immediately rather than waiting for another onLayout.
  const [rowHeight, setRowHeight] = useState(BAR_HEIGHT);
  const height = rowHeight + padBottom;
  const sideInset =
    Platform.OS === 'web'
      ? ('var(--bloom-page-footer-inset, 16px)' as ViewStyle['paddingLeft'])
      : wide
        ? 24
        : 16;
  const store = useContext(PageFooterContext);
  const id = useId();
  useEffect(() => {
    if (positionedByScreen || inFlow) return;
    store?.claim(id, height + bottom);
    return () => store?.release(id);
  }, [store, id, height, bottom, positionedByScreen, inFlow]);

  const onLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    if (Platform.OS !== 'web' && Number.isFinite(layout.width))
      setWide(layout.width >= BREAKPOINTS.sm);
    if (Number.isFinite(layout.height)) setRowHeight(Math.max(0, layout.height));
  };

  return (
    <>
      {documentAnchor.enabled ? (
        <View
          ref={documentAnchor.ref}
          onLayout={documentAnchor.measure}
          pointerEvents="none"
          style={{ height: 0, width: '100%' }}
          testID={testID ? `${testID}-anchor` : undefined}
        />
      ) : null}
      <View
        testID={testID}
        {...dataHook('bloomPageFooter')}
        pointerEvents="box-none"
        style={[
          styles.container,
          Platform.OS === 'web' ? FOOTER_WEB_LAYOUT : undefined,
          positionedByScreen || inFlow
            ? {
                position:
                  !positionedByScreen && position === 'sticky' && Platform.OS === 'web'
                    ? WEB_POSITION_STICKY
                    : 'relative',
                left: undefined,
                right: undefined,
                bottom:
                  !positionedByScreen && position === 'sticky' && Platform.OS === 'web'
                    ? bottom
                    : undefined,
                paddingBottom: padBottom,
              }
            : { bottom, paddingBottom: padBottom },
          documentAnchor.style,
          style,
        ]}
      >
        {scrim !== 'none' ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.scrim, { height: height * (1 + SCRIM_TAIL_RATIO) }, scrimStyle]}
            testID={testID ? `${testID}-scrim` : undefined}
          >
            <EdgeScrim
              edge="bottom"
              color={scrimColor ?? fill}
              testID={testID ? `${testID}-scrim-gradient` : undefined}
            />
          </Animated.View>
        ) : null}
        <View
          onLayout={onLayout}
          {...dataHook('bloomPageFooterRow')}
          pointerEvents="box-none"
          style={[
            styles.row,
            { paddingLeft: sideInset, paddingRight: sideInset },
            contentContainerStyle,
          ]}
          testID={testID ? `${testID}-row` : undefined}
        >
          <BloomScope>
            {children != null ? (
              <View pointerEvents="box-none" style={styles.content}>
                {children}
              </View>
            ) : null}
            {actions != null ? (
              <View
                pointerEvents="box-none"
                style={styles.actions}
                testID={testID ? `${testID}-actions` : undefined}
              >
                {actions}
              </View>
            ) : null}
          </BloomScope>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: Z_INDEX.floating,
    ...(Platform.OS !== 'web' ? { elevation: Z_INDEX.floating } : {}),
  },
  scrim: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  row: {
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  content: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flexShrink: 1 },
});

export const PageFooter = memo(PageFooterComponent);
PageFooter.displayName = 'PageFooter';
