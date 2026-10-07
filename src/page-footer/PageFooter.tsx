import React, { memo, useContext, useEffect, useId, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BloomScope } from '../appearance';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { EdgeScrim, SCRIM_TAIL_RATIO } from '../page-header/EdgeScrim';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useSurfaceFill } from '../styles/surface-levels';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { PageFooterContext } from './context';
import type { PageFooterProps } from './types';

const BAR_HEIGHT = 56;

/** Page-local controls floating over a bounded scroller, above app navigation. */
function PageFooterComponent({
  children, actions, bottomInset, safeArea, scrim = 'always', scrimColor, style, testID,
}: PageFooterProps) {
  const theme = useTheme();
  const fill = useSurfaceFill() ?? theme.colors.background;
  const occupied = useBottomEdgeInset();
  const rawBottom = bottomInset ?? occupied;
  const bottom = Number.isFinite(rawBottom) ? Math.max(0, rawBottom) : 0;
  const insets = useContext(SafeAreaInsetsContext);
  const padBottom = (safeArea ?? Platform.OS !== 'web') && bottom === 0 ? insets?.bottom ?? 0 : 0;
  const windowWidth = useWindowDimensions().width;
  const [width, setWidth] = useState<number | null>(null);
  // Measure the row, not the outer box: a safe-area change can then update the
  // published clearance immediately rather than waiting for another onLayout.
  const [rowHeight, setRowHeight] = useState(BAR_HEIGHT);
  const height = rowHeight + padBottom;
  const sideInset = (width ?? windowWidth) >= BREAKPOINTS.sm ? 24 : 16;
  const store = useContext(PageFooterContext);
  const id = useId();
  useEffect(() => {
    store?.claim(id, height + bottom);
    return () => store?.release(id);
  }, [store, id, height, bottom]);

  const onLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    if (Number.isFinite(layout.width)) setWidth(Math.max(0, layout.width));
    if (Number.isFinite(layout.height)) setRowHeight(Math.max(0, layout.height));
  };

  return (
    <View
      testID={testID}
      pointerEvents="box-none"
      style={[styles.container, { bottom, paddingBottom: padBottom }, style]}
    >
      {scrim !== 'none' ? (
        <View
          pointerEvents="none"
          style={[styles.scrim, { height: height * (1 + SCRIM_TAIL_RATIO) }]}
          testID={testID ? `${testID}-scrim` : undefined}
        >
          <EdgeScrim edge="bottom" color={scrimColor ?? fill} testID={testID ? `${testID}-scrim-gradient` : undefined} />
        </View>
      ) : null}
      <View
        onLayout={onLayout}
        pointerEvents="box-none"
        style={[styles.row, { paddingLeft: sideInset, paddingRight: sideInset }]}
        testID={testID ? `${testID}-row` : undefined}
      >
        <BloomScope>
          {children != null ? <View pointerEvents="box-none" style={styles.content}>{children}</View> : null}
          {actions != null ? (
            <View pointerEvents="box-none" style={styles.actions} testID={testID ? `${testID}-actions` : undefined}>
              {actions}
            </View>
          ) : null}
        </BloomScope>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 0, right: 0, zIndex: Z_INDEX.floating,
    ...(Platform.OS !== 'web' ? { elevation: Z_INDEX.floating } : {}),
  },
  scrim: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  row: {
    minHeight: BAR_HEIGHT, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingTop: 8, paddingBottom: 8,
  },
  content: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flexShrink: 1 },
});

export const PageFooter = memo(PageFooterComponent);
PageFooter.displayName = 'PageFooter';
